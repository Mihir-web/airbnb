// Middleware to check if a user is authenticated
const ensureAuth = (req, res, next) => {
    if (req.session && req.session.user) {
      next();
    } else {
      res.redirect('/login');
    }
  };
  
  module.exports = { ensureAuth };
  