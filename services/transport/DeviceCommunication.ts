import { Buffer } from 'buffer';
import { Device } from 'react-native-ble-plx';
import { READ_CHARACTERISTIC_UUID, SERVICE_UUID, WRITE_CHARACTERISTIC_UUID } from '../Constants';
import { Utils } from '../Utils';

export class DeviceCommunication {
    /**
     * Write data to a specific device
     */
    static async writeToDevice(
        device: Device,
        data: Uint8Array,
        requireResponse: boolean = false
    ): Promise<boolean> {
        try {
            const base64 = Buffer.from(data).toString('base64');
            console.log(`[DeviceCommunication] Writing ${requireResponse ? 'with' : 'without'} response: ${Utils.arrayToHex(data)}`);

            if (requireResponse) {
                await device.writeCharacteristicWithResponseForService(
                    SERVICE_UUID,
                    WRITE_CHARACTERISTIC_UUID,
                    base64
                );
            } else {
                try {
                    await device.writeCharacteristicWithoutResponseForService(
                        SERVICE_UUID,
                        WRITE_CHARACTERISTIC_UUID,
                        base64
                    );
                } catch (writeError) {
                    console.warn('[DeviceCommunication] Write without response failed, fallback to with response');
                    await device.writeCharacteristicWithResponseForService(
                        SERVICE_UUID,
                        WRITE_CHARACTERISTIC_UUID,
                        base64
                    );
                }
            }
            return true;
        } catch (error) {
            console.error('[DeviceCommunication] Write failed:', error);
            return false;
        }
    }

    /**
     * Send command with response and handle notifications
     */
    static async sendCommandWithResponse(
        device: Device,
        requestBytes: Uint8Array,
        expectedHeader: Uint8Array
    ): Promise<Uint8Array | null> {
        console.log(`[DeviceCommunication] Command: ${Utils.arrayToHex(requestBytes)}, expecting header: ${Utils.arrayToHex(expectedHeader)}`);

        try {
            const responsePromise = new Promise<Uint8Array | null>((resolve) => {
                const timeout = setTimeout(() => {
                    console.warn(`[DeviceCommunication] Timeout`);
                    resolve(null)
                }, 3000);

                let subscription: any;

                const handleResponse = (error: any, characteristic: any) => {
                    if (error || !characteristic?.value) {
                        return; // Don't resolve yet, keep listening
                    }

                    const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                    console.log(`[DeviceCommunication] Received notification: ${Utils.arrayToHex(data)}`);

                    // Check if this response matches what we're expecting
                    if (expectedHeader.length === 0 || this.headerMatches(data, expectedHeader)) {
                        clearTimeout(timeout);
                        subscription.remove();
                        resolve(data);
                    } else {
                        console.warn(`[DeviceCommunication] Ignoring unexpected response, waiting for expected header: ${Utils.arrayToHex(expectedHeader)}`);
                        // Keep listening for the correct response
                    }
                };

                subscription = device.monitorCharacteristicForService(
                    SERVICE_UUID,
                    READ_CHARACTERISTIC_UUID,
                    handleResponse
                );
            });

            const success = await this.writeToDevice(device, requestBytes, true);
            if (!success) {
                console.error('[DeviceCommunication] Failed to write command');
                return null;
            }

            const response = await responsePromise;
            if (response) {
                return response;
            }

            console.warn('[DeviceCommunication] First response detection method failed, trying the fallback');

            try {
                const characteristic = await device.readCharacteristicForService(
                    SERVICE_UUID,
                    READ_CHARACTERISTIC_UUID
                );
                if (characteristic?.value) {
                    const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                    console.log(`[DeviceCommunication] Response: ${Utils.arrayToHex(data)}`);
                    if (expectedHeader.length === 0 || this.headerMatches(data, expectedHeader)) {
                        return data;
                    }
                }
            } catch (readError) {
                console.log('[DeviceCommunication] Failed to read from characteristic');
            }

            return null;
        } catch (error) {
            console.error('[DeviceCommunication] Top-level error:', error);
            return null;
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
    static async sendPacketsToDevice(device: Device, packets: Uint8Array[], delayMs: number): Promise<boolean> {
        for (const packet of packets) {
            if (!await this.writeToDevice(device, packet, false)) {
                return false;
            }
            if (delayMs > 0) {
                await Utils.sleep(delayMs);
            }
        }
        return true;
    }
}