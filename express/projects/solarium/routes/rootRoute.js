const router = require('express').Router();
const solariumDB = require('../config/db')();


const PressurePoints= require('../models/pressurePoints')(solariumDB);

router.get("/health", (req, res) => {
    return res.json({status: "Healthy",dateTime: Date.now()});
});

router.post('/send', async (req, res) => {
    const { data } = req.body;

    // Basic validation
    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid input. 'data' field must be an array." });
    }

    try {
        const newPressurePoint = new PressurePoints({
            data: data
        });

        const savedPoint = await newPressurePoint.save();

        // *** Broadcast the new data to all WebSocket clients ***
        req.io.emit("pressureData", savedPoint);
        console.log(`API Insert: Broadcasted new data point ${savedPoint._id} to all clients.`);

        res.status(201).json(savedPoint); // 201 Created status

    } catch (error) {
        console.error("API Error on POST /points:", error);
        res.status(500).json({ message: "Server error while saving data.", error: error.message });
    }
});





router.get('/latest', async (req, res) => {
    try {
        // Find one record, sort by createdAt in descending order (-1) to get the latest.
        const latestPoint = await PressurePoints.findOne().sort({ createdAt: -1 });

        if (!latestPoint) {
            return res.status(404).json({ message: "No records found." });
        }

        res.status(200).json(latestPoint);

    } catch (error) {
        console.error("API Error on GET /points/latest:", error);
        res.status(500).json({ message: "Server error while retrieving data.", error: error.message });
    }
});





router.get('/records', async (req, res) => {

    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    try {
        // Find records, sort by createdAt descending, and limit the results.
        const points = await PressurePoints.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json(points);
    } catch (error) {
        console.error("API Error on GET /points:", error);
        res.status(500).json({ message: "Server error while retrieving data.", error: error.message });
    }
});






module.exports = router;
