/******************************************************************************
***
* ITE5315 – Assignment 2
* I declare that this assignment is my own work in accordance with Humber Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Mihirbhai Hiteshbhai Hirpara Student ID: N01635700 Date: 28/10/2024
*
******************************************************************************/

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const databaseConfig = require('./config/database');
const Movies = require('./models/movies_data');
const app = express();
const port = process.env.PORT || 8000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars engine configuration
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

// Connect to MongoDB
mongoose.connect(databaseConfig.url)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Custom file storage settings for multer
const storageOptions = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// File filter to ensure only JPG files are uploaded
const fileFilter = (req, file, cb) => {
  const isJpg = file.mimetype === 'image/jpeg';
  if (isJpg) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg files are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({ storage: storageOptions, fileFilter });

// API Route to fetch all movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movies.find();
    if (movies.length) {
      const result = movies.map((movie) => ({
        _id: movie._id,
        Movie_ID: movie.Movie_ID,
        Title: movie.Title,
        Year: movie.Year,
        Rated: movie.Rated,
        Released: movie.Released,
        Runtime: movie.Runtime,
        Genre: movie.Genre,
        Director: movie.Director,
        Writer: movie.Writer,
        Actors: movie.Actors,
        Plot: movie.Plot,
        Language: movie.Language,
        Country: movie.Country,
        Awards: movie.Awards,
        Poster: movie.Poster,
        Rating: movie.Rating,
        Metascore: movie.Metascore,
        imdbRating: movie.imdbRating,
        imdbVotes: movie.imdbVotes,
        imdbID: movie.imdbID,
        Type: movie.Type
      }));
      res.render('allData', { result });
    } else {
      res.status(404).render('error');
    }
  } catch (err) {
    res.status(500).send('Error fetching movies: ' + err.message);
  }
});

// API Route to fetch a single movie by its ID
app.get('/api/movies/:movie_id', async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movie_id);
    if (!movie) {
      return res.status(404).send("Movie not found");
    }
    res.json(movie);
  } catch (err) {
    res.status(500).send('Error fetching movie: ' + err.message);
  }
});

// API Route to render movie add form
app.get('/api/addmovie', (req, res) => {
  res.render('addMovieForm');
});

// Route to create a new movie with validation
app.post('/api/movie', upload.single('Poster'), [
  body('Movie_ID').isInt({ min: 1 }).withMessage('Movie_ID must be a positive integer'),
  body('Title').notEmpty().withMessage('Title is required'),
  body('Year').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Enter a valid year'),
  body('Rated').notEmpty().withMessage('Rated is required'),
  body('Released').isDate().withMessage('Released must be a valid date (YYYY-MM-DD)'),
  body('Runtime').notEmpty().withMessage('Runtime is required'),
  body('Genre').notEmpty().withMessage('Genre is required'),
  body('Director').notEmpty().withMessage('Director is required'),
  body('Writer').notEmpty().withMessage('Writer is required'),
  body('Actors').notEmpty().withMessage('Actors are required'),
  body('Plot').notEmpty().withMessage('Plot is required'),
  body('Language').notEmpty().withMessage('Language is required'),
  body('Country').notEmpty().withMessage('Country is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Poster image is required' });
  }

  try {
    const movieData = {
      ...req.body,
      Poster: `/images/${req.file.filename}` // Save file path in DB
    };
    const newMovie = await Movies.create(movieData);
    res.redirect('/api/movies');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to edit movie data
app.get('/api/editmovie/:movie_id', async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movie_id);
    if (!movie) {
      return res.status(404).send('Movie not found');
    }
    res.render('editMovieForm', { movieData: movie });
  } catch (err) {
    res.status(500).send('Error loading movie for editing: ' + err.message);
  }
});

// Update movie data
app.post('/api/movies/:movie_id', upload.single('Poster'), [
  body('Movie_ID').isInt({ min: 1 }).withMessage('Movie_ID must be a positive integer'),
  body('Title').notEmpty().withMessage('Title is required'),
  body('Year').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Enter a valid year'),
  body('Rated').notEmpty().withMessage('Rated is required'),
  body('Released').isDate().withMessage('Released must be a valid date (YYYY-MM-DD)'),
  body('Runtime').notEmpty().withMessage('Runtime is required'),
  body('Genre').notEmpty().withMessage('Genre is required'),
  body('Director').notEmpty().withMessage('Director is required'),
  body('Writer').notEmpty().withMessage('Writer is required'),
  body('Actors').notEmpty().withMessage('Actors are required'),
  body('Plot').notEmpty().withMessage('Plot is required'),
  body('Language').notEmpty().withMessage('Language is required'),
  body('Country').notEmpty().withMessage('Country is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let movieData = req.body;
  if (req.file) {
    movieData.Poster = `/images/${req.file.filename}`;
  }

  try {
    const updatedMovie = await Movies.findByIdAndUpdate(req.params.movie_id, movieData, { new: true });
    if (!updatedMovie) {
      return res.status(404).send('Movie not found');
    }
    res.redirect('/api/movies');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete movie by ID with SweetAlert confirmation
app.get('/api/deletemovie/:movie_id', async (req, res) => {
  try {
    const deletedMovie = await Movies.findByIdAndDelete(req.params.movie_id);
    if (!deletedMovie) {
      return res.status(404).send('Movie not found');
    }
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).send('Error deleting movie: ' + err.message);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
