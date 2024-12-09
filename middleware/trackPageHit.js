const UserAgent = require('useragent'); // For device parsing
const mongoose = require('mongoose'); // For ObjectId validation
const PageHits = require('../models/PageHits'); // Import the PageHits model

module.exports = async function trackPageHit(req, res, next) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceType = UserAgent.parse(req.headers['user-agent']).device.toString();
    const listingId = req.params.listing_id || req.body.listing_id;

let objectId = null;
if (mongoose.Types.ObjectId.isValid(listingId)) {
  objectId = new mongoose.Types.ObjectId(listingId);
} 

const today = new Date();
today.setHours(0, 0, 0, 0); // Start of the day
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1); // Start of the next day

// Check for an existing entry
const existingHit = await PageHits.findOne({
  ip,
  listingId,
  createdAt: { $gte: today, $lt: tomorrow }, // Today's entries only
});

if (!existingHit) {
  

const pageHit = new PageHits({
  ip,
  deviceType,
  listingObjectId: objectId,
  listingId: listingId.toString(),
});




    await pageHit.save();
    
 
}
    // Proceed to the next middleware
    next();
  } catch (err) {
    
    res.status(500).send('Error tracking page hit.');
  }
};
