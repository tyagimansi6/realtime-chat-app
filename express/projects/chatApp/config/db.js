const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://archanatyagi209_db_user:YHpkNqwTCWzEwSce@cluster0.dqgwmoy.mongodb.net/chatapp?appName=Cluster0";

module.exports = () => {
    const chatDB = mongoose.createConnection(MONGO_URL, {
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