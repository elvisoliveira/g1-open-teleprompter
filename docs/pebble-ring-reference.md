# Pebble Index 01 — full reference (features beyond the clicker)

> **Historical (stock firmware).** This app now drives the ring through the **CFW** — a
> connectionless click beacon (company `0xFFFF`), see [pebble-ring.md](pebble-ring.md). The
> GATT layout, collection semantics and sync behaviour below describe the **stock**
> firmware and no longer run in the app; kept because the knowledge is still useful (and the
> CFW's failsafe restores the stock firmware).

Everything known about the **Pebble Index 01** ring that g1-open-teleprompter does **not**
use. Kept so the knowledge is not lost; the app itself only needs
[pebble-ring.md](pebble-ring.md) (single click → next slide) and
[pebble-ring-firmware.md](pebble-ring-firmware.md) (firmware updates).

Facts marked **[measured]** were observed on real hardware (2026-07-30/31); **[poc]** come
from the reverse-engineering PoC (`~/projects/pebble/ring-click-poc`, README + 227-line
`MainActivity.kt` — frozen at v2 on purpose); **[disasm]** from the haversine library
binaries; **[source]** from the official app source (`~/projects/pebble/mobileapp`).

## Hardware origin

The platform is a repurposed **golf swing sensor** — firmware struct names give it away:
`GSSwingSetupRecord`, `GSClubSettingsRecord`, `GSTargetLineAimRecord` **[disasm]**. That
explains the architecture: the ring is a *collection recorder* (motion + microphone samples
per button press), not an input device. There is no click-only mode; every press records and
transfers a full collection.

Hardware version reported by the ring is **11.0** — eleven hardware revisions against a 3.x
firmware suggests the physical platform (the golf sensor) long predates the Pebble product:
a mature platform licensed and repackaged into a ring, consistent with the fossilized
`GSClubSettings` structs still in the protocol.

## What the firmware image tells us about the silicon

Inferences from the decoded firmware image (see
[pebble-ring-firmware.md](pebble-ring-firmware.md) for the format), ordered from solid to
speculative:

- **SoC: Dialog/Renesas SmartBond DA1453x, most likely the DA14531.** Three converging
  pieces of evidence: the update protocol is SUOTA (Dialog's proprietary OTA, used by no one
  else); the whole firmware is **~29 KB**, which only makes sense on a part whose BLE stack
  lives in factory ROM — the DA1453x hallmark, where the "application" is a tiny binary on
  top; and the image's vector table points into `0x07fc_xxxx`, the DA1453x RAM map
  **[measured]**. The DA14531 (Cortex-M0+ at 16 MHz, ~48 KB RAM, ~2 mm² package) is the
  classic pick for a ring-sized wearable. 29 KB total implies bare-metal or a minimal RTOS,
  with no room for heavy DSP.
- **Storage: a separate SPI flash for collections.** The Telesto primitives are literally
  `ERASE_MEMORY` / `PROGRAM_MEMORY` / `READ_MEMORY` — raw memory access, not a filesystem.
  Voice notes of minutes (PCM at ~16 kHz ≈ 32 KB/s) need megabytes, far beyond the SoC's
  ~48 KB RAM. This also explains the **1.5–6 s commit per press** **[measured]**: waking the
  flash, writing the collection (even a 2 ms audio stub carries metadata plus sensor samples)
  and finalizing is expensive on an M0+.
- **Sensors: 9-axis IMU plus a MEMS microphone.** `GSSTSensorConfigRecord` exposes
  `accelBDR`, `gyroBDR` and `magBDR` — accelerometer, gyroscope and magnetometer with
  configurable data rates (straight from the golf lineage) **[disasm]**. The `isMoving`
  advertisement bit implies **wake-on-motion via an accelerometer interrupt**, with the IMU
  standing sentry while the SoC sleeps. Heavy processing (resampling, audio timeline —
  `PPResampledIMUTimeSeries`, `PPResultAudioTimeline`) happens **on the phone** via
  libppcommon, confirming minimal on-ring CPU.
- **Power: aggressive duty-cycling, no fuel gauge.** Battery is reported in **millivolts, not
  percent** — a raw ADC read with no gas-gauge circuit (saves BOM and quiescent current).
  Every radio behavior we fought (total silence when idle, waking only on button/motion, the
  fixed-timer advertising tail, the retry beacon begging for a sync) is the profile of a
  design counting microamps. The sync obligation that shaped this whole integration is, at
  root, a battery consequence: a pending collection means the radio stays on.
- **Boot: dual-bank with a recovery image.** Failsafe mode (`isInFailSafeMode`) plus SUOTA
  implies Dialog's standard two-slot arrangement: a bad flash boots into a minimal rescue
  image that still speaks BLE and SUOTA — which is why the official app prioritizes the
  update over transfers when it sees failsafe **[source]**.

Practical takeaway: the limits we hit (~1.3 s commit, ~10 s tail, no click-only mode) are not
sloppy firmware — they are the energy and silicon budget of an M0+ with external flash on a
ring-sized battery. The hybrid detector sits at the hardware's ceiling.

### Custom firmware — feasibility mapped, still a bad deal for this app

**Technically feasible, and the risk is now well characterized** (2026-07-31 investigation).
What we established:

- No signature, no encryption — only a CRC32; SUOTA accepts any well-formed image
  ([pebble-ring-firmware.md](pebble-ring-firmware.md)).
- The bootloader **validates** the app image (signature `0x7051`, `validflag 0xAA`,
  `code_size < 32 KB`, CRC32) before booting; on failure it drops to a BLE- and
  Telesto-capable **failsafe** at `0x40050000` that survives any write to the app region. So a
  *malformed* image cannot brick the ring — confirmed by disassembly.
- READ / PROGRAM / ERASE were **exercised end-to-end on the real ring** (write `DE AD BE EF …`
  to the scratch region, verified, erased, verified back to `0xFF`). We control all three flash
  operations by hand, and can read an image back byte-for-byte before reboot to confirm it.
- The Pokémon Go Plus scene has published custom firmware and a BLE flashing client for the
  same silicon (links in the firmware doc).

**Residual risk:** a *well-formed but logically wrong* image (bad button pinout, hang on init)
passes validation, boots, and then hangs — the failsafe does not cover this, and a reset
re-boots the same bad image. Mitigation: develop and validate on a **DA14531 dev kit** (~US$50,
SWD-recoverable) first, and ideally keep a spare ring.

**Still not worth it for the teleprompter.** The gain is **~1.3 s on fast clicks only** (spaced
presses are already instant), against: mapping the IMU/flash/button pinout of an undocumented
golf-sensor platform (weeks of Ghidra over symbol-less Thumb), losing voice notes and
official-app integration, and every published firmware release fighting to overwrite the custom
one (our own sync applies updates). The parked **IMU streaming** idea below delivers the same
latency win — plus double-click discrimination — with zero hardware risk and full reversibility.

If pursued anyway, the smallest first milestone is a custom image that only *advertises*
something recognizable (no button yet) — it proves the whole compile → header → flash → boot →
recover chain. The button, then single/double/long discrimination, come after.

## Firmware internals (Ghidra, 2026-07-31)

Both flash images are disassembled in the `PebbleRing` Ghidra project
(`~/projects/pebble/ghidra-ring`), driven via the GhidraMCP plugin.

### ROM symbols imported

The DA14531 boot ROM's function map was imported so ROM calls read as names. Source: the
SDK6 `da14531_symbols.txt` (Keil `--symdefs`), found in `atc1441/ATC_SR08_Ring` on GitHub
(another DA14531 ring). Two steppings ship (`-00` 2019, `-01` 2022); **the ring uses
DA14531‑00** — confirmed by cross-checking call targets (`rwip_reset` @ `0x07f1d3ba`,
`llc_state_handler` @ `0x07f1f468` match `-00`; `-01`'s address range doesn't even reach the
`0x07f22d60` the firmware calls). A ROM memory block was created at `0x07f00000` and **837 ROM
functions** were defined (labels alone don't rename decompiler calls — a *function* must exist
at the target; `GHIDRA_MCP_ALLOW_SCRIPTS=1` enabled the bulk-create script). Applied to both
images. **[disasm]**

Notable ROM contents surfaced: the full Dialog BLE stack (`llc_*`, `lld_*`, `llm_*`, `ke_*`,
`gapc/gapm/gattc/gattm/l2cc/smpc`), crypto (`u_ecc_*`, `ba431_get_rand`), a **flash driver**
(`flash_identify/init/read/write/erase`), the **SUOTA receiver** (`suotar_prf_itf_get`), the
**custom-service framework** (`custs1_*` — what Telesto is built on), and a **Battery Service**
(`bass_*`, present in ROM but the ring does not expose `0x180F`).

### Application architecture — a stock Dialog SDK6 app

This is the single most important finding for any custom-firmware plan: **the stock firmware is
a textbook DA14531‑00 SDK6 application, not exotic custom bring-up.** Named so far (in
`app_fw374_body.bin`):

| Function | Address | Role |
|---|---|---|
| `platform_init` | `0x07fc14c4` | the SDK `arch_main`: `ble_init` + `periph_init` + the `rwip` main loop with `WaitForInterrupt` sleep; builds the `"Pebble Index XXX"` BLE name from the serial |
| `periph_init` | `0x07fc6824` | peripheral init via `GPIO_ConfigurePin(pin, mode, func, val)` — called at boot and on every wakeup |
| `button_wakeup_handler` | `0x07fc4e06` | WKUP IRQ: timestamp + send event msg `0x12` + re-arm |
| `arm_button_wakeup` | `0x07fc1194` | `wkupct_enable_irq(0x2, 0x2, 1, deb)` → arms wake on P0_1 |
| `wkupct_enable_irq` | `0x07f1fce4` (ROM) | SDK wakeup-controller enable (sel, pol, events, debounce) |
| `restore_regs_wakeup` | `0x07fc0ae8` | `ble_regs_pop` — restores BLE registers after sleep |
| `gen_random` | `0x07fc2250` | wraps `dia_rand` (Dialog RNG) |
| `build_send_msg` | `0x07fc0388` | alloc → clear → copy → send a kernel message |
| `send_prf_msg` | `0x07fc2a40` | profile-task message send |
| `gpio_config_pin` | `0x07f1f998` (ROM) | GPIO pad config helper |
| `msg_alloc` / `msg_send` | `0x07f1acf8` / `0x07f1ad2e` (ROM) | kernel message alloc/send (heavily used) |
| `memcpy` / `memclr` | `0x07f1d3b0` / `0x07f1d3e2` (ROM) | the ubiquitous copy/clear helpers |

The app mostly calls its own functions plus these ROM helpers — so call-fingerprint naming
yields broad categories (message senders using `msg_alloc`+`msg_send`; data movers using
`memcpy`/`memclr`; dense event/GATT handlers like `0x07fc36b0`, `0x07fc38c8`) but few specific
names. The GATT service DB table sits at `0x07fc704a` with the Telesto data-char UUID at
`0x07fc705c` — the anchor for naming the Telesto handlers precisely (per-function decompile).

### GPIO pin map (from periph_init) [disasm]

`GPIO_ConfigurePin` calls (`mode` 0x300 = OUTPUT, 0 = INPUT; `func` = pad function ID):

| pin | mode | func | likely |
|---|---|---|---|
| P0_9 | OUTPUT | 0x1d | SPI flash |
| P0_0 | OUTPUT | 0x1c | SPI flash |
| P0_6 | OUTPUT | 0x1b | SPI flash |
| P0_11 | INPUT | 0x1a | peripheral input (mic PDM / sensor) |
| **P0_1** | INPUT | 0 | **the button** (plain GPIO, confirmed below) |
| P0_3, P0_4 | OUTPUT | — | mic / misc |

### Button — confirmed P0_1 [disasm]

The button is **P0_1**, via the DA14531 wakeup controller. `arm_button_wakeup` (`0x07fc1194`)
calls the ROM `wkupct_enable_irq(sel_mask, pol_mask, num_events, debounce)` as
`wkupct_enable_irq(0x2, 0x2, 1, 0x14)`:
- `sel_mask = 0x2` → bit 1 → **P0_1**;
- `pol_mask = 0x2` → falling edge on P0_1 → **active-low** (pull-up, press pulls to GND);
- `debounce = 0x14` = **20 ms**.

Event path on a press: WKUP IRQ → `button_wakeup_handler` (`0x07fc4e06`) takes a timestamp,
sends kernel event message `0x12` (via a `msg_alloc`+`msg_send` wrapper), and re-arms the
wakeup. This closes the click side: a click CFW configures P0_1 as input-pull-up, calls
`wkupct_enable_irq(1<<1, 1<<1, 1, deb)`, and on wake advertises the press.

### Custom-firmware synthesis (safety verdict)

Everything needed to attempt a **featureless (advertise-only) CFW** is now established:
SoC DA14531‑00, XTAL 16 MHz (fixed), **1.5 V single-cell boost** power (from the FCC battery),
flash auto-detected by ROM, stock SDK6 architecture, `0x7051`+CRC32 image (unsigned), flashed
via Telesto `ERASE`+`PROGRAM` at `0x40060000`.

Safety:
- **Malformed image → does not brick** (failsafe bootloader validates + drops to a
  Telesto-capable BLE loop; re-flashable by our own dumper).
- **Well-formed image that hangs after boot → NOT auto-recoverable** — no boot-attempt
  counter / watchdog fallback exists (confirmed in the bootloader). This is the only real
  brick risk.
- **Verdict:** validate any CFW on a **DA14531 dev kit** (SWD-recoverable) before ever
  flashing the ring; ideally keep a spare ring.

A **click CFW is now fully specified**: boot config as above + configure **P0_1** as
input-pull-up + `wkupct_enable_irq(1<<1, 1<<1, 1, ~20ms)` + on wake, advertise a recognizable
manufacturer payload. No collection recording, no mic, no flash writes — which should also give
*better* battery than stock. Still must be dev-kit-validated before flashing the ring.

## Collections and button sequences

- Every press records a collection **with mic audio** — a ~2 ms stub for a quick click **[poc]**.
- `buttonSequence` metadata is **cumulative** within the firmware's quick-press window: a
  double click produces TWO collections — `'short'`, then `'short short'`. Clients must
  debounce (official app: 700 ms) and act on the last value **[poc]**. Known atoms:
  `short`, `long`.
- The ring **retains** collections; each client keeps its own sync cursor
  (`CollectionIndexStorage`). Two clients each receive everything, once per client **[poc]**.
  The ring's own view of what it holds is readable at `0x40030005` as
  `TelestoStoredCollectionIndexes{rangeStart, rangeEnd}` — comparing it against each client's
  cursor is the way to diagnose a zombie ring (see the recovery section in
  [pebble-ring.md](pebble-ring.md)) **[measured]**.
- Transfer speed: a click collection syncs in ~60–150 ms connect-to-ack; a 13-collection
  backlog took < 1 s **[poc]**.
- Official app behavior: audio < 1 s → discarded; sequence → action (media key via
  `AudioManager.dispatchMediaKeyEvent`). Handler chain: `RingSync` →
  `IndexButtonSequenceRecorder` (700 ms debounce) → `IndexButtonActionHandler` → media-key
  dispatch **[poc, source]**.

This app used the buttonSequence path in an earlier iteration (commits `755a398`/`2f05122`:
`'short'` → next, `'short short'` → previous) and dropped it: the sequence only arrives
~1.3 s + 700 ms debounce after the press, and the advertisement path made forward-only
instant clicks possible.

## The haversine library

- Public on Maven Central: `io.github.coredevices.haversine:haversine:f8d8bd7` — the same
  version the official app pins. Artifacts are immutable; vendoring the 657 KB AAR removes
  the remote dependency if ever needed **[poc]**.
- Uses the OS-level BLE bond: pair once via the official Pebble app, then any app on the
  phone can drive the ring **[poc]**.
- Transport layer is readable Java (`com.wtlp.haversinesatellitelibrary`); the wire protocol
  ("Telesto") lives in bundled native libs: `libhaversinesatellitelibrary.so` (unstripped,
  154 named exports) and `libppcommon.so` (SWIG bindings for the golf-platform structures)
  **[disasm]**.
- Logs to logcat under `HS-CentralManager`, `HS-HaversineSatelliteManager`,
  `KMPHaversineSatelliteManager` — shows scan/connect decisions **[measured]**.
- **The manager only connects when the advertisement has `needsServicing` (`0x40`) set**;
  a ring beaconing `0x00` is watched but never serviced **[measured]**.
- KMP surface: `KMPHaversineSatelliteManager` (awaitBluetoothReady, startScanning flow,
  programSatelliteWithUserID, restartPreemptiveTransfer, getSatelliteById, getLastRing);
  `KMPHaversineSatellite` (panic, eraseCollections, state, lastAdvertisement, `getWrap()`).
- Raw `HaversineSatellite` adds: transferCollections, programApplicationData /
  eraseApplicationData, streamSamples, setConnectionTimeoutSeconds,
  addAdvertisementListener / addStateListener (the lib's own parsed advertisement feed — a
  possible alternative to a hand-rolled BLE scan).
- The advertisement parser (`HaversineAdvertisementData`) decodes the manufacturer data into
  `needsServicing`, `inCollectionState`, `isMoving`, `hasDebugInfo`, `collectionCount`,
  `cacheableStateFingerprint` — bit positions recovered by disasm (see pebble-ring.md).

### GATT layout

Confirmed live with nRF Connect (2026-07-31) **[measured]** — the ring's full attribute table
is exactly this and nothing else:

| Service | Characteristic | UUID | Properties |
|---|---|---|---|
| Generic Access `0x1800` | Device Name / Appearance | `0x2A00` / `0x2A01` | READ |
| Generic Attribute `0x1801` | Service Changed | `0x2A05` | INDICATE, READ |
| Haversine (16-bit alias `0xFCC9`) | — | `607B5C9B-3700-4E94-F44A-2DF900BCB0C3` | — |
| ↳ | Telesto data channel | `DAAD3D52-237C-90A7-B54B-8854A134D801` | NOTIFY, WRITE, WRITE NO RESPONSE |
| ↳ | Telesto ctrl channel | `C0EF558A-2058-FABF-A140-8D5ACDE50B39` | NOTIFY, WRITE, WRITE NO RESPONSE |
| ↳ | System input channel | `1D1F4039-23F5-33B2-C24E-704351F20585` | NOTIFY, WRITE, WRITE NO RESPONSE |

Two absences settle open questions:

- **No Battery Service `0x180F`** — the "2 minutes with nRF Connect" route to a ready-made
  battery percentage is definitively dead. Only the JNI-shim-over-`libppcommon` route
  remains (millivolts, refreshed on button press).
- **No Device Information Service `0x180A`** — firmware revision and serial are not exposed
  over standard GATT; they arrive through `UpdateCache` over Telesto.
- **No SUOTA service `0xFEF5`** — see [pebble-ring-firmware.md](pebble-ring-firmware.md):
  firmware flashing rides the proprietary Telesto memory operations, not the standard Dialog
  OTA service.

The UUIDs match the `HaversineUUID` table extracted from the AAR exactly — a good
cross-validation of the disassembly work.

### Telesto virtual address map [disasm]

Telesto's memory primitives (`ERASE_MEMORY=1`, `PROGRAM_MEMORY=2`, `READ_MEMORY=3`,
`CANCEL_OPERATION=4`) address a **virtual space** the firmware maps to physical flash. Four
addresses are named in the library's `TelestoVirtualAddress` enum; the rest were recovered by
sweeping `0x4xxxxxxx` constants across `libhaversinesatellitelibrary.so`:

