const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user.model.js'); 
const Post = require('../models/post.model.js');
const ConnectedPost = require('../models/connectedPost.models.js');
const router = express.Router();

router.get('/fetchPosts', async(req, res) =>{

    try{
        const {userId} = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const now = new Date();
        const yesterday = new Date (now.getTime()- 24*60*60*1000);
    
        const user = await User.findById(userId);
        const followingId = user.following;

        const userAndFollowingIds = [userId, ...followingId];
    
        const posts = await Post.find({
            userId : {$in: userAndFollowingIds}, 
            createdAt : {$gte : yesterday},
        })
        .populate('userId', 'username firstName lastName createdAt hustle creative imageUrl following followers uploads')
        .sort({createdAt: -1});

        const connectedPosts = await ConnectedPost.find({
            userId: {$in: userAndFollowingIds},
            createdAt: {$gte: yesterday},
        })
        .populate('userId', 'username firstName lastName createdAt hustle creative imageUrl following followers uploads likedConnectedPost')
        .populate({
            path: 'referencePostId', 
            select: 'title description',
            populate: {
                path: 'userId',
                select: 'username'
            }
        })
        .sort({createdAt: -1});

        const allPosts = [...posts,...connectedPosts].sort(
            (a,b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    
        res.status(200).json({success: true, message: 'posts fetched successfully', posts: allPosts});
    } catch(error) {
        
        res.status(500).json({success: false, message: 'server error'});
    }

});

router.post('/fetchUserUploads', async(req,res) => {
    const {userId} = req.body;
    try{
        const user = await User.findById(userId)
        .populate('uploads', 'category title description text imageUrl createdAt likes connections');

        res.status(200).json({success: true, user});
    } catch(error){
        
        res.status(500).json({success: false, message: 'server error'});
    }
});

router.post('/targetUserPosts', async(req, res) => {
    const {targetUserId} = req.body;
    try{
        const user = await User.findById(targetUserId)
        .populate('uploads', 'category title description text imageUrl createdAt likes connections');
        res.status(200).json({success: true, user});
    } catch(error){
        
        res.status(500).json({success: false, message: 'server error'});
    }
});

router.get('/trendingPosts', async(req,res)=>{
    try{
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate()-1);

        const trendingPosts = await Post.find({
            createdAt : {$gte: oneDayAgo}
        })
        .populate('userId', 'username')
        .exec();

        const postsWithScores = trendingPosts.map(post => ({
            ...post.toObject(),
            engagementScore: post.likes.length + (1.5 * post.connections.length)
        }));

        postsWithScores.sort((a,b) => b.engagementScore - a.engagementScore);

        const posts = postsWithScores.slice(0,15);

        res.status(200).json({success: true, trending: posts});
    } catch(error){
        
        res.status(500).json({success: false, message: 'server error'});
    }
});

router.get('/fetchPostsConnected', async(req,res)=>{
    try{
        const {userId} = req.query;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }
        const user = await User.findById(userId)
        .populate({
            path: 'connectedPost', 
            populate: {
                path: 'referencePostId',
                model: 'Post'
            }
        });
        res.status(200).json({success: true, user});
    } catch(error){
        
        res.status(500).json({success: false, message: 'server error'})
    }
});

router.get('/fetchLikedPosts', async(req,res)=>{
    try{
        const {userId} = req.query;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }
        const user = await User.findById(userId)
        .populate('likedPosts', 'category title description text imageUrl createdAt likes connections');
        res.status(200).json({success: true, user});
    } catch(error){
        
        res.status(500).json({success: false, message: 'server error'})
    }
})

module.exports = router;