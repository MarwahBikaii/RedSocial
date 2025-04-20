import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiDroplet, FiMapPin, FiClock, FiUser, FiInfo, FiPhone, FiTag, FiPlusCircle, FiChevronDown, FiCalendar } from 'react-icons/fi';
import { FaHospital, FaExclamationTriangle, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const MySwal = withReactContent(Swal);

const RequestForm = () => {
  const { register, handleSubmit, watch, formState: { errors }, setValue, reset, control } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [expirationDate, setExpirationDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 7 days from now
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');

    const storedUser = JSON.parse(localStorage.getItem("userInfo"));
 const userId = storedUser?.data?.user._id; // Extract user ID safely

    if (!token || !userId) {
      MySwal.fire({
        title: 'Login Required',
        text: 'You need to login to create a blood request',
        icon: 'warning',
        confirmButtonColor: '#00CCCC',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Go to Login'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        } else {
          navigate('/');
        }
      });
    } else {
      setValue('requestedBy', userId);
    }
  }, [navigate]);

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      setLocationLoading(true);
      try {
        if (navigator.geolocation) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserLocation(coords);
          setValue('location.coordinates', [coords.lng, coords.lat]);
          setValue('location.type', 'Point');
          await fetchNearbyHospitals(coords.lat, coords.lng);
          
          // Get readable address
          const address = await getReadableAddress(coords.lat, coords.lng);
          setValue('location.address', address);
        }
      } catch (err) {
        console.error("Error getting location:", err);
        MySwal.fire({
          title: 'Location Error',
          text: 'Could not get your location. Please enable location services.',
          icon: 'error',
          confirmButtonColor: '#00CCCC'
        });
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, []);

  // Validate coordinates
  const validateCoordinates = (coordinates) => {
    return (
      coordinates.length === 2 &&
      !isNaN(coordinates[0]) &&
      !isNaN(coordinates[1]) &&
      coordinates[0] >= -180 && coordinates[0] <= 180 &&
      coordinates[1] >= -90 && coordinates[1] <= 90
    );
  };

  // Get readable address from coordinates