All of it was then **read back from a real ring** with `READ_MEMORY` (2026-07-31) **[measured]**:

| address | contents | what a live read returned |
|---|---|---|
| `0x40000000` | application data store (user ID blob) | 512 × `0xFF` — erased, no user ID programmed |
| `0x40010000` | unknown (mapped) | 512 × `0xFF` — erased |
| `0x40020000` | collection base | real records (`57 00 00 00 35 04 00 FF…`) |
| `0x40030001` | timestamp record | `93 65 6C 6A` = `0x6A6C6593` = Unix 2026-07-25 |
| `0x40030005` | stored collection indexes | `00 00 08 00` |
| `0x40030006` | platform versions | `0B 00 03 4A` = **hw 11.0, fw 3.74** — matches the manifest exactly |
| `0x40040000` | — | error 67 "Telesto operation bad request" → not mapped |
| **`0x40050000`** | **SPI-flash bootable image** (sig `0x7050`, 30795 B) | full image, dumped |
| **`0x40060000`** | **primary firmware image** (sig `0x7051`, 29224 B) | byte-for-byte identical to the published 3.74 |
| `0x40070000` | — | error 67 → no secondary slot here |

Useful behaviors observed: the firmware **truncates a read to the region's real size** (asking 512
bytes of a 4-byte record returns 4), and unmapped addresses fail cleanly with operation error 67 —
so the address space can be mapped safely by probing.

