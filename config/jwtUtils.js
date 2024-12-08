const jwt = require('jsonwebtoken');
const secretKey = 'your-secret-key';  // Change to a strong secret key

// Function to generate JWT
function generateToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role },  // Payload
        secretKey,  // Secret key
        { expiresIn: '1h' }  // Token expiration time (1 hour)
    );
}

// Function to verify JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, secretKey);  // Verify the token
    } catch (err) {
        return null;  // Return null if token is invalid or expired
    }
}

module.exports = { generateToken, verifyToken };
