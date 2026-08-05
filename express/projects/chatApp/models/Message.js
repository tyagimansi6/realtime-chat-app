const mongoose = require('mongoose');
const {Schema} = require("mongoose");


const chatMessage = new mongoose.Schema({
    sender : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content : {
        type: String,
        required: true
    },
    chat : {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    media : {
        type: String,
    },

    hasAttachment:Boolean,
    attachment : {type: Schema.Types.ObjectId, ref: 'File'}
    ,
    seenBy : [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }]
},{timestamps : true})

module.exports = (conn) => conn.model('Message', chatMessage);
