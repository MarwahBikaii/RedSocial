import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiSearch, FiFilter, FiMapPin, FiPhone, FiClock, 
  FiDroplet, FiHome, FiX, FiChevronLeft, 
  FiChevronRight, FiHeart 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import Swal from 'sweetalert2';

const BloodRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    bloodType: '',
    hospitalName: '',
    urgencyLevel: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  // Blood type options
  const bloodTypes = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const urgencyLevels = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'urgencyLevel', label: 'Most Urgent' }
  ];

  // Custom select styles
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 48,
      borderRadius: 12,
      borderColor: '#E2E8F0',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#0097B2'
      }
    }),
    option: (base, { isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? '#0097B2' : 'white',
      color: isSelected ? 'white' : '#4A5568',
      '&:hover': {
        backgroundColor: '#E6FFFA',
        color: '#0097B2'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    })
  };

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setSearchParams(prev => ({
      ...prev,
      hospitalName: value,
      page: 1
    }));
  }, 500);

  // Fetch blood requests
  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`http://localhost:3000/api/Requests?${params.toString()}`);
      setRequests(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching blood requests');
    } finally {
      setLoading(false);
    }
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.info('Location access denied. Using default search.');
        }
      );
    }
  };

  // Search nearby requests
  const searchNearbyRequests = async () => {
    if (!userLocation) {
      toast.info('Please allow location access to find nearby requests');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/Requests/search`, 
        {
          params: {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            radius: 10,
            bloodType: searchParams.bloodType,
            urgencyLevel: searchParams.urgencyLevel
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setRequests(response.data);
      setPagination({});
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        error.message ||
        'Failed to search nearby requests'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle "I can help" button click with SweetAlert
const handleHelpClick = async (requestId) => {
  const storedUser = JSON.parse(localStorage.getItem("userInfo"));
  const donorId = storedUser?.data?.user._id;

  if (!donorId) {
    toast.info('Please login to help with this request');
    navigate('/login');
    return;
  }

  try {
    const { isConfirmed } = await Swal.fire({
      title: 'Confirm Your Help',
      text: 'Are you sure you want to volunteer for this blood donation?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0097B2',
      cancelButtonColor: '#ff3131',
      confirmButtonText: 'Yes, I can help!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: '#ffffff',
      backdrop: `rgba(0, 151, 178, 0.1)`
    });

    if (!isConfirmed) return;

    // Directly attempt assignment (backend will validate compatibility)
    const response = await axios.post(
      'http://localhost:3000/api/Requests/assign-donor',
      { requestId, donorId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    await Swal.fire({
      title: 'Thank You!',
      text: response.data.message || 'Your help is greatly appreciated!',
      icon: 'success',
      confirmButtonColor: '#0097B2',
      background: '#ffffff'
    });

    fetchBloodRequests(); // Refresh the list
  } catch (error) {
    let errorMessage = error.response?.data?.message || 'Failed to assign donor';

    // Customize error messages for known backend responses
    if (error.response?.data?.error?.includes('incompatible')) {
      errorMessage = `Blood type incompatible. ${error.response.data.details}`;
    } 
    else if (error.response?.data?.error?.includes('already assigned')) {
      errorMessage = 'You are already assigned to this request.';
    }

    console.log()

    Swal.fire({
      title: 'Cannot Request Blood Donation',
      text: error.response.data.error   ,
      icon: 'error',
      confirmButtonColor: '#ff3131',
      background: '#ffffff'
    });
  }
};
  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleSelectChange = (name, selectedOption) => {
    setSearchParams(prev => ({ ...prev, [name]: selectedOption?.value || '' }));
  };

  const handleSortChange = (selectedOption) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy: selectedOption.value,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchParams({
      bloodType: '',
      hospitalName: '',
      urgencyLevel: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchInput('');
  };

  useEffect(() => {
    fetchBloodRequests();
    getUserLocation();
  }, [searchParams]);

  // Render pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, searchParams.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, searchParams.page - 1))}
            disabled={searchParams.page === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <FiChevronLeft size={18} />
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1 rounded-lg ${searchParams.page === 1 ? 'bg-[#0097b2] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                1
              </button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 rounded-lg ${searchParams.page === pageNum ? 'bg-[#0097b2] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {pageNum}
            </button>
          ))}

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                className={`px-3 py-1 rounded-lg ${searchParams.page === pagination.totalPages ? 'bg-[#0097b2] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(Math.min(pagination.totalPages, searchParams.page + 1))}
            disabled={searchParams.page === pagination.totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Find Blood Requests</h1>
          <p className="text-gray-600">Discover urgent blood donation needs at hospitals near you</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder="Search by hospital name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${showFilters ? 'bg-[#0097b2] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <FiFilter />
              Filters
            </button>

            <button
              onClick={searchNearbyRequests}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#ff3131] text-white rounded-lg hover:bg-[#e62a2a] transition-colors"
            >
              <FiMapPin />
              Near Me
            </button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-md  mb-6 pb-10"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Filter Requests</h3>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                    <Select
                      options={bloodTypes}
                      onChange={(selected) => handleSelectChange('bloodType', selected)}
                      value={bloodTypes.find(opt => opt.value === searchParams.bloodType)}
                      placeholder="Any blood type..."
                      isClearable
                      styles={selectStyles}
                      classNamePrefix="react-select"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                    <Select
                      options={urgencyLevels}
                      onChange={(selected) => handleSelectChange('urgencyLevel', selected)}
                      value={urgencyLevels.find(opt => opt.value === searchParams.urgencyLevel)}
                      placeholder="Any urgency..."
                      isClearable
                      styles={selectStyles}
                      classNamePrefix="react-select"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <Select
                      options={sortOptions}
                      onChange={(selected) => handleSelectChange('sortBy', selected)}
                      value={sortOptions.find(opt => opt.value === searchParams.sortBy)}
                      placeholder="Newest first"
                      styles={selectStyles}
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-[#ff3131] hover:bg-[#ff3131]/10 rounded-lg transition-colors"
                  >
                    Clear all filters
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a91] transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0097b2]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <h3 className="text-xl font-medium text-gray-700">No blood requests found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search filters or location</p>
              </div>
            ) : (
              <AnimatePresence>
                {requests.map((request) => {
                  const isCurrentUserMatched = request.matchedDonors?.includes(localStorage.getItem('userId'));
                  
                  return (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                request.urgencyLevel === 'high' ? 'bg-[#ff3131]/10 text-[#ff3131]' :
                                request.urgencyLevel === 'medium' ? 'bg-[#00CCCC]/10 text-[#00CCCC]' :
                                'bg-[#0097b2]/10 text-[#0097b2]'
                              }`}>
                                {request.urgencyLevel}
                              </span>
                              <span className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                                <FiDroplet className={`text-${request.bloodType.includes('+') ? '[#ff3131]' : '[#0097b2]'}`} />
                                {request.bloodType}
                              </span>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              {request.hospital?.name || 'Hospital'} needs {request.bloodType} blood
                            </h3>
                            
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <FiHome className="text-[#0097b2]" />
                              <span>{request.hospital?.address || 'Address not provided'}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-2">
                                <FiClock />
                                Posted {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                              {request.hospital?.contactNumber && (
                                <span className="flex items-center gap-2">
                                  <FiPhone />
                                  {request.hospital.contactNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[160px]">
                            <button
                              onClick={() => navigate(`/request/${request._id}`)}
                              className="px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a91] transition-colors"
                            >
                              View Details
                            </button>
                            
                            <button
                              onClick={() => handleHelpClick(request._id)}
                              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isCurrentUserMatched
                                  ? 'bg-[#ff3131]/20 text-[#ff3131] cursor-default'
                                  : 'bg-[#ff3131]/10 text-[#ff3131] hover:bg-[#ff3131]/20'
                              }`}
                              disabled={isCurrentUserMatched}
                            >
                              <FiHeart className={isCurrentUserMatched ? 'fill-[#ff3131]' : ''} />
                              {isCurrentUserMatched ? 'You are helping!' : 'I can help'}
                            </button>
                            
                            {request.hospital?.contactNumber && (
                              <a
                                href={`tel:${request.hospital.contactNumber}`}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <FiPhone />
                                Call Hospital
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
      
      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        toastClassName="rounded-lg shadow-sm"
        progressClassName="bg-[#0097b2]"
      />
    </div>
  );
};

export default BloodRequests;