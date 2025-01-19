const mongoose = require('mongoose');

const verifiedUserSchema = new mongoose.Schema({
    username: {
        type: String,
    },
});

const VerifiedUser = mongoose.model('VerifiedUser', verifiedUserSchema);

module.exports = VerifiedUser;