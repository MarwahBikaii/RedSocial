        const User= require("../models/userModel");
        const validator = require('validator');
        const jwt =require('jsonwebtoken')
        const {promisify}=require('util')
        const env= require('dotenv');


        const signToken = (id, res) => {
            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
            });
        
            // Set the JWT as a cookie
            res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production, false in development
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });
        
            return token;
        };

     const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("jwt", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: "Strict",
  });

  res.status(statusCode).json({
    status: "success",
    token, // ✅ Sending token in response
    data: { user },
  });

  return token; // ✅ Return the generated token
};


        
      exports.signup = async (req, res) => {
    console.log("Request body:", req.body);  // Debugging the incoming data

    const { firstName, lastName, email, username, password, passwordConfirm, role, bloodType, phone } = req.body;

    try {
        // Check if email is already in use
        const emailCheck = await User.findOne({ email });
        if (emailCheck) {
            return res.status(409).json({ message: "Email is in use." });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid Email." });
        }

        // Ensure required fields are present
        if (!bloodType && (role.includes('user'))) {
            return res.status(400).json({ message: "Blood type is required for users." });
        }

        if (!phone && (role.includes('user') || role.includes('hospital'))) {
            return res.status(400).json({ message: "Phone number is required for users and hospitals." });
        }

        // Create a new user instance
        const newUser = new User({
            firstName,
            lastName,
            email,
            username,
            password,
            passwordConfirm,
            role,
            bloodType,
            phone,
        });

        // Explicitly validate the document
        await newUser.validate();

        // Save the user to the database
        await newUser.save();

        // Send response with token
        // signing up and logging in the user
        createSendToken(newUser, 201, res);
    } catch (err) {
        // Handle validation errors
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        // Handle other errors
        res.status(500).json({ message: err.message });
        console.error("Error in signup:", err);
    }
};

        exports.login= async(req,res)=>{
            console.log("Login route hit");  // Log to see if the route is hit
            try{
                const {email,password}= req.body;
                const user = await User.findOne({ email }).select("+password");
                //user not signedup
                if (!user){
                    return res.status (404).json({ message: "User not found" })
                }

                //if password is not correct

                if (!(await user.checkPassword(password,user.password))){
                    return res.status(401).json({message:"Incorrect Email or Password"})

                }

                //if login is successfull , set user's token

                createSendToken(user, 200, res)
                console.log("lOGGED IN")


            }catch(err)
            {console.log(err)

            }
        }


        exports.logout = async (req, res) => {
            res.cookie("jwt", "", {
                httpOnly: true, // Corrected the typo here
                expires: new Date(0),
            });
        
            console.log("Logged out")
            res.status(200).json({ message: "Logged out successfully" });
        };
        

        exports.protect=async(req,res,next)=>{
            try{
                //check if token exists
                let token;
                if (
                req.headers.authorization &&
                req.headers.authorization.startsWith("Bearer")
                ) {
                token = req.headers.authorization.split(" ")[1];
                } else if (req.cookies.jwt) {
                token = req.cookies.jwt; // ✅ Read from cookies
                }
                

                if (!token){
                    return res.status(401).json({message:"Not logged in"})
                }
            

                //token verification

                let decoded;
                try{

                    decoded= await promisify(jwt.verify)(token, process.env.JWT_SECRET)

                }
                catch(err)
                
                {
                    if (err.name==="JsonWebTokenError"){
                        return res.status(401).json("Invalid Token")
                    }
                    else if(err.name==="TokenExpiredError"){
                        return res.status(401).json("Your session token is expired, Login again!")

                }

            
                }
            
            //check if user exists
            const currentUser= await User.findById(decoded.id);
            if (!currentUser){
                return res.status(401).json({message:"The token owner no longer exists"})
            }

            //check if user changed the password after taking the token
            if (currentUser.passwordChangedAfterTokenIssued(decoded.iat)){
                return res.status(401).json({message:"Your password has been changed, login again!"})
            }

            // We add the user to all the requests
            req.user = currentUser;
            next() ;

        }catch(err){

            console.log(err)
        }}


        exports.googleLogin = async (req, res) => {
  
        try {
   
        const { googleId, name, email, photo } = req.body;
        console.log(email)
  
        let user = await User.findOne({ email });


       if (user) {
      // User already exists, send an error response
      return res.status(400).json({ message: "User already registered" });
    }

        if (!user) {
      // Create new user if not exists
    
      user = new User({
        firstName: name.split(" ")[0],
        lastName: name.split(" ")[1] || "",
        email,
        username: email.split("@")[0], // Generate a username
        password: "google-auth", // No password needed, but required in schema
        passwordConfirm: "google-auth",
      });
      await user.save();
    }

    // Send token & response
   
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginWithGoogle = async (req, res) => {
  try {
    const { googleId, email } = req.body;
    console.log("Google UID:", googleId);
    console.log("Google Email:", email);

    const user = await User.findOne({ googleId, email });

    if (!user) {
      return res.status(401).json({ message: "User not registered or email does not match." });
    }

    // ✅ Generate token
    const token = createSendToken(user, 200, res); // This already sends a response!

    console.log("Generated Token:", token); // Debugging

    // ✅ Only return if token is valid (Avoids second response)
    if (!token) {
      return res.status(500).json({ message: "Token generation failed" });
    }

  } catch (err) {
    console.error("Google login error:", err);

    // ✅ Ensure error response is sent only ONCE
    if (!res.headersSent) {
      res.status(500).json({ message: "Google login failed" });
    }
  }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -passwordConfirm'); // Exclude password fields
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    const { userId, firstName, lastName, phone, bloodType, profilePicture, emergencyContact, location, oldPassword, newPassword } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    console.log('User:', user);  // Debugging log

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only the provided fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (bloodType) user.bloodType = bloodType;
    if (profilePicture) user.profilePicture = profilePicture;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (location) user.location = location;

    // Handle password change logic
    if (oldPassword && newPassword) {
      const isMatch = await user.checkPassword(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect old password." });
      }
      
      // Hash the new password and set it
      user.password = newPassword;
      user.passwordConfirm = newPassword; // Re-set passwordConfirm for consistency, but it will not be stored.
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from request parameters

    const user = await User.findById(userId).select(
      "firstName lastName email phone bloodType profilePicture location availability emergencyContact role"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile retrieved successfully", data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { name, bloodType, role, city, available } = req.query;

    let query = {};

    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }
    if (bloodType) query.bloodType = bloodType;
    if (role) query.role = role;
    if (city) query["location.city"] = city;
    if (available !== undefined) query.availability = available === "true";

    const users = await User.find(query).select(
      "firstName lastName email phone bloodType profilePicture location availability role"
    );

    res.status(200).json({ message: "Users retrieved successfully", data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
