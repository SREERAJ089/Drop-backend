const express = require('express');
const Post = require('../models/post.model.js');
const Notification = require('../models/notification.model.js');
const User = require('../models/user.model.js');
const ConnectedPost = require('../models/connectedPost.models.js');
const router = express.Router();
const admin = require('firebase-admin');
const serviceAccount = require('../../myapp-1f7eb-firebase-adminsdk-m8kjj-54e2d43897.json');


// Initialize Firebase Admin SDK 
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'myapp-1f7eb',
    });
}

router.post('/like', async(req,res) => {
    const {currentUserId, postId, targetUserId} = req.body
    try {
        const post = await Post.findById(postId);
        const user = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);
        if(!post){
           return res.status(400).json({success: false, message: 'post not found'});
        }

        post.likes.push(currentUserId);
        await post.save();

        user.likedPosts.push(postId);
        await user.save();

        
        const notification = new Notification({
            fromUser: currentUserId,
            fromUserName: user.username,
            fromUserImageUrl: user.imageUrl,
            toUser: targetUserId,
            type: 'like',
            message: 'liked your drop.',
        });

        await notification.save();

        
        // Send push notification if targetUser has an FCM token
        if (targetUser.fcmToken) {
            const message = {
            notification: {
                title: `${user.username} liked your drop!`,
                body: "Check it out now!",
            },
            token: targetUser.fcmToken, // Target user's FCM token
            };
    
            try {
            await admin.messaging().send(message);
            
            } catch (error) {
            
            }
        }

        res.status(200).json({success: true, message: 'post liked', post, user});

    } catch (error) {
        
        res.status(500).json({success: false, message: 'server error'});
    }
});

router.post('/connectedPostLike', async(req,res) => {
    const {currentUserId, postId, targetUserId} = req.body
    try {
        const post = await ConnectedPost.findById(postId);
        const user = await User.findById(currentUserId);
        if(!post){
            return res.status(400).json({success: false, message: 'post not found'});
        }

        post.likes.push(currentUserId);
        
        await post.save();

        user.likedConnectedPost.push(postId);
        
        await user.save();

        
        const notification = new Notification({
            fromUser: currentUserId,
            fromUserName: user.username,
            fromUserImageUrl: user.imageUrl,
            toUser: targetUserId,
            type: 'like',
            message: 'liked your connected drop.',
        });

        await notification.save();

        res.status(200).json({success: true, message: 'post liked', post, user});

    } catch (error) {
        
        res.status(500).json({success: false, message: 'server error'});
    }
});



router.get('/fetchLikedPostId', async(req,res)=>{
    try{
        const {currentUserId} = req.query;

        const user = await User.findById(currentUserId)
        .populate('likedPosts', '_id');

        res.status(200).json({success: true, message: 'fetched liked post id successfully', user});

    }catch(error){
        
        res.status(500).json({success: false, message: 'server error'});
    }
});


router.get('/fetchReactedPost', async(req,res)=>{
    try{
        const {currentUserId} = req.query;

        const user = await User.findById(currentUserId)
        .populate('reactedPost');

        res.status(200).json({success: true, message: 'fetched liked post id successfully', user});

    }catch(error){
        
        res.status(500).json({success: false, message: 'server error'});
    }
});


router.get('/fetchLikedConnectedPostId', async(req,res)=>{
    try{
        const {currentUserId} = req.query;

        const user = await User.findById(currentUserId)
        .populate('likedConnectedPost', '_id');

        res.status(200).json({success: true, message: 'fetched liked post id successfully', user});

    }catch(error){
        
        res.status(500).json({success: false, message: 'server error'});
    }
});

router.post('/reactions', async(req,res) => {
    const {currentUserId, computedReaction, targetPostId} = req.body;
    try{
        const user = await User.findById(currentUserId);
        let post = await Post.findById(targetPostId);
        if(!post){
            post = await ConnectedPost.findById(targetPostId);
        }
        post.reactions.push({userId: currentUserId, reaction: computedReaction});
        await post.save();
        user.reactedPost.push({postId: targetPostId, reaction: computedReaction});
        await user.save();
        res.status(200).json({ message: 'Reaction added successfully', post });
    }catch(error){
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;