const ListingsModel = require('../models/listings');

exports.getListings = async (req, res) => {
  try {
    const listingData = await ListingsModel.find().limit(10);
    if (listingData.length) {
      res.render('user/listings', { result: listingData });
    } else {
      res.status(404).render('error', { message: 'No listings found' });
    }
  } catch (err) {
    res.status(500).send('Error fetching listings: ' + err.message);
  }
};
