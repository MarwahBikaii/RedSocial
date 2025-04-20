const BloodRequest = require('../models/BloodRequest');
const User = require('../models/userModel'); // Import User model



const { getIO } = require("../utils/socket"); // Adjust the path as needed

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
    let address = hospital.tags["addr:full"] || hospital.tags["addr:street"] || "Not Provided";
    if (!address) {
      address = await getHospitalAddress(hospital.lat, hospital.lon);
    }

    return {
      name: hospital.tags.name || "Not Provided",
      address: address || "Address not available",
      contactNumber: hospital.tags.phone || hospital.tags["contact:phone"] || "Not Provided"
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

    // Get the Socket.io instance
    const io = getIO();

    // 🔔 **Notify users who created these nearby requests**
    const notifiedUsers = new Set(); // Avoid duplicate notifications

    nearbyRequests.forEach(request => {
      const recipientId = request.requestedBy.toString();

      if (!notifiedUsers.has(recipientId)) {
        notifiedUsers.add(recipientId);

        console.log(`🔔 Emitting notification to user: ${recipientId}`);

        // 🔍 Log the notification in the backend before emitting
        console.log("📢 Preparing to send notification:", {
          recipientId,
          message: "A new blood request has been posted near your request!",
          newRequest,
          nearbyRequest: request
        });

        // ✅ **Corrected socket emission**
        io.to(recipientId).emit("nearbyBloodRequest", {
          message: "A new blood request has been posted near your request!",
          newRequest,
          nearbyRequest: request
        });
      }
    });

    // ✅ Emit event for all connected users about the new blood request
    io.emit("newBloodRequest", newRequest);

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
    
    let matchStage = {};
    if (bloodType) matchStage.bloodType = bloodType;
    if (location) matchStage['location.city'] = location;
    if (urgencyLevel) matchStage.urgencyLevel = urgencyLevel;

    const now = new Date();

    const requests = await BloodRequest.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          urgencyWeight: { 
            $switch: { 
              branches: [
                { case: { $eq: ["$urgencyLevel", "high"] }, then: 3 },
                { case: { $eq: ["$urgencyLevel", "medium"] }, then: 2 },
                { case: { $eq: ["$urgencyLevel", "low"] }, then: 1 },
              ],
              default: 1 
            }
          },
          timeLeftWeight: {
            $cond: {   
              if: { $gt: ["$expirationDate", now] },
              then: { $subtract: ["$expirationDate", now] },
              else: 0
            }
          },
          recentUpdateWeight: {
            $cond: {   
              if: { $gt: ["$updatedAt", new Date(now - 6 * 60 * 60 * 1000)] },
              then: 20,
              else: 0
            }
          }
        }
      },
      {
        $addFields: {   
          priorityScore: {
            $add: [
              { $multiply: ["$urgencyWeight", 10] },
              { $divide: ["$timeLeftWeight", 1000000000] },
              "$recentUpdateWeight"
            ]
          }
        }
      },
      { $sort: { priorityScore: -1 } },  
      { $skip: (page - 1) * limit },    
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "requestedByDetails"
        }
      },
      { $unwind: "$requestedByDetails" },
      { 
        $project: {
          _id: 1, 
          bloodType: 1, 
          urgencyLevel: 1, 
          status: 1, 
          expirationDate: 1, 
          location: 1, 
          createdAt: 1, 
          priorityScore: 1,
          hospital: 1,  // Add this line to include hospital data
          "requestedByDetails._id": 1,
          "requestedByDetails.firstName": 1,
          "requestedByDetails.lastName": 1,
          "requestedByDetails.phone": 1,
          "requestedByDetails.email": 1,
        }
      }
    ]);

    const total = await BloodRequest.countDocuments(matchStage); // Use countDocuments with the same match stage

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
    console.error("❌ Error fetching blood requests:", error);
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

    console.log("Searching near:", { lat, lng, radius }); // Log cleanly

    const requests = await BloodRequest.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // Mongo uses [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    });

    return requests;
  } catch (error) {
    console.error("Search error:", error.message);
    throw error; // Let the route handler manage the HTTP response
  }
};



const iofunction = require("../utils/socket").getIO(); // Import socket instance


