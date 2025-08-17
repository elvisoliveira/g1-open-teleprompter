import React from 'react';
import { Text, View } from 'react-native';
import { topAppBarStyles } from '../styles/TopAppBarStyles';
import { version } from './../package.json';

const TopAppBar: React.FC = () => {
    return (
        <View style={topAppBarStyles.container}>
            <View style={topAppBarStyles.content}>
                <Text>
                    <Text style={topAppBarStyles.title}>G1 OpenTeleprompter</Text>
                    <Text style={topAppBarStyles.version}>{'\t'}{version}</Text>
                </Text>
            </View>
        </View>
    );
};

export default TopAppBar;
