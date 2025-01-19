const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderUsername: { type: String, required: true },
    receiverUsername: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    seen: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Message', messageSchema);
