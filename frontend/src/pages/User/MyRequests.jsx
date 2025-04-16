import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiDroplet, FiClock, FiUser, FiPhone, FiCalendar } from 'react-icons/fi';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch user's requests
  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Extract user ID from localStorage
        const storedUser = JSON.parse(localStorage.getItem("userInfo"));
        const userId = storedUser?.data?.user._id; // Extract user ID safely

        // If there's no userId, redirect to login
        if (!userId) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:3000/api/Requests/MyRequests?${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setRequests(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch requests');
        MySwal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch your requests',
          icon: 'error',
          confirmButtonColor: '#00CCCC',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, [navigate]);

  // Get urgency color
  const getUrgencyColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'fulfilled': return <FaCheckCircle className="text-green-500" />;
      case 'matched': return <FaCheckCircle className="text-blue-500" />;
      default: return <FaExclamationTriangle className="text-yellow-500" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00CCCC]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00CCCC]/10 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#00CCCC] to-[#008080] p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FiDroplet className="w-6 h-6" />
              My Blood Requests
            </h1>
            <p className="mt-2 opacity-90">View all your blood requests and donations</p>
          </div>

          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">You haven't made or been matched with any requests yet.</p>
                <button
                  onClick={() => navigate('/RequestForm')}
                  className="mt-4 bg-[#00CCCC] text-white px-6 py-2 rounded-lg hover:bg-[#008080] transition-colors"
                >
                  Create New Request
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => (
                  <motion.div
                    key={request._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                            {request.urgencyLevel.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            <span className="text-sm capitalize">{request.status}</span>
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-800">
                          {request.bloodType} Blood Needed
                        </h3>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiUser />
                            <span>
                              {request.requestedBy?.name || 'You'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiCalendar />
                            <span>Expires: {formatDate(request.expirationDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiDroplet />
                            <span>Units: {request.bloodUnits}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiPhone />
                            <span>{request.contactInfo?.phone || request.contactInfo?.email || 'No contact'}</span>
                          </div>
                        </div>
                        
                        {request.additionalNotes && (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700">{request.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/requests/${request._id}`)}
                          className="bg-[#00CCCC] text-white px-4 py-2 rounded-lg hover:bg-[#008080] transition-colors"
                        >
                          View Details
                        </button>
                        {request.status === 'pending' && (
                          <button
                            onClick={() => navigate(`/requests/${request._id}/edit`)}
                            className="bg-white border border-[#00CCCC] text-[#00CCCC] px-4 py-2 rounded-lg hover:bg-[#00CCCC]/10 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {request.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {request.tags.map((tag) => (
                          <span key={tag} className="bg-[#00CCCC]/10 text-[#008080] px-2 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyRequests;
