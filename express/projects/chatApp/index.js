const express = require('express');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

module.exports = ({ ChatModel, MessageModel, UserModel }) => {
    const router = express.Router();

    // You can inject these models into controllers as needed

    router.use('/auth', authRoutes);
    router.use('/chat', chatRoutes);

    return router;
};
