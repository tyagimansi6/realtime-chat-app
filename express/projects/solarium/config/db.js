const mongoose = require('mongoose');
require('dotenv').config();

module.exports = () => {
    const mongoDB = mongoose.createConnection(process.env.SOLARIUM_MONGO, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    mongoDB.on('connected', () => {
        console.log("MongoDB Solarium connected");
    });

    mongoDB.on('error', (err) => {
        console.error("MongoDB Solarium error", err);
    });

    return mongoDB;
};
