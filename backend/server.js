const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { query, body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Validation Middleware Helper
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (errors.isEmpty()) return next();
        res.status(400).json({ errors: errors.array() });
    };
};

// ── AI Model Config (shared across endpoints) ──
const AI_MODELS = [
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'qwen/qwen3-4b-instruct:free',
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-3n-4b-it:free',
    'google/gemma-3n-2b-it:free',
];

// ── Helper: Get AI-estimated market prices via OpenRouter ──
const getAIMarketEstimate = async (state, commodity) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('No OPENROUTER_API_KEY set. Cannot generate AI prices.');
        return null;
    }

    const today = new Date().toLocaleDateString('en-GB');
    const prompt = `You are an Indian agricultural market data expert.
Estimate realistic current wholesale market prices for "${commodity}" in "${state}", India.
Return ONLY a valid JSON object (no markdown, no explanation), in this exact format:
{
    "records": [
        {
            "state": "${state}",
            "district": "Major District",
            "market": "Main Mandi",
            "commodity": "${commodity}",
            "variety": "Common",
            "min_price": "1500",
            "max_price": "2200",
            "modal_price": "1800",
            "arrival_date": "${today}"
        },
        {
            "state": "${state}",
            "district": "Second District",
            "market": "Second Mandi",
            "commodity": "${commodity}",
            "variety": "Hybrid",
            "min_price": "1600",
            "max_price": "2400",
            "modal_price": "2000",
            "arrival_date": "${today}"
        }
    ]
}
Replace ALL price values with your best realistic estimate in INR per Quintal.
Use real district and market names from ${state}.`;

    // Try each model until one works
    for (const model of AI_MODELS) {
        try {
            console.log(`[Market AI] Trying ${model} for ${commodity} in ${state}...`);
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model,
                messages: [{ role: 'user', content: prompt }]
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://kisanmitra.app',
                    'X-Title': 'Kisan Mitra App',
                },
                timeout: 15000
            });

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) {
                const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleaned);
                if (parsed.records && parsed.records.length > 0) {
                    console.log(`[Market AI] Success with ${model}`);
                    return parsed;
                }
            }
        } catch (e) {
            console.warn(`[Market AI] ${model} failed: ${e.message}`);
            if (e.response?.status === 401) break; // Bad key, stop trying
        }
    }
    return null;
};

// ── Helper: Build data.gov.in URL ──
const buildGovUrl = (state, commodity) => {
    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey) return null;
    let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=20`;
    if (state) url += `&filters[state]=${encodeURIComponent(state)}`;
    if (commodity) url += `&filters[commodity]=${encodeURIComponent(commodity)}`;
    return url;
};

// ── Routes ──
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🌾 Kisan-Mitra Backend is Running!' });
});

// ── Market Prices Endpoint ──
// Strategy: Try data.gov.in first → AI fallback if it fails
app.get('/api/market', validate([
    query('state').trim().notEmpty().withMessage('State is required').escape(),
    query('commodity').optional().trim().escape()
]), async (req, res) => {
    try {
        const { state, commodity } = req.query;

        // 1. Try official data.gov.in API (if key exists)
        const govUrl = buildGovUrl(state, commodity);
        if (govUrl) {
            try {
                console.log(`[Market] Trying data.gov.in for ${commodity} in ${state}`);
                const govResponse = await axios.get(govUrl, { timeout: 8000 });
                if (govResponse.data?.records?.length > 0) {
                    console.log(`[Market] Got ${govResponse.data.records.length} records from data.gov.in`);
                    return res.json(govResponse.data);
                }
                console.log('[Market] data.gov.in returned empty records');
            } catch (govError) {
                console.warn(`[Market] data.gov.in failed: ${govError.message}`);
            }

            // 1b. Try broader search (state only, no commodity filter)
            if (commodity) {
                const broadUrl = buildGovUrl(state, null);
                if (broadUrl) {
                    try {
                        console.log(`[Market] Trying broader search (state only)...`);
                        const broadResponse = await axios.get(broadUrl, { timeout: 8000 });
                        if (broadResponse.data?.records?.length > 0) {
                            console.log(`[Market] Got ${broadResponse.data.records.length} records (broad)`);
                            return res.json(broadResponse.data);
                        }
                    } catch (broadError) {
                        console.warn(`[Market] Broad search failed: ${broadError.message}`);
                    }
                }
            }
        } else {
            console.log('[Market] No DATA_GOV_API_KEY, skipping official API');
        }

        // 2. AI Fallback (always available if OPENROUTER_API_KEY is set)
        console.log(`[Market] Engaging AI fallback for ${commodity} in ${state}...`);
        const aiData = await getAIMarketEstimate(state, commodity || 'Onion');
        if (aiData) {
            return res.json(aiData);
        }

        // 3. Nothing worked — return empty
        console.warn('[Market] All sources failed. Returning empty.');
        res.json({ records: [] });

    } catch (error) {
        console.error('[Market] Fatal error:', error.message);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// ── AI Advisory Endpoint ──
app.post('/api/advisory', validate([
    body('prompt').trim().notEmpty().withMessage('Prompt is required').isLength({ max: 1000 }).withMessage('Prompt too long').escape()
]), async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        console.log('[Advisory] Generating...');

        let lastError;
        for (const model of AI_MODELS) {
            try {
                console.log(`[Advisory] Trying ${model}`);
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model,
                    messages: [{ role: 'user', content: prompt }]
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://kisanmitra.app',
                        'X-Title': 'Kisan Mitra App',
                    },
                    timeout: 15000
                });

                if (response.data?.choices?.length > 0) {
                    console.log(`[Advisory] Success with ${model}`);
                    return res.json(response.data);
                }
            } catch (error) {
                console.error(`[Advisory] ${model} failed: ${error.message}`);
                lastError = error;
                if (error.response?.status === 401) break;
            }
        }

        throw lastError || new Error('All models failed');

    } catch (error) {
        console.error('[Advisory] Fatal error:', error.message);
        res.status(500).json({ error: 'Failed to generate advisory. Please try again later.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🌾 Kisan-Mitra server running on port ${PORT}`);
});
