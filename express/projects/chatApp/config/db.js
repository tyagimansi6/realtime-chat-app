const mongoose = require('mongoose');

// Prefer MONGO_URL; accept MONGO_URI for local/compatibility.
function getChatAppMongoUri() {
    return process.env.MONGO_URL || process.env.MONGO_URI || '';
}

module.exports = () => {
    const mongoUri = getChatAppMongoUri();

    if (!mongoUri) {
        console.error(
            '[ChatApp DB] Missing required environment variable: MONGO_URL (or MONGO_URI). ' +
            'Set it in projects/chatApp/.env for local use, or in the Render Environment settings for deployment.'
        );
        const chatDB = mongoose.createConnection();
        chatDB.on('error', (err) => {
            console.error('[ChatApp DB] connection error:', err.name, err.message);
        });
        return chatDB;
    }

    const chatDB = mongoose.createConnection(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    chatDB.on('connected', () => {
        console.log('[ChatApp DB] connected successfully');
    });

    chatDB.on('error', (err) => {
        console.error('[ChatApp DB] connection error:', err.name, err.message);
        if (/SSL|TLS|tlsv|certificate/i.test(err.message)) {
            console.error(
                '[ChatApp DB] TLS/SSL error talking to MongoDB Atlas. ' +
                'Code options are standard; check Atlas Network Access (allow Render IPs or 0.0.0.0/0), ' +
                'cluster status, and that MONGO_URL / MONGO_URI is correct in the host environment.'
            );
        }
    });

    chatDB.on('disconnected', () => {
        console.warn('[ChatApp DB] disconnected');
    });

    return chatDB;
};