### Two images in flash

`0x40050000` holds a **different, complete image** from the SUOTA one: signature `0x7050`
(AN-B-001 "SPI flash bootable image", i.e. what the ROM loads at power-on) versus `0x7051`
(SUOTA image header), 30795 vs 29224 bytes, different initial stack pointers
(`0x07FCE400` vs `0x07FCC2D4`), 36 of 113 code blocks in common. **Both** contain the service
UUID, the Telesto channel UUID, the `0x0EEA` company id and the `"Pebble Index"` name template
— so both are BLE- and Telesto-capable, meaning either can be talked to and can reflash.

Since **SUOTA writes only to `0x40060000`**, the image at `0x40050000` survives a firmware
update. Ghidra confirmed its role (2026-07-31): it is the **failsafe bootloader** — its startup
code reads and validates the app image's header (`validflag 0xAA`, signature `0x7051`,
`code_size < 32 KB`) and boots it, or drops to its own BLE/Telesto loop on failure. This is the
recovery path (`isInFailSafeMode`) and it resolves the single biggest unknown in any
custom-firmware plan: a malformed app image cannot brick the ring. Full analysis in
[pebble-ring-firmware.md](pebble-ring-firmware.md).

The firmware-update path was confirmed by disassembling `HaversineSuotaOperation_shouldRetry`:
it builds a `TelestoRequest` on the stack (`type=1` ERASE_MEMORY, `address=0x40060000`,
`offset=0`, `length=`image size) and calls `TelestoOperation_init` — so **SUOTA is literally
Telesto memory operations**, matching the log strings `Starting ERASE_PRIMARY_IMAGE` /
`Starting PROGRAM_PRIMARY_IMAGE`. "Primary" hints at a secondary slot; `0x40070000` is worth
probing.

