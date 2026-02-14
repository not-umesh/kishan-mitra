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
app.use(helmet()); // Secure HTTP headers
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
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({ errors: errors.array() });
    };
};

// Routes
app.get('/', (req, res) => {
    res.send('🌾 Kisan-Mitra Backend is Running! ‘‘</UV> ’’');
});

// Proxy for Market Prices (data.gov.in)
// Validates: state (string, not empty), commodity (string, optional)
app.get('/api/market', validate([
    query('state').trim().notEmpty().withMessage('State is required').escape(),
    query('commodity').optional().trim().escape()
]), async (req, res) => {
    try {
        const { state, commodity } = req.query;
        const apiKey = process.env.DATA_GOV_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        // Helper to get estimate from Gemini
        const getGeminiEstimate = async (s, c) => {
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) return null;

            try {
                console.log(`Asking Gemini for estimated price of ${c} in ${s}... ‘‘</UV> ’’`);
                // Using OpenRouter to access Gemini if user provided OpenRouter Key, OR direct if they have Gemini Key
                // Since user said "put my gemini api", we assume they might want to use Google's API directly or via OpenRouter
                // The current setup uses OpenRouter for everything, so let's stick to that for consistency if possible,
                // BUT the user specifically added GEMINI_API_KEY.
                // Let's use the GEMINI_API_KEY with Google's URL if it's a Google key, or OpenRouter if it's an OpenRouter key.
                // Assuming it's a standard Google AI Studio key for "google/gemini-2.0-flash-lite-preview-02-05:free" via OpenRouter or direct.
                // Simpler: Use OpenRouter with the existing OPENROUTER_API_KEY but specifically target a high-quality model,
                // OR use the GEMINI_API_KEY if provided directly to Google.
                // Given the context, we'll use OpenRouter with the specific free Gemini model, using the GEMINI_API_KEY as an override if present, or OPENROUTER_KEY.

                const keyToUse = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
                const modelToUse = 'google/gemini-2.0-flash-lite-preview-02-05:free'; // Fast, free, good at reasoning

                const prompt = `Estimate the current average wholesale market price for ${c} in ${s}, India.
                Return ONLY a JSON object with this exact format, no markdown:
                {
                    "records": [
                        {
                            "state": "${s}",
                            "district": "Estimated",
                            "market": "Market Estimate (AI)",
                            "commodity": "${c}",
                            "variety": "Common",
                            "min_price": "1000",
                            "max_price": "1200",
                            "modal_price": "1100",
                            "arrival_date": "${new Date().toLocaleDateString('en-GB')}"
                        }
                    ]
                }
                Replace the price values with your best realistic estimate for today in INR/Quintal.`;

                const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: modelToUse,
                    messages: [{ role: 'user', content: prompt }]
                }, {
                    headers: {
                        'Authorization': `Bearer ${keyToUse}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://kisanmitra.app',
                        'X-Title': 'Kisan Mitra App',
                    }
                });

                if (aiResponse.data?.choices?.[0]?.message?.content) {
                    const content = aiResponse.data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(content);
                }
            } catch (e) {
                console.error('Gemini Estimate Failed:', e.message);
                return null;
            }
            return null;
        };

        // 1. Try Specific Search (State + Commodity)
        let url = buildUrl(state, commodity);
        console.log(`Fetching Market Data (Specific): ${state}, ${commodity} ‘‘</UV> ’’`);

        let response = { data: { records: [] } }; // Default empty
        try {
            response = await axios.get(url);
        } catch (apiError) {
            console.warn(`Primary API Failed (Specific): ${apiError.message}`);
            // Do not throw, let it fall through to fallbacks
        }

        // 2. Fallback: If no records, try State only
        if ((!response.data.records || response.data.records.length === 0) && commodity) {
            console.log(`No records for ${commodity}. Trying broader search... ‘‘</UV> ’’`);
            url = buildUrl(state, null);
            try {
                response = await axios.get(url);
            } catch (apiError) {
                console.warn(`Secondary API Failed (Broad): ${apiError.message}`);
                // Do not throw, let it fall through to AI fallback
            }
        }

        // 3. Final Fallback: If STILL no records (or empty state), ask Gemini
        if (!response.data || !response.data.records || response.data.records.length === 0) {
            console.log(`Still no data. Engaging Gemini Fallback... ‘‘</UV> ’’`);
            const aiData = await getGeminiEstimate(state, commodity);
            if (aiData) {
                res.json(aiData);
                return;
            }
        }

        res.json(response.data || { records: [] });
    } catch (error) {
        console.error('Market API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// Proxy for AI Advisory (OpenRouter)
// Validates: prompt (string, not empty, max length 1000 chars)
app.post('/api/advisory', validate([
    body('prompt').trim().notEmpty().withMessage('Prompt is required').isLength({ max: 1000 }).withMessage('Prompt too long').escape()
]), async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        console.log('Generating AI Advisory... ‘‘</UV> ’’');

        // List of models to try in order (Fallback strategy)
        // Updated with latest free models as of Feb 2026
        // List of models to try in order (Fallback strategy)
        // Updated with user-requested free models (Feb 2026)
        const models = [
            'nousresearch/hermes-3-llama-3.1-405b:free',
            'google/gemma-3-27b-it:free',
            'google/gemma-3-12b-it:free',
            'qwen/qwen3-4b-instruct:free',
            'google/gemma-3-4b-it:free',
            'meta-llama/llama-3.2-3b-instruct:free',
            'google/gemma-3n-4b-it:free',
            'google/gemma-3n-2b-it:free',
        ];

        let lastError;
        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://kisanmitra.app',
                        'X-Title': 'Kisan Mitra App',
                    },
                    timeout: 15000 // 15 second timeout for slower models
                });

                if (response.data && response.data.choices && response.data.choices.length > 0) {
                    console.log(`Success with model: ${model}`);
                    return res.json(response.data);
                }
            } catch (error) {
                console.error(`Model ${model} failed: ${error.message}`);
                // Log full error for debugging
                if (error.response) {
                    console.error('Status:', error.response.status, 'Data:', JSON.stringify(error.response.data));
                }

                lastError = error;
                // Continue to next model on ANY error (5xx server, 429 rate limit, 404 model not found)
                // Only stop if it's a 401 (Unauthorized - Invalid API Key) which applies to all models
                if (error.response && error.response.status === 401) {
                    break;
                }
            }
        }

        throw lastError || new Error('All models failed');

    } catch (error) {
        console.error('Advisory API Fatal Error:', error.message);
        if (error.response) {
            console.error('OpenRouter Response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to generate advisory. Please try again later.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} ‘‘</UV> ’’`);
});
