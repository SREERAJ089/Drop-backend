require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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



app.use('/api', authRoute);
app.use('/api', searchRoute);
app.use('/api', followRoute);
app.use('/api', postRoute);
app.use('/api', updateRoute);
app.use('/api', fetchPostsRoute);
app.use('/api', reactionRoute);
app.use('/api', notificationRoute);
app.use('/api', messagesRoute);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Socket.io connection handling
io.on('connection', (socket) => {
    

    socket.on('sendMessage', (message) => {
        
        io.emit('receiveMessage', message);  // Broadcast message to all clients
    });

    socket.on('disconnect', () => {
        console.log("disconnected");
    });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("connected to database");
        app.listen(PORT, () => {
            console.log(`server running on ${PORT}`)
        });
    })
    .catch((error) => {
        console.error(error);
    });