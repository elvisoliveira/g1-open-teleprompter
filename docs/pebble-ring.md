# Pebble Index 01 ring as a slide clicker

What g1-open-teleprompter needs to know about the **Pebble Index 01** smart ring
([repebble.com/index](https://repebble.com/index)) as a **one-button forward clicker**: a
press advances one slide. Every other capability (button sequences, voice recording,
sensors, battery telemetry) is deliberately ignored.

> **This app targets the CFW**, not the stock firmware. The custom firmware
> ([pebble-index-cfw](https://github.com/elvisoliveira/pebble-index-cfw)) turns the ring
> into an instant, connectionless clicker — no pairing, no GATT sync. Flash it first with
> the [flasher app](https://github.com/elvisoliveira/pebble-index-flasher). The stock
> firmware's much slower sync-based behaviour, and how this app drove it before, is kept
> for reference in [pebble-ring-reference.md](pebble-ring-reference.md) and
> [pebble-ring-firmware.md](pebble-ring-firmware.md).

## How a press shows up on the radio (CFW)

The ring is radio-silent when idle. A press wakes it, it advertises a short burst
immediately, then it goes back to sleep:

- Device name contains `Pebble Index`; manufacturer data uses company **`0xFFFF`**.
- `payload[0]` is the **click counter**: **+1 per press**, a single byte, wraps 255→0.
- The burst lasts a few seconds (~30 packets/s), so the new count reaches the phone within
  tens of milliseconds of the press — the whole point of the CFW.
- A power-on reset (the CFW's 5-click / long-press recovery gestures) resets the counter to
  0; a large backward jump is a reboot, not a press.

No GATT, no bonding, no sync cursor, no collection semantics. A counter change *is* a click.

## Detection (implemented in `PebbleRingModule.kt`)

A single `BluetoothLeScanner` scan, hardware-filtered to company `0xFFFF` and the selected
ring's address:

- `counter = manufacturerData(0xFFFF)[0]`; on any forward change, emit `PebbleAdvertClick`
  (plus a short haptic).
- A backward jump larger than 8 is treated as a reboot and ignored (the counter reset to 0),
  so a recovery gesture never fires a phantom click.
- The first packet after `start()` only primes the baseline — no click is emitted for it.
- **Auto-heal:** Android silently stops delivering scan results after a fixed window
  (~10 min measured); the module re-issues the scan every 4 minutes, so a long presentation
  never loses the clicker. (Same fix the flasher app carries.)

Selection: the ring is discovered by an advertisement scan (name + company `0xFFFF`), so it
works even though a CFW ring is not bonded — see `scanForPebbleCfwRings` in
`PebbleController.ts`. A ring already bonded from the stock firmware still appears in the
paired list too; either path yields the same address passed to `PebbleController.connect`.

## What went away vs. the stock firmware

The CFW removes every source of the old latency and fragility (all of which the reference
doc still describes for the stock firmware):

- **No sync obligation** — the ring sleeps on its own after the burst; nothing to ack, so
  the entire haversine sync loop is gone (and the `haversine` dependency with it).
- **No zombie ring / cursor-out-of-range** — there is no sync cursor.
- **No burst-vs-counter heuristics, no `0x60` state guard, no post-sync window** — a counter
  change is unambiguous, so the ~1.3 s "counter-change" latency and the burst-start fast path
  both disappear.
- **No pairing step** — connectionless; no OS-level bond required.

`adb logcat -s PebbleRing` still logs every decision (primed / click / reboot / scan failed).

## Known limits

- Single vs. double click is not distinguishable from advertisements — hence forward-only,
  one event per press.
- The ring must already be running the CFW; this app only consumes clicks, it does not flash
  firmware (use the flasher app).
