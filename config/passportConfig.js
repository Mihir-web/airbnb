const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Define the local strategy
passport.use(new LocalStrategy(
  function(email, password, done) {
    // Replace this with your user lookup logic (e.g., query your database)
    // Here is a simple example assuming you have a User model
    User.findOne({ email: email }, function (err, user) {
       
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Incorrect username.' }); }
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// Serialize user
passport.serializeUser(function(user, done) {
  done(null, user.id);  // Store the user id in the session
});

// Deserialize user
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);  // Retrieve user from the session by the id
  });
});
