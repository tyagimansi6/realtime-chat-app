const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // 1hr expiry
}, { timestamps: false });

module.exports = (conn)=>conn.model('PasswordResetToken', passwordResetTokenSchema);
