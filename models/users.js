const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['2', '3'], // Define user roles (Guest and Host)
    required: true
  },
  is_active: {
    type: Boolean,
    default: true // User is active by default
  }
});

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // Hash password if it has been modified
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});



// Model Creation
const users = mongoose.model('users', userSchema); // Use 'User' as the model name

module.exports = users;
