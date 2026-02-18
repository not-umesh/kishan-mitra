import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { CROPS } from '../constants/crops';
import { getMarketPrices } from '../services/marketAgent';
import { getSettings } from '../utils/storage';

export default function MandiScreen() {
    const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState('Maharashtra');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        fetchPrices();
    }, [selectedCrop, state]);

    const loadSettings = async () => {
        const settings = await getSettings();
        if (settings && settings.state) {
            setState(settings.state);
        }
    };

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const data = await getMarketPrices(state, selectedCrop.name);
            setPrices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderCropItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.cropChip,
                selectedCrop.id === item.id && styles.selectedCropChip,
            ]}
            onPress={() => setSelectedCrop(item)}
        >
            <Text
                style={[
                    styles.cropText,
                    selectedCrop.id === item.id && styles.selectedCropText,
                ]}
            >
                {item.name} ({item.hindiName})
            </Text>
        </TouchableOpacity>
    );

    const renderPriceItem = ({ item }) => (
        <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
                <Text style={styles.marketName}>{item.market}, {item.district}</Text>
                <Text style={styles.date}>{item.date || 'Today'}</Text>
            </View>
            <View style={styles.priceRow}>
                <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <Text style={styles.priceValue}>₹{item.min_price}</Text>
                    <Text style={styles.unitLabel}>/Qtl</Text>
                </View>
                <View style={styles.priceBlockAndBorder}>
                    <Text style={styles.priceLabel}>Modal</Text>
                    <Text style={styles.modalPrice}>₹{item.modal_price}</Text>
                    <Text style={styles.unitLabelPrimary}>/Qtl</Text>
                </View>
                <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>Max</Text>
                    <Text style={styles.priceValue}>₹{item.max_price}</Text>
                    <Text style={styles.unitLabel}>/Qtl</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <Text style={styles.sectionTitle}>Select Crop</Text>
                <FlatList
                    horizontal
                    data={CROPS}
                    renderItem={renderCropItem}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cropList}
                />
            </View>

            <Text style={styles.listTitle}>Prices in {state}</Text>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={prices}
                    renderItem={renderPriceItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.priceList}
                    ListEmptyComponent={<Text style={styles.emptyText}>No data available for this crop.</Text>}
                />
            )}

            <View style={styles.footer}>
                <Text style={styles.footerText}>* Prices are in ₹ per Quintal (1 Qtl = 100 Kg)</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: SPACING.xl,
    },
    filterContainer: {
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    cropList: {
        paddingBottom: SPACING.s,
    },
    cropChip: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.l,
        marginRight: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedCropChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    cropText: {
        color: COLORS.text,
    },
    selectedCropText: {
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: SPACING.m,
        marginBottom: SPACING.s,
        color: COLORS.text,
    },
    priceList: {
        padding: SPACING.m,
    },
    priceCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
        elevation: 2,
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.s,
    },
    marketName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    date: {
        color: COLORS.textLight,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceBlock: {
        alignItems: 'center',
        flex: 1,
    },
    priceBlockAndBorder: {
        alignItems: 'center',
        flex: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: COLORS.border,
    },
    priceLabel: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    unitLabel: {
        fontSize: 10,
        color: COLORS.textLight,
    },
    unitLabelPrimary: {
        fontSize: 10,
        color: COLORS.primary,
    },
    footer: {
        padding: SPACING.m,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textLight,
        fontSize: 12,
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textLight,
    },
});
