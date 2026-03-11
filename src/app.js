
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { securityHeaders, apiLimiter} = require('./middlewares/srcurity.middleware');
const errorMiddleware = require('./middlewares/error.middleware');


const app = express();

app.set('trust proxy', 1);

// Global security headers
app.use(securityHeaders);

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5173', 'https://khelodost.live', 'https://agadmin.khelodost.live'],
    credentials: true
}));



// Global rate limiting for API routes
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Routes
app.use('/api', routes);


// Health check route
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is healthy' });
});

// Global error handler (should be last)
app.use(errorMiddleware);

module.exports = app;
