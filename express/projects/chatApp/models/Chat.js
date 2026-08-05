const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    isGroupChat: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        default: ''
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
});

// ✅ Scoped model factory
module.exports = (conn) => conn.model('Chat', chatSchema);
