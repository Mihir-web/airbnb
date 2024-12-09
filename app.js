const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { engine } = require('express-handlebars');
const databaseConfig = require('./config/database');
const ListingsModel = require('./models/listings'); // Renamed for clarity
const flash = require('connect-flash'); // Add this import
const { authenticate, authorizeAdmin } = require('./middleware/auth');
const trackPageHit = require('./middleware/trackPageHit');
const PageHits = require('./models/PageHits');
const { Parser } = require('json2csv')

const jwt = require('jsonwebtoken');

const UserModel = require('./models/users');
const cookieParser = require('cookie-parser');


const app = express();
const port = process.env.PORT || 8000;
const JWT_SECRET = process.env.secret_key || "$2a$10$VieH5MXzIrPIB4DQSyVuBuzpoiTilJOiDF5zexWuSVcvkVLv2qNzO";


// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars engine configuration
app.engine('.hbs', engine({ extname: '.hbs',  helpers: {
  gt: (a, b) => a > b,
  lt: (a, b) => a < b,
  eq: (a, b) => a === b,
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  range: (start, end) => {
    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  },
  first: (array) => {
    if (Array.isArray(array) && array.length > 0) {
      return array[0];
    }
    return null; // Return null or a fallback value if the array is empty
  },
  and: (a, b) => {
    return a && b;
  },
  last:  (array) => {
    if (Array.isArray(array) && array.length > 0) {
      return array[array.length - 1];
    }
    return null; // Return null if array is empty or invalid
  },
  updateDate: (date, newYear, newMonth, newDay) => {
    
    const originalDate = new Date(date);
  
    if (isNaN(originalDate)) {
     
      return '';
    }
  
    originalDate.setFullYear(newYear);
    originalDate.setMonth(newMonth - 1); // Correct month (0-indexed)
    originalDate.setDate(newDay);
  
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(originalDate);
  
    
  
    return formattedDate;
  }
}, runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  }}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

const hbs = require('hbs');



app.use(cookieParser());

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

app.get('/listing', async (req, res) => {
  try {
    const { page = 1, perPage = 12, minimum_nights } = req.query;
    const query = {};
    if (minimum_nights) {
      query.minimum_nights = { $gte: parseInt(minimum_nights, 10) };
    }

    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(perPage, 10);

    // Fetch paginated data and total items
    const listingData = await ListingsModel.find(query)
      .limit(itemsPerPage)
      .skip((currentPage - 1) * itemsPerPage)
      .exec();
    const total = await ListingsModel.countDocuments(query);
    const totalPages = Math.ceil(total / itemsPerPage);

    
    
    // Set the range of pages to display
    const delta = 1; // Number of pages around the current page
    const startPage = Math.max(1, currentPage - delta); // Start from at least page 1
    const endPage = Math.min(totalPages, currentPage + delta); // Ensure not to exceed total pages

    // Always include first 3 pages and last 3 pages
    const visiblePages = [];
    for (let i = 1; i <= Math.min(3, totalPages); i++) {
      visiblePages.push(i);
    }

    // Add middle pages dynamically
    for (let i = startPage; i <= endPage; i++) {
      if (!visiblePages.includes(i)) visiblePages.push(i);
    }

    // Always include last 3 pages
    for (let i = Math.max(totalPages - 2, startPage); i <= totalPages; i++) {
      if (!visiblePages.includes(i)) visiblePages.push(i);
    }

    // Handle ellipses logic
    const firstPage = 1;
    const lastPage = totalPages;
    const pagesToShow = [];

    if (visiblePages[0] > firstPage) {
      pagesToShow.push(firstPage); // Always show the first page
      pagesToShow.push('...');
    }

    pagesToShow.push(...visiblePages);

    if (visiblePages[visiblePages.length - 1] < lastPage) {
      pagesToShow.push('...');
      pagesToShow.push(lastPage); // Always show the last page
    }

    res.render('frontListing', {
      result: listingData,
      page: currentPage,
      perPage: itemsPerPage,
      totalItems: total,
      totalPages,
      visiblePages: pagesToShow,
      startPage,
      endPage,
      query: req.query, // Retain filters
    });
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
});

app.get('/detail/:listing_id', trackPageHit, async (req, res) => {
  try {
    const listingId = req.params.listing_id; // Get the ID from the URL
    const listing = await ListingsModel.findById(listingId); // Fetch the record from the database

    if (!listing) {
      return res.status(404).send('Listing not found'); // Handle case where the listing doesn't exist
    }

    
    res.render('detail', { listing }); // Pass the listing data to the HBS template
  } catch (err) {
    res.status(500).send('Error fetching listing details: ' + err.message);
  }
});




//********************************Auth routes start*********************************//
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login',
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'), 
  async function(req, res)
  {  try {
    // Find user by email
    let email =  req.body.email;
    let password = req.body.password;
    
    const user = await UserModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expiration
    );
    res.cookie('authToken', token, {
      httpOnly: true, // Prevent JavaScript access to the cookie
      secure: false,   // Use this in production with HTTPS
      maxAge: 3600000 // 1 hour
    });
    // res.json({ token, message: 'Login successful' });
    res.redirect('/admin/listing');
  } catch (error) {
    
    res.status(500).json({ message: 'Internal Server Error', error });
  }    
}
);

