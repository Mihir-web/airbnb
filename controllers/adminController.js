const ListingsModel = require('../models/listings');

exports.getListings = async (req, res) => {
  try {
    const listingData = await ListingsModel.find().limit(10);
    if (listingData.length) {
      res.render('admin/listings', { result: listingData });
    } else {
      res.status(404).render('error', { message: 'No listings found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
};

exports.getListingById = async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const listingData = await ListingsModel.findById(listingId);
    if (listingData) {
      res.render('admin/listingDetail', { result: listingData });
    } else {
      res.status(404).render('error', { message: 'Listing not found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listing: ' + err.message);
  }
};
