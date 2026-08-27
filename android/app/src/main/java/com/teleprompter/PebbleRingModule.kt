package com.teleprompter

import android.bluetooth.BluetoothManager
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

private const val TAG = "PebbleRing"
private const val ADVERT_CLICK_EVENT = "PebbleAdvertClick"

// CFW click beacon: manufacturer company 0xFFFF, payload[0] = click counter, one
// step per button press. (The official firmware used company 0x0EEA with the count
// buried at offset 4 behind a mandatory haversine GATT sync — slow, ~1.3 s per click.
// The CFW advertises the new count in a burst the instant the button is pressed, with
// no connection and no bonding, so a counter change *is* the click.)
private const val CFW_COMPANY_ID = 0xFFFF
// A counter that drops by more than this is a reboot (POR / 5-click / long-press reset
// the count to 0), not a wrap-around or a real click — don't fire on it.
private const val REBOOT_DROP = 8
// Android silently stops delivering scan results after a fixed window (~10 min measured).
// Re-issuing startScan opens a fresh one, so restart well inside it — a teleprompter
// session runs long and the clicker must not die mid-presentation.
private const val SCAN_RESTART_MS = 4L * 60 * 1000

/**
 * Click detector for the Pebble Index 01 ring running the CFW. A connectionless BLE
 * scan is the whole protocol: the ring advertises company 0xFFFF with a one-byte click
 * counter and sleeps between presses. Each increment emits [ADVERT_CLICK_EVENT] to JS
 * (plus a short haptic). No GATT, no sync, no pairing.
 */
class PebbleRingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var scope: CoroutineScope? = null
    private var scanner: BluetoothLeScanner? = null
    private var address: String? = null
    private var lastCounter: Int? = null

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val data = result.scanRecord?.getManufacturerSpecificData(CFW_COMPANY_ID) ?: return
            if (data.isEmpty()) return
            val counter = data[0].toInt() and 0xFF
            val last = lastCounter
            lastCounter = counter
            when {
                last == null -> Log.i(TAG, "Primed at counter $counter")
                counter != last -> {
                    val delta = (counter - last + 256) % 256
                    // A large backward jump is a reboot (counter reset to 0), not a press.
                    if (counter < last && delta > REBOOT_DROP) {
                        Log.i(TAG, "Ring rebooted (counter $last -> $counter) — not a click")
                    } else {
                        // One event per change (matches the previous contract). `delta`
                        // is the exact number of presses since the last packet if a
                        // per-click advance is ever wanted.
                        Log.i(TAG, "Click (counter $last -> $counter)")
                        emitClick()
                    }
                }
            }
        }

        override fun onScanFailed(errorCode: Int) {
            Log.w(TAG, "Scan failed: $errorCode")
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

    /** Start (or re-issue) the CFW click scan for the current [address]. Returns false
     *  if the scanner is unavailable (Bluetooth off) or the permission is missing. */
    private fun openScan(): Boolean {
        val ble = reactApplicationContext.getSystemService(BluetoothManager::class.java)
            ?.adapter?.bluetoothLeScanner ?: return false
        // Hardware filter: only this ring's CFW beacons (company 0xFFFF + its address)
        // ever reach the callback, so a stranger's 0xFFFF beacon can't fake a click.
        val filter = ScanFilter.Builder()
            .setManufacturerData(CFW_COMPANY_ID, byteArrayOf())
            .apply { address?.takeIf { it.isNotBlank() }?.let { setDeviceAddress(it) } }
            .build()
        return try {
            ble.startScan(
                listOf(filter),
                ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),
                scanCallback,
            )
            scanner = ble
            true
        } catch (e: SecurityException) {
            Log.w(TAG, "BLUETOOTH_SCAN not granted")
            false
        }
    }

    private fun closeScan() {
        try {
            scanner?.stopScan(scanCallback)
        } catch (e: SecurityException) {
            // scan never started without the permission
        }
    }

    @ReactMethod
    fun start(address: String, promise: Promise) {
        if (scope != null) {
            promise.resolve(null)
            return
        }
        this.address = address
        Log.i(TAG, "Starting CFW click scan for $address")
        if (!openScan()) {
            promise.reject("E_SCAN", "Could not start BLE scan (Bluetooth off or scan permission missing)")
            return
        }
        val healScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
        scope = healScope
        // Auto-heal: restart the scan well inside Android's silent-stop window.
        healScope.launch {
            while (isActive) {
                delay(SCAN_RESTART_MS)
                closeScan()
                openScan()
            }
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun stop() {
        closeScan()
        scanner = null
        address = null
        lastCounter = null
        scope?.cancel()
        scope = null
    }
}
