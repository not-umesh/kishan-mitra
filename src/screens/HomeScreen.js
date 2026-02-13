import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getCurrentLocation, reverseGeocode } from '../utils/location';
import { getFarmerInsights } from '../services/orchestrator';
import { getSettings } from '../utils/storage';

export default function HomeScreen({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationName, setLocationName] = useState('Locating...');
    const [insights, setInsights] = useState(null);
    const [error, setError] = useState(null);

    // Fetch data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get Location
            const coords = await getCurrentLocation();
            const address = await reverseGeocode(coords.latitude, coords.longitude);

            const city = address?.city || address?.district || 'Unknown Location';
            const state = address?.region || 'Maharashtra';
            setLocationName(`${city}, ${state}`);

            // 2. Get Settings
            const settings = await getSettings();
            const preferredState = settings?.state || state;
            const preferredCrop = 'Onion'; // Default, could be from settings

            // 3. Call Orchestrator
            const data = await getFarmerInsights(
                coords.latitude,
                coords.longitude,
                preferredState,
                city,
                preferredCrop
            );

            setInsights(data);

        } catch (e) {
            console.error(e);
            setError('Could not fetch latest data. Check internet.');
            setLocationName('Location Error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const SummaryCard = ({ title, icon, value, subtext, onPress }) => (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <Text style={styles.cardValue}>{value}</Text>
            <Text style={styles.cardSubtext}>{subtext}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Namaste, Kisan!</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color={COLORS.secondary} />
                        <Text style={styles.location}>{locationName}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Quick Actions / Summary */}
                <View style={styles.grid}>
                    <SummaryCard
                        title="Weather"
                        icon="partly-sunny"
                        value={insights?.weather?.current?.temp ? `${Math.round(insights.weather.current.temp)}°C` : '--'}
                        subtext={insights?.weather?.current?.rain > 0 ? "Rain Alert!" : "Clear Sky"}
                        onPress={() => navigation.navigate('Weather')}
                    />
                    <SummaryCard
                        title="Mandi"
                        icon="trending-up"
                        value={insights?.market?.[0]?.modal_price ? `₹${insights.market[0].modal_price}` : '--'}
                        subtext={insights?.market?.[0]?.commodity || "Onion"}
                        onPress={() => navigation.navigate('Mandi')}
                    />
                </View>

                {/* AI Advisory Highlight */}
                <View style={styles.advisoryCard}>
                    <View style={styles.advisoryHeader}>
                        <Text style={styles.sectionTitle}>💡 AI Insight</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Advisory')}>
                            <Text style={styles.linkText}>View Full</Text>
                        </TouchableOpacity>
                    </View>
                    {loading && !insights ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <Text style={styles.advisoryPreview} numberOfLines={3}>
                            {insights?.advisory || "Tap 'Get Advice' to generate new insights for your farm."}
                        </Text>
                    )}
                </View>

                <TouchableOpacity style={styles.mainActionButton} onPress={() => navigation.navigate('Advisory')}>
                    <Text style={styles.mainActionText}>Get Full Advisory</Text>
                    <Ionicons name="arrow-forward" size={24} color={COLORS.surface} />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.l,
        paddingTop: SPACING.xl * 2,
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
        gap: 4,
    },
    location: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    content: {
        padding: SPACING.m,
    },
    grid: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    card: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
        gap: SPACING.s,
    },
    iconContainer: {
        backgroundColor: COLORS.background,
        padding: 8,
        borderRadius: RADIUS.m,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    cardSubtext: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    advisoryCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        marginBottom: SPACING.l,
        elevation: 2,
    },
    advisoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    advisoryPreview: {
        color: COLORS.textLight,
        lineHeight: 22,
        fontSize: 14,
    },
    mainActionButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.s,
    },
    mainActionText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorBox: {
        backgroundColor: '#FFEBEE',
        padding: SPACING.s,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
    },
});
