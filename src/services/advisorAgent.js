import Constants from 'expo-constants';

const { BACKEND_URL } = Constants.expoConfig?.extra || {};

// Use local backend for development
const API_URL = BACKEND_URL ? `${BACKEND_URL}/api/advisory` : 'http://localhost:3000/api/advisory';

export const getAdvisory = async (weatherData, marketData, language = 'Hindi') => {
    try {
        const prompt = `
    You are 'Kisan Mitra', a helpful agricultural advisor for Indian farmers.
    
    Context:
    - Weather: ${JSON.stringify(weatherData.current)} (Temp: ${weatherData.current.temp}°C, Rain: ${weatherData.current.rain}mm)
    - Forecast: ${JSON.stringify(weatherData.daily[0])}
    - Market Prices: ${JSON.stringify(marketData)}
    
    Task:
    Provide a short, actionable advisory in ${language}.
    1. Advice on crop protection based on weather.
    2. Advice on whether to sell or hold based on market prices.
    3. Keep it simple and encouraging.
    
    Format:
    Plain text, max 3-4 sentences.
    `;

        console.log('AdvisorAgent: Fetching from', API_URL);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        if (!response.ok) {
            throw new Error(`Backend Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            throw new Error('No response from AI');
        }

    } catch (error) {
        console.error('Advisor Agent Error:', error);
        return getFallbackAdvisory(language);
    }
};

const getFallbackAdvisory = (language) => {
    if (language === 'Hindi') {
        return "नमस्ते किसान भाई। आज का मौसम साफ रहने की उम्मीद है। मंडी में प्याज के दाम स्थिर हैं। अगर आपको अच्छे दाम मिल रहे हैं तो कुछ फसल बेच सकते हैं। अपनी फसलों में नमी बनाए रखें।";
    }
    return "Hello Farmer. The weather is expected to be clear today. Market prices for Onion are stable. If you are getting a good price, consider selling some produce. Maintain moisture in your crops.";
};
