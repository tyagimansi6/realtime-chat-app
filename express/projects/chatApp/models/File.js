const mongoose = require('mongoose');
const {Schema} = require("mongoose");


const File = new mongoose.Schema({
    originalFilename:String,
    fileKey:{type: String,unique:true,required: true},
    fileSizeBytes:Number,
    fileType: String,
    sender : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    authorizedUsers:[{type: Schema.Types.ObjectId, ref: 'User'}],
    chatId : {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    message:{type: Schema.Types.ObjectId, ref: 'Message'},
    media : {
        type: String,
    },
    seenBy : [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }]
},{timestamps : true})

module.exports = (conn) => conn.model('File', File);
