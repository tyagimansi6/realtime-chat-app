const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: {
        type: String, required: true, unique: true, trim: true, lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: { type: String, required: true }
}, { timestamps: true });

// ✅ Export factory that takes in a connection
module.exports = (conn) => conn.model('User', userSchema);
