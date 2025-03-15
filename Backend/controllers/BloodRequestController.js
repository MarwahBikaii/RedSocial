const BloodRequest = require('../models/BloodRequest');
const User = require('../models/userModel'); // Import User model




// Function to get the nearest hospital
const axios = require('axios');



// Function to get the nearest hospital using Overpass API
const getNearestHospital = async (lat, lng) => {
  try {
    const overpassQuery = `
      [out:json];
      node["amenity"="hospital"](around:5000, ${lat}, ${lng});
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "BloodDonationApp/1.0" }
    });

    const hospitals = response.data.elements;

    if (!hospitals.length) {
      console.warn("⚠️ No hospitals found in Overpass API.");
      return null;
    }

    const hospital = hospitals[0];

    // Fetch address separately using Reverse Geocoding if not available
    let address = hospital.tags["addr:full"] || hospital.tags["addr:street"] || null;
    if (!address) {
      address = await getHospitalAddress(hospital.lat, hospital.lon);
    }

    return {
      name: hospital.tags.name || "Unknown Hospital",
      address: address || "Address not available",
      contactNumber: hospital.tags.phone || hospital.tags["contact:phone"] || "Unknown"
    };
  } catch (error) {
    console.error("❌ Error fetching hospital from Overpass API:", error.message);
    return null;
  }
};

// Function to get the hospital address using Reverse Geocoding (Nominatim)
const getHospitalAddress = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "BloodDonationApp/1.0" }
    });

    return response.data.display_name || "Address not available";
  } catch (error) {
    console.error("❌ Error fetching hospital address:", error.message);
    return "Address not available";
  }
};



// Function to get hospital contact number from Overpass API
const getHospitalContact = async (lat, lng, hospitalName) => {
  try {
    const overpassQuery = `
      [out:json];
      node["amenity"="hospital"](around:5000, ${lat}, ${lng});
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "BloodDonationApp/1.0" }
    });

    const hospitals = response.data.elements;

    // ✅ Find the correct hospital contact info
    for (let hospital of hospitals) {
      if (hospital.tags.name && hospital.tags.name.includes(hospitalName)) {
        return hospital.tags.phone || hospital.tags["contact:phone"] || "Unknown";
      }
    }

    return "Unknown";
  } catch (error) {
    console.error("❌ Error fetching hospital contact from Overpass API:", error.message);
    return "Unknown";
  }
};

