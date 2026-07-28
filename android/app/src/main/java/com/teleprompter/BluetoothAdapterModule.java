package com.teleprompter;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Set;
import java.util.HashSet;

public class BluetoothAdapterModule extends ReactContextBaseJavaModule {
    public BluetoothAdapterModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "BluetoothAdapter";
    }

    // RN freezes JS timers while the Activity is paused, so the BLE ping
    // cadence comes from this native ticker instead of setInterval. The main
    // looper keeps running in background because the foreground service holds
    // the process alive. Must match BLE_TICK_INTERVAL_MS in BluetoothConstants.ts.
    private static final long TICK_INTERVAL_MS = 5000;
    private Handler tickHandler;
    private final Runnable tickRunnable = new Runnable() {
        @Override
        public void run() {
            ReactApplicationContext context = getReactApplicationContext();
            if (context.hasActiveReactInstance()) {
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("BleTick", null);
            }
            if (tickHandler != null) {
                tickHandler.postDelayed(this, TICK_INTERVAL_MS);
            }
        }
    };

    @ReactMethod
    public void startForegroundService() {
        Context context = getReactApplicationContext();
        Intent intent = new Intent(context, BleForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        if (tickHandler == null) {
            tickHandler = new Handler(Looper.getMainLooper());
            tickHandler.postDelayed(tickRunnable, TICK_INTERVAL_MS);
        }
    }

    @ReactMethod
    public void stopForegroundService() {
        if (tickHandler != null) {
            tickHandler.removeCallbacksAndMessages(null);
            tickHandler = null;
        }
        Context context = getReactApplicationContext();
        context.stopService(new Intent(context, BleForegroundService.class));
    }

    @ReactMethod
    public void getPairedDevices(Promise promise) {
        try {
            BluetoothManager btManager = (BluetoothManager) getReactApplicationContext().getSystemService(android.content.Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = btManager != null ? btManager.getAdapter() : BluetoothAdapter.getDefaultAdapter();
            WritableArray result = Arguments.createArray();

            if (adapter == null || !adapter.isEnabled()) {
                promise.resolve(result);
                return;
            }

            // Collect addresses of devices currently connected over GATT
            Set<String> connectedGattAddresses = new HashSet<>();
            if (btManager != null) {
                try {
                    for (BluetoothDevice d : btManager.getConnectedDevices(BluetoothProfile.GATT)) {
                        if (d != null && d.getAddress() != null) connectedGattAddresses.add(d.getAddress());
                    }
                } catch (SecurityException ignored) {}
            }

            Set<BluetoothDevice> bonded = adapter.getBondedDevices();
            if (bonded == null) {
                promise.resolve(result);
                return;
            }

            for (BluetoothDevice device : bonded) {
                try {
                    // Show only BLE or DUAL devices; remove this check if you want all bonded devices
                    int type = device.getType();
                    boolean isBleCapable = (type == BluetoothDevice.DEVICE_TYPE_LE) || (type == BluetoothDevice.DEVICE_TYPE_DUAL);
                    if (!isBleCapable) continue;

                    WritableMap map = Arguments.createMap();
                    map.putString("name", device.getName());
                    map.putString("address", device.getAddress());

                    // Connection state derived from GATT connected devices
                    boolean isConnected = device.getAddress() != null && connectedGattAddresses.contains(device.getAddress());
                    map.putBoolean("connected", isConnected);

                    result.pushMap(map);
                } catch (SecurityException ignored) {
                    // Skip this device if we lack BLUETOOTH_CONNECT at runtime on Android 12+
                }
            }

            promise.resolve(result);
        } catch (SecurityException se) {
            promise.reject("E_BLUETOOTH_PERMISSION", "Missing BLUETOOTH_CONNECT permission");
        } catch (Exception e) {
            promise.reject("E_BLUETOOTH_ERROR", e.getMessage(), e);
        }
    }
}
