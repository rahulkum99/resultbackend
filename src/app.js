
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');

const { securityHeaders, apiLimiter, authLimiter, sensitiveLimiter } = require('./middlewares/srcurity.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('./utils/jwt');
const { protect } = require('./middlewares/auth.middleware');

const app = express();

app.set('trust proxy', 1);

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5173', 'https://khelodost.live', 'https://agadmin.khelodost.live'],
    credentials: true
}));

// Global security headers
app.use(securityHeaders);

// Global rate limiting for API routes
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Authentication / login route
app.post('/api/auth/login', authLimiter, (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    const VALID_USERNAME = process.env.LOGIN_USERNAME || process.env.ADMIN_USERNAME;
    const VALID_PASSWORD = process.env.LOGIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!VALID_USERNAME || !VALID_PASSWORD) {
        return res.status(500).json({
            success: false,
            message: 'Login credentials are not configured on the server'
        });
    }

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
        return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }

    const payload = { username };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const isProd = process.env.NODE_ENV === 'production';

    res
        .cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000 // 30 minutes
        })
        .cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        .json({
            success: true,
            message: 'Login successful',
            user: { username },
            tokens: {
                accessToken,
                refreshToken
            }
        });
});

// Logout route – clears auth cookies
app.post('/api/auth/logout', sensitiveLimiter, (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';

    res
        .clearCookie('accessToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax'
        })
        .clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax'
        })
        .json({
            success: true,
            message: 'Logged out successfully'
        });
});

// Refresh / rotate tokens using refresh token
app.post('/api/auth/refresh', sensitiveLimiter, (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';

    const authHeader = req.headers.authorization || '';
    let refreshToken = null;

    if (authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
    } else if (req.cookies && req.cookies.refreshToken) {
        refreshToken = req.cookies.refreshToken;
    }

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token missing'
        });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        const payload = { username: decoded.username };

        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        res
            .cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax',
                maxAge: 30 * 60 * 1000 // 30 minutes
            })
            .cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            })
            .json({
                success: true,
                message: 'Token refreshed successfully',
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid refresh token'
        });
    }
});

// Example protected route – only logged-in user can access
app.get('/api/auth/me', protect, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is healthy' });
});

// Global error handler (should be last)
app.use(errorMiddleware);

module.exports = app;