// Assuming you are using Passport.js for authentication
app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/'); // Redirect the user after logging out
  });
});


// Create a new user
app.get('/register', async (req, res) => {
  res.render('register');
});

app.post(
  '/register',
  // Validate inputs using express-validator
  body('name').notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('repeatPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  body('role').isIn(["2", "3"]).withMessage('Role must be either Guest or Host'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean.'),
  async (req, res) => {
    
      // Check validation result
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      let { name, email, password, role, is_active } = req.body;

      if(role == '2'){
        is_active=false;
      }else{
        is_active=true;
      }

      // Check if email is already in use
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
          return res.status(400).send("Email already in use.");
      }

      // Hash password before saving to database
      

      // Create new user object
      const newUser = new UserModel({
          name,
          email,
          password,
          role,
          is_active
      });

      try {
          // Save the user to the database
          await newUser.save();
          // res.status(201).send("User registered successfully.");
          res.redirect('login');
      } catch (error) {
          res.status(500).send("Error registering user: " + error.message);
      }
  }
);

// ***********************************************Users routes start*******************************************//


// Get all users
app.get('/', async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching users', error });
  }
});

// Get a specific user by ID
app.get('/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching user', error });
  }
});

// Update a user's information (excluding password)
app.put('/:id', async (req, res) => {
  const { name, email, role, password } = req.body;
  try {
    const updateData = { name, email, role };
    if (password) {
      // Hash the new password if provided
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    const user = await UserModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error });
  }
});

// Delete a user
app.delete('/:id', async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting user', error });
  }
});
// ***********************************************Users routes end*******************************************//
//********************************Auth routes end*********************************//

//********************************Front routes start*********************************//
// Routes
app.get('/', (req, res) => {
  res.redirect('/api/listing');
});
//********************************Front routes ends*********************************//

//********************************Admin routes start*********************************//
app.get('/admin/listing', authenticate, authorizeAdmin, async (req, res) => {
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
     
      res.render('allData', { result: result, user: req.user});
    } else {
      res.status(404).render('error', { message: 'No listings found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
});

app.get('/admin/listing/:listingId', authenticate, authorizeAdmin, async (req, res) => {
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
      
      res.render('allData', { result });
    } else {
      res.status(404).render('error', { message: 'No listings found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
});


app.get('/admin/export-csv', async (req, res) => {
  try {
    const { startDate, endDate, listingId, ip } = req.query;

    // Build the query object
    const query = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    if (listingId) query.listingId = listingId;
    if (ip) query.ip = ip;

    // Fetch data based on the query
    const pageHits = await PageHits.find(query).lean();
console.log(pageHits);
    if (!pageHits || pageHits.length === 0) {
      return res.status(404).send('No data found for the given criteria.');
    }

    // Define the fields for the CSV
    const fields = ['ip', 'deviceType', 'listingId', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(pageHits);

    // Set the response headers for file download
    res.header('Content-Type', 'text/csv');
    res.attachment('page_hits_report.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).send('Error exporting CSV.');
  }
});







//********************************Admin routes start*********************************//


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
