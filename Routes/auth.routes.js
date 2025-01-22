const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('../models/user.model.js'); 
const router = express.Router();
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken.model.js');

const secretKey = process.env.SECRET_KEY;

const saveRefreshToken = async (username, refreshToken) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const newToken = new RefreshToken({
        token: refreshToken,
        username: username,
        expiresAt: expiresAt,
    });

    await newToken.save();
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token missing' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            
            
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

router.post('/authRefresh', async(req, res) => {
    const refreshToken = req.body.refreshToken;

   
    if (!refreshToken) {
        return res.status(403).json({ success: false, message: 'Refresh token missing' });
    }

    try {
        const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

        if (!tokenDoc) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }

        // Check if the refresh token has expired
        if (new Date() > tokenDoc.expiresAt) {
            await RefreshToken.deleteOne({ token: refreshToken }); // Remove expired token
            return res.status(403).json({ success: false, message: 'Refresh token expired' });
        }

        // Verify the refresh token
        jwt.verify(refreshToken, secretKey, (err, user) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Invalid refresh token' });
            }

            // Issue a new access token
            const accessToken = jwt.sign({ id: user.id }, secretKey, { expiresIn: '15m' });
            res.json({ success: true, accessToken });
        });
    } catch (error) {
        
        res.status(500).json({ success: false, message: 'Server error' });
    }

});


//signup route
router.post('/signUp', async(req,res) => {
    const {username, password,fcmToken} = req.body;
    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            res.status(400).json({success: false, message: "User with this username already exists"});
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username, 
                password: hashedPassword,
                fcmToken,
            });
            await newUser.save();
            // const token = jwt.sign({ username }, secretKey, { expiresIn: '24h' });
            const accessToken = jwt.sign({username}, secretKey, { expiresIn: '15m' });
            const refreshToken = jwt.sign({username}, secretKey, { expiresIn: '7d' });

            // Save the refresh token in the database
            await saveRefreshToken(username, refreshToken);


            res.json({success: true, message: "Account created successfully", userId: newUser._id, accessToken, refreshToken});
        } 
    }catch(error){
        console.log(error);
        res.status(500).json({success: false, message: "server error"});
    }
});

router.post('/signUpUsingGoogle', async(req,res) => {
    const {username, password, googleUserId, fcmToken} = req.body;
    try{
        const existingUser = await User.findOne({googleUserId});
        if(existingUser){
            res.status(400).json({success: false, message: "User with this userId already exists! Please login"});
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username, 
                password: hashedPassword,
                googleUserId,
                isVerified: false,
                fcmToken,
            });
            await newUser.save();
            // const token = jwt.sign({ username }, secretKey, { expiresIn: '24h' });
            const accessToken = jwt.sign({username}, secretKey, { expiresIn: '15m' });
            const refreshToken = jwt.sign({username}, secretKey, { expiresIn: '7d' });

            // Save the refresh token in the database
            await saveRefreshToken(username, refreshToken);


            res.json({success: true, message: "Account created successfully", userId: newUser._id, accessToken, refreshToken});
        } 
    }catch(error){
        
        
        res.status(500).json({success: false, message: "server error"});
    }
});

//login route
router.post('/login', async(req,res) =>{
    const {username, password} = req.body;
    try {
        const user = await User.findOne({username});
        if(!user){
            return res.status(400).json({ success: false, message: 'user does not exist' });
        }

        const token = jwt.sign({ username }, secretKey, { expiresIn: '15m' });
        const refreshToken = jwt.sign({username}, secretKey, { expiresIn: '7d' });

        await saveRefreshToken(username, refreshToken);
        

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            res.json({ success: true, user, token, refreshToken});
        } else {
            res.status(400).json({ success: false, message: 'Incorrect password' });
        }        
    } catch (error) {
        
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/loginUsingGoogle', async(req,res) =>{
    const {googleUserId} = req.body;
    try {
        const user = await User.findOne({googleUserId});
        if(!user){
            return res.status(400).json({ success: false, message: 'user does not exist' });
        }

        const token = jwt.sign({ username }, secretKey, { expiresIn: '15m' });
        const refreshToken = jwt.sign({username}, secretKey, { expiresIn: '7d' });

        await saveRefreshToken(username, refreshToken);

        res.json({ success: true, user, token, refreshToken});

    } catch (error) {
        
        
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
 
// Get user data endpoint
router.get('/userDetails', verifyToken, async (req, res) => {
    
    try {
        // Fetch the user data from the database using the user ID from the token
        const user = await User.findOne({username: req.user.username}).select('-password'); // Exclude password field

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({success: true, user}); // Return the user data
    } catch (error) {
        
        
        return res.status(500).json({success: false, message: 'Server Error' });
    }
});


// Route to check if a username exists
router.get('/check-username', async (req, res) => {
    const { username } = req.query; // Get the username from the query parameters

    try {
        // Check if the username already exists in the database
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            // If user exists, return a message indicating it's unavailable
            return res.status(400).json({ success: false, message: `${username} is not available` });
        }

        // If no user found, the username is available
        res.status(200).json({ success: true, message: `${username} is available` });
    } catch (error) {
        
        
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;