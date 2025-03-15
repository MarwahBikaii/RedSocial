const BloodRequest = require("../models/BloodRequest");

const findNearbyRequests = async (lat, lng, radius) => {
  try {
    if (!lat || !lng) throw new Error("Latitude and longitude are required.");

    const requests = await BloodRequest.find({
      location: {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius / 6378.1] // Convert km to radians
        }
      }
    });

    return requests;
  } catch (error) {
    throw error;
  }
};

module.exports = findNearbyRequests;
