# Pebble Index 01 ring — engineering notes

Everything known about driving the **Pebble Index 01** smart ring
([repebble.com/index](https://repebble.com/index)) as a slide clicker, consolidated from the
`ring-click-poc` reverse-engineering effort and live hardware testing done while building this
app's integration (2026-07-30). Facts are marked **[measured]** when observed on real hardware,
**[poc]** when they come from the PoC README, and **[disasm]** when extracted from the
haversine library binaries.

The ring's platform is a repurposed golf swing sensor — struct names in the firmware protocol
(`GSSwingSetupRecord`, `GSClubSettingsRecord`, `GSTargetLineAimRecord`) give it away **[disasm]**.
That explains its architecture: it is a *collection recorder* (motion + mic samples per button
press), not an input device. There is no click-only mode; every press records and transfers a
full collection.

---

## 1. Radio behavior

| State | Behavior |
|---|---|
| Idle, synced | Radio silent (verified ≥2 min windows) **[poc]** |
| Button pressed | Wakes instantly and advertises its **old** state (counter not yet bumped, state `0x60`) **[measured]** |
| Committing | Collection commit lands on air as a counter change ~1.3–4.6 s after the press **[measured]** |
| Data pending | ~10 adv/s for 4–10 s, then retry beacon every 1–3 s forever until a client syncs **[poc]** |
| While GATT connected | Advertising stops completely **[poc, measured]** |
| After sync | Keeps advertising for a ~10 s tail, then silence **[measured]** |
| Zombie mode | Beacons every ~2–8 s with state `0x00`, never serviced (see §7) **[measured]** |

Key derived facts:

- **The advertising tail is ~10 s per click and is a firmware timer.** No library operation
  configures it (full API audited, §5). It is not motion-related (`isMoving` bit never seen).
  Consequence: two presses less than ~12 s apart never see radio silence between them.
- Each advertising event arrives as a **triplet** (3 BLE channels, ~8 ms apart) **[poc]**.
- With a fast sync (~150 ms GATT hold), the wake burst, pending phase and post-sync burst
  **merge into one continuous burst** from the scanner's point of view — there is no ≥2 s gap
  between them **[measured]**. A separate post-sync burst only appears when the GATT link was
  held longer; separate post-sync bursts were observed starting up to ~9 s after the counter
  change **[measured]**.

## 2. Advertisement format

- Service UUID: `607B5C9B-3700-4E94-F44A-2DF900BCB0C3` (16-bit alias `0xFCC9`)
- Manufacturer data, company id `0x0EEA`, 6 bytes:

```
FF FF 3C F0 CC SS
└───┬────┘  │  └─ state bitfield (see below)
    │       └─ collection counter
    └─ constant prefix; the lib parser reads these 4 bytes as "cacheableStateFingerprint"
```

### Collection counter `CC`

- +1 per button press (it is the next collection index) **[poc, measured]**.
- Single unsigned byte: **wraps 255 → 0** in normal operation (observed live; change-based
  detection survives it) **[measured]**.
- **Reset to 0 by `EraseCollections`** — this blinds any counter-based click detection and is
  one of the reasons the wipe experiment failed (§7) **[measured]**.

### State bitfield `SS` [disasm]

Bit meanings recovered by disassembling `HaversineAdvertisementData_parseManufacturedData`
(x86_64 build of `libhaversinesatellitelibrary.so`) and matching the JNI constructor call:

| bit | name (lib) | observed |
|---|---|---|
| `0x80` | `isMoving` | never seen |
| `0x40` | `needsServicing` | set on wake-from-idle press; seen alone once (pending) |
| `0x20` | `inCollectionState` | set on wake-from-idle press |
| `0x10` | `hasDebugInfo` | never seen |
| `0x08` | parsed by the lib but unused | — |

Empirical rules (consistent across ~150 logged clicks) **[measured]**:

- **A genuine wake-from-idle press always advertises `0x60`** (`needsServicing + inCollectionState`).
- Commit packets, post-sync tail bursts, retry beacons and zombie beacons advertise `0x00`.
- The PoC README's interpretation (`0x00` = "official app alive") is **wrong** — `0x00` shows
  with no official app installed/running.

### How the haversine manager reacts

**The manager only connects to the ring when `needsServicing` (`0x40`) is set** **[measured]**.
Its scanner logs (`HS-CentralManager`) show it counting the ring's advertisements while
refusing to connect as long as the state is `0x00`. This is what keeps a zombie ring zombie (§7).

## 3. Collections and button sequences

- Every press records a collection **with mic audio** — a ~2 ms stub for a quick click **[poc]**.
- `buttonSequence` metadata is **cumulative** within the firmware's quick-press window: a double
  click produces TWO collections — `'short'`, then `'short short'`. Clients must debounce
  (official app: 700 ms) and act on the last value **[poc]**. Known atoms: `short`, `long`.
- The ring **retains** collections; each client keeps its own sync cursor
  (`CollectionIndexStorage`). Two clients each receive everything, once per client **[poc]**.
- **Unsynced collections = perpetual retry beacon = ring battery drain.** Whoever detects
  clicks must also let a sync complete (or let the official app do it) **[poc, measured]**.
- Transfer speed: a click collection syncs in ~60–150 ms connect-to-ack; a 13-collection
  backlog took < 1 s **[poc]**.

## 4. Click timeline (measured end to end)

```
t=0        press; ring wakes; advertises OLD counter, state 0x60   ← earliest detectable signal
t≈0–1s     manager (scanning) sees needsServicing and connects; advertising stops
t≈1.3–4.6s collection commit becomes visible as the counter change
           (observed on air when radio is free; delivered over the open link otherwise)
t≈+0.15s   transfer + ack complete; GATT released
t≈…+10s    post-sync advertising tail, state 0x00, then silence
```

Latency consequences for any advertisement-based detector:

- Press after ≥~12 s of ring silence → the `0x60` wake burst is separable → **instant** detection.
- Press while the previous click's tail is still on air → no detectable burst boundary → the
  counter change is the first usable signal → **~1.3 s+** detection.
- Press while GATT is open (previous sync in flight) → **no advertisement at all**; the
  collection is delivered over the open link **[poc]**. An advertisement-only detector misses
  these entirely (recoverable: press again).

## 5. The haversine library

- Public on Maven Central: `io.github.coredevices.haversine:haversine:f8d8bd7` — same version
  the official app pins. Artifacts are immutable; vendoring the 657 KB AAR removes the remote
  dependency if ever needed **[poc]**.
- Uses the OS-level BLE bond: pair once via the official Pebble app, then any app on the phone
  can drive the ring **[poc]**.
- Transport layer is readable Java (`com.wtlp.haversinesatellitelibrary`); the wire protocol
  ("Telesto") lives in bundled native libs: `libhaversinesatellitelibrary.so` (unstripped, 154
  named exports) and `libppcommon.so` (SWIG bindings for the golf-platform data structures)
  **[disasm]**.
- The lib logs to logcat under tags `HS-CentralManager`, `HS-HaversineSatelliteManager` and
  `KMPHaversineSatelliteManager` — useful to see scan/connect decisions **[measured]**.

### GATT layout

| Role | UUID |
|---|---|
| Service (16-bit) | `0xFCC9` |
| Service (128-bit) | `607B5C9B-3700-4E94-F44A-2DF900BCB0C3` |
| Telesto data channel | `DAAD3D52-237C-90A7-B54B-8854A134D801` |
| Telesto ctrl channel | `C0EF558A-2058-FABF-A140-8D5ACDE50B39` |
| System input channel | `1D1F4039-23F5-33B2-C24E-704351F20585` |

### Complete operation inventory [disasm]

Everything the ring accepts, from the native export list and the Java/Kotlin API:

| Operation | Notes |
|---|---|
| `TransferCollections` | The sync; the only thing that puts a pending ring back to sleep |
| `EraseCollections` | Wipes stored collections; **resets the advertisement counter to 0** |
| `ProgramApplicationData` / `EraseApplicationData` | Writes/clears a user-ID blob (`PPRingApplicationData_t`: fingerprint, timestamp, user) |
| `Panic` | Golf-platform legacy; semantics unknown, untested |
| `ReadDebugInfo` | Returns `coreDump: byte[]` + `rebootReasons[]` — **no battery, no telemetry** |
| `ReadRxRSSI` | Link signal strength |
| `StreamOperation` / `SensorService` | Real-time IMU streaming (accel/gyro/mag) over a held link |
| `Suota` | Firmware update (official app only, in practice) |
| `SystemInput` | Write channel into the ring; purpose unmapped |
| `UpdateCache` | Reads cacheable state: serial, firmware revision, platform versions, app data |
| Telesto primitives | `ERASE_MEMORY`, `PROGRAM_MEMORY`, `READ_MEMORY`, `CANCEL_OPERATION` |

**There is no operation that configures advertising, sleep, radio timing or the ~10 s tail.**
The only phone-side knob in the whole API is `setConnectionTimeoutSeconds`. The only way to
silence the radio is to hold the GATT connection open — which costs ring battery and removes
the instant wake-burst signal, so it is a net loss for a clicker.

Also available on the raw `HaversineSatellite`: `addAdvertisementListener` /
`addStateListener` (the lib's own parsed advertisement feed — a possible alternative to a
hand-rolled BLE scan), `streamSamples`, `getWrap()` from the KMP `KMPHaversineSatellite`.

### Battery

- `libppcommon.so` exports `PPCollection_batteryVoltage` — every collection carries battery
  voltage — but **no Java/Kotlin binding surfaces it** (the Kotlin `PPCollection` omits it, and
  `TransferStatus` never sees it) **[poc, disasm]**.
- `ReadDebugInfo` was tested as an alternative route: it is a crash dump, not telemetry. Dead end **[measured]**.
- Remaining routes, unexplored: check for standard Battery Service `0x180F` with nRF Connect;
  else a JNI shim over `libppcommon`. Caveats: value is millivolts (needs a discharge curve)
  and only refreshes on a button press **[poc]**.

## 6. Driving the ring from an app (what this repo does)

Implementation: `android/app/src/main/java/com/teleprompter/PebbleRingModule.kt` (hybrid
detector + sync loop), `services/PebbleController.ts` (driver), `components/SlidesScreen.tsx`
(one listener: click → next slide).

### Detection rules (hybrid, fastest signal available per click)

1. **Burst-start click** — fires instantly at the press. Requires ALL of:
   - ≥2 s of radio silence before the packet (`BURST_GAP_MS`);
   - counter unchanged vs. last seen (the ring wakes advertising its old counter);
   - state byte exactly `0x60` (rejects retry/zombie/tail beacons);
   - more than 10 s since the last counter change (`POST_SYNC_WINDOW_MS` — a burst starting
     sooner is the same click's post-sync burst).
2. **Counter-change click** — the fallback that never misses: any counter change fires,
   ~1.3 s after the press, unless that counter value already fired as a burst-start click
   (dedupe by counter value: a burst-start fire at counter N owns the N→N+1 change).

Properties that fall out of these rules **[measured]**:

- Comparing counters dedupes the 3-channel advertising triplet for free.
- The first packet ever seen only primes the baseline → the very first press after starting
  the monitor is swallowed (calibration press).
- Counter wrap 255→0 and erase-resets are handled (change-based, not ordered).
- Presses ≥~12 s apart: instant. Faster cadence: ~1.3 s. Press during open GATT: missed, press again.
- ~150 clicks logged with zero duplicates and zero missed (except the documented cases above).

### Design decisions

- **Forward-only**: 1 press = next slide. The advertisement cannot distinguish single from
  double click, so double click just advances twice; "previous slide" via `'short short'` was
  deliberately dropped along with the whole collection-content path (the sequence would only
  arrive ~1.3 s+700 ms debounce after the press).
- **The sync loop still runs, with statuses ignored** — it exists solely so `TransferCollections`
  acks each collection and the ring goes back to sleep. This is mandatory (see §3).
- Haptic feedback: the phone vibrates 50 ms per detected click (`VibrationEffect` with
  `VibrationAttributes.USAGE_TOUCH` — plain `vibrate()` lands as `USAGE_UNKNOWN`, which many
  devices suppress via settings).

## 7. Failure modes and recovery (all observed live)

### `shouldWipeCollectionsBeforeTransfer = true` — never do this

Tried on 2026-07-30, failed in three compounding ways:

1. The wipe does **not** clear the pending state — the ring re-advertises as pending, the
   manager reconnects and wipes again, in a ~2 s infinite loop.
2. The erase resets the advertisement counter to 0, blinding counter-based dedupe/suppression
   → every retry beacon reads as a click (phantom slide advances).
3. It left the ring in **zombie mode** after the hack was reverted: beaconing every ~2–8 s with
   state `0x00` — and since `needsServicing` is clear, the manager never connects to fix it.

Only the real transfer+ack cycle puts the ring to sleep.

### Sync cursor ahead of the ring

The erase also desynchronized the client cursor (`SharedPreferences "pebble_sync"`, key
`lastIndex` — held 260 while the ring was back at 3). The manager finds "nothing new" and never
services the ring. Fix (debug builds):

```sh
adb shell am force-stop com.teleprompter
adb shell run-as com.teleprompter rm shared_prefs/pebble_sync.xml
# reopen the app; the first sync re-primes from scratch
```

### Zombie ring cure

One **real button press** raises `needsServicing` (`0x60`) → the manager finally connects →
full sync + ack of the orphaned collections → the ring sleeps again **[measured]**. If that
ever fails, open the official Pebble app once and let it service the ring (it has the full
maintenance flow), then force-stop it.

## 8. Coexistence with the official Pebble app

- Ring sync runs in the official app's `PebbleService` (foreground service). It starts only
  when the app process starts; **no `BOOT_COMPLETED` receiver** → after force-stop or reboot it
  stays dead until manually opened **[poc]**.
- Both clients can sync in parallel — each keeps its own cursor and receives everything once.
- **Firmware updates happen only through the official app** — open it occasionally.
- Voice notes recorded while this app is the active syncer are consumed and dropped.
- Official app handler chain, for reference: `RingSync` → `IndexButtonSequenceRecorder`
  (700 ms debounce) → `IndexButtonActionHandler` → media-key dispatch **[poc]**.

## 9. Ideas explored and parked

- **IMU streaming click detection** (`streamSamples`): hold the link (radio silent), detect the
  physical press as an accelerometer spike in near-real-time — the only known route to both
  instant detection *and* single/double discrimination. Costs: continuous radio+sensor drain on
  the ring's tiny battery, an unmapped collection-recording interplay, and a spike detector to
  tune. Parked until the hybrid's latency actually hurts.
- **Battery readout**: JNI shim over `libppcommon`, or check for GATT Battery Service `0x180F`.
- **`restartPreemptiveTransfer()`** (manager) — undocumented; might accelerate the connect/ack
  cycle when prodded at wake time. Untested.
- **Lib's advertisement listener** instead of our own BLE scan — same signal, less code, but
  the internal scanner's timing is unproven for this use.

## 10. References

- PoC (frozen at v2 on purpose): `~/projects/pebble/ring-click-poc` — `README.md` +
  `MainActivity.kt` (scan + sync side by side, 227 lines).
- This repo: `PebbleRingModule.kt` (detector + sync), commits `755a398` (phase 1, collection
  sequences), `2f05122` (phase 2, device integration), and the `simplify` branch session that
  produced the hybrid detector and this document.
- Reversing route for going deeper: Android HCI snoop log → `adb bugreport` →
  `btsnoop_hci.log` in Wireshark (ATT is plaintext above link encryption), plus Ghidra on the
  unstripped `libhaversinesatellitelibrary.so`.
