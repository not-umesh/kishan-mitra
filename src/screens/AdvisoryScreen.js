import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getFarmerInsights } from '../services/orchestrator';
import { getCurrentLocation } from '../utils/location';
import { getSettings } from '../utils/storage';

export default function AdvisoryScreen() {
    const [advisory, setAdvisory] = useState('');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetchAdvisory();
    }, []);

    const fetchAdvisory = async () => {
        setLoading(true);
        try {
            const userSettings = await getSettings();
            setSettings(userSettings);

            const coords = await getCurrentLocation();
            const state = userSettings?.state || 'Maharashtra';
            const crop = 'Onion'; // Default or from settings

            const insights = await getFarmerInsights(
                coords.latitude,
                coords.longitude,
                state,
                'Nashik',
                crop
            );

            setAdvisory(insights.advisory);
        } catch (error) {
            console.error(error);
            setAdvisory('Unable to fetch advisory. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    const onShare = async () => {
        try {
            await Share.share({
                message: `Kisan Mitra Advisory:\n\n${advisory}\n\n- Sent via Kisan Mitra App`,
            });
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>AI Kisan Advisor</Text>
                <Text style={styles.subtitle}>Personalized insights for you</Text>
            </View>

            <View style={styles.card}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Analyzing weather & markets...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.cardHeader}>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Today's Advice</Text>
                        </View>
                        <Text style={styles.advisoryText}>{advisory}</Text>

                        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                            <Ionicons name="logo-whatsapp" size={20} color={COLORS.surface} />
                            <Text style={styles.shareButtonText}>Share on WhatsApp</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={fetchAdvisory} disabled={loading}>
                <Text style={styles.refreshButtonText}>Refresh Advice</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.m,
        paddingTop: SPACING.xl,
    },
    header: {
        marginBottom: SPACING.l,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: SPACING.l,
        borderRadius: RADIUS.l,
        elevation: 4,
        minHeight: 200,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.textLight,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: SPACING.s,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    advisoryText: {
        fontSize: 18,
        color: COLORS.text,
        lineHeight: 28,
        marginBottom: SPACING.l,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: '#25D366', // WhatsApp Green
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
    },
    shareButtonText: {
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 16,
    },
    refreshButton: {
        marginTop: SPACING.l,
        alignSelf: 'center',
        padding: SPACING.m,
    },
    refreshButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
