import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { saveSettings, getSettings } from '../utils/storage';

export default function SettingsScreen() {
    const [state, setState] = useState('Maharashtra');
    const [district, setDistrict] = useState('Nashik');
    const [language, setLanguage] = useState('English');
    const [isHindi, setIsHindi] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await getSettings();
        if (settings) {
            setState(settings.state || 'Maharashtra');
            setDistrict(settings.district || 'Nashik');
            setLanguage(settings.language || 'English');
            setIsHindi(settings.language === 'Hindi');
        }
    };

    const handleSave = async () => {
        const settings = {
            state,
            district,
            language: isHindi ? 'Hindi' : 'English',
        };
        await saveSettings(settings);
        Alert.alert('Success', 'Settings saved successfully!');
    };

    const toggleSwitch = () => setIsHindi(previousState => !previousState);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>User Settings</Text>

            <View style={styles.section}>
                <Text style={styles.label}>State</Text>
                <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="e.g. Maharashtra"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>District</Text>
                <TextInput
                    style={styles.input}
                    value={district}
                    onChangeText={setDistrict}
                    placeholder="e.g. Nashik"
                />
            </View>

            <View style={styles.sectionRow}>
                <Text style={styles.label}>Language: {isHindi ? 'Hindi' : 'English'}</Text>
                <Switch
                    trackColor={{ false: "#767577", true: COLORS.primary }}
                    thumbColor={isHindi ? COLORS.secondary : "#f4f3f4"}
                    onValueChange={toggleSwitch}
                    value={isHindi}
                />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    input: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: SPACING.m,
    },
    saveButtonText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
