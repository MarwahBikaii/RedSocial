const express= require('express')
const router=express.Router();
const {signup,login,searchUsers,getProfile,getUsers,updateProfile,logout,googleLogin,loginWithGoogle } = require('../controllers/userController');
const {authenticate}= require('../middlewares/authMiddleware')

router.post('/signup', signup); // This maps POST /signup to the signup function
router.post('/auth/login', login); // This maps POST /login to the login function
router.post('/logout', logout); // This maps POST /logout to the logout function
router.post("/google-login", googleLogin); // Add this route
router.post("/loginWithGoogle", loginWithGoogle); // Add this route
router.post('/updateProfile', updateProfile); // This maps POST /signup to the signup function
router.get('/profile/:userId', authenticate, getProfile);
router.get('/search', authenticate, searchUsers);

 

// Add GET users route
router.get('/getUsers', getUsers);
module.exports = router; 