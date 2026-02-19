const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { query, body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(v => v.run(req)));
        const errors = validationResult(req);
        if (errors.isEmpty()) return next();
        res.status(400).json({ errors: errors.array() });
    };
};

// ── AI Models (free tier on OpenRouter) ──
const AI_MODELS = [
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'qwen/qwen3-4b-instruct:free',
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
];

// ── OpenRouter API call helper ──
const callOpenRouter = async (prompt, apiKey) => {
    for (const model of AI_MODELS) {
        try {
            console.log(`[AI] Trying ${model}...`);
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
                timeout: 20000
            });

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) {
                console.log(`[AI] Success with ${model}`);
                return content;
            }
        } catch (e) {
            console.warn(`[AI] ${model} failed: ${e.message}`);
            if (e.response?.status === 401) break;
        }
    }
    return null;
};

// ── Routes ──
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🌾 Kisan-Mitra Backend Running' });
});

// ── Market Prices (AI-powered via OpenRouter) ──
app.get('/api/market', validate([
    query('state').trim().notEmpty().withMessage('State is required').escape(),
    query('commodity').optional().trim().escape()
]), async (req, res) => {
    try {
        const { state, commodity } = req.query;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server config error: No OPENROUTER_API_KEY' });
        }

        const today = new Date().toLocaleDateString('en-GB');
        const cropName = commodity || 'Onion';

        const prompt = `You are an Indian agricultural market price expert.
Generate realistic CURRENT wholesale mandi prices for "${cropName}" in the state of "${state}", India.

Return ONLY a valid JSON object. No markdown, no explanation, no backticks.
Use this EXACT format:
{
  "records": [
    {
      "state": "${state}",
      "district": "RealDistrictName",
      "market": "RealMandiName",
      "commodity": "${cropName}",
      "variety": "Common",
      "min_price": "1500",
      "max_price": "2200",
      "modal_price": "1800",
      "arrival_date": "${today}"
    }
  ]
}

Rules:
- Generate 3-5 records for DIFFERENT real districts and mandis in ${state}.
- Use REAL district names and mandi names from ${state}.
- Prices must be realistic for ${cropName} in INR per Quintal (100 kg).
- Each record should have slightly different prices (different local markets).
- variety can be "Common", "Hybrid", "Local", "Desi" etc as appropriate.
- Return ONLY the JSON. Nothing else.`;

        console.log(`[Market] Fetching AI prices for ${cropName} in ${state}...`);
        const aiResponse = await callOpenRouter(prompt, apiKey);

        if (aiResponse) {
            try {
                const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleaned);
                if (parsed.records && parsed.records.length > 0) {
                    return res.json(parsed);
                }
            } catch (parseErr) {
                console.error('[Market] JSON parse failed:', parseErr.message);
                console.error('[Market] Raw AI response:', aiResponse.substring(0, 500));
            }
        }

        // Fallback: return empty
        console.warn('[Market] All AI models failed. Returning empty.');
        res.json({ records: [] });

    } catch (error) {
        console.error('[Market] Fatal:', error.message);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// ── AI Advisory (OpenRouter) ──
app.post('/api/advisory', validate([
    body('prompt').trim().notEmpty().withMessage('Prompt is required').isLength({ max: 1000 }).withMessage('Prompt too long').escape()
]), async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server config error: No OPENROUTER_API_KEY' });
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
        console.error('[Advisory] Fatal:', error.message);
        res.status(500).json({ error: 'Failed to generate advisory.' });
    }
});

app.listen(PORT, () => {
    console.log(`🌾 Kisan-Mitra server on port ${PORT}`);
});