exports.updateBloodRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const updateData = req.body; // Get all sent fields

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data provided for update." });
    }

    console.log("🔍 Update Data Received:", updateData);

    // ✅ Use findOneAndUpdate with dynamic fields
    const updatedRequest = await BloodRequest.findOneAndUpdate(
      { _id: requestId },
      { $set: updateData },  // ✅ Only update sent fields
      { new: true, runValidators: true } // ✅ Returns updated doc & validates
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Blood request not found." });
    }

    console.log("🟢 After Update in DB:", updatedRequest);

    // Emit real-time update event
    const io = getIO();
    io.emit("bloodRequestUpdated", updatedRequest);

    return res.status(200).json({ message: "Blood request updated successfully!", data: updatedRequest });

  } catch (error) {
    console.error("❌ Error updating blood request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const { isBloodTypeCompatible,getCompatibleTypes } = require('../utils/bloodCompatibility');

exports.assignDonorToRequest = async (req, res) => {
  const { requestId, donorId } = req.body;

  console.log('[DEBUG] Assigning donor:', { requestId, donorId });

  try {
    // 1. Fetch request and donor with error handling
    const [request, donor] = await Promise.all([
      BloodRequest.findById(requestId),
      User.findById(donorId)
    ]);

    if (!request || !donor) {
      console.error('[ERROR] Missing records:', {
        requestExists: !!request,
        donorExists: !!donor
      });
      return res.status(404).json({ 
        error: "Request or donor not found.",
        details: !request ? "Request not found" : "Donor not found"
      });
    }

    // 2. Initialize assignedDonors if undefined
    if (!request.assignedDonors) {
      request.assignedDonors = [];
      console.log('[DEBUG] Initialized assignedDonors array');
    }

    // 3. Check blood compatibility
    const isCompatible = isBloodTypeCompatible(donor.bloodType, request.bloodType);
    console.log('[DEBUG] Compatibility check:', {
      donor: donor.bloodType,
      recipient: request.bloodType,
      compatible: isCompatible
    });

    if (!isCompatible) {
      const compatibleTypes = getCompatibleTypes(request.bloodType);
      return res.status(400).json({
        error: "Blood type incompatibility",
        details: `Donor (${donor.bloodType}) cannot donate to (${request.bloodType})`,
        compatibleTypes,
        solution: compatibleTypes.length 
          ? `Needed types: ${compatibleTypes.join(', ')}`
          : 'No compatible types available'
      });
    }

    // 4. Check existing assignments using safe array methods
    const isAlreadyAssigned = request.assignedDonors.some(id => id.equals(donorId));
    console.log('[DEBUG] Assignment check:', {
      existingAssignments: request.assignedDonors.length,
      isAlreadyAssigned
    });

    if (isAlreadyAssigned) {
      return res.status(400).json({
        error: "Duplicate assignment",
        details: "This donor is already assigned",
        solution: "Check your active donations"
      });
    }

    // 5. Process assignment
    request.assignedDonors.push(donorId);
    await request.save();

    console.log('[SUCCESS] Assignment completed:', {
      requestId: request._id,
      donorId: donor._id,
      assignedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Donor successfully assigned",
      request: {
        id: request._id,
        bloodType: request.bloodType,
        assignedDonors: request.assignedDonors.length
      },
      donor: {
        id: donor._id,
        bloodType: donor.bloodType
      }
    });

  } catch (error) {
    console.error('[FATAL] Assignment failed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });

    return res.status(500).json({
      error: "Assignment processing failed",
      details: error.message,
      recovery: "Please try again later"
    });
  }
};
exports.deleteBloodRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the blood request by ID
    const bloodRequest = await BloodRequest.findById(requestId);

    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    // Delete the request
    await bloodRequest.deleteOne();

    // Emit real-time update (if using socket.io)
    const io = getIO();
    io.emit("bloodRequestDeleted", { requestId });

    res.status(200).json({ message: "Blood request deleted successfully!" });

  } catch (error) {
    console.error("❌ Error deleting blood request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.getMyRequests = async (req, res) => {
  try {
    const userId = Object.keys(req.query)[0];
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const requests = await BloodRequest.find({
      $or: [{ requestedBy: userId }, { requestedFor: userId }],
    }).populate('requestedBy', 'name email'); // Only populate requestedBy

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error in getMyRequests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};