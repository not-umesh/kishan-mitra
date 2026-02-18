const axios = require('axios');
require('dotenv').config();

const testApi = async () => {
    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey) {
        console.error('❌ No API Key found in .env');
        return;
    }
    console.log('🔑 Using API Key:', apiKey.substring(0, 5) + '...');

    // 1. Test Simple Call (No filters) to check Auth
    const simpleUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=5`;

    try {
        console.log('\n📡 Testing Connectivity (Simple Request)...');
        console.log(`URL: ${simpleUrl}`);
        const res = await axios.get(simpleUrl);

        console.log('✅ Status:', res.status);
        if (res.data.records) {
            console.log(`✅ Records Found: ${res.data.records.length}`);
            console.log('Sample Record:', JSON.stringify(res.data.records[0], null, 2));
        } else {
            console.warn('⚠️ No records found in simple request.');
            console.log('Full Response:', JSON.stringify(res.data, null, 2));
        }
    } catch (e) {
        console.error('❌ Simple Request Failed:');
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error('Data:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }

    // 2. Test Specific Filter (Onion in Chhattisgarh)
    const filterUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=5&filters[state]=Chhattisgarh&filters[commodity]=Onion`;

    try {
        console.log('\n🔍 Testing Filtered Request (Chhattisgarh + Onion)...');
        console.log(`URL: ${filterUrl}`);
        const res = await axios.get(filterUrl);

        console.log('✅ Status:', res.status);
        if (res.data.records && res.data.records.length > 0) {
            console.log(`✅ Records Found: ${res.data.records.length}`);
            console.log('Sample Record:', JSON.stringify(res.data.records[0], null, 2));
        } else {
            console.warn('⚠️ No records found for specific filter.');
            console.log('Note: This might be normal if no data was uploaded for this crop today.');
        }
    } catch (e) {
        console.error('❌ Filtered Request Failed:', e.message);
    }
};

testApi();
