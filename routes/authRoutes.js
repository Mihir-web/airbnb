const express = require('express');
const router = express.Router();
const { loginUser, signupUser, logoutUser } = require('../controllers/authController');

// Login route
router.get('/login', (req, res) => res.render('auth/login'));
router.post('/login', loginUser);

// Signup route
router.get('/signup', (req, res) => res.render('auth/signup'));
router.post('/signup', signupUser);

// Logout route
router.get('/logout', logoutUser);

module.exports = router;
