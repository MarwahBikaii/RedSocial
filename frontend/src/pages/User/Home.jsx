import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { FiDroplet, FiUsers, FiHeart, FiCalendar, FiMapPin, FiPhone, FiAward, FiUserPlus } from "react-icons/fi";
import { FaHandHoldingHeart, FaHospital, FaRegClock } from "react-icons/fa";

const Home = () => {
  // State for animated numbers
  const [donorsCount, setDonorsCount] = useState(0);
  const [livesSavedCount, setLivesSavedCount] = useState(0);
  const [hospitalsCount, setHospitalsCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsSectionRef = useRef(null);
  const controls = useAnimation();

  // Animation for counting numbers
  const animateNumbers = () => {
    if (hasAnimated) return;
    
    setHasAnimated(true);
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setDonorsCount(Math.floor(progress * 1000));
      setLivesSavedCount(Math.floor(progress * 500));
      setHospitalsCount(Math.floor(progress * 50));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateNumbers();
            controls.start("visible");
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }

    return () => {
      if (statsSectionRef.current) {
        observer.unobserve(statsSectionRef.current);
      }
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-50 to-blue-50 py-16 md:py-24 relative overflow-hidden">
        <motion.div 
          className="container mx-auto px-4 flex flex-col items-center text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="relative mb-8"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <FiDroplet className="text-red-500 w-16 h-16 mx-auto" />
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-300 mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Connecting Blood Donors, <br className="hidden md:block" />
            <span className="text-red-500">Saving Lives</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Join our community of heroes who make a difference by donating blood to those in need.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link 
              to="/register" 
              className="bg-[#00CCCC] hover:from-blue-400 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full text-center transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <FiUserPlus /> Become a Donor
            </Link>
            <Link 
              to="/find-donors" 
              className="bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 px-8 rounded-full text-center transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <FiUsers /> Find Donors
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated background elements */}
        <motion.div 
          className="absolute top-20 left-10 w-8 h-8 rounded-full bg-red-300/30"
          animate={{
            y: [0, 20, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-20 w-12 h-12 rounded-full bg-blue-300/30"
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        />
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl font-bold text-center text-blue-600 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100 text-center"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="bg-blue-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiUserPlus className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-600 mb-3">Register</h3>
              <p className="text-gray-600">Create your profile and specify your blood type</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-b from-red-50 to-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-red-100 text-center"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="bg-red-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiHeart className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-3">Connect</h3>
              <p className="text-gray-600">Find donors or recipients in your area</p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100 text-center"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="bg-blue-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaHandHoldingHeart className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-600 mb-3">Save Lives</h3>
              <p className="text-gray-600">Donate blood and make a real difference</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section with Scroll-Triggered Animation */}
      <section 
        ref={statsSectionRef}
        className="bg-[#00CCCC] from-blue-600 to-blue-500 text-white py-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white/20"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/20"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our Community Impact
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            <motion.div 
              className="p-6 bg-white/10 rounded-xl backdrop-blur-sm"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <FiUsers className="w-10 h-10 mx-auto mb-4 text-white" />
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {donorsCount}+
              </div>
              <div className="text-lg">Donors Registered</div>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white/10 rounded-xl backdrop-blur-sm"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <FaHandHoldingHeart className="w-10 h-10 mx-auto mb-4 text-white" />
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {livesSavedCount}+
              </div>
              <div className="text-lg">Lives Saved</div>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white/10 rounded-xl backdrop-blur-sm"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <FaHospital className="w-10 h-10 mx-auto mb-4 text-white" />
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {hospitalsCount}+
              </div>
              <div className="text-lg">Partner Hospitals</div>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white/10 rounded-xl backdrop-blur-sm"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <FaRegClock className="w-10 h-10 mx-auto mb-4 text-white" />
              <div className="text-4xl md:text-5xl font-bold mb-2">
                24/7
              </div>
              <div className="text-lg">Emergency Support</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl font-bold text-center text-blue-600 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Donor Stories
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="bg-gray-50 p-8 rounded-xl border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100/50 w-12 h-12 rounded-full mr-4 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">SJ</span>
                </div>
                <div>
                  <h4 className="font-bold text-blue-600">Sarah Johnson</h4>
                  <p className="text-gray-600">Regular Donor (O+)</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Through RedSocial, I've been able to directly help three patients in need. The platform makes it so easy to connect with those who need my blood type."
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-50 p-8 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-red-100/50 w-12 h-12 rounded-full mr-4 flex items-center justify-center">
                  <span className="text-red-600 font-bold">MC</span>
                </div>
                <div>
                  <h4 className="font-bold text-red-600">Michael Chen</h4>
                  <p className="text-gray-600">Recipient (AB-)</p>
                </div>
              </div>
              <p className="text-gray-700">
                "RedSocial found a matching donor within hours when my daughter needed an emergency transfusion. This platform is truly life-saving."
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-red-500 to-red-600 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/20"></div>
          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-white/20"></div>
        </div>
        
        <motion.div 
          className="container mx-auto px-4 text-center relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="mb-6"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <FiHeart className="w-16 h-16 mx-auto text-white" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Save Lives?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of donors and help make a difference today.
          </p>
          <Link 
            to="/register" 
            className="bg-white text-red-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full inline-block transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Sign Up Now
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-500 to-blue-300 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-white font-bold text-xl">RedSocial</span>
              <p className="text-white/80 mt-1">Connecting Blood Donors, Saving Lives</p>
            </div>
            <motion.div 
              className="flex space-x-6"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link to="/about" className="text-white/80 hover:text-white transition-colors duration-300">About</Link>
              <Link to="/privacy" className="text-white/80 hover:text-white transition-colors duration-300">Privacy</Link>
              <Link to="/contact" className="text-white/80 hover:text-white transition-colors duration-300">Contact</Link>
              <Link to="/faq" className="text-white/80 hover:text-white transition-colors duration-300">FAQ</Link>
            </motion.div>
          </div>
          <div className="border-t border-white/20 mt-6 pt-6 text-center text-white/80">
            <p>© {new Date().getFullYear()} RedSocial. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;