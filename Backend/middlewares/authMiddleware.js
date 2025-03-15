const jwt =require('jsonwebtoken')
const  User =require("../models/userModel.js");
const { asyncHandler } = require("./asyncHandler");

exports.authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];  // Get token from Authorization header
  } else if (req.cookies.jwt) {
    // Or fallback to cookies if no Authorization header is found
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT
      req.user = await User.findById(decoded.userId).select("-password"); // Exclude password from user data
      next();  // Proceed to the next middleware/controller
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed.");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token.");
  }
});



