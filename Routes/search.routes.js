const express = require('express');
const User = require('../models/user.model.js'); 
const router = express.Router();

router.get('/searchUsers', async(req,res) =>{
    const searchQuery = req.query.q;
    try {
        const users = await User.find({
            username : {$regex: searchQuery, $options: 'i'}
        });
        res.json({success: true, users})
    } catch (error) {
        
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;