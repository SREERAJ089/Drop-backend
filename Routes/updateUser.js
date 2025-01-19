const express = require('express');
const router = express.Router();
const User = require('../models/user.model.js'); 
const VerifiedUser = require('../models/verifiedUsers.model.js');

router.put('/updateUser/:userId', async(req,res) =>{
    const {userId} = req.params;
    const {firstName, lastName, hustle, creative, imageUrl} = req.body;

    
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId, {
                firstName,
                lastName,
                hustle,
                creative,
                imageUrl,
            },
            {new: true}
        );

        if(!updatedUser){
            res.status(400).json({success: false, message: 'could not find user'});
        }
        res.status(200).json({success: true, message: 'profile updated successfully', user: updatedUser});
    } catch (error) {
        
        res.status(500).json({message: 'server error'})
    }
});


// Delete Account API
router.delete('/delete-account', async (req, res) => {
   
  try {
    const userId = req.query.userId;
    const result = await User.findByIdAndDelete(userId);

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    
    res.status(500).json({success: false, message: 'Internal server error' });
  }
});

router.get('/verifiedUsers', async(req, res) => {
  try{
    const result = await VerifiedUser.find();
    return res.status(200).json({success: true, result});
  } catch (error) {
    res.status(500).json({success: false, message: 'Internal server error' });
  }
})


module.exports = router;