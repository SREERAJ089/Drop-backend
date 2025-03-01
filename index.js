require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const authRoute = require('./Routes/auth.routes.js');
const searchRoute = require('./Routes/search.routes.js');
const followRoute = require('./Routes/follow.routes.js');
const postRoute = require('./Routes/post.routes.js');
const updateRoute = require('./Routes/updateUser.js');
const fetchPostsRoute = require('./Routes/fetchPosts.routes.js');
const reactionRoute = require('./Routes/reactions.routes.js');
const notificationRoute = require('./Routes/getNotification.routes.js');
const messagesRoute = require('./Routes/messages.routes.js');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Register normal routes
app.use('/api', authRoute);
app.use('/api', searchRoute);
app.use('/api', followRoute);
app.use('/api', postRoute);
app.use('/api', updateRoute);
app.use('/api', fetchPostsRoute);
app.use('/api', reactionRoute);
app.use('/api', notificationRoute);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Pass `io` when using the router
app.use('/api', messagesRoute(io));

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('join', (username) => {
        socket.join(username);
        console.log(`${username} joined the chat`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to database");
        server.listen(PORT, () => {  // Use `server.listen` instead of `app.listen`
            console.log(`Server running on ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection error:", error);
    });