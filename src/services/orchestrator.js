import { getWeather } from './weatherAgent';
import { getMarketPrices } from './marketAgent';
import { getAdvisory } from './advisorAgent';

export const getFarmerInsights = async (latitude, longitude, state, district, crop) => {
    try {
        console.log('Orchestrator: Starting data fetch...');

        // 1. Fetch Weather and Market Data in parallel
        const [weatherResult, marketResult] = await Promise.allSettled([
            getWeather(latitude, longitude),
            getMarketPrices(state, crop)
        ]);

        const weatherData = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
        const marketData = marketResult.status === 'fulfilled' ? marketResult.value : [];

        // 2. Generate Advisory based on fetched data
        let advisoryText = "Unable to generate advisory at this moment.";
        if (weatherData) {
            advisoryText = await getAdvisory(weatherData, marketData);
        }

        return {
            weather: weatherData,
            market: marketData,
            advisory: advisoryText,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Orchestrator Error:', error);
        throw error;
    }
};
