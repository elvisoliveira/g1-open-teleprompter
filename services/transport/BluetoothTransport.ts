import { Buffer } from 'buffer';
import { Device } from 'react-native-ble-plx';
import {
    CHARACTERISTIC_NOTIFY,
    CHARACTERISTIC_WRITE,
    CHARACTERISTICS,
    SERVICES
} from '../constants/BluetoothConstants';
import { RingStandardDeviceInfo } from '../DeviceTypes';
import { TextFormatter } from '../TextFormatter';

export class BluetoothTransport {
    /**
     * Write data to a specific device
     */
    static async writeToDevice(
        service: string,
        device: Device,
        data: Uint8Array,
        requireResponse: boolean = false
    ): Promise<boolean> {
        try {
            const base64 = Buffer.from(data).toString('base64');
            console.log(`[BluetoothTransport] Writing ${requireResponse ? 'with' : 'without'} response: ${TextFormatter.arrayToHex(data)}`);

            if (requireResponse) {
                await device.writeCharacteristicWithResponseForService(
                    service,
                    CHARACTERISTIC_WRITE,
                    base64
                );
            } else {
                try {
                    await device.writeCharacteristicWithoutResponseForService(
                        service,
                        CHARACTERISTIC_WRITE,
                        base64
                    );
                } catch (writeError) {
                    console.warn('[BluetoothTransport] Write without response failed, fallback to with response');
                    await device.writeCharacteristicWithResponseForService(
                        service,
                        CHARACTERISTIC_WRITE,
                        base64
                    );
                }
            }
            return true;
        } catch (error) {
            console.error('[BluetoothTransport] Write failed:', error);
            return false;
        }
    }

    /**
     * Send command with response and handle notifications
     */
    static async sendCommandWithResponse(
        service: string,
        device: Device,
        requestBytes: Uint8Array,
        expectedHeader: Uint8Array
    ): Promise<Uint8Array | null> {
        console.log(`[BluetoothTransport] Command: ${TextFormatter.arrayToHex(requestBytes)}, expecting header: ${TextFormatter.arrayToHex(expectedHeader)}`);
        try {
            const responsePromise = new Promise<Uint8Array | null>((resolve) => {
                const timeout = setTimeout(() => {
                    console.warn(`[BluetoothTransport] Timeout`);
                    resolve(null)
                }, 3000);

                let subscription: any;

                const handleResponse = (error: any, characteristic: any) => {
                    if (error || !characteristic?.value) {
                        return; // Don't resolve yet, keep listening
                    }

                    const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                    console.log(`[BluetoothTransport] Received notification: ${TextFormatter.arrayToHex(data)}`);

                    // Check if this response matches what we're expecting
                    if (expectedHeader.length === 0 || this.headerMatches(data, expectedHeader)) {
                        clearTimeout(timeout);
                        subscription.remove();
                        resolve(data);
                    } else {
                        console.warn(`[BluetoothTransport] Ignoring unexpected response, waiting for expected header: ${TextFormatter.arrayToHex(expectedHeader)}`);
                        // Keep listening for the correct response
                    }
                };

                subscription = device.monitorCharacteristicForService(
                    service,
                    CHARACTERISTIC_NOTIFY,
                    handleResponse
                );
            });

            const success = await this.writeToDevice(service, device, requestBytes, true);
            if (!success) {
                console.error('[BluetoothTransport] Failed to write command');
                return null;
            }

            const response = await responsePromise;
            if (response) {
                return response;
            }

            console.warn('[BluetoothTransport] First response detection method failed, trying the fallback');

            try {
                const characteristic = await device.readCharacteristicForService(
                    service,
                    CHARACTERISTIC_NOTIFY
                );
                if (characteristic?.value) {
                    const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                    console.log(`[BluetoothTransport] Response: ${TextFormatter.arrayToHex(data)}`);
                    if (expectedHeader.length === 0 || this.headerMatches(data, expectedHeader)) {
                        return data;
                    }
                }
            } catch (readError) {
                console.log('[BluetoothTransport] Failed to read from characteristic');
            }

            return null;
        } catch (error) {
            console.error('[BluetoothTransport] Top-level error:', error);
            return null;
        }
    }

    static async getDeviceInfo(
        device: Device
    ): Promise<RingStandardDeviceInfo | undefined> {
        if (!device) return;

        try {
            console.log('[BluetoothTransport] Reading device information...');

            const readCharacteristic = async (charUUID: string): Promise<string> => {
                try {
                    const characteristic = await device.readCharacteristicForService(SERVICES.DEVICE_INFO, charUUID);
                    if (characteristic?.value) {
                        const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                        console.log(`[BluetoothTransport] Response: ${TextFormatter.arrayToHex(data)}`);
                        return new TextDecoder('utf-8').decode(data).trim();;
                    }
                    return 'N/A';
                } catch {
                    return 'N/A';
                }
            };

            const [firmware, hardware] = await Promise.all([
                readCharacteristic(CHARACTERISTICS.FIRMWARE_REVISION),
                readCharacteristic(CHARACTERISTICS.HARDWARE_REVISION),
            ]);

            return {
                firmware: firmware,
                hardware: hardware,
            };

        } catch (error) {
            console.error('[BluetoothTransport] Device information error:', error);
        }
    }

    /**
     * Check if response header matches expected header
     */
    private static headerMatches(responseData: Uint8Array, expectedHeader: Uint8Array): boolean {
        if (responseData.length < expectedHeader.length) return false;
        for (let i = 0; i < expectedHeader.length; i++) {
            if (responseData[i] !== expectedHeader[i]) return false;
        }
        return true;
    }

    /**
     * Send packets to a device with delays
     */
    static async sendPacketsToDevice(service: string, device: Device, packets: Uint8Array[], delayMs: number): Promise<boolean> {
        for (const packet of packets) {
            if (!await this.writeToDevice(service, device, packet, false)) {
                return false;
            }
            if (delayMs > 0) {
                await TextFormatter.sleep(delayMs);
            }
        }
        return true;
    }
}