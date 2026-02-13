import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Permission to access location was denied');
        }

        let location = await Location.getCurrentPositionAsync({});
        return location.coords;
    } catch (error) {
        console.error('Error getting location:', error);
        throw error;
    }
};

export const reverseGeocode = async (latitude, longitude) => {
    try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        return address;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};
