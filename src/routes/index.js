const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../modules/auth/auth.routes');
const cricketRoutes = require('../modules/cricket/cricket.routes');
const soccerRoutes = require('../modules/soccer/soccer.routes');
const tennisRoutes = require('../modules/tennis/tennis.routes');
const cancelRoutes = require('../modules/cancel/cancel.routes');


// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/cricket', cricketRoutes);
router.use('/soccer', soccerRoutes);
router.use('/tennis', tennisRoutes);
router.use('/cancel', cancelRoutes);


module.exports = router;

