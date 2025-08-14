import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { DeviceStatus } from '../services/types';
import { deviceStatusCardStyles as styles } from '../styles/DeviceStatusCardStyles';
import { MaterialColors } from '../styles/MaterialTheme';

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
    const getBatteryIcon = (level: number) => {
        if (level < 0) return 'battery-unknown';
        if (level > 75) return 'battery-full';
        if (level > 50) return 'battery-5-bar';
        if (level > 25) return 'battery-3-bar';
        return 'battery-1-bar';
    };

    const getBatteryIconColor = (level: number) => {
        if (level < 0) return MaterialColors.onSurfaceVariant;
        if (level > 25) return MaterialColors.success;
        return MaterialColors.error;
    };

    const getConnectionIcon = () => {
        return connected ? 'bluetooth-connected' : 'bluetooth-disabled';
    };

    const getConnectionIconColor = () => {
        return connected ? MaterialColors.success : MaterialColors.error;
    };

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

    const getUptimeIconColor = (uptime: number) => {
        return uptime >= 0 ? MaterialColors.success : MaterialColors.error;
    };

    const getHeartbeatIcon = () => {
        return connected ? 'favorite' : 'heart-broken';
    };

    const getHeartbeatIconColor = () => {
        return connected ? MaterialColors.success : MaterialColors.error;
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
                    <MaterialIcons 
                        name={getConnectionIcon() as any}
                        size={20}
                        color={getConnectionIconColor()}
                        style={styles.headerIcon}
                    />
                    <Text style={[
                        styles.title,
                        connected ? styles.titleConnected : styles.titleDisconnected
                    ]}>
                        {side.charAt(0).toUpperCase() + side.slice(1)} Glass
                    </Text>
                </View>
                <View style={styles.statusIndicator}>
                    <MaterialIcons 
                        name={getHeartbeatIcon() as any}
                        size={16}
                        color={getHeartbeatIconColor()}
                        style={styles.heartbeatIcon}
                    />
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
                                <MaterialIcons 
                                    name={getBatteryIcon(batteryLevel) as any}
                                    size={18}
                                    color={getBatteryIconColor(batteryLevel)}
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.labelText}>Battery</Text>
                            </View>
                            <Text style={styles.valueText}>{batteryLevel}%</Text>
                        </View>
                    )}

                    {/* Firmware Version */}
                    {firmwareVersion && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <MaterialIcons 
                                    name="memory"
                                    size={18}
                                    color={MaterialColors.primary}
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.labelText}>Firmware</Text>
                            </View>
                            <Text style={styles.valueText}>{firmwareVersion}</Text>
                        </View>
                    )}

                    {/* Uptime */}
                    {deviceStatus?.uptime !== undefined && deviceStatus.uptime >= 0 && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <MaterialIcons 
                                    name="schedule"
                                    size={18}
                                    color={getUptimeIconColor(deviceStatus.uptime)}
                                    style={styles.infoIcon}
                                />
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
                    <MaterialIcons 
                        name="bluetooth-disabled"
                        size={32}
                        color={MaterialColors.onSurfaceVariant}
                        style={styles.disconnectedIcon}
                    />
                    <Text style={styles.disconnectedText}>Device not connected</Text>
                </View>
            )}
        </View>
    );
};

export default DeviceStatusCard;
