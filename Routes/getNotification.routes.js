const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model.js');

router.get('/getNotification', async(req,res) =>{
    const {userId} = req.query;
    try{
        const notifications = await Notification.find({toUser: userId}).sort({date: -1});
        res.status(200).json({success: true, notifications});
    } catch(error){
        res.status(500).json({success: false, message: 'unable to fetch notifications'});
    }
});

router.post('/clearNotifications', async(req,res) =>{
    const {userId} = req.body;
    
    try {
        await Notification.deleteMany({toUser: userId});
        res.status(200).json({success: true, message: 'notification cleared successfully'});

    } catch (error) {
        res.status(500).json({success: false, message: 'error clearing notifications'});
    }
});

router.get('/unreadNotifications', async(req,res) =>{
    const {userId} = req.query;
    try{
        const unreadCount = await Notification.countDocuments({toUser: userId, isRead: false});
        res.status(200).json({success: true, unreadCount});
    } catch(error){
        res.status(500).json({success: false, message: 'error fetching unread notifications'});
    }
});

router.post('/markNotificationAsRead', async(req,res) =>{
    const {userId} = req.body;
    try{
        await Notification.updateMany(
            {toUser: userId, isRead: false},
            {$set: {isRead: true}},
        );

        res.status(200).json({success: true, message: 'notification marked as read'});
    } catch(error){
        res.status(500).json({success: false, message: 'could not mark notifications as read'});
    }
});

module.exports = router;