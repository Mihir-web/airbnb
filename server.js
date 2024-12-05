// Importing necessary modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// MongoDB connection string for local MongoDB
const dbURI = 'mongodb://localhost:27017/airbnbClone'; // Use any name you want for the database

// Connect to MongoDB
mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Hardcoded homes for testing
const homes = [
    {
        title: "Cozy Mountain Retreat",
        location: "Lake Tahoe, CA",
        price: 200,
        imageUrl: "https://via.placeholder.com/150"
    },
    {
        title: "Seaside Villa",
        location: "Miami Beach, FL",
        price: 300,
        imageUrl: "https://via.placeholder.com/150"
    }
];

// API to add a new home
app.post('/api/homes', (req, res) => {
    const newHome = req.body;
    homes.push(newHome);
    console.log('New Home Added:', newHome);
    res.status(201).send("Home added successfully!");
});

// API to get all homes
app.get('/api/homes', (req, res) => {
    res.json(homes); // Send the homes array
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