const getReadableAddress = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    return response.data.display_name || "Your current location";
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Your current location";
  }
};

  // Enhanced hospital data validation
  const hasCompleteHospitalInfo = (hospital) => {
    return (
      hospital.tags?.name &&
      (hospital.tags?.["addr:full"] || hospital.tags?.["addr:street"]) &&
      (hospital.tags?.phone || hospital.tags?.["contact:phone"])
    );
  };

  // Fetch nearby hospitals with complete information
  const fetchNearbyHospitals = async (lat, lng) => {
  try {
    const overpassQuery = `
      [out:json];
      node["amenity"="hospital"](around:5000, ${lat}, ${lng});
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    const response = await axios.get(url);
    
    const hospitalsWithCompleteInfo = response.data.elements
      .filter(hasCompleteHospitalInfo)
      .slice(0, 3)
      .map(hospital => ({
        id: hospital.id,
        name: hospital.tags.name,
        address: hospital.tags["addr:full"] || hospital.tags["addr:street"],
        contact: hospital.tags.phone || hospital.tags["contact:phone"],
        distance: calculateDistance(lat, lng, hospital.lat, hospital.lon),
        coordinates: [hospital.lon, hospital.lat]
      }));

    setNearbyHospitals(hospitalsWithCompleteInfo);
    
    if (hospitalsWithCompleteInfo.length > 0) {
      setSelectedHospital(hospitalsWithCompleteInfo[0]);
      setHospitalFormValues(hospitalsWithCompleteInfo[0]);
    } 
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    MySwal.fire({
      title: 'Hospital Data Error',
      text: 'Could not fetch nearby hospitals. Please select manually.',
      icon: 'error',
      confirmButtonColor: '#00CCCC'
    });
  }
};

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1); // Distance in km
  };

  // Set hospital values in form
  const setHospitalFormValues = (hospital) => {
    setValue('hospital', {
      name: hospital.name,
      address: hospital.address,
      contactNumber: hospital.contact
    });
  };

  // Handle adding tags
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle form submission with all required fields
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    // Validate coordinates
    if (!validateCoordinates(data.location.coordinates)) {
      MySwal.fire({
        title: 'Invalid Location',
        text: 'The provided coordinates are not valid. Please enable location services.',
        icon: 'error',
        confirmButtonColor: '#00CCCC'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare the complete request data according to your model
  

       const storedUser = JSON.parse(localStorage.getItem("userInfo"));
 const userId = storedUser?.data?.user._id; // Extract user ID safely
      
      
      const requestData = {
        requestedBy:userId,
        bloodType: data.bloodType,
        location: {
          type: 'Point',
          coordinates: data.location.coordinates,
          address: data.location.address
        },
        urgencyLevel: data.urgencyLevel,
        status: 'pending', // Default status
        expirationDate: expirationDate,
        additionalNotes: data.additionalNotes || undefined,
        contactInfo: {
          phone: data.contactInfo.includes('@') ? undefined : data.contactInfo,
          email: data.contactInfo.includes('@') ? data.contactInfo : undefined
        },
        bloodUnits: Number(data.bloodUnits),
        urgencyDescription: data.urgencyDescription,
        tags: tags.length > 0 ? tags : undefined,
        hospital: data.hospital,
        statusUpdateHistory: [{
          status: 'pending',
          updatedAt: new Date()
        }]
      };

      console.log(requestData)

      const response = await axios.post('http://localhost:3000/api/Requests/create', requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Show success message
      MySwal.fire({
        title: 'Request Created!',
        text: 'Your blood request has been submitted successfully',
        icon: 'success',
        confirmButtonColor: '#00CCCC',
        willClose: () => {
          reset();
          setTags([]);
          setExpirationDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        }
      });
    } catch (err) {
      // Show error message
      MySwal.fire({
        title: 'Request Failed',
        text: err.response?.data?.message || "Failed to create blood request",
        icon: 'error',
        confirmButtonColor: '#00CCCC'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get urgency color
  const getUrgencyColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 border-red-400 text-red-800';
      case 'medium': return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'low': return 'bg-green-100 border-green-400 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00CCCC]/10 to-white py-8 px-4">
      <motion.div 
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-[#00CCCC]/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00CCCC] to-[#008080] p-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <FiDroplet className="w-8 h-8" />
              Create Blood Request
            </h1>
            <p className="mt-2 opacity-90">Help save lives by requesting blood donations</p>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
          {/* Hidden requestedBy field */}
          <input type="hidden" {...register("requestedBy")} />

          {/* Blood Type */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiDroplet className="text-[#00CCCC]" /> Blood Type Required *
            </label>
            <select
              {...register("bloodType", { required: "Blood type is required" })}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC] text-gray-700 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tZG93biI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            {errors.bloodType && (
              <motion.p 
                className="mt-2 text-red-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.bloodType.message}
              </motion.p>
            )}
          </motion.div>

          {/* Location */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-[#00CCCC]" /> Your Location
            </label>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <FiMapPin className="text-gray-500 flex-shrink-0" />
              {locationLoading ? (
                <div className="h-4 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
              ) : (
                <span className="text-gray-700">{watch('location.address') || "Location not available"}</span>
              )}
            </div>
            <input type="hidden" {...register("location.address")} />
            <input type="hidden" {...register("location.coordinates")} />
            <input type="hidden" {...register("location.type")} />
          </motion.div>

          {/* Recommended Hospitals */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FaHospital className="text-[#00CCCC]" /> Recommended Hospitals Near You
            </label>
            
            {nearbyHospitals.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-left flex justify-between items-center hover:border-gray-300 transition-colors"
                  onClick={() => setShowHospitalDropdown(!showHospitalDropdown)}
                >
                  <div>
                    <span className="font-medium block">{selectedHospital.name}</span>
                    <span className="text-sm text-gray-600">{selectedHospital.address}</span>
                  </div>
                  <FiChevronDown className={`transition-transform ${showHospitalDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showHospitalDropdown && (
                    <motion.div
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      {nearbyHospitals.map((hospital) => (
                        <motion.div
                          key={hospital.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedHospital?.id === hospital.id ? 'bg-[#00CCCC]/10' : ''}`}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setSelectedHospital(hospital);
                            setHospitalFormValues(hospital);
                            setShowHospitalDropdown(false);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{hospital.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{hospital.address}</p>
                              <div className="flex items-center gap-2 mt-2 text-sm">
                                <FaPhone className="text-gray-400" size={12} />
                                <span className="text-gray-600">{hospital.contact}</span>
                              </div>
                            </div>
                            <span className="text-xs bg-[#00CCCC]/10 text-[#008080] px-2 py-1 rounded-full">
                              {hospital.distance} km
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                No nearby hospitals with complete information found. Please enter hospital details manually.
              </div>
            )}

            {/* Manual Hospital Input */}
            <motion.div 
              className="mt-4 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div>
                <label className="block text-gray-700 font-medium mb-2">Hospital Name *</label>
                <input
                  type="text"
                  placeholder="Enter hospital name"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC]"
                  {...register("hospital.name", { required: "Hospital name is required" })}
                />
                {errors.hospital?.name && (
                  <p className="mt-2 text-red-600 text-sm">{errors.hospital.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Hospital Address *</label>
                <input
                  type="text"
                  placeholder="Enter hospital address"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC]"
                  {...register("hospital.address", { required: "Hospital address is required" })}
                />
                {errors.hospital?.address && (
                  <p className="mt-2 text-red-600 text-sm">{errors.hospital.address.message}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Number *</label>
                <input
                  type="text"
                  placeholder="Hospital phone number"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC]"
                  {...register("hospital.contactNumber", { required: "Hospital contact is required" })}
                />
                {errors.hospital?.contactNumber && (
                  <p className="mt-2 text-red-600 text-sm">{errors.hospital.contactNumber.message}</p>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Urgency Level */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FaExclamationTriangle className="text-[#00CCCC]" /> Urgency Level *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { level: 'high', label: 'High', icon: <FaExclamationTriangle /> },
                { level: 'medium', label: 'Medium', icon: <FiClock /> },
                { level: 'low', label: 'Low', icon: <FiInfo /> }
              ].map((item) => (
                <motion.div 
                  key={item.level}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="radio"
                    id={`urgency-${item.level}`}
                    value={item.level}
                    className="hidden peer"
                    {...register("urgencyLevel", { required: "Urgency level is required" })}
                  />
                  <label
                    htmlFor={`urgency-${item.level}`}
                    className={`block p-4 border rounded-xl text-center cursor-pointer transition-all peer-checked:${getUrgencyColor(item.level)} ${errors.urgencyLevel ? 'border-red-300' : 'border-gray-200'} flex flex-col items-center gap-2`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </label>
                </motion.div>
              ))}
            </div>
            {errors.urgencyLevel && (
              <motion.p 
                className="mt-2 text-red-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.urgencyLevel.message}
              </motion.p>
            )}
          </motion.div>

          {/* Expiration Date */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiCalendar className="text-[#00CCCC]" /> Expiration Date *
            </label>
            <DatePicker
              selected={expirationDate}
              onChange={(date) => setExpirationDate(date)}
              minDate={new Date()}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC]"
              placeholderText="Select expiration date"
            />
          </motion.div>

          {/* Blood Units Needed */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiPlusCircle className="text-[#00CCCC]" /> Blood Units Needed *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="How many units do you need?"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC] appearance-none"
                {...register("bloodUnits", { 
                  required: "Number of units is required",
                  min: { value: 1, message: "At least 1 unit is required" }
                })}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">units</span>
            </div>
            {errors.bloodUnits && (
              <motion.p 
                className="mt-2 text-red-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.bloodUnits.message}
              </motion.p>
            )}
          </motion.div>

          {/* Urgency Description */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiInfo className="text-[#00CCCC]" /> Urgency Description *
            </label>
            <select
              {...register("urgencyDescription", { required: "Urgency description is required" })}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC] text-gray-700"
            >
              <option value="">Select urgency description</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.urgencyDescription && (
              <motion.p 
                className="mt-2 text-red-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.urgencyDescription.message}
              </motion.p>
            )}
          </motion.div>

          {/* Additional Notes */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiInfo className="text-[#00CCCC]" /> Additional Notes
            </label>
            <textarea
              placeholder="Any special requirements or additional information"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC] min-h-[120px]"
              {...register("additionalNotes")}
            />
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiPhone className="text-[#00CCCC]" /> Contact Information *
            </label>
            <input
              type="text"
              placeholder="Phone number or email where you can be reached"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC]"
              {...register("contactInfo", { required: "Contact information is required" })}
            />
            {errors.contactInfo && (
              <motion.p 
                className="mt-2 text-red-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.contactInfo.message}
              </motion.p>
            )}
          </motion.div>

          {/* Tags */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <label className="block text-gray-700 font-medium mb-3 flex items-center gap-2">
              <FiTag className="text-[#00CCCC]" /> Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag (e.g., emergency, rare-type)"
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CCCC] focus:border-[#00CCCC]"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-[#00CCCC] text-white px-4 rounded-xl hover:bg-[#008080] transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#00CCCC]/10 text-[#008080] px-3 py-1 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#008080] hover:text-[#006666]"
                  >
                    &times;
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00CCCC] to-[#008080] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FiPlusCircle className="w-5 h-5" />
                  Create Blood Request
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default RequestForm;