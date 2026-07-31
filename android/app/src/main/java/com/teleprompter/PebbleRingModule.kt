package com.teleprompter

import android.bluetooth.BluetoothManager
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Build
import android.os.ParcelUuid
import android.os.SystemClock
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import coredevices.haversine.CollectionIndexStorage
import coredevices.haversine.KMPHaversineDebugDelegate
import coredevices.haversine.KMPHaversineDebugInfo
import coredevices.haversine.KMPHaversineHacksDelegate
import coredevices.haversine.KMPHaversineSatellite
import coredevices.haversine.KMPHaversineSatelliteManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

private const val TAG = "PebbleRing"
private const val ADVERT_CLICK_EVENT = "PebbleAdvertClick"

private val RING_SERVICE_UUID = ParcelUuid.fromString("607B5C9B-3700-4E94-F44A-2DF900BCB0C3")
private const val RING_COMPANY_ID = 0x0EEA
// Manufacturer data layout: FF FF 3C F0 CC SS — CC increments once per button press
private const val COUNTER_OFFSET = 4
private const val STATE_OFFSET = 5
// Gap that separates two wake bursts; within a burst the ring emits ~30 packets/s
private const val BURST_GAP_MS = 2_000L
// A burst starting this soon after a counter change is the post-sync burst of the
// same click (only separate from it when the GATT link was held > BURST_GAP_MS;
// with a fast sync everything merges into one continuous burst), not a new click
private const val POST_SYNC_WINDOW_MS = 10_000L
// State byte of a wake-from-idle press: needsServicing (0x40) + inCollectionState (0x20)
private const val WAKE_STATE = 0x60

/**
 * Click detector for the Pebble Index 01 ring: clicks come from the ring's
 * advertisements (a press is one event; single vs double is indistinguishable),
 * while the haversine sync loop runs only to ack collections so the ring goes
 * back to sleep. Full protocol notes and rationale: docs/pebble-ring.md.
 */
class PebbleRingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var scope: CoroutineScope? = null
    private var scanner: BluetoothLeScanner? = null
    private var lastCounter: Int? = null
    private var lastPacketMs = 0L
    private var counterChangedAtMs = 0L
    private var burstFiredForCounter: Int? = null

    /**
     * Hybrid click detection — fastest signal available per click: burst start
     * after radio silence fires instantly (the ring wakes advertising its OLD
     * counter); the counter change (~1.3s after the press) is the fallback that
     * never misses. Detection rules and measurements: docs/pebble-ring.md §6.
     */
    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val data = result.scanRecord?.getManufacturerSpecificData(RING_COMPANY_ID) ?: return
            if (data.size <= STATE_OFFSET) return
            val counter = data[COUNTER_OFFSET].toInt() and 0xFF
            val state = data[STATE_OFFSET].toInt() and 0xFF
            val now = SystemClock.elapsedRealtime()
            val newBurst = now - lastPacketMs > BURST_GAP_MS
            lastPacketMs = now
            val last = lastCounter
            lastCounter = counter
            when {
                last == null -> Log.i(TAG, "Primed at counter $counter (state 0x%02X)".format(state))
                counter != last -> {
                    val alreadyFired = burstFiredForCounter == last
                    burstFiredForCounter = null
                    counterChangedAtMs = now
                    if (alreadyFired) {
                        Log.i(TAG, "Counter $last -> $counter (state 0x%02X) — click already fired at burst start".format(state))
                    } else {
                        Log.i(TAG, "Counter-change click ($last -> $counter, state 0x%02X, newBurst=$newBurst)".format(state))
                        emitClick()
                    }
                }
                newBurst -> {
                    if (now - counterChangedAtMs < POST_SYNC_WINDOW_MS) {
                        Log.i(TAG, "Post-sync burst (counter $counter, state 0x%02X) — suppressed".format(state))
                    } else if (state != WAKE_STATE) {
                        // Only a wake-from-idle press carries 0x60; anything else
                        // bursting after silence is a retry/zombie beacon, not a click
                        Log.i(TAG, "Non-wake burst (counter $counter, state 0x%02X) — ignored".format(state))
                    } else {
                        Log.i(TAG, "Burst-start click (counter $counter, state 0x%02X)".format(state))
                        burstFiredForCounter = counter
                        emitClick()
                    }
                }
            }
        }
    }

    private fun emitClick() {
        val context = reactApplicationContext
        val effect = VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE)
        val vibrator = context.getSystemService(Vibrator::class.java)
        if (Build.VERSION.SDK_INT >= 33) {
            // Without declared attributes the effect lands as USAGE_UNKNOWN, which
            // vibration settings commonly suppress; touch feedback stays enabled
            vibrator?.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_TOUCH))
        } else {
            vibrator?.vibrate(effect)
        }
        if (context.hasActiveReactInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(ADVERT_CLICK_EVENT, null)
        }
    }

    override fun getName() = "PebbleRing"

    /** Cursor of the last synced collection; the haversine manager advances it. */
    private class PrefsIndexStorage(context: Context) : CollectionIndexStorage {
        private val prefs = context.getSharedPreferences("pebble_sync", Context.MODE_PRIVATE)
        private val state = MutableStateFlow(
            if (prefs.contains("lastIndex")) prefs.getInt("lastIndex", 0) else null
        )
        override val lastSuccessfulCollectionIndex: StateFlow<Int?> = state
        override fun setLastSuccessfulCollectionIndex(index: Int?) {
            prefs.edit().apply {
                if (index == null) remove("lastIndex") else putInt("lastIndex", index)
            }.apply()
            state.value = index
        }
    }

    @ReactMethod
    fun start(address: String, promise: Promise) {
        if (scope != null) {
            promise.resolve(null)
            return
        }

        val context = reactApplicationContext
        val ring = try {
            context.getSystemService(BluetoothManager::class.java)?.adapter?.bondedDevices
                ?.firstOrNull { it.address.equals(address, ignoreCase = true) }
        } catch (e: SecurityException) {
            promise.reject("E_PERMISSION", "BLUETOOTH_CONNECT not granted")
            return
        }
        if (ring == null) {
            promise.reject("E_NOT_BONDED", "Ring $address is not bonded — pair it via the official Pebble app first")
            return
        }

        Log.i(TAG, "Starting sync for ${ring.address}")

        // Passive advertisement scan alongside the sync (validated in the PoC).
        // Hardware-filtered by service UUID + address, so the callback only fires
        // on this ring's rare wake bursts; advertising stops while GATT is open.
        try {
            scanner = context.getSystemService(BluetoothManager::class.java)?.adapter?.bluetoothLeScanner
            scanner?.startScan(
                listOf(
                    ScanFilter.Builder()
                        .setServiceUuid(RING_SERVICE_UUID)
                        .setDeviceAddress(ring.address)
                        .build()
                ),
                ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),
                scanCallback,
            )
        } catch (e: SecurityException) {
            Log.w(TAG, "No BLUETOOTH_SCAN permission — advertisement fast path disabled")
            scanner = null
        }

        val manager = KMPHaversineSatelliteManager(
            pairedSatelliteIdProvider = { ring.address.replace(":", "") },
            debugDelegate = object : KMPHaversineDebugDelegate {
                override fun handleHaversineDebugInfo(info: KMPHaversineDebugInfo) {}
                override fun shouldReadRxRSSI(satellite: KMPHaversineSatellite) = false
                override fun handleRxRSSI(rssi: Float, satellite: KMPHaversineSatellite) {}
            },
            hacksDelegate = object : KMPHaversineHacksDelegate {
                // Wipe-instead-of-transfer bricks the ring — tested, never enable
                // (docs/pebble-ring.md §7). Only transfer+ack puts it to sleep.
                override fun shouldWipeCollectionsBeforeTransfer(satellite: KMPHaversineSatellite) = false
                override fun wipedCollectionsBeforeTransfer(satellite: KMPHaversineSatellite) {}
            },
            collectionIndexStorage = PrefsIndexStorage(context),
            context = context,
            hwVersion = Pair(11, 0),
            CoroutineScope(Dispatchers.Default),
        )

        val syncScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
        scope = syncScope
        syncScope.launch {
            // Same loop as the official app's RingSync: scan, sync, pause, repeat.
            // Statuses are ignored — the sync only acks so the ring goes back to sleep.
            while (isActive) {
                try {
                    manager.awaitBluetoothReady()
                    manager.startScanning().collect { }
                    delay(3_000)
                } catch (e: Exception) {
                    Log.w(TAG, "Sync error: ${e.message}")
                    delay(3_000)
                }
            }
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun stop() {
        try {
            scanner?.stopScan(scanCallback)
        } catch (e: SecurityException) {
            // scan never started without the permission
        }
        scanner = null
        lastCounter = null
        lastPacketMs = 0L
        counterChangedAtMs = 0L
        burstFiredForCounter = null
        scope?.cancel()
        scope = null
    }

}
