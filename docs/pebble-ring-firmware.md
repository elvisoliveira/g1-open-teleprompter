# Pebble Index 01 — firmware update process

> **Historical (stock firmware).** This app no longer syncs or updates the ring — it drives
> the **CFW** as a connectionless clicker ([pebble-ring.md](pebble-ring.md)). Flashing the
> CFW (and restoring the stock firmware from failsafe) is done by the separate
> [flasher app](https://github.com/elvisoliveira/pebble-index-flasher). The stock update
> flow below is kept for reference.

How the ring's firmware gets updated, reverse-engineered from the official Pebble app source
(`~/projects/pebble/mobileapp`) and the haversine library artifact (2026-07-31). Facts marked
**[measured]** were observed live; **[disasm]** come from the library binaries/bytecode;
**[source]** from the official app's code.

## The mechanism lives in the library, not in the app

The official app contains **no firmware update logic**. The whole mechanism is inside
`KMPHaversineSatelliteManager` — the same Maven artifact this project uses
(`io.github.coredevices.haversine:haversine:f8d8bd7`). The app's `RingSync`
(`experimental/src/commonMain/kotlin/coredevices/ring/service/RingSync.kt:744-810`) merely
observes `SatelliteStatus.FirmwareUpdating.{Started,Success,Failed}` from the same
`startScanning()` flow every client already collects, and reacts: marks the device as
updating, emits UI events, and handles the failsafe interplay **[source]**.

## Update manifest

Hardcoded in the artifact **[disasm]**:

```
RING_UPDATE_URL = https://raw.githubusercontent.com/HyperionSensing/firmware_releases/core_ring/haversine_update.json
CACHE_SUBDIRECTORY = "haversine_download"
```

A single self-contained JSON — the firmware image itself is embedded in base64 (~29 KB
decoded; tiny). As of 2026-07-31 **[measured]**:

```json
{
  "firmwareVersionMajor": 3,
  "firmwareVersionMinor": 74,
  "hardwareVersionMajor": 11,
  "hardwareVersionMinor": 0,
  "creationDate": 1784300474,
  "image": "<base64, ~39 KB of JSON>"
}
```

## Image format — plain Dialog SUOTA, unsigned

The decoded image is 29,224 bytes: a **64-byte Dialog `image_header_t`** followed by 29,160
bytes of ARM Thumb code. Every field matches the struct documented in the Renesas SDK6
**[measured]**:

| offset | field | value | meaning |
|---|---|---|---|
| `0x00` | `signature[2]` | `70 51` | must be `0x7051` or the bootloader rejects the image |
| `0x02` | `validflag` | `0xAA` | `0xAA` = valid; anything else is ignored by the bootloader |
| `0x03` | `imageid` | `0x00` | slot index for the dual-image bootloader |
| `0x04` | `code_size` | 29160 | file size minus the header |
| `0x08` | `CRC` | `0xc7c25d37` | **CRC32 of the body — reproduced exactly with `binascii.crc32`** |
| `0x0c` | `version[16]` | `"1.20"` | header format version (not the firmware version) |
| `0x1c` | `timestamp` | `0xffffffff` | unset |
| `0x20` | `encryption` | `0x00` | **not encrypted** |
| `0x21` | `reserved[31]` | `0xff` | padding |

**There is no signature and no encryption** — only a CRC32, which is an integrity check, not
an authenticity one. Corroborating evidence: body entropy is ~7.0 bits/byte (dense ARM code,
not ciphertext, which would sit at ~8.0), and the body starts with a plaintext Cortex-M
vector table — `0x07fcc2d4` (initial SP) followed by Thumb handlers at `0x07fc00a1`,
`0x07fc26a1`, … The `0x07fc_xxxx` addresses are the **Dialog DA1453x RAM map**, confirming
the SoC family. The string `"Pebble Index XXX"` (BLE name template, serial filled at runtime)
sits in the trailer.

Practical consequence: **any image with a valid header and correct CRC32 would be accepted.**
The BLE bond is the only thing gating who can flash the ring — worth knowing as a property of
the product, and it means a custom firmware faces no cryptographic barrier (see the hardware
inferences in [pebble-ring-reference.md](pebble-ring-reference.md) for why it is still a bad
deal).

## The flashing path is proprietary too

**The ring does not expose the standard Dialog SUOTA service `0xFEF5`** — confirmed live with
nRF Connect (2026-07-31): its entire attribute table is Generic Access, Generic Attribute and
the three Telesto characteristics, nothing else **[measured]**.

Disassembling `HaversineSuotaOperation_shouldRetry` settles how flashing actually works
**[disasm]**: it builds a `TelestoRequest` on the stack and hands it to
`TelestoOperation_init` —

```
movb $0x1,        …   ; type = 1 = TELESTO_ERASE_MEMORY
movl $0x40060000, …   ; address = primary firmware image
movl $0x0,        …   ; offset
mov  0x58(%rax),  …   ; length = image size
call TelestoOperation_init
```

matching the library's log strings `Starting ERASE_PRIMARY_IMAGE` /
`Starting PROGRAM_PRIMARY_IMAGE`. **Firmware is written as plain Telesto memory operations at
virtual address `0x40060000`** — the same primitive set (`ERASE_MEMORY=1`,
`PROGRAM_MEMORY=2`, `READ_MEMORY=3`) used for every other region. Full address map in
[pebble-ring-reference.md](pebble-ring-reference.md).

Consequences for anyone considering custom firmware:

- The **first** flash must go through the proprietary path — in practice by implementing the
  raw Java layer's `HaversineUpdateDelegate` and returning a hand-crafted `FirmwareUpdate`,
  i.e. borrowing the official library's own update machinery. Plausible, never validated.
- That first flash is the one-way step: a custom firmware that does not speak Telesto can no
  longer be reached by the haversine library, and the ring is sealed (no SWD access). Any
  custom image **must** ship the standard SUOTA service `0xFEF5` itself, and work on the
  first try — which would actually leave the ring with a *better* update path than stock.
- **A second image survives the flash.** SUOTA writes only `0x40060000`; a live `READ_MEMORY`
  dump found a separate, complete, BLE- and Telesto-capable image at `0x40050000` with the
  `0x7050` "SPI flash bootable image" signature — what the ROM loads at power-on **[measured]**.
  It is the failsafe/recovery path (confirmed by disassembly, below), which materially lowers
  the brick risk. Details in [pebble-ring-reference.md](pebble-ring-reference.md).
- Raw memory writes give very direct control of the flash — the same primitive the Pokémon
  Go Plus exploit abused by manipulating the write base address. **READ, PROGRAM and ERASE
  were all exercised end-to-end on a real ring** (2026-07-31, see below).

## Bootloader validation (Ghidra) — a bad flash does NOT brick the ring

The boot image at `0x40050000` was disassembled (Ghidra, ARM Cortex-M LE, base `0x07FC0000`).
Its startup routine reads the application image's header at `0x40060000` and validates it
before booting **[disasm]** — confirmed in the raw assembly at `0x07fc1348`:

```asm
ldr  r1,[0x07fc13f0]   ; r1 = 0x40060000  — the app image header
bl   0x07fc35a8        ; read(handle, 0x40060000, 0, buffer)
ldrb r0,[r5,#0x2]
cmp  r0,#0xaa          ; validflag == 0xAA ?
bne  0x07fc13f6        ; ✗ → invalid-image path
ldrb r0,[r5,#0x0]
cmp  r0,#0x70          ; signature[0] == 0x70 ?
bne  0x07fc13f6
ldrb r0,[r5,#0x1]
cmp  r0,#0x51          ; signature[1] == 0x51 ?
bne  0x07fc13f6
ldr  r0,[sp,#0x8c]     ; code_size — tested < 0x8000 (32 KB) in the decompiler
```

If any check fails, the flow leaves the boot loop and falls into the **main BLE loop** — the
routine that advertises, sleeps, and waits for a connection. That loop's GATT table (also in
the boot image) is byte-for-byte the normal one: the Haversine service UUID, the three Telesto
characteristics, the `0x0EEA` manufacturer data. So **a malformed application image does not
brick the ring** — it drops to a BLE- and Telesto-capable failsafe that can be re-flashed by
the same library (and this project's `DumpActivity`) with no new tooling.

Two hard constraints for a custom image fall out of this:

- **It must carry a valid `image_header_t`** (signature `0x7051`, `validflag 0xAA`, correct
  `code_size`, matching CRC32) or the bootloader rejects it.
- **`code_size` must be < 32 KB** (`0x8000`). The stock image is 29,160 bytes, leaving ~3.5 KB.

The failsafe does **not** protect against a *well-formed* image that boots and then hangs
(wrong pinout, bad init): the header validates, the bootloader hands over control, and a reset
would re-validate and re-boot the same bad image. That residual risk is what a DA14531 dev kit
(and, ideally, a spare ring) is for.

### Failsafe exposes only Telesto, not standard SUOTA

Searched the boot image for the standard Dialog SUOTA service `0xFEF5` and the SPOTA
characteristic UUIDs — **absent** **[disasm]**. What it does contain, at `0x07fc48ca`, is the
same Telesto GATT table as the normal firmware. So in failsafe the ring is indistinguishable
on air from normal operation: same service, same three Telesto channels, same advertisement
format. This is *better* than standard SUOTA for recovery — the haversine library and our own
dumper already speak this protocol, so no `0xFEF5` client is needed. It also revises the
earlier worry that a custom image must ship `0xFEF5` itself: the recovery path lives in the
bootloader, which stock firmware never overwrites, and uses the protocol we already control.

## Live validation of the flash primitives (2026-07-31)

READ / PROGRAM / ERASE were exercised end-to-end on the real ring via `DumpActivity`, against
`0x40000000` (application data store — all `0xFF`, not read at boot, where the official app
writes the user ID; a safe scratch region) **[measured]**:

| step | expected | read back | result |
|---|---|---|---|
| initial | erased | `FF FF FF …` | ✓ |
| PROGRAM 16 B | our bytes | `DE AD BE EF CA FE BA BE 01 02 03 04 05 06 07 08 FF …` | ✓ CHANGED |
| ERASE 4 KB | back to erased | `FF FF FF …` | ✓ CHANGED |

This proves we control all three flash operations by hand over Telesto, that PROGRAM writes
exactly the intended bytes at the intended offset without disturbing the rest, and that ERASE
returns a page to `0xFF`. Combined with `READ_MEMORY`, a custom image can be written and then
read back and compared byte-for-byte *before* the ring reboots — eliminating "did the write
corrupt?" as an unknown. The scratch region was returned to its original erased state, so
nothing persistent changed on the ring.

Implementation notes (how, in `DumpActivity`): reflection to reach the private `linkController`
on `HaversineSatellite`, then `performOperation(TelestoOperation(TelestoInputParameters(
TelestoRequest(type, address, offset, length), payload)), HIGHEST, collectingCallback)`. Must
dispatch on the main thread (native latches the caller's `JNIEnv`); queue while the link is
`DISCONNECTED` and let the controller run it on the next connection (a button press wakes the
ring). See [pebble-ring-reference.md](pebble-ring-reference.md) for the full plumbing.

### Tooling that produces this format

- **`mkimage`** — the official generator, source shipped inside Renesas SDK6
  (`\utilities\mkimage`). The format is trivial enough (64-byte header + binary + CRC32) to
  reimplement in ~30 lines of Python.
- **[ezFlashCLI](https://github.com/ezflash/ezFlashCLI)** — open-source Python flashing tool
  from Dialog/Renesas for the SmartBond family (SWD/J-Link, not OTA).
- **Pokémon Go Plus scene** — the same DA145xx + SUOTA combination, with custom firmware and
  a BLE flashing client already public: [Suota-Go-Plus](https://github.com/Jesus805/Suota-Go-Plus),
  [write-up](https://coderjesus.com/blog/pgp-suota/), and a
  [signature-bypass analysis](https://tinyhack.com/2019/05/01/reverse-engineering-pokemon-go-plus-part-2-ota-signature-bypass/)
  (unnecessary here — this ring signs nothing). The closest existing map for anyone attempting
  custom firmware on this hardware.

Reference docs: [SUOTA memory layout](https://lpccs-docs.renesas.com/Tutorial_SDK6/suota_memory.html),
[SW Platform Reference Manual appendix](https://lpccs-docs.renesas.com/UM-B-119_DA14585-DA14531_SW_Platform_Reference/Appendix/Appendix.html).

## The flow

1. **At manager construction**, an update download job fetches and caches the manifest
   (logcat: `KMPHaversineSatelliteManager: Starting initial update download job` /
   `Getting update data`) **[measured]**.
2. The manager internally implements the transport's `HaversineUpdateDelegate`
   (`getFirmwareUpdate`, `willUpdateFirmware`, `didUpdateFirmware`, `getSensorConfigUpdate`)
   **[disasm]**.
3. **On every connection** to the ring, the transport asks the delegate for an available
   update. If the ring's firmware revision is older than the manifest's and the hardware
   matches the `hwVersion` pair given at manager construction (`Pair(11, 0)`), it runs the
   native `SuotaOperation` — SUOTA is Dialog Semiconductor's Software Update Over The Air
   protocol, which suggests a Dialog/Renesas BLE SoC in the ring (`SuotaOperation_shouldRetry`
   is also exported) **[disasm]**.
4. Progress surfaces as `SatelliteStatus.FirmwareUpdating.Started/Success/Failed` in the
   `startScanning()` flow.
5. **Sensor configuration updates** ride the same delegate (`getSensorConfigUpdate`).

### Failsafe mode

A ring that boots into failsafe (recovery after a bad flash — `isInFailSafeMode` on the
satellite state) is rescued by this same flow. The official app gives the update priority:
any active collection transfer is marked failed and cleared so the flash can proceed
**[source]**.

## Implication for g1-open-teleprompter

**This app auto-updates the ring's firmware too.** There is no opt-out parameter in the
manager's constructor; our integration passes `hwVersion = Pair(11, 0)` and collects the same
status flow. The moment Pebble publishes a version newer than the ring's on that GitHub
branch, our sync loop will silently flash it mid-cycle — our `collect { }` ignores statuses,
so it would not even be visible in our logs. (The user's ring is presumably already at 3.74,
which is why it has never triggered.)

Consequences:

- The PoC README's claim that "firmware updates happen only through the official app" is
  **wrong** for any haversine-based client.
- Opening the official app periodically for firmware updates is unnecessary.
- If visibility is ever wanted, log `SatelliteStatus.FirmwareUpdating` in
  `PebbleRingModule`'s collector (deliberately not done today — YAGNI).
