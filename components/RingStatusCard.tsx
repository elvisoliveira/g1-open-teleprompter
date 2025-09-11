import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RingStatus } from '../services/DeviceTypes';
import { ButtonStyles } from '../styles/CommonStyles';
import { deviceStatusCardStyles as styles } from '../styles/DeviceStatusCardStyles';

interface RingStatusCardProps {
    connected: boolean;
    ringStatus?: RingStatus;
    isCompact?: boolean;
    onToggleTouchPanel?: () => void;
}

const RingStatusCard: React.FC<RingStatusCardProps> = ({
    connected,
    ringStatus,
    isCompact = false,
    onToggleTouchPanel
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
            {/* Content - only show when connected */}
            {connected && ringStatus && (
                <View style={styles.content}>
                    {/* Battery Reading */}
                    <View style={styles.infoRow}>
                        <Text style={styles.labelText}>Status</Text>
                        <Text style={[
                            styles.statusText,
                            connected ? styles.statusTextConnected : styles.statusTextDisconnected
                        ]}>
                            {connected ? 'Online' : 'Offline'}
                        </Text>
                    </View>

                    {ringStatus.battery !== undefined && ringStatus.battery >= 0 && (
                        <View style={styles.infoRow}>
                            <Text style={styles.labelText}>Battery</Text>
                            <Text style={styles.valueTextBattery}>{ringStatus.battery}%</Text>
                        </View>
                    )}

                    {/* Firmware Reading - only show if data is present */}
                    {ringStatus.firmware && (
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
                    )}

                    {/* Full Firmware Info */}
                    {!isCompact && ringStatus.firmware && (
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsTitle}>Firmware Details</Text>
                            <Text style={styles.detailsText} numberOfLines={3}>
                                {ringStatus.firmware}
                            </Text>
                        </View>
                    )}


                    {/* Touch panel status */}
                    {ringStatus.panel && (() => {
                        const isTouchEnabled = ringStatus.panel.controlType === 'touch' && ringStatus.panel.mode === 'Music';
                        return (
                            <>
                                <View style={styles.infoRow}>
                                    <Text style={styles.labelText}>
                                        Touch Panel
                                    </Text>
                                    <Text style={[
                                        styles.statusText,
                                        isTouchEnabled ? styles.statusTextConnected : styles.statusTextDisconnected
                                    ]}>
                                        {isTouchEnabled ? 'Enabled' : 'Disabled'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        ButtonStyles.secondaryButton,
                                        { marginTop: 8 }
                                    ]}
                                    onPress={onToggleTouchPanel}
                                >
                                    <Text style={ButtonStyles.secondaryButtonText}>
                                        {isTouchEnabled ? 'Disable Touch Panel' : 'Enable Touch Panel'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        );
                    })()}
                </View>
            )}

            {/* Disconnected State */}
            {!connected && (
                <View style={styles.disconnectedContent}>
                    <Text style={styles.disconnectedText}>Qring controller not connected</Text>
                </View>
            )}
        </View>
    );
};

export default RingStatusCard;