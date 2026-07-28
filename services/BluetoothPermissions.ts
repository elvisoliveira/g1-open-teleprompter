import { PermissionsAndroid, Platform } from 'react-native';

export class BluetoothPermissions {
    /**
     * Request Bluetooth permissions based on Android version
     * @returns Promise<boolean> - true if permissions granted, false otherwise
     */
    static async requestBluetoothPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;

        try {
            if (Number(Platform.Version) >= 31) {
                const statuses = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                ]);
                const allGranted = Object.values(statuses).every(
                    status => status === PermissionsAndroid.RESULTS.GRANTED
                );
                if (!allGranted) {
                    console.error('[BluetoothPermissions] Bluetooth permissions not granted:', statuses);
                }
                return allGranted;
            }

            const locationStatus = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (locationStatus !== PermissionsAndroid.RESULTS.GRANTED) {
                console.error('[BluetoothPermissions] Location permission not granted:', locationStatus);
                return false;
            }
            return true;
        } catch (error) {
            console.error('[BluetoothPermissions] Failed to request permissions:', error);
            return false;
        }
    }

    /**
     * Request notification permission (Android 13+) so the BLE foreground
     * service notification is visible. The service runs either way.
     */
    static async requestNotificationPermission(): Promise<void> {
        if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return;
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    /**
     * Request Bluetooth connect permission for device connection
     * @returns Promise<boolean> - true if permission granted, false otherwise
     */
    static async requestBluetoothConnectPermission(): Promise<boolean> {
        if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return true;

        const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            console.error('[BluetoothPermissions] Bluetooth connect permission not granted');
            return false;
        }
        return true;
    }
}
