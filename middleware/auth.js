const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.secret_key || "$2a$10$VieH5MXzIrPIB4DQSyVuBuzpoiTilJOiDF5zexWuSVcvkVLv2qNzO";

// Middleware to verify JWT and user authentication
const authenticate = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    // return res.status(403).json({ message: 'Access denied, no token provided' });
    return res.redirect('/login');
  }

  try {
    // Verify token directly
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach decoded data to request object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check admin access
const authorizeAdmin = (req, res, next) => {
    
  if (req.user.role !== '1') {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
