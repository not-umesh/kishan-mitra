import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, ScrollView, Modal, SafeAreaView
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { CROPS } from '../constants/crops';
import { INDIAN_STATES } from '../constants/states';
import { getMarketPrices } from '../services/marketAgent';
import { getSettings } from '../utils/storage';

export default function MandiScreen() {
    const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedState, setSelectedState] = useState('Maharashtra');
    const [showStatePicker, setShowStatePicker] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        fetchPrices();
    }, [selectedCrop, selectedState]);

    const loadSettings = async () => {
        const settings = await getSettings();
        if (settings && settings.state) {
            setSelectedState(settings.state);
        }
    };

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const data = await getMarketPrices(selectedState, selectedCrop.name);
            setPrices(data);
        } catch (error) {
            console.error(error);
            setPrices([]);
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
                <View style={{ flex: 1 }}>
                    <Text style={styles.marketName}>{item.market}</Text>
                    <Text style={styles.districtText}>{item.district}, {item.state}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{item.date || 'Today'}</Text>
                </View>
            </View>
            {item.variety ? (
                <Text style={styles.varietyText}>Variety: {item.variety}</Text>
            ) : null}
            <View style={styles.priceRow}>
                <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <Text style={styles.priceValue}>₹{item.min_price}</Text>
                    <Text style={styles.unitLabel}>/Qtl</Text>
                </View>
                <View style={styles.priceBlockCenter}>
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
        <SafeAreaView style={styles.container}>
            {/* State Picker Button */}
            <TouchableOpacity
                style={styles.statePickerBtn}
                onPress={() => setShowStatePicker(true)}
            >
                <Text style={styles.statePickerLabel}>📍 State</Text>
                <Text style={styles.statePickerValue}>{selectedState} ▼</Text>
            </TouchableOpacity>

            {/* Crop Selector */}
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

            {/* Title */}
            <Text style={styles.listTitle}>
                {selectedCrop.name} prices in {selectedState}
            </Text>

            {/* Price List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Fetching mandi prices...</Text>
                </View>
            ) : (
                <FlatList
                    data={prices}
                    renderItem={renderPriceItem}
                    keyExtractor={(item, index) => `${item.market}-${index}`}
                    contentContainerStyle={styles.priceList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>📭</Text>
                            <Text style={styles.emptyText}>No data available</Text>
                            <Text style={styles.emptySubtext}>Try another crop or state</Text>
                        </View>
                    }
                />
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    * Prices in ₹/Quintal (1 Qtl = 100 Kg) • AI-estimated
                </Text>
            </View>

            {/* State Picker Modal */}
            <Modal
                visible={showStatePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowStatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select State</Text>
                            <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.stateList}>
                            {INDIAN_STATES.map((stateName) => (
                                <TouchableOpacity
                                    key={stateName}
                                    style={[
                                        styles.stateItem,
                                        selectedState === stateName && styles.stateItemSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedState(stateName);
                                        setShowStatePicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.stateItemText,
                                        selectedState === stateName && styles.stateItemTextSelected,
                                    ]}>
                                        {stateName}
                                    </Text>
                                    {selectedState === stateName && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // State Picker
    statePickerBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        marginHorizontal: SPACING.m,
        marginTop: SPACING.xl,
        marginBottom: SPACING.s,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.m,
    },
    statePickerLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statePickerValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Crop filter
    filterContainer: {
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.s,
    },
    sectionTitle: {
        fontSize: 15,
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
        fontSize: 13,
    },
    selectedCropText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Title
    listTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: SPACING.m,
        marginBottom: SPACING.s,
        color: COLORS.text,
    },
    // Price cards
    priceList: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.l,
    },
    priceCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.s,
    },
    marketName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    districtText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    dateBadge: {
        backgroundColor: COLORS.primary + '15',
        borderRadius: RADIUS.s,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    dateText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '600',
    },
    varietyText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: SPACING.s,
        fontStyle: 'italic',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceBlock: {
        alignItems: 'center',
        flex: 1,
    },
    priceBlockCenter: {
        alignItems: 'center',
        flex: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: COLORS.border,
    },
    priceLabel: {
        fontSize: 11,
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
    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.textLight,
        fontSize: 14,
    },
    // Empty
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: SPACING.m,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 4,
    },
    // Footer
    footer: {
        padding: SPACING.s,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textLight,
        fontSize: 11,
        fontStyle: 'italic',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalClose: {
        fontSize: 22,
        color: COLORS.textLight,
        padding: 4,
    },
    stateList: {
        paddingHorizontal: SPACING.m,
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '40',
    },
    stateItemSelected: {
        backgroundColor: COLORS.primary + '15',
        borderRadius: RADIUS.s,
    },
    stateItemText: {
        fontSize: 15,
        color: COLORS.text,
    },
    stateItemTextSelected: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    checkmark: {
        fontSize: 18,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
