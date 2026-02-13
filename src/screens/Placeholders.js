import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const PlaceholderScreen = ({ title }) => (
    <View style={styles.container}>
        <Text style={styles.text}>{title}</Text>
    </View>
);

export const WeatherScreen = () => <PlaceholderScreen title="Weather Forecast" />;
export const MandiScreen = () => <PlaceholderScreen title="Mandi Prices" />;
export const AdvisoryScreen = () => <PlaceholderScreen title="AI Advisory" />;
export const SettingsScreen = () => <PlaceholderScreen title="Settings" />;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    text: {
        fontSize: 20,
        color: COLORS.text,
        fontWeight: 'bold',
    },
});
