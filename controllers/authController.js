const User = require('../models/User');
const bcrypt = require('bcrypt');

// Handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    // Save user info in session
    req.session.user = { id: user._id, name: user.name, role: user.role };
    res.redirect('/listings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Handle user signup
const signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/signup', { error: 'Email already exists.' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Handle logout
const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = { loginUser, signupUser, logoutUser };
