package com.teleprompter

import android.bluetooth.BluetoothManager
import android.content.Context
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
import coredevices.haversine.SatelliteStatus
import coredevices.haversine.TransferStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

private const val TAG = "PebbleRing"
private const val BUTTON_SEQUENCE_EVENT = "PebbleButtonSequence"

/**
 * Sync client for the Pebble Index 01 ring via the haversine library.
 * The ring is radio-silent when idle; a button press wakes it, we sync the
 * collection carrying the button sequence and ack it (mandatory — unsynced
 * collections make the ring retry-beacon forever, draining its battery).
 * The ring's firmware handles its own sleep after a sync.
 *
 * Sequences are cumulative within the quick-press window ('short', then
 * 'short short'), so we debounce 700 ms — same as the official app — and
 * emit only the final sequence to JS.
 */
class PebbleRingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var scope: CoroutineScope? = null
    private var debounceJob: Job? = null
    private var pendingSequence: String? = null

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

        val manager = KMPHaversineSatelliteManager(
            pairedSatelliteIdProvider = { ring.address.replace(":", "") },
            debugDelegate = object : KMPHaversineDebugDelegate {
                override fun handleHaversineDebugInfo(info: KMPHaversineDebugInfo) {}
                override fun shouldReadRxRSSI(satellite: KMPHaversineSatellite) = false
                override fun handleRxRSSI(rssi: Float, satellite: KMPHaversineSatellite) {}
            },
            hacksDelegate = object : KMPHaversineHacksDelegate {
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
            // Same loop as the official app's RingSync: scan, collect statuses, pause, repeat
            while (isActive) {
                try {
                    manager.awaitBluetoothReady()
                    manager.startScanning().collect { status -> onStatus(status) }
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
        debounceJob?.cancel()
        debounceJob = null
        pendingSequence = null
        scope?.cancel()
        scope = null
    }

    private fun onStatus(status: SatelliteStatus) {
        val transfer = (status as? SatelliteStatus.Transferring)?.transferStatus ?: return
        if (transfer !is TransferStatus.TransferTypeDetermined) return

        val sequence = transfer.buttonSequence?.trim()?.takeIf { it.isNotEmpty() } ?: return
        pendingSequence = sequence
        debounceJob?.cancel()
        debounceJob = scope?.launch {
            delay(700)
            pendingSequence?.let { emitSequence(it) }
            pendingSequence = null
        }
    }

    private fun emitSequence(sequence: String) {
        Log.i(TAG, "Button sequence: '$sequence'")
        val context = reactApplicationContext
        if (context.hasActiveReactInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(BUTTON_SEQUENCE_EVENT, sequence)
        }
    }
}
