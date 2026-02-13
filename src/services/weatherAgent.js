const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const getWeather = async (latitude, longitude) => {
    try {
        const url = `${OPEN_METEO_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.current) {
            throw new Error('Invalid weather data');
        }

        return {
            current: {
                temp: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                windSpeed: data.current.wind_speed_10m,
                rain: data.current.rain,
                code: data.current.weather_code,
                isDay: data.current.is_day,
            },
            daily: data.daily.time.map((time, index) => ({
                date: time,
                maxTemp: data.daily.temperature_2m_max[index],
                minTemp: data.daily.temperature_2m_min[index],
                rainSum: data.daily.precipitation_sum[index],
                code: data.daily.weather_code[index],
            })),
        };
    } catch (error) {
        console.error('Weather Agent Error:', error);
        return null;
    }
};

export const getWeatherDescription = (code) => {
    // WMO Weather interpretation codes (WW)
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    };
    return codes[code] || 'Unknown';
};
