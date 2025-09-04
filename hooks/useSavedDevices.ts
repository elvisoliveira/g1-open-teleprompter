import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

// Storage keys for saved devices
const STORAGE_KEYS = {
    LEFT_GLASS_MAC: 'left_glass_mac',
    RIGHT_GLASS_MAC: 'right_glass_mac',
    // Legacy keys for backward compatibility
    LEFT_DEVICE_MAC: 'left_device_mac',
    RIGHT_DEVICE_MAC: 'right_device_mac',
    // Future ring controller key (placeholder)
    RING_MAC: 'ring_mac',
};

export const useSavedDevices = () => {
    const [savedLeftGlassMac, setSavedLeftGlassMac] = useState<string | null>(null);
    const [savedRightGlassMac, setSavedRightGlassMac] = useState<string | null>(null);

    const saveGlassMacAddress = async (side: 'left' | 'right', macAddress: string) => {
        try {
            const key = side === 'left' ? STORAGE_KEYS.LEFT_GLASS_MAC : STORAGE_KEYS.RIGHT_GLASS_MAC;
            await AsyncStorage.setItem(key, macAddress);
            if (side === 'left') {
                setSavedLeftGlassMac(macAddress);
            } else {
                setSavedRightGlassMac(macAddress);
            }
        } catch (error) {
            console.error(`Failed to save ${side} glass MAC:`, error);
        }
    };

    const loadSavedGlassMacAddresses = async () => {
        try {
            // Try new keys first, fallback to legacy keys for backward compatibility
            let [leftMac, rightMac] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.LEFT_GLASS_MAC),
                AsyncStorage.getItem(STORAGE_KEYS.RIGHT_GLASS_MAC)
            ]);

            // Fallback to legacy keys if new keys don't exist
            if (!leftMac || !rightMac) {
                const [legacyLeftMac, legacyRightMac] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.LEFT_DEVICE_MAC),
                    AsyncStorage.getItem(STORAGE_KEYS.RIGHT_DEVICE_MAC)
                ]);
                
                leftMac = leftMac || legacyLeftMac;
                rightMac = rightMac || legacyRightMac;

                // Migrate to new keys if legacy data exists
                if (legacyLeftMac && !await AsyncStorage.getItem(STORAGE_KEYS.LEFT_GLASS_MAC)) {
                    await AsyncStorage.setItem(STORAGE_KEYS.LEFT_GLASS_MAC, legacyLeftMac);
                }
                if (legacyRightMac && !await AsyncStorage.getItem(STORAGE_KEYS.RIGHT_GLASS_MAC)) {
                    await AsyncStorage.setItem(STORAGE_KEYS.RIGHT_GLASS_MAC, legacyRightMac);
                }
            }

            setSavedLeftGlassMac(leftMac);
            setSavedRightGlassMac(rightMac);
            return { leftMac, rightMac };
        } catch (error) {
            console.error('Failed to load saved glass MAC addresses:', error);
            return { leftMac: null, rightMac: null };
        }
    };

    const clearSavedGlassMacAddresses = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.LEFT_GLASS_MAC),
                AsyncStorage.removeItem(STORAGE_KEYS.RIGHT_GLASS_MAC),
                // Also clear legacy keys
                AsyncStorage.removeItem(STORAGE_KEYS.LEFT_DEVICE_MAC),
                AsyncStorage.removeItem(STORAGE_KEYS.RIGHT_DEVICE_MAC)
            ]);
            setSavedLeftGlassMac(null);
            setSavedRightGlassMac(null);
        } catch (error) {
            console.error('Failed to clear saved glass MAC addresses:', error);
        }
    };

    return {
        savedLeftGlassMac,
        savedRightGlassMac,
        saveGlassMacAddress,
        loadSavedGlassMacAddresses,
        clearSavedGlassMacAddresses,
        // Legacy exports for backward compatibility (deprecated)
        savedLeftMac: savedLeftGlassMac,
        savedRightMac: savedRightGlassMac,
        saveMacAddress: saveGlassMacAddress,
        loadSavedMacAddresses: loadSavedGlassMacAddresses,
        clearSavedMacAddresses: clearSavedGlassMacAddresses,
    };
};
