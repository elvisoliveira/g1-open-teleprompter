import React from 'react';
import { Text, View } from 'react-native';
import { DeviceStatus } from '../services/types';
import { deviceStatusCardStyles as styles } from '../styles/DeviceStatusCardStyles';

interface DeviceStatusCardProps {
    side: 'left' | 'right';
    connected: boolean;
    batteryLevel: number;
    deviceStatus?: DeviceStatus;
    isCompact?: boolean;
}

const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
    side,
    connected,
    batteryLevel,
    deviceStatus,
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

    const formatUptime = (uptime: number) => {
        if (uptime < 0) return 'Unknown';
        
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const firmwareVersion = extractFirmwareVersion(deviceStatus?.firmware || null);

    return (
        <View style={[
            styles.container,
            connected ? styles.containerConnected : styles.containerDisconnected,
            isCompact && styles.containerCompact
        ]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={[
                        styles.title,
                        connected ? styles.titleConnected : styles.titleDisconnected
                    ]}>
                        {side.charAt(0).toUpperCase() + side.slice(1)} Glass
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
            {connected && (
                <View style={styles.content}>
                    {/* Battery Info */}
                    {batteryLevel >= 0 && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <Text style={styles.labelText}>Battery</Text>
                            </View>
                            <Text style={styles.valueText}>{batteryLevel}%</Text>
                        </View>
                    )}

                    {/* Firmware Version */}
                    {firmwareVersion && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <Text style={styles.labelText}>Firmware</Text>
                            </View>
                            <Text style={styles.valueText}>{firmwareVersion}</Text>
                        </View>
                    )}

                    {/* Uptime */}
                    {deviceStatus?.uptime !== undefined && deviceStatus.uptime >= 0 && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <Text style={styles.labelText}>Uptime</Text>
                            </View>
                            <Text style={styles.valueText}>{formatUptime(deviceStatus.uptime)}</Text>
                        </View>
                    )}

                    {/* Full Firmware Info (expandable section) */}
                    {!isCompact && deviceStatus?.firmware && (
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsTitle}>Firmware Details</Text>
                            <Text style={styles.detailsText} numberOfLines={3}>
                                {deviceStatus.firmware}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Disconnected State */}
            {!connected && (
                <View style={styles.disconnectedContent}>
                    <Text style={styles.disconnectedText}>Device not connected</Text>
                </View>
            )}
        </View>
    );
};

export default DeviceStatusCard;
