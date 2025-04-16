import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, provider } from "../../Firebase"; 
import { signInWithPopup } from "firebase/auth";
import validator from 'validator';
import { FiMapPin, FiNavigation, FiCheckCircle } from 'react-icons/fi';

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
    role: ['user'],
    bloodType: '',
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    location: {
      type: "Point",
      coordinates: [0, 0],
      address: '',
      city: '',
      country: ''
    }
  });
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    toast.info("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get address details
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          
          const { address } = response.data;
          setFormData(prev => ({
            ...prev,
            location: {
              type: "Point",
              coordinates: [
                position.coords.longitude,
                position.coords.latitude
              ],
              address: address?.road || '',
              city: address?.city || address?.town || address?.village || '',
              country: address?.country || ''
            }
          }));
          
          setLocationGranted(true);
          toast.success("Location obtained successfully!");
        } catch (error) {
          console.error("Geocoding error:", error);
          // Fallback to just coordinates if geocoding fails
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              type: "Point",
              coordinates: [
                position.coords.longitude,
                position.coords.latitude
              ]
            }
          }));
          toast.success("Location obtained, but address details couldn't be fetched");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("The request to get user location timed out.");
            break;
          default:
            toast.error("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } 
    // Handle location fields
    else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      role: [value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Client-side validation
    if (!validator.isEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    // Prepare submission data
    const submissionData = {
      ...formData,
      // Only include location if enabled and coordinates are set
      location: locationEnabled && formData.location.coordinates[0] !== 0 ? 
        formData.location : 
        undefined
    };

    try {
      const response = await axios.post('http://localhost:3000/api/users/signup', submissionData);
      toast.success("Registration successful!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

    const signInWithGoogle = async (e) => {
    e.preventDefault();
    setLoading(true);    
    try {
      const result = await signInWithPopup(auth, provider);
      await axios.post("http://localhost:3000/api/users/google-login", {
        googleId: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
        role: ['user'] // Default role for Google signups
      });
      toast.success("Google registration successful!");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast.error(error.response?.status === 400 ? 
                 "User already registered" : 
                 "Google Sign-In Error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-r from-[#0097b2]/10 to-[#ff3131]/10 p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg flex flex-col md:flex-row">
        {/* Left Side - Branding */}
        <div className="md:w-2/5 bg-gradient-to-br from-[#0097b2] to-[#007a91] text-white p-6 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-5xl font-bold mb-3">Join RedSocial</h1>
            <p className="text-lg">Connect with blood donors and save lives</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <FiNavigation className="w-5 h-5" />
              </div>
              <span className="text-md">Find donors near your location</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <span className="text-md">Verified blood donations</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-3/5 p-6">
          <h2 className="text-2xl font-bold text-[#0097b2] mb-4">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name*</label>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email*</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username*</label>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password*</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength="8"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm*</label>
                <input
                  name="passwordConfirm"
                  type="password"
                  required
                  minLength="8"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role*</label>
              <select
                name="role"
                value={formData.role[0] || 'user'}
                onChange={handleRoleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                required
              >
                <option value="user">Donor/Recipient</option>
                <option value="hospital">Hospital</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Blood Type (for users only) */}
            {(formData.role.includes('user') || formData.role[0] === 'user') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Blood Type*</label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  required={formData.role.includes('user') || formData.role[0] === 'user'}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            )}

            {/* Phone (for users and hospitals) */}
            {(formData.role.includes('user') || 
              formData.role.includes('hospital') || 
              formData.role[0] === 'user' || 
              formData.role[0] === 'hospital') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone*</label>
                <input
                  name="phone"
                  type="tel"
                  required={
                    formData.role.includes('user') || 
                    formData.role.includes('hospital') ||
                    formData.role[0] === 'user' || 
                    formData.role[0] === 'hospital'
                  }
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                />
              </div>
            )}

            {/* Emergency Contact (for users only) */}
            {(formData.role.includes('user') || formData.role[0] === 'user') && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      name="emergencyContact.name"
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      name="emergencyContact.phone"
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    name="emergencyContact.relationship"
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                  />
                </div>
              </div>
            )}

            {/* Location Services */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiMapPin className="mr-1" /> Location Services
              </h3>
              
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="enableLocation"
                  checked={locationEnabled}
                  onChange={(e) => {
                    setLocationEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setLocationGranted(false);
                      setFormData(prev => ({
                        ...prev,
                        location: {
                          type: "Point",
                          coordinates: [0, 0],
                          address: '',
                          city: '',
                          country: ''
                        }
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="enableLocation" className="text-sm text-gray-700">
                  Enable location services (recommended for donors)
                </label>
              </div>

              {locationEnabled && (
                <>
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className={`flex items-center text-sm text-[#0097b2] hover:underline ${locationLoading ? 'opacity-70' : ''}`}
                    >
                      {locationLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0097b2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Getting location...
                        </>
                      ) : (
                        <>
                          <FiNavigation className="mr-1" />
                          {locationGranted ? 'Update my current location' : 'Get my current location'}
                        </>
                      )}
                    </button>
                  </div>

                  {locationGranted && (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Address*</label>
                        <input
                          name="location.address"
                          type="text"
                          required
                          value={formData.location.address}
                          onChange={handleChange}
                          placeholder="Street address"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">City*</label>
                          <input
                            name="location.city"
                            type="text"
                            required
                            value={formData.location.city}
                            onChange={handleChange}
                            placeholder="City"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Country*</label>
                          <input
                            name="location.country"
                            type="text"
                            required
                            value={formData.location.country}
                            onChange={handleChange}
                            placeholder="Country"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0097b2]"
                          />
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        <p>Coordinates: {formData.location.coordinates[1].toFixed(6)}, {formData.location.coordinates[0].toFixed(6)}</p>
                        <p className="mt-1">Your location helps connect you with nearby blood donation opportunities.</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 mt-2 bg-[#0097b2] hover:bg-[#007a91] text-white text-sm font-medium rounded transition-all ${loading ? 'opacity-80' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-xs text-gray-500">or</span>
            </div>
          </div>

          {/* Google Signup */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-all"
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google logo" 
              className="w-4 h-4"
            />
            Sign up with Google
          </button>

          {/* Login Link */}
          <div className="mt-4 text-center text-xs">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0097b2] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default SignUp;