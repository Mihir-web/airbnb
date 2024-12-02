const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../config/auth');

// Render listings page
router.get('/listings', ensureAuth, (req, res) => {
  res.render('user/listings', { user: req.session.user });
});

module.exports = router;
