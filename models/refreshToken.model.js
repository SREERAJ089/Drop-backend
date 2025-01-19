const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: String,
    username: String,
    expiresAt: Date,
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
