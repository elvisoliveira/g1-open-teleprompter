import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

// Storage keys for saved devices
const STORAGE_KEYS = {
    LEFT_DEVICE_MAC: 'left_device_mac',
    RIGHT_DEVICE_MAC: 'right_device_mac',
};

export const useDeviceStorage = () => {
    const [savedLeftMac, setSavedLeftMac] = useState<string | null>(null);
    const [savedRightMac, setSavedRightMac] = useState<string | null>(null);

    const saveMacAddress = async (side: 'left' | 'right', macAddress: string) => {
        try {
            const key = side === 'left' ? STORAGE_KEYS.LEFT_DEVICE_MAC : STORAGE_KEYS.RIGHT_DEVICE_MAC;
            await AsyncStorage.setItem(key, macAddress);
            if (side === 'left') {
                setSavedLeftMac(macAddress);
            } else {
                setSavedRightMac(macAddress);
            }
        } catch (error) {
            console.error(`Failed to save ${side} device MAC:`, error);
        }
    };

    const loadSavedMacAddresses = async () => {
        try {
            const [leftMac, rightMac] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.LEFT_DEVICE_MAC),
                AsyncStorage.getItem(STORAGE_KEYS.RIGHT_DEVICE_MAC)
            ]);
            setSavedLeftMac(leftMac);
            setSavedRightMac(rightMac);
            return { leftMac, rightMac };
        } catch (error) {
            console.error('Failed to load saved MAC addresses:', error);
            return { leftMac: null, rightMac: null };
        }
    };

    const clearSavedMacAddresses = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.LEFT_DEVICE_MAC),
                AsyncStorage.removeItem(STORAGE_KEYS.RIGHT_DEVICE_MAC)
            ]);
            setSavedLeftMac(null);
            setSavedRightMac(null);
        } catch (error) {
            console.error('Failed to clear saved MAC addresses:', error);
        }
    };

    return {
        savedLeftMac,
        savedRightMac,
        saveMacAddress,
        loadSavedMacAddresses,
        clearSavedMacAddresses,
    };
};
