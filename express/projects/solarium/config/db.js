const mongoose = require('mongoose');

module.exports = () => {
    const mongoUri = process.env.SOLARIUM_MONGO || '';

    if (!mongoUri) {
        console.error(
            '[Solarium DB] Missing required environment variable: SOLARIUM_MONGO. ' +
            'Set it in projects/solarium/.env or express/.env for local use, ' +
            'or in the Render Environment settings for deployment.'
        );
        const mongoDB = mongoose.createConnection();
        mongoDB.on('error', (err) => {
            console.error('[Solarium DB] connection error:', err.name, err.message);
        });
        return mongoDB;
    }

    const mongoDB = mongoose.createConnection(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    mongoDB.on('connected', () => {
        console.log('[Solarium DB] connected successfully');
    });

    mongoDB.on('error', (err) => {
        console.error('[Solarium DB] connection error:', err.name, err.message);
        if (/SSL|TLS|tlsv|certificate/i.test(err.message)) {
            console.error(
                '[Solarium DB] TLS/SSL error talking to MongoDB Atlas. ' +
                'Check Atlas Network Access, cluster status, and SOLARIUM_MONGO in the host environment.'
            );
        }
    });

    mongoDB.on('disconnected', () => {
        console.warn('[Solarium DB] disconnected');
    });

    return mongoDB;
};
