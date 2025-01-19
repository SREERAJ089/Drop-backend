const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    imageUrl: { 
        type: String,
        required: true,
    },
    uploadedShots: [{
        type: String,
        required: false
    }],
    isEnabledAnonymous: {
        type: Boolean,
        required: true,
    },
    likes: [
        {   type: mongoose.Schema.Types.ObjectId,
            ref : 'User'
        }
    ],
    connections: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    reactions: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            reaction: {
                type: String,
            }
        }
       
    ],
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
