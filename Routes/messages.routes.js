const express = require('express');
const Message = require('../models/messages.model.js');
const router = express.Router();
const User = require('../models/user.model.js');

// Fetch messages API
router.get('/fetchMessages/:senderUsername/:receiverUsername', async (req, res) => {
    const { senderUsername, receiverUsername } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { senderUsername: senderUsername, receiverUsername: receiverUsername },
                { senderUsername: receiverUsername, receiverUsername: senderUsername },
            ],
        }).sort({ timestamp: 1, _id:1 }); // Sorting messages by timestamp

        res.status(200).json(messages);
    } catch (error) {
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/messages', async (req, res) => {
    const { senderUsername, receiverUsername, text, timestamp } = req.body;

    try {
        const newMessage = new Message({ senderUsername, receiverUsername, text, timestamp });
        await newMessage.save();

        res.status(201).json(newMessage);
    } catch (error) {
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/fetchMessages/:username', async (req, res) => {
    const { username } = req.params;
    
  
    try {
      const messages = await Message.find({
        $or: [
          { senderUsername: username },
          { receiverUsername: username },
        ],
      }).sort({ timestamp: -1 }); // Sort by timestamp (newest to oldest)
  
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

router.get('/user/:username', async (req, res) => {
    const { username } = req.params;
  
    try {
      const user = await User.findOne({ username });
  
      if (user) {
        res.json({ imageUrl: user.imageUrl });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
});



// Endpoint to fetch unread messages from all senders
router.get('/unreadMessages/:receiverUsername', async (req, res) => {
  try {
    const { receiverUsername } = req.params;

    // Fetch messages where `seen` is false and receiver matches
    const unreadMessages = await Message.find({
      receiverUsername,
      seen: false,
    });

    // Group unread messages by sender
    const groupedMessages = unreadMessages.reduce((acc, message) => {
      if (!acc[message.senderUsername]) {
          acc[message.senderUsername] = [];
      }
      acc[message.senderUsername].push(message);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      groupedMessages, // Messages grouped by sender
      unreadCount: unreadMessages.length, // Total count of unread messages
    });
  } catch (error) {
    
    res.status(500).json({
        success: false,
        error: 'Failed to fetch unread messages',
    });
  }
});

//Endpoint to mark message as seen
router.post('/markAsSeen',async(req,res) => {
  const {username} = req.body;
  try{
    await Message.updateMany(
      {senderUsername: username, seen: false},
      {$set: {seen:true}}
    );
  }catch(error){
    console.error("Error marking messages as seen", error)
  }
});

  

module.exports = router;