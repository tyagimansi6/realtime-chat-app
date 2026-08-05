const mongoose = require('mongoose');
require('dotenv').config();

module.exports = () => {
    const chatDB = mongoose.createConnection(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    chatDB.on('connected', () => {
        console.log("MongoDB ChatApp connected");
    });

    chatDB.on('error', (err) => {
        console.error("MongoDB ChatApp error", err);
    });

    return chatDB;
};
