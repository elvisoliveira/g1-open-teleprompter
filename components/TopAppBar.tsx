import React from 'react';
import { Text, View } from 'react-native';
import { topAppBarStyles } from '../styles/TopAppBarStyles';

const TopAppBar: React.FC = () => {
    return (
        <View style={topAppBarStyles.container}>
            <View style={topAppBarStyles.content}>
                <Text style={topAppBarStyles.title}>G1 OpenTeleprompter</Text>
            </View>
        </View>
    );
};

export default TopAppBar;
