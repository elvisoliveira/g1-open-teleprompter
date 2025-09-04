import React from 'react';
import { Text, View } from 'react-native';
import { RingStatus } from '../services/types';
import { deviceStatusCardStyles as styles } from '../styles/DeviceStatusCardStyles';

interface RingStatusCardProps {
    connected: boolean;
    ringStatus?: RingStatus;
    isCompact?: boolean;
}

const RingStatusCard: React.FC<RingStatusCardProps> = ({
    connected,
    ringStatus,
    isCompact = false
}) => {
    const extractFirmwareVersion = (firmwareText: string | null) => {
        if (!firmwareText) return null;
        
        const versionMatch = firmwareText.match(/ver\s+([\d\.]+)/);
        if (versionMatch) {
            return versionMatch[1];
        }
        
        const fallbackMatch = firmwareText.match(/v?(\d+\.\d+\.\d+)/);
        if (fallbackMatch) {
            return fallbackMatch[1];
        }
        
        return 'Unknown';
    };

    const firmwareVersion = extractFirmwareVersion(ringStatus?.firmware || null);

    return (
        <View style={[
            styles.container,
            connected ? styles.containerConnected : styles.containerDisconnected
        ]}>
            {/* Header - Ring name and Status */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={[
                        styles.title,
                        connected ? styles.titleConnected : styles.titleDisconnected
                    ]}>
                        Ring Controller
                    </Text>
                </View>
                <View style={styles.statusIndicator}>
                    <Text style={[
                        styles.statusText,
                        connected ? styles.statusTextConnected : styles.statusTextDisconnected
                    ]}>
                        {connected ? 'Online' : 'Offline'}
                    </Text>
                </View>
            </View>

            {/* Content - only show when connected */}
            {connected && ringStatus && (
                <View style={styles.content}>
                    {/* Battery Reading */}
                    {ringStatus.battery !== undefined && ringStatus.battery >= 0 && (
                        <View style={styles.infoRow}>
                            <Text style={styles.labelText}>Battery</Text>
                            <Text style={styles.valueTextBattery}>{ringStatus.battery}%</Text>
                        </View>
                    )}

                    {/* Gesture Mode */}
                    {ringStatus.gestureMode && (
                        <View style={styles.infoRow}>
                            <Text style={styles.labelText}>Mode</Text>
                            <Text style={styles.valueTextFirmware}>
                                {ringStatus.gestureMode.charAt(0).toUpperCase() + ringStatus.gestureMode.slice(1)}
                            </Text>
                        </View>
                    )}

                    {/* Firmware Reading */}
                    <View style={styles.infoRow}>
                        <Text style={styles.labelText}>Firmware</Text>
                        <Text style={[
                            styles.valueTextFirmware,
                            firmwareVersion === 'Unknown' 
                                ? styles.valueTextFirmwareUnknown 
                                : styles.valueTextFirmwareKnown
                        ]}>
                            {firmwareVersion || 'Unknown'}
                        </Text>
                    </View>

                    {/* Full Firmware Info */}
                    {!isCompact && ringStatus.firmware && (
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsTitle}>Firmware Details</Text>
                            <Text style={styles.detailsText} numberOfLines={3}>
                                {ringStatus.firmware}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Disconnected State */}
            {!connected && (
                <View style={styles.disconnectedContent}>
                    <Text style={styles.disconnectedText}>Ring controller not connected</Text>
                </View>
            )}
        </View>
    );
};

export default RingStatusCard;