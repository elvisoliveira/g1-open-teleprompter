import { MaterialIcons } from '@expo/vector-icons';
import { useKeyEvent } from "expo-key-event";
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RingStatus } from '../services/DeviceTypes';
import { ButtonStyles } from '../styles/CommonStyles';
import { deviceStatusCardStyles as styles } from '../styles/DeviceStatusCardStyles';
import { MaterialColors } from '../styles/MaterialTheme';

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
    const { keyEvent } = useKeyEvent();
    const [isToggling, setIsToggling] = useState(false);
    const [lastPanelState, setLastPanelState] = useState<string>();
    const [upButtonPressed, setUpButtonPressed] = useState(false);
    const [downButtonPressed, setDownButtonPressed] = useState(false);

    // Reset isToggling when panel status changes
    useEffect(() => {
        if (ringStatus?.panel) {
            const currentState = `${ringStatus.panel.controlType}-${ringStatus.panel.mode}`;
            if (lastPanelState && lastPanelState !== currentState) {
                setIsToggling(false);
            }
            setLastPanelState(currentState);
        }
    }, [ringStatus?.panel, lastPanelState]);

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

    const handleToggleTouchPanel = async () => {
        if (!onToggleTouchPanel || isToggling) return;

        setIsToggling(true);
        try {
            await onToggleTouchPanel();
        } catch (error) {
            setIsToggling(false);
            throw error;
        }
    };

    useEffect(() => {
        if (keyEvent) {
            const keyCode = parseInt(keyEvent.key);
            switch (keyCode) {
                case 88:
                    handleArrowPress('up')
                    break;
                case 87:
                    handleArrowPress('down')
                    break;
                default:
                    break;
            }
        }
    }, [keyEvent]);


    const handleArrowPress = (direction: 'up' | 'down') => {
        const setPressed = direction === 'up' ? setUpButtonPressed : setDownButtonPressed;

        setPressed(true);
        setTimeout(() => setPressed(false), 100);
    };

    const firmwareVersion = extractFirmwareVersion(ringStatus?.firmware || null);

    return (
        <>
            <View style={[
                styles.container,
                connected ? styles.containerConnected : styles.containerDisconnected
            ]}>
                {/* Content - only show when connected */}
                {connected && ringStatus && (
                    <View style={styles.contentCols}>
                        <View style={styles.infoRow}>
                            <Text style={styles.labelText}>Status</Text>
                            <Text style={[
                                styles.statusText,
                                connected ? styles.statusTextConnected : styles.statusTextDisconnected
                            ]}>
                                {connected ? 'Online' : 'Offline'}
                            </Text>
                        </View>

                        {/* Battery Reading */}
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

                        {/* Touch panel status */}
                        {ringStatus.panel && (() => {
                            const isTouchEnabled = ringStatus.panel.controlType === 'touch' && ringStatus.panel.mode === 'Music';
                            return (
                                <View style={styles.infoRow}>
                                    <Text style={styles.labelText}>Touch Panel</Text>
                                    <Text style={[
                                        styles.statusText,
                                        isTouchEnabled ? styles.statusTextConnected : styles.statusTextDisconnected
                                    ]}>
                                        {isTouchEnabled ? 'Enabled' : 'Disabled'}
                                    </Text>
                                </View>
                            );
                        })()}

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
                        <Text style={styles.disconnectedText}>Disconnected</Text>
                    </View>
                )}
            </View>

            {/* Touch Panel Toggle Button */}
            {connected && ringStatus?.panel && (() => {
                const isTouchEnabled = ringStatus.panel.controlType === 'touch' && ringStatus.panel.mode === 'Music';
                return (
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, justifyContent: 'space-between', alignContent: 'stretch' }}>
                        <TouchableOpacity
                            style={[
                                ButtonStyles.secondaryButton,
                                (isToggling) && ButtonStyles.secondaryButtonDisabled,
                                { flexGrow: 1 }
                            ]}
                            disabled={isToggling}
                            onPress={handleToggleTouchPanel}
                        >
                            <Text style={[
                                ButtonStyles.secondaryButtonText,
                                (isToggling) && ButtonStyles.secondaryButtonTextDisabled
                            ]}>
                                {isToggling
                                    ? 'Updating...'
                                    : isTouchEnabled
                                        ? 'Disable Touch Panel'
                                        : 'Enable Touch Panel'
                                }
                            </Text>
                        </TouchableOpacity>

                        {/* Arrow buttons - only show when touch panel is enabled */}
                        {isTouchEnabled && (
                            <>
                                <TouchableOpacity
                                    style={upButtonPressed ? ButtonStyles.secondaryButton : ButtonStyles.primaryButton}
                                    onPress={() => handleArrowPress('up')}
                                >
                                    <MaterialIcons
                                        name="arrow-upward"
                                        size={20}
                                        color={upButtonPressed ? MaterialColors.onSurface : MaterialColors.onPrimary}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={downButtonPressed ? ButtonStyles.secondaryButton : ButtonStyles.primaryButton}
                                    onPress={() => handleArrowPress('down')}
                                >
                                    <MaterialIcons
                                        name="arrow-downward"
                                        size={20}
                                        color={downButtonPressed ? MaterialColors.onSurface : MaterialColors.onPrimary}
                                    />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                );
            })()}
        </>
    );
};

export default RingStatusCard;