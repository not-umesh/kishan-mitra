import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Switch, TouchableOpacity,
    ScrollView, Alert, Modal, SafeAreaView
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { INDIAN_STATES } from '../constants/states';
import { saveSettings, getSettings } from '../utils/storage';

export default function SettingsScreen() {
    const [state, setState] = useState('Chhattisgarh');
    const [isHindi, setIsHindi] = useState(false);
    const [showStatePicker, setShowStatePicker] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await getSettings();
        if (settings) {
            setState(settings.state || 'Chhattisgarh');
            setIsHindi(settings.language === 'Hindi');
        }
    };

    const handleSave = async () => {
        const settings = {
            state,
            language: isHindi ? 'Hindi' : 'English',
        };
        await saveSettings(settings);
        Alert.alert('✅ Saved', 'Settings updated successfully!');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>⚙️ Settings</Text>

                {/* State Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Your State</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowStatePicker(true)}
                    >
                        <Text style={styles.pickerText}>{state}</Text>
                        <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Language Toggle */}
                <View style={styles.sectionRow}>
                    <Text style={styles.label}>
                        Language: {isHindi ? 'हिंदी' : 'English'}
                    </Text>
                    <Switch
                        trackColor={{ false: '#767577', true: COLORS.primary }}
                        thumbColor={isHindi ? COLORS.secondary : '#f4f3f4'}
                        onValueChange={() => setIsHindi(p => !p)}
                        value={isHindi}
                    />
                </View>

                {/* Save */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Settings</Text>
                </TouchableOpacity>
            </ScrollView>

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
                                        state === stateName && styles.stateItemSelected,
                                    ]}
                                    onPress={() => {
                                        setState(stateName);
                                        setShowStatePicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.stateItemText,
                                        state === stateName && styles.stateItemTextSelected,
                                    ]}>
                                        {stateName}
                                    </Text>
                                    {state === stateName && (
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
    scrollContent: {
        padding: SPACING.m,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: SPACING.l,
        marginBottom: SPACING.l,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: 8,
    },
    label: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.s,
        fontWeight: '500',
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    pickerText: {
        fontSize: 16,
        color: COLORS.text,
    },
    pickerArrow: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: SPACING.m,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
