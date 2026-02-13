import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getCurrentLocation } from '../utils/location';
import { getWeather, getWeatherDescription } from '../services/weatherAgent';

export default function WeatherScreen() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchWeather = async () => {
        setLoading(true);
        try {
            const coords = await getCurrentLocation();
            const data = await getWeather(coords.latitude, coords.longitude);
            setWeather(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    const renderForecastItem = (day, index) => {
        const date = new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        return (
            <View key={index} style={styles.forecastItem}>
                <Text style={styles.forecastDate}>{date}</Text>
                <Ionicons name="partly-sunny" size={24} color={COLORS.primary} />
                <Text style={styles.forecastTemp}>{Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°</Text>
                <Text style={styles.forecastDesc}>{getWeatherDescription(day.code)}</Text>
            </View>
        );
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWeather} />}
        >
            {weather && weather.current && (
                <>
                    <View style={styles.currentCard}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Current Weather</Text>
                            <Text style={styles.todayDate}>{new Date().toLocaleDateString('en-IN')}</Text>
                        </View>

                        <View style={styles.mainInfo}>
                            <Ionicons name={weather.current.rain > 0 ? "rainy" : "sunny"} size={64} color={COLORS.secondary} />
                            <Text style={styles.temp}>{Math.round(weather.current.temp)}°C</Text>
                        </View>
                        <Text style={styles.desc}>{getWeatherDescription(weather.current.code)}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Ionicons name="water-outline" size={20} color={COLORS.textLight} />
                                <Text>Hum: {weather.current.humidity}%</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="speedometer-outline" size={20} color={COLORS.textLight} />
                                <Text>Wind: {weather.current.windSpeed} km/h</Text>
                            </View>
                        </View>

                        {weather.current.rain > 0 && (
                            <View style={styles.alertBanner}>
                                <Ionicons name="warning-outline" size={20} color={COLORS.surface} />
                                <Text style={styles.alertText}>Rain Expected! Protect crops.</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>3-Day Forecast</Text>
                    <View style={styles.forecastContainer}>
                        {weather.daily.map((day, index) => renderForecastItem(day, index))}
                    </View>
                </>
            )}
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
    currentCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.l,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        marginBottom: SPACING.l,
        elevation: 3,
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.m,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    todayDate: {
        color: COLORS.textLight,
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    temp: {
        fontSize: 56,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: SPACING.m,
    },
    desc: {
        fontSize: 18,
        color: COLORS.textLight,
        marginBottom: SPACING.l,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: SPACING.m,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertBanner: {
        flexDirection: 'row',
        backgroundColor: COLORS.error,
        padding: SPACING.s,
        borderRadius: RADIUS.m,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    alertText: {
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    forecastContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    forecastItem: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        alignItems: 'center',
        width: '30%',
        elevation: 1,
    },
    forecastDate: {
        fontSize: 12,
        marginBottom: SPACING.s,
        color: COLORS.textLight,
    },
    forecastTemp: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: SPACING.s,
    },
    forecastDesc: {
        fontSize: 10,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});