Because the space is *virtual*, the bootloader is probably not reachable through it — a full
raw flash dump is likely impossible, and only firmware-exposed regions can be read. The
translator also validates addresses: unmapped ones return `0x43` (67, "Telesto operation bad
request"), which is exactly what a live probe of `0x40040000` and `0x40070000` returned.

Physical mapping recovered from the translator constants **[disasm]**: `0x4000000N` →
`0x12000 + N*0x1000` (app data store, 4 KB pages); `0x40060000` → physical `0x05000` (app
image); `0x40060002` → `0x1F000` (product header — the DA14531's documented
`PRODUCT_HEADER_POSITION`, another SoC confirmation; a `0xDEADDEAD` marker there is checked and
repaired each boot).

### Dispatching a raw operation — READ / PROGRAM / ERASE all validated

Not exposed by the KMP layer, and the official Pebble app never does it (zero uses in its
source — it only calls the high-level API). The plumbing that works **[measured]**:
`KMPHaversineSatellite.wrap` → `HaversineSatellite`, whose `linkController` field is private
(reflection), then `performOperation(TelestoOperation(TelestoInputParameters(TelestoRequest(
type, address, offset, length), payload)), HaversineOperationPriority.HIGHEST,
HaversineOperationCollectingCallback)`. Operation type codes: `NO_OP=0, ERASE=1, PROGRAM=2,
READ=3, CANCEL=4`.

Two implementation facts learned the hard way:

- **Dispatch from the main thread.** The native layer latches the calling thread's `JNIEnv` and
  its `LinkTransport` delivers replies on the main looper; dispatching from a background
  coroutine aborts the process (`JNI DETECTED ERROR … in call to NewByteArray from
  LinkControllerAdapter.receiveTelestoDataBytes`).
- **Don't chase the connection window.** Queue the operation while the link is `DISCONNECTED`
  and let the controller run it on the next connection — it works, and beats racing the
  ~150 ms GATT window. A press wakes the ring; the reply lands 1–3 s later. A single request
  can be large: 30795 bytes came back in 3.2 s.

**All three memory ops confirmed on hardware** (2026-07-31): a READ of `0x40060000` matched the
published firmware byte-for-byte; a PROGRAM of 16 bytes to the erased scratch region
(`0x40000000`) wrote exactly the intended bytes; an ERASE returned that page to `0xFF`. Each
is bracketed by read-backs so the effect is verified, not assumed. `DumpActivity` in the PoC
implements all of them; PROGRAM/ERASE refuse `0x40060000` unless an explicit `allowBoot` flag
is passed, since that is the one address the bootloader boots.

### Complete operation inventory [disasm]

| Operation | Notes |
|---|---|
| `TransferCollections` | The sync; the only thing that puts a pending ring back to sleep |
| `EraseCollections` | Wipes stored collections; **resets the advertisement counter to 0** and does NOT clear the pending state — bricks the ring into a zombie loop (tested) **[measured]** |
| `ProgramApplicationData` / `EraseApplicationData` | Writes/clears a user-ID blob (`PPRingApplicationData_t`: fingerprint, timestamp, user) |
| `Panic` | Golf-platform legacy; semantics unknown, untested |
| `ReadDebugInfo` | Returns `coreDump: byte[]` + `rebootReasons[]` — no battery, no telemetry (tested) **[measured]** |
| `ReadRxRSSI` | Link signal strength |
| `StreamOperation` / `SensorService` | Real-time IMU streaming (accel/gyro/mag) over a held link |
| `Suota` | Firmware update — see [pebble-ring-firmware.md](pebble-ring-firmware.md) |
| `SystemInput` | Write channel into the ring; purpose unmapped |
| `UpdateCache` | Reads cacheable state: serial, firmware revision, platform versions, app data |
| Telesto primitives | `ERASE_MEMORY`, `PROGRAM_MEMORY`, `READ_MEMORY`, `CANCEL_OPERATION` |

**No operation configures advertising, sleep, radio timing or the ~10 s advertising tail.**
The only phone-side knob is `setConnectionTimeoutSeconds`. The only way to silence the radio
is holding the GATT connection open — which costs ring battery and removes the instant
wake-burst signal.

## Battery

- `libppcommon.so` exports `PPCollection_batteryVoltage` — every collection carries battery
  voltage — but **no Java/Kotlin binding surfaces it** (the Kotlin `PPCollection` omits it,
  `TransferStatus` never sees it) **[poc, disasm]**.
- `ReadDebugInfo` was tested as an alternative route: crash dump only, dead end **[measured]**.
- **The standard Battery Service `0x180F` is not exposed** — checked live with nRF Connect
  (2026-07-31) **[measured]**. The only remaining route is a JNI shim over `libppcommon`;
  caveats: the value is millivolts (needs a discharge curve) and only refreshes on a button
  press **[poc]**.
- The official app shows no ring battery anywhere (its battery UI is watch-only) **[poc]**.

## Official app facts

- Ring sync runs in `PebbleService` (foreground service); starts only when the app process
  starts; **no `BOOT_COMPLETED` receiver** → after force-stop or reboot it stays dead until
  manually opened **[poc]**.
- Ring code lives in `experimental/src/*/kotlin/coredevices/ring/` (RingSync, RingPairing,
  RingHacksDelegate, RingDelegate…), plus `libindex` for device management UI **[source]**.
- Voice notes recorded while another client is the syncer are consumed and dropped **[poc]**.

## Parked ideas

- **IMU streaming click detection** (`streamSamples`): hold the link (radio silent), detect
  the press as an accelerometer spike in near-real-time — the only known route to both
  instant detection *and* single/double discrimination (would bring "previous slide" back).
  Costs: continuous radio+sensor drain on the ring's tiny battery, unmapped
  collection-recording interplay, a spike detector to tune.
- **Battery readout**: JNI shim over `libppcommon` — the GATT `0x180F` route was checked and
  the ring does not expose it.
- **`restartPreemptiveTransfer()`**: undocumented; might accelerate the connect/ack cycle if
  prodded at wake time. Untested.
- **Lib's advertisement listener** instead of our own BLE scan: same signal, less code;
  internal scanner timing unproven.

## Going deeper (reversing routes)

- **Ghidra project set up and annotated**: `~/projects/pebble/ghidra-ring/PebbleRing`, both flash
  images imported as ARM:LE:32:Cortex at base `0x07FC0000`, headers stripped so file offset 0 =
  load base — `boot_image_body.bin` (failsafe bootloader) and `app_fw374_body.bin` (application).
  **837 DA14531‑00 ROM functions + the app-level functions above are named** (see "Firmware
  internals"). Driven live via GhidraMCP. Raw dumps kept in `ring-click-poc/` (`fw374.bin`,
  `dump_40050000_0_30795.bin`).
- **ROM symbols**: import `da14531_symbols.txt` (SDK6 `--symdefs`) — use the `-00` file (the
  ring's stepping). Labels don't rename decompiler calls; create *functions* at the addresses
  (needs `GHIDRA_MCP_ALLOW_SCRIPTS=1` for the bulk script). TSV of (addr, name) at
  `scratchpad/rom_funcs.tsv`.
- Ghidra gotchas: the extension must live under the settings dir matching the running build's
  *edition* (PUBLIC build → `~/.config/ghidra/ghidra_<ver>_PUBLIC/Extensions/`, not `_DEV`), and
  `extension.properties` `version` must equal the Ghidra version exactly; `run_script_inline`
  needs `GHIDRA_MCP_ALLOW_SCRIPTS=1` in the *Ghidra process* env (restart) **and** the
  `~/ghidra_scripts` bundle enabled once via the Script Manager (else an OSGi `PlaceholderBundle`
  cast error).
- **Next static-analysis targets**: (1) ~~button pin~~ **done — P0_1** (see "Button — confirmed");
  (2) the **Telesto GATT handlers** — decompile from the service DB table `0x07fc704a` / char
  UUID `0x07fc705c`; (3) the **collection record format** for battery voltage.
- Android HCI snoop log → `adb bugreport` → `btsnoop_hci.log` in Wireshark — ATT is
  plaintext above link encryption, no sniffer hardware needed **[poc]**.
- `objdump -d` on the x86_64 variant of `libhaversinesatellitelibrary.so` works for quick looks
  (that is how the advertisement bit map and the SUOTA `TelestoRequest` were first recovered).
- A clean-room Telesto rewrite is weeks of work; vendoring the AAR is the pragmatic hedge
  **[poc]**.
