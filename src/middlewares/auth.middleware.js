const { verifyAccessToken } = require('../utils/jwt');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing'
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Not authorized'
    });
  }
};

module.exports = {
  protect
};