// Function to get hospital directly from Overpass API if Nominatim fails
const getHospitalFromOverpass = async (lat, lng) => {
  try {
    const overpassQuery = `
      [out:json];
      node["amenity"="hospital"](around:5000, ${lat}, ${lng});
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "BloodDonationApp/1.0" }
    });

    const hospitals = response.data.elements;

    if (hospitals.length > 0) {
      const hospital = hospitals[0];
      return {
        name: hospital.tags.name || "Unknown Hospital",
        address: hospital.tags["addr:full"] || "Address not available",
        contactNumber: hospital.tags.phone || hospital.tags["contact:phone"] || "Unknown"
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching hospital from Overpass API:", error.message);
    return null;
  }
};



(async () => {
  const hospital = await getNearestHospital(34.4389, 35.8482);
  console.log("Nearest Hospital:", hospital);
})();



// Controller for creating a Blood Request

const io= require("../utils/socket"); // Adjust path based on your project structure


exports.createBloodRequest = async (req, res) => {
  console.log("📝 Request Body:", req.body);

  try {
    const {
      bloodType,
      location,
      urgencyLevel,
      requestedBy,
      expirationDate,
      additionalNotes,
      contactInfo,
      bloodUnits,
      urgencyDescription,
      tags,
      hospital
    } = req.body;

    // 🛑 Validate urgencyLevel
    const validUrgencyLevels = ["high", "medium", "low"];
    if (!validUrgencyLevels.includes(urgencyLevel)) {
      return res.status(400).json({ message: "Invalid urgencyLevel. Must be 'high', 'medium', or 'low'." });
    }

    // 🛑 Validate location
    if (!location?.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ message: "Invalid location. Must include 'coordinates' as [lng, lat]." });
    }

    // 🛑 Validate bloodType
    if (!bloodType || typeof bloodType !== "string") {
      return res.status(400).json({ message: "Invalid bloodType. Must be a string." });
    }

    //  Ensure the requestedBy user exists
    const user = await User.findById(requestedBy);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.role.includes("user")) {
      return res.status(403).json({ message: "Unauthorized to create requests." });
    }

    // If hospital is not provided, assign the nearest hospital
    let assignedHospital = hospital;
    if (!hospital) {
      const [lng, lat] = location.coordinates;
      assignedHospital = await getNearestHospital(lat, lng);
      console.log("🏥 Assigned Hospital:", assignedHospital);
    }

    // 🚨 **Mandatory Hospital Check**
if (!assignedHospital) {
  return res.status(400).json({ 
    message: "No nearby hospital found. Please enter a hospital manually." 
  });
}

// 🚨 **Mandatory Hospital Check**
if (!assignedHospital) {
  return res.status(400).json({ 
    message: "No nearby hospital found. Please enter a hospital manually." 
  });
}
    // ✅ Create the blood request
    const newRequest = new BloodRequest({
      bloodType,
      location,
      urgencyLevel,
      requestedBy,
      expirationDate,
      additionalNotes,
      contactInfo,
      bloodUnits,
      urgencyDescription,
      tags,
      hospital: assignedHospital ? { ...assignedHospital } : null,
    });

    // 📌 Save the blood request
    await newRequest.save();

    // 🔍 **Find nearby existing blood requests of the same blood type**
    const nearbyRequests = await BloodRequest.find({
      bloodType: bloodType,
      status: "pending", // Only notify about active requests
      "location.coordinates": {
        $near: {
          $geometry: { type: "Point", coordinates: location.coordinates },
          $maxDistance: 10000 // 10km radius
        }
      }
    });

    console.log("📢 Found", nearbyRequests.length, "nearby blood requests.");

    // 🔔 **Notify users who created these nearby requests**
    const notifiedUsers = new Set(); // Avoid duplicate notifications

    nearbyRequests.forEach(request => {

          const recipientId = request.requestedBy.toString(); // ✅ Define recipientId

          
      if (!notifiedUsers.has(request.requestedBy.toString())) {
        notifiedUsers.add(request.requestedBy.toString());

        console.log(`🔔 Emitting notification to user: ${request.requestedBy}`);


            // 🔍 Log the notification in the backend before emitting
    console.log("📢 Preparing to send notification:");
    console.log({
      recipientId,
      message: "A new blood request has been posted near your request!",
      newRequest: newRequest,
      nearbyRequest: request
    });


        // Emit a real-time notification via Socket.io
        io.getIO(request.requestedBy.toString()).emit("nearbyBloodRequest", {
          message: "A new blood request has been posted near your request!",
          newRequest: newRequest,
          nearbyRequest: request
        });
      }
    });

    // ✅ Respond with success
    res.status(201).json({ message: "Blood request created successfully!", data: newRequest });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllBloodRequests = async (req, res) => {
  try {
    const { bloodType, location, urgencyLevel, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (bloodType) filter.bloodType = bloodType;
    if (location) filter['location.city'] = location;
    if (urgencyLevel) filter.urgencyLevel = urgencyLevel;

    const skip = (page - 1) * limit;
    
    const requests = await BloodRequest.find(filter)
      .select('bloodType unitsRequired location urgencyLevel status requestedBy createdAt')
      .populate('requestedBy', 'firstName lastName phone role')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BloodRequest.countDocuments(filter);

    res.status(200).json({
      message: "Blood requests retrieved successfully",
      data: requests,
      pagination: {
        totalRequests: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getBloodRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await BloodRequest.findById(id).select(
      'bloodType unitsRequired location urgencyLevel status requestedBy createdAt'
    ).populate('requestedBy', 'firstName lastName phone role');

    if (!request) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    res.status(200).json({ message: "Blood request retrieved", data: request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


const findNearbyRequests = require("../utils/geolocation");


exports.searchNearBloodRequests = async (lat, lng, radius) => {
  try {
    if (!lat || !lng) throw new Error("Latitude and longitude are required.");

    console.log("Searching for requests near:", lat, lng, "within radius:", radius);

    const requests = await BloodRequest.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    });

    console.log("Found requests:", requests);
    return requests;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
};


