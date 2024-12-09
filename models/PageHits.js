const mongoose = require('mongoose');

const pageHitSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  deviceType: { type: String, required: true },
  listingId: { type: String, required: true }, // Use String if IDs can be alphanumeric
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PageHits', pageHitSchema);
