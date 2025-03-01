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
                        body: text,
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

    // Typing Indicator
    io.on('connection', (socket) => {
        socket.on('typing', ({ senderUsername, receiverUsername }) => {
            socket.broadcast.emit('typing', { senderUsername, receiverUsername });
        });

        socket.on('stopTyping', ({ senderUsername, receiverUsername }) => {
            socket.broadcast.emit('stopTyping', { senderUsername, receiverUsername });
        });
    });

    return router;
};
