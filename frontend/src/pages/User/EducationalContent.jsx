// EducationalContent.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiHeart, FiMessageSquare, FiShare2, FiBookmark, FiChevronDown } from 'react-icons/fi';

const EducationalContent = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/EducationalContent');
        setContent(response.data);
        // Initialize expanded state for each card
        const initialExpanded = response.data.reduce((acc, item) => {
          acc[item._id] = false;
          return acc;
        }, {});
        setExpandedCards(initialExpanded);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLike = async (id) => {
    try {
      // Optimistic UI update
      setContent(prev => prev.map(item => 
        item._id === id ? { ...item, likes: item.likes + 1 } : item
      ));
      
      await axios.patch(`http://localhost:3000/api/EducationalContent/${id}/like`);
    } catch (error) {
      console.error('Error liking content:', error);
      // Rollback if error
      setContent(prev => prev.map(item => 
        item._id === id ? { ...item, likes: item.likes - 1 } : item
      ));
    }
  };

  const filteredContent = activeFilter === 'all' 
    ? content 
    : content.filter(item => item.tags?.includes(activeFilter));

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const contentVariants = {
    collapsed: { height: 120, overflow: 'hidden' },
    expanded: { height: 'auto', overflow: 'visible' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-red-400 via-red-500 to-red-600 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-red-600 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-white text-center mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Blood Donation & Health Education
        </motion.h1>
        
        {/* Filter tags */}
        <motion.div className="flex flex-wrap justify-center gap-2 mb-10">
          {['all', 'donation', 'health', 'tips', 'science'].map(tag => (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === tag 
                  ? 'bg-white text-red-600 shadow-md' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredContent.map((item) => (
              <motion.div
                key={item._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
                className="bg-white rounded-xl shadow-xl overflow-hidden"
                whileHover={{ y: -5 }}
              >
                {/* Image with gradient overlay */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.image || 'https://source.unsplash.com/random/500x300/?blood,donation'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button 
                      onClick={() => handleLike(item._id)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    >
                      <FiHeart className={`w-5 h-5 ${item.likes > 0 ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    </button>
                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                      <FiBookmark className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">{item.title}</h2>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      {item.duration || '5 min read'}
                    </span>
                  </div>

                  <motion.div
                    variants={contentVariants}
                    animate={expandedCards[item._id] ? "expanded" : "collapsed"}
                    className="relative"
                  >
                    <p className="text-gray-600">{item.content}</p>
                    {!expandedCards[item._id] && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent" />
                    )}
                  </motion.div>

                  <button 
                    onClick={() => toggleExpand(item._id)}
                    className="mt-2 flex items-center text-red-600 font-medium text-sm"
                  >
                    {expandedCards[item._id] ? 'Show less' : 'Read more'}
                    <motion.span
                      animate={{ rotate: expandedCards[item._id] ? 180 : 0 }}
                      className="ml-1"
                    >
                      <FiChevronDown />
                    </motion.span>
                  </button>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags?.map((tag, index) => (
                      <motion.span 
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </motion.span>
                    ))}
                  </div>

                  {/* Stats and actions */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <FiHeart className="w-4 h-4" />
                        <span className="text-sm">{item.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <FiMessageSquare className="w-4 h-4" />
                        <span className="text-sm">{item.comments?.length || 0}</span>
                      </div>
                    </div>
                    <button className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors">
                      <FiShare2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comments preview */}
                  {item.comments?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Comments</h3>
                      <div className="space-y-3">
                        {item.comments.slice(0, 2).map((comment, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start space-x-3"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-medium text-sm">
                              {comment.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm text-gray-800">{comment.commentText}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {comment.timestamp || '2 days ago'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredContent.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <h3 className="text-xl font-medium text-white">No content found for this filter</h3>
            <p className="text-white/80 mt-2">Try selecting a different category</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default EducationalContent;