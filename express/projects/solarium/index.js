// ✅ Correct in ./projects/solarium/index.js
const express = require("express/lib/express");
const rootRoutes = require("./routes/rootRoute");
module.exports = (conn) => {
    const express = require('express');
    const router = express.Router();

    // use `conn` here if needed

    router.get('/', (req, res) => {
        res.send("Solarium connected.");
    });
    router.use('/api',rootRoutes );

    return router;
};
