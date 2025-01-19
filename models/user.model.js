const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


// Define the User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    googleUserId: {
        type: String,
        required: false
    },
    isVerified: {
        type: Boolean,
        deafult: false
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    // email: {
    //     type: String,
    //     required: false,
        
    // },
    hustle: {
        type: String,
        required: false
    },
    creative: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: false
    },
    fcmToken: String,
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    uploads: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    likedPosts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    likedConnectedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConnectedPost'
    }],
    connectedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConnectedPost'
    }],
    reactedPost:[
        {
            postId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Post'
            },
            reaction:{
                type:String
            }
        }
    ]
}, { timestamps: true });



// Export the User model
module.exports = mongoose.model('User', UserSchema);
