import { Platform } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';

export class PermissionManager {
    /**
     * Request Bluetooth permissions based on Android version
     * @returns Promise<boolean> - true if permissions granted, false otherwise
     */
    static async requestBluetoothPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        
        try {
            if (Platform.Version >= 31) {
                const bluetoothScanGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
                const bluetoothConnectGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
                
                if (bluetoothScanGranted !== 'granted' || bluetoothConnectGranted !== 'granted') {
                    console.error('[PermissionManager] Bluetooth permissions not granted:', {
                        bluetoothScan: bluetoothScanGranted,
                        bluetoothConnect: bluetoothConnectGranted
                    });
                    return false;
                }
            } else {
                const locationGranted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                if (locationGranted !== 'granted') {
                    console.error('[PermissionManager] Location permission not granted:', locationGranted);
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('[PermissionManager] Failed to request permissions:', error);
            return false;
        }
    }

    /**
     * Request Bluetooth connect permission for device connection
     * @returns Promise<boolean> - true if permission granted, false otherwise
     */
    static async requestBluetoothConnectPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        
        if (Platform.Version >= 31) {
            const bluetoothConnectGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
            if (bluetoothConnectGranted !== 'granted') {
                console.error('[PermissionManager] Bluetooth connect permission not granted');
                return false;
            }
        }
        
        return true;
    }
} 