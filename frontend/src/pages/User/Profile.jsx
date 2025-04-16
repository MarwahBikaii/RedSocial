import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiEdit, FiSave, FiLock, FiPhone, 
  FiUser, FiMail, FiDroplet, FiClock, FiAlertTriangle, 
  FiUpload, FiX, FiToggleLeft, FiToggleRight 
} from 'react-icons/fi';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo"));
  const userId = storedUser?.data?.user._id;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bloodType: '',
    profilePicture: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    availability: false,
    oldPassword: '',
    newPassword: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // Add this useEffect to sync formData when profile changes
useEffect(() => {
  if (profile) {
    setFormData(prev => ({
      ...prev,
      availability: profile.availability || false
    }));
  }
}, [profile]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/users/profile/${userId}`, 
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.data) {
          const userData = response.data.data;
          setProfile(userData);
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            bloodType: userData.bloodType || '',
            profilePicture: userData.profilePicture || '',
            emergencyContact: userData.emergencyContact || {
              name: '',
              phone: '',
              relationship: ''
            },
            availability: userData.availability || false,
            oldPassword: '',
            newPassword: ''
          });
          setPreviewImage(userData.profilePicture || '');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && token) {
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [userId, token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested emergency contact fields
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvailabilityToggle = () => {
    setFormData(prev => ({
      ...prev,
      availability: !prev.availability
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, profilePicture: URL.createObjectURL(file) }));
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

const handleSubmit = async (e) => { 
  e.preventDefault(); 
  setError(null);

  try {
    const response = await axios.put(
      'http://localhost:3000/api/users/updateProfile',
      { ...formData, userId },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.data) {
      // Update both profile and formData states
      setProfile(prev => ({
        ...prev,
        ...response.data.data,
        availability: formData.availability
      }));
      setFormData(prev => ({
        ...prev,
        availability: response.data.data.availability
      }));
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to update profile');
  }
};

  const bloodTypeColors = {
    'A+': 'bg-red-100 text-red-800',
    'A-': 'bg-red-50 text-red-600',
    'B+': 'bg-blue-100 text-blue-800',
    'B-': 'bg-blue-50 text-blue-600',
    'AB+': 'bg-purple-100 text-purple-800',
    'AB-': 'bg-purple-50 text-purple-600',
    'O+': 'bg-green-100 text-green-800',
    'O-': 'bg-green-50 text-green-600'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-[#00CCCC] border-t-transparent"
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-center items-center h-screen gap-4"
      >
        <div className="text-red-500 text-xl">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#00CCCC] text-white rounded-lg hover:bg-[#00AAAA] transition"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-xl">No profile data found</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative">
            <div className="h-40 bg-gradient-to-r from-[#00CCCC] to-[#00AAAA]"></div>
            <div className="absolute -bottom-16 left-6">
             <motion.div 
  whileHover={{ scale: 1.02 }}
  className="relative group"
>
  <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
    {previewImage ? (
      <motion.img
        src={previewImage}
        alt="Profile"
        className="h-full w-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    ) : (
      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
        <FiUser className="text-gray-400 text-4xl" />
      </div>
    )}
  </div>
  {isEditing && (
    <>
      <label className="absolute bottom-0 right-0 bg-[#00CCCC] p-2 rounded-full cursor-pointer shadow-md group-hover:bg-[#00AAAA] transition-all duration-200">
        <FiUpload className="text-white" />
        <input 
          type="file" 
          className="hidden" 
          onChange={handleImageChange}
          accept="image/*"
        />
      </label>
      {previewImage !== profile.profilePicture && (
        <motion.button
          onClick={() => {
            setPreviewImage(profile.profilePicture || '');
            setFormData(prev => ({
              ...prev,
              profilePicture: profile.profilePicture || ''
            }));
          }}
          className="absolute top-0 right-0 bg-red-500 p-1 rounded-full shadow-md"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiX className="text-white text-sm" />
        </motion.button>
      )}
    </>
  )}
  {isUploading && (
    <motion.div
      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-6 w-6 rounded-full border-2 border-white border-t-transparent"
      />
    </motion.div>
  )}
</motion.div>
            </div>
            <div className="absolute top-4 right-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isEditing ? 'bg-gray-100 text-gray-800' : 'bg-white text-[#00CCCC]'} shadow-md`}
              >
                {isEditing ? (
                  <>
                   Editing
                  </>
                ) : (
                  <>
                    <FiEdit size={18} /> Edit Profile
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 px-6 pb-6">
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center"
                >
                  <FiAlertTriangle className="mr-2" />
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Personal Information */}
              <motion.div variants={itemVariants} className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-[#00CCCC] bg-opacity-10 rounded-full">
                    <FiUser className="text-[#00CCCC]" />
                  </div>
                  Personal Information
                </h3>
                
                <div className="space-y-4">
             <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="relative"
>
  <label className="block text-sm font-medium text-gray-500 mb-1">
    First Name
  </label>
  {isEditing ? (
    <motion.input
      type="text"
      name="firstName"
      value={formData.firstName}
      onChange={handleInputChange}
      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00CCCC] focus:border-transparent transition-all duration-200"
      whileFocus={{ 
        scale: 1.01,
        boxShadow: "0 0 0 2px rgba(0, 204, 204, 0.2)"
      }}
    />
  ) : (
    <p className="px-4 py-3 bg-gray-50 rounded-lg transition-all duration-200">
      {profile.firstName}
    </p>
  )}
</motion.div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00CCCC] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-4 py-2 bg-gray-50 rounded-lg">{profile.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="px-4 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                      <FiMail className="text-gray-400" /> {profile.email}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div variants={itemVariants} className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-[#00CCCC] bg-opacity-10 rounded-full">
                    <FiPhone className="text-[#00CCCC]" />
                  </div>
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00CCCC] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-4 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                        <FiPhone className="text-gray-400" /> {profile.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="emergencyContact.name"
                          value={formData.emergencyContact.name}
                          onChange={handleInputChange}
                          placeholder="Name"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="tel"
                          name="emergencyContact.phone"
                          value={formData.emergencyContact.phone}
                          onChange={handleInputChange}
                          placeholder="Phone"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text"
                          name="emergencyContact.relationship"
                          value={formData.emergencyContact.relationship}
                          onChange={handleInputChange}
                          placeholder="Relationship"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg">
                        {profile.emergencyContact?.name ? (
                          <>
                            <p>{profile.emergencyContact.name}</p>
                            <p className="text-sm text-gray-600">{profile.emergencyContact.phone}</p>
                            <p className="text-xs text-gray-500">{profile.emergencyContact.relationship}</p>
                          </>
                        ) : (
                          'Not provided'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Medical Information */}
            <motion.div 
              variants={itemVariants}
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-[#00CCCC] bg-opacity-10 rounded-full">
                    <FiDroplet className="text-[#00CCCC]" />
                  </div>
                  Blood Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Blood Type</label>
                  {isEditing ? (
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00CCCC] focus:border-transparent"
                    >
                      <option value="">Select blood type</option>
                      {Object.keys(bloodTypeColors).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-2">
                      {profile.bloodType ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bloodTypeColors[profile.bloodType]}`}>
                          {profile.bloodType}
                        </span>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-[#00CCCC] bg-opacity-10 rounded-full">
                    <FiClock className="text-[#00CCCC]" />
                  </div>
                  Availability
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Donation Status</label>
               <div className="px-4 py-2">
  {isEditing ? (
   <motion.div 
  className="flex items-center gap-3"
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3 }}
>
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors duration-300 ${
      formData.availability ? 'bg-[#00CCCC]' : 'bg-gray-300'
    }`}
    onClick={handleAvailabilityToggle}
  >
    <motion.span
      layout
      transition={{ 
        type: "spring", 
        stiffness: 700, 
        damping: 30
      }}
      className={`absolute inline-block w-5 h-5 rounded-full bg-white shadow-lg ${
        formData.availability ? 'left-7' : 'left-1'
      }`}
      animate={{
        x: formData.availability ? 6 : 0,
        boxShadow: formData.availability 
          ? '0 2px 4px rgba(0, 0, 0, 0.2)'
          : '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}
    />
  </motion.div>
  <motion.span 
    className="text-sm font-medium text-gray-600"
    animate={{
      color: formData.availability ? '#00AAAA' : '#6B7280'
    }}
  >
    {formData.availability ? 'Available' : 'Unavailable'}
  </motion.span>
</motion.div>
  ) : (
    <div className="flex items-center gap-2">
      {profile.availability ? (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Available for donations
        </span>
      ) : (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Currently unavailable
        </span>
      )}
    </div>
  )}
  {isEditing && (
    <span className="ml-2 text-sm text-gray-600">
      {formData.availability ? 'Available' : 'Unavailable'}
    </span>
  )}
</div>        </div>
              </div>
            </motion.div>

            {/* Password Change Section */}
            {isEditing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="mt-8 pt-6 border-t border-gray-200 overflow-hidden"
              >
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#00CCCC] bg-opacity-10 rounded-full">
                    <FiLock className="text-[#00CCCC]" />
                  </div>
                  Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Current Password</label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00CCCC] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00CCCC] focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Save Button */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex justify-end gap-4"
              >
<button
  onClick={() => {
    setIsEditing(false);
    // Reset form to original profile data
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      bloodType: profile.bloodType || '',
      profilePicture: profile.profilePicture || '',
      emergencyContact: profile.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      availability: profile.availability || false,
      oldPassword: '',
      newPassword: ''
    });
    setPreviewImage(profile.profilePicture || '');
  }}
  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
>
  Cancel
</button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-[#00CCCC] to-[#00AAAA] text-white rounded-lg shadow-md hover:shadow-lg transition"
                >
                  Save Changes
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;