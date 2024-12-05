const mongoose = require('mongoose');
const Home = require('./models/Home');  // Make sure to adjust this path

mongoose.connect('mongodb://localhost:27017/your-database-name', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const homes = [
      {
        name: "Luxury Villa",
        price: 350000,
        description: "Spacious villa with a pool and a beautiful view.",
        image: "https://example.com/villa.jpg"
      },
      {
        name: "Urban Apartment",
        price: 250000,
        description: "Modern apartment in the heart of the city.",
        image: "https://example.com/apartment.jpg"
      }
    ];

    Home.insertMany(homes)
      .then(() => {
        console.log("Homes added successfully!");
        mongoose.disconnect();  // Disconnect after adding data
      })
      .catch(err => {
        console.error("Error adding homes:", err);
      });
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
  });
