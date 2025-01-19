const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    fromUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    fromUserName: {type: String, required: true},
    fromUserImageUrl:{type: String, required: true},
    toUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    type: {type: String, required: true},
    message: {type: String, required: true},
    date: {type: Date, default: Date.now},
    isRead: { type: Boolean, default: false },
});

module.exports = mongoose.model('Notification', NotificationSchema);