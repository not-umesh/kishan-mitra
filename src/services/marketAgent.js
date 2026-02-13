import { DATA_GOV_API_KEY, BACKEND_URL } from '@env';

// Use local backend for development, fallback to production URL if set
const API_URL = BACKEND_URL || 'http://localhost:3000/api/market';

export const getMarketPrices = async (state, commodity) => {
    try {
        // Call the backend proxy instead of data.gov.in directly
        // Ensure state and commodity are URL encoded
        const url = `${API_URL}?state=${encodeURIComponent(state)}&commodity=${encodeURIComponent(commodity)}`;

        console.log('MarketAgent: Fetching from', url);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Backend Error: ${response.status}`);
            return getMockMarketData(state, commodity);
        }

        const data = await response.json();

        if (data.records && data.records.length > 0) {
            return data.records.map(record => ({
                state: record.state,
                district: record.district,
                market: record.market,
                commodity: record.commodity,
                variety: record.variety,
                min_price: record.min_price,
                max_price: record.max_price,
                modal_price: record.modal_price,
                date: record.arrival_date,
            }));
        } else {
            console.warn('MarketAgent: No records found, using mock data');
            return getMockMarketData(state, commodity);
        }
    } catch (error) {
        console.error('Market Agent Error:', error);
        return getMockMarketData(state, commodity);
    }
};

const getMockMarketData = (state, commodity) => {
    // Return realistic mock data for demo purposes
    return [
        {
            state: state || 'Maharashtra',
            district: 'Nashik',
            market: 'Lasalgaon',
            commodity: commodity || 'Onion',
            variety: 'Red',
            min_price: '1200',
            max_price: '1800',
            modal_price: '1500',
            date: new Date().toLocaleDateString('en-IN'),
        },
        {
            state: state || 'Maharashtra',
            district: 'Pune',
            market: 'Pune Mandi',
            commodity: commodity || 'Onion',
            variety: 'Red',
            min_price: '1300',
            max_price: '1900',
            modal_price: '1600',
            date: new Date().toLocaleDateString('en-IN'),
        }
    ];
};
