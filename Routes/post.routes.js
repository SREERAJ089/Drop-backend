require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

const User = require('../models/user.model.js'); 
const Post = require('../models/post.model.js');
const ConnectedPost = require('../models/connectedPost.models.js');
const router = express.Router();
const Notification = require('../models/notification.model.js');


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
}



// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/addPost', async(req, res) =>{
    const {userId, category, title, description, text, imageUrl, uploadedShots, isEnabledAnonymous} = req.body;

    try {
        const user = await User.findById(userId);
        const newPost = new Post({
            userId,
            category,
            title,
            description,
            text,
            imageUrl,
            uploadedShots,
            isEnabledAnonymous
        });

        const savedPost = await newPost.save();
        user.uploads.push(savedPost._id);
        await user.save();
        res.status(201).json({ success: true, message: 'Post added successfully', post:savedPost , user: user});
        
    } catch (error) {
        
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/connectPosts', async(req,res) => {
    const {userId, content, referencePostId, targetUserId} = req.body;

    try{
        const user = await User.findById(userId);
        const post = await Post.findById(referencePostId);
        const targetUser = await User.findById(targetUserId);

        const newConnectedPost = new ConnectedPost({
            userId,
            content,
            referencePostId,
        });

        const savedConnectedPost = await newConnectedPost.save();
        user.connectedPost.push(savedConnectedPost._id);
        post.connections.push(userId);

        const notification = new Notification({
            fromUser: userId,
            fromUserName: user.username,
            fromUserImageUrl: user.imageUrl,
            toUser: targetUserId,
            type: 'connect',
            message: 'connected your drop.',
        });

        await notification.save();

        // Send push notification if targetUser has an FCM token
        if (targetUser.fcmToken) {
            const message = {
            notification: {
                title: `${user.username} connected your drop!`,
                body: "Check it out now!",
            },
            token: targetUser.fcmToken, // Target user's FCM token
            };
    
            try {
            await admin.messaging().send(message);
            
            } catch (error) {
            
            }
        }

        await user.save();
        await post.save();

        res.status(200).json({success: true, connectedPost: savedConnectedPost});
    }catch(error){
        
        res.status(500).json({success: false, message: 'error connecting posts'});
    }
});

// Configure Multer storage and file filter
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Save files to the 'uploads' directory
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Unique file name
    },
});
  
const upload = multer({ storage });
// API route for image upload
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }
        
      const result = await cloudinary.uploader.upload(req.file.path);
      // Send the URL of the uploaded image back to the frontend
      res.json({ imageUrl: result.secure_url });

    } catch (error) {
      res.status(500).send({ message: 'Error uploading image', error });
    }
});

// API route for image shots upload
router.post('/uploadShots', upload.array('images', 3), async (req, res) => {
    try {
        if (!req.files || req.files.length===0) {
            return res.status(400).send({ message: 'No file uploaded' });
        }
        
        const uploadResults = await Promise.all(
            req.files.map(file => cloudinary.uploader.upload(file.path))
        );
      
        const imageUrls = uploadResults.map(result => result.secure_url);

        res.json({ success: true, imageUrls });

    } catch (error) {
      res.status(500).send({ message: 'Error uploading image', error });
    }
});

// API route for profile image upload
router.post('/profileUpload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }
        
        
        const result = await cloudinary.uploader.upload(req.file.path);
        // Send the URL of the uploaded image back to the frontend
        res.json({ imageUrl: result.secure_url });

    } catch (error) {
      res.status(500).send({ message: 'Error uploading image', error });
    }
});

// Delete Account API
router.delete('/deletePosts', async (req, res) => {
    const { ids , userId} = req.body; // Receive the array of IDs from the request body

    if (!ids || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided' });
    }

    try {
        const deletedPosts = await Post.deleteMany({ _id: { $in: ids } });
         // Update user's uploads field
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { uploads: { $in: ids } } }, // Remove matching IDs from uploads array
            { new: true }
        );
        

        if (deletedPosts.deletedCount === 0) {
            return res.status(404).json({ message: 'No posts found to delete' });
        }

        res.status(200).json({
            success: true, message: `${deletedPosts.deletedCount} post(s) deleted successfully`,
        });
    } catch (error) {
        
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});






module.exports = router;