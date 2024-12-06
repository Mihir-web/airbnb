const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const databaseConfig = require('./config/database');
const ListingsModel = require('./models/listings'); // Renamed for clarity

const app = express();
const port = process.env.PORT || 8000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars engine configuration
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose
  .connect(databaseConfig.url)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Multer configuration for file uploads
const storageOptions = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  const isJpg = file.mimetype === 'image/jpeg';
  if (isJpg) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg files are allowed'), false);
  }
};

const upload = multer({ storage: storageOptions, fileFilter });

// Routes
app.get('/', (req, res) => {
  res.redirect('/api/listing');
});

app.get('/api/listing', async (req, res) => {
  try {
    const listingData = await ListingsModel.find().limit(10);
    if (listingData.length) {
      const result = listingData.map((listing) => ({
        _id: listing._id,
        listing_url: listing.listing_url,
        name: listing.name,
        summary: listing.summary,
        space: listing.space,
        description: listing.description,
        neighborhood_overview: listing.neighborhood_overview,
        notes: listing.notes,
        transit: listing.transit,
        access: listing.access,
        interaction: listing.interaction,
        house_rules: listing.house_rules,
        property_type: listing.property_type,
        room_type: listing.room_type,
        bed_type: listing.bed_type,
        minimum_nights: listing.minimum_nights,
        maximum_nights: listing.maximum_nights,
        cancellation_policy: listing.cancellation_policy,
        last_scraped: listing.last_scraped,
        calendar_last_scraped: listing.calendar_last_scraped,
        first_review: listing.first_review,
        last_review: listing.last_review,
        accommodates: listing.accommodates,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        number_of_reviews: listing.number_of_reviews,
        bathrooms: listing.bathrooms,
        amenities: listing.amenities,
        price: listing.price,
        security_deposit: listing.security_deposit,
        cleaning_fee: listing.cleaning_fee,
        extra_people: listing.extra_people,
        guests_included: listing.guests_included,
        images: listing.images,
        host: listing.host,
        address: listing.address,
        location: listing.location,
        availability: listing.availability,
        review_scores: listing.review_scores,
        reviews: listing.reviews,
      }));
      console.log(result);
      res.render('allData', { result });
    } else {
      res.status(404).render('error', { message: 'No listings found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
});

app.get('/api/listing/:listingId', async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const listingData = await ListingsModel.find({"_id":listingId}).limit(10);
    if (listingData.length) {
      const result = listingData.map((listing) => ({
        _id: listing._id,
        listing_url: listing.listing_url,
        name: listing.name,
        summary: listing.summary,
        space: listing.space,
        description: listing.description,
        neighborhood_overview: listing.neighborhood_overview,
        notes: listing.notes,
        transit: listing.transit,
        access: listing.access,
        interaction: listing.interaction,
        house_rules: listing.house_rules,
        property_type: listing.property_type,
        room_type: listing.room_type,
        bed_type: listing.bed_type,
        minimum_nights: listing.minimum_nights,
        maximum_nights: listing.maximum_nights,
        cancellation_policy: listing.cancellation_policy,
        last_scraped: listing.last_scraped,
        calendar_last_scraped: listing.calendar_last_scraped,
        first_review: listing.first_review,
        last_review: listing.last_review,
        accommodates: listing.accommodates,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        number_of_reviews: listing.number_of_reviews,
        bathrooms: listing.bathrooms,
        amenities: listing.amenities,
        price: listing.price,
        security_deposit: listing.security_deposit,
        cleaning_fee: listing.cleaning_fee,
        extra_people: listing.extra_people,
        guests_included: listing.guests_included,
        images: listing.images,
        host: listing.host,
        address: listing.address,
        location: listing.location,
        availability: listing.availability,
        review_scores: listing.review_scores,
        reviews: listing.reviews,
      }));
      console.log(result);
      res.render('allData', { result });
    } else {
      res.status(404).render('error', { message: 'No listings found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
});

// Other routes like movies and forms...

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
