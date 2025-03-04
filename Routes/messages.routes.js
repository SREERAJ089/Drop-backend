const express = require('express');
const Message = require('../models/messages.model.js');
const User = require('../models/user.model.js');
const admin = require('firebase-admin');
const router = express.Router();

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
};

// WebSocket Setup
module.exports = function (io) {
    router.get('/fetchMessage/:username', async (req, res) => {
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

    // Fetch Messages
    router.get('/fetchMessages/:senderUsername/:receiverUsername', async (req, res) => {
        const { senderUsername, receiverUsername } = req.params;

        try {
            const messages = await Message.find({
                $or: [
                    { senderUsername, receiverUsername },
                    { senderUsername: receiverUsername, receiverUsername: senderUsername },
                ],
            }).sort({ timestamp: 1 });

            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Send Message
    router.post('/messages', async (req, res) => {
        const { senderUsername, receiverUsername, text, timestamp } = req.body;

        try {
            const newMessage = new Message({ senderUsername, receiverUsername, text, timestamp, seen: false });
            await newMessage.save();
            

            // Send real-time message via WebSocket
            io.emit('receiveMessage', newMessage);

            // Fetch target user for push notification
            const targetUser = await User.findOne({ username: receiverUsername });

            // Send push notification
            if (targetUser?.fcmToken) {
              const message = {
                  notification: {
                      title: `${senderUsername}`,
                      body: `${text}`,
                  },
                  token: targetUser.fcmToken,
              };

              try {
                  await admin.messaging().send(message);
              } catch (error) {
                  console.error("FCM Error: ", error);
              }
            }

            res.status(201).json(newMessage);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Mark Messages as Seen
    router.post('/markAsSeen', async (req, res) => {
        const { username } = req.body;
        try {
            await Message.updateMany(
                { senderUsername: username, seen: false },
                { $set: { seen: true } }
            );
            io.emit('messageSeen', username);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to mark messages as seen' });
        }
    });

    io.on('connection', (socket) => {
      socket.on('userTyping', ({ senderUsername, receiverUsername, isTyping }) => {
          io.emit('userTyping', { sender: senderUsername, receiver: receiverUsername, isTyping });
      });

      socket.on('stopTyping', ({ senderUsername, receiverUsername }) => {
        io.emit('userTyping', { sender: senderUsername, receiver: receiverUsername, isTyping: false });
      });

    });
  

    return router;
};

