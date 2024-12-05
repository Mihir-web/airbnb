const mongoose = require('mongoose');

// Define the home schema
const homeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [String], // Array of image URLs
    location: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Create a model based on the schema
const Home = mongoose.model('Home', homeSchema);

module.exports = Home;
