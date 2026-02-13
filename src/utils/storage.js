import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    SETTINGS: 'kisan_settings',
    ADVISORY_HISTORY: 'kisan_advisory_history',
};

export const saveSettings = async (settings) => {
    try {
        const jsonValue = JSON.stringify(settings);
        await AsyncStorage.setItem(KEYS.SETTINGS, jsonValue);
    } catch (e) {
        console.error('Error saving settings:', e);
    }
};

export const getSettings = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(KEYS.SETTINGS);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Error reading settings:', e);
        return null;
    }
};

export const saveAdvisory = async (advisory) => {
    try {
        const currenthistory = await getAdvisoryHistory() || [];
        const newHistory = [advisory, ...currenthistory].slice(0, 10); // Keep last 10
        await AsyncStorage.setItem(KEYS.ADVISORY_HISTORY, JSON.stringify(newHistory));
    } catch (e) {
        console.error('Error saving advisory:', e);
    }
};

export const getAdvisoryHistory = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(KEYS.ADVISORY_HISTORY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        return [];
    }
};
