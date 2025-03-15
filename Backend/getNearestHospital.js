const axios = require('axios');

const getNearestHospital = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=hospital+near+${lat},${lng}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "BloodDonationApp/1.0" } // Required by OpenStreetMap
    });

    const hospitals = response.data;

    if (hospitals.length > 0) {
      return {
        name: hospitals[0].display_name,
        address: hospitals[0].display_name,
        contactNumber: "N/A" // OSM doesn't provide phone numbers
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching nearest hospital:", error.message);
    return null;
  }
};
