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

        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=10&filters[state.keyword]=${state}&filters[commodity]=${commodity}`;

        console.log(`Fetching Market Data for: ${state}, ${commodity} ‘‘</UV> ’’`);
        const response = await axios.get(url);
        res.json(response.data);
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
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://kisanmitra.app',
                'X-Title': 'Kisan Mitra App',
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Advisory API Error:', error.message);
        if (error.response) {
            console.error('OpenRouter Response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to generate advisory' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} ‘‘</UV> ’’`);
});
