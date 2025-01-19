const mongoose = require('mongoose');

const ConnectedPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    referencePostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    createdAt: { type: Date, default: Date.now },
    likes: [
        {   type: mongoose.Schema.Types.ObjectId,
            ref : 'User'
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
});

module.exports = mongoose.model('ConnectedPost', ConnectedPostSchema);