require('dotenv').config();
const express = require('express');
const User = require('../models/user.model.js'); 
const router = express.Router();
const Notification = require('../models/notification.model.js');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
}

router.post('/follow', async(req, res) =>{
    const {userId , targetUserId} = req.body;
    try {
        const user= await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if(!user || !targetUser){
            return res.status(404).json({success: false, message: 'user not found'});
        }

        if(user.following.includes(targetUserId)){
            return res.status(400).json({success: false, message: 'already following this user'});
        }

        user.following.push(targetUser);
        targetUser.followers.push(user);

        const notification = new Notification({
            fromUser: user._id,
            fromUserName: user.username,
            fromUserImageUrl: user.imageUrl,
            toUser: targetUser._id,
            type: 'follow',
            message: 'started following you.',
        });

        await notification.save();

        await user.save();
        await targetUser.save();


        // Send push notification if targetUser has an FCM token
        if (targetUser.fcmToken) {
            const message = {
            notification: {
                title: `${user.username} started following you!`,
                body: "Check out their profile now!",
            },
            token: targetUser.fcmToken, // Target user's FCM token
            };
    
            try {
            await admin.messaging().send(message);
            
            } catch (error) {
                console.error(error);
            }
        }

        return res.status(200).json({success: true, message: 'you are now following this user', targetUser, user})

    } catch (error) {
        
        return res.status(500).json({success: false, message: 'server error'})
    }
});

router.post('/unfollow', async(req,res) =>{
    const {userId, targetUserId} = req.body;
    try {
        const user= await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if(!user || !targetUser){
            return res.status(404).json({success: false, message: 'user not found'});
        }

        if(!user.following.includes(targetUserId)){
            return res.status(400).json({success: false, message: 'you are not following this user to unfollow'});
        }

        targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
        await targetUser.save();

        user.following = user.following.filter(id => id.toString() !== targetUserId);
        await user.save();

        res.status(200).json({success: true, user, targetUser, message: 'Successfully unfollowed the user'});
    } catch (error) {
        
        res.status(500).json({success: false, message: 'server error'});
    }
})

module.exports = router;