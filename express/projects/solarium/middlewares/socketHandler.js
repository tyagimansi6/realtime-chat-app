/**
 * Initializes Socket.IO listeners for the application.
 * @param {object} io - The Socket.IO server instance.
 * @param {object} models - An object containing Mongoose models, e.g., { PressurePoints }.
 */
const initializeSocketIO = (io, { PressurePoints }) => {
    console.log("Socket.IO Initialized and ready for connections.");

    // This event fires for every new client that connects to the server
    io.on("connection", (socket) => {
        console.log(`Client Connected: ${socket.id}`);

        /**
         * Listens for a 'pressureData' event from any connected client.
         * This is the primary mechanism for receiving real-time data.
         * The 'data' parameter is the payload sent from the client.
         */
        socket.on("pressureData", async (data) => {
            console.log(`Received 'pressureData' from client ${socket.id}:`, data);

            // 1. Validate incoming data
            if (!Array.isArray(data)) {
                console.error(`Invalid data from ${socket.id}. Expected an array, got ${typeof data}.`);
                // Optionally, notify the sender of the error
                socket.emit("dataError", { message: "Invalid data format. Payload must be an array." });
                return; // Stop processing
            }

            try {
                // 2. Save the data to the database
                // Create a new document using the PressurePoints model
                const newPressurePoint = new PressurePoints({
                    data: data
                });

                // Save the document to MongoDB
                const savedPoint = await newPressurePoint.save();
                console.log(`Data from ${socket.id} saved to MongoDB with ID: ${savedPoint._id}`);

                // 3. Broadcast the newly saved data to ALL connected clients
                // We broadcast the 'savedPoint' object because it includes the
                // database-generated _id and timestamps.
                // We use 'io.emit' to send the message to everyone.
                // The event is named 'dataUpdate' to distinguish it from the incoming event.
                io.emit("dataUpdate", savedPoint);
                console.log(`Broadcasted 'dataUpdate' to all clients.`);

            } catch (error) {
                console.error("Error processing 'pressureData':", error);
                // If a database error occurs, notify the original sender
                socket.emit("dbError", { message: "Failed to save data to the database.", error: error.message });
            }
        });


        socket.on("disconnect", () => {
            console.log(`Client Disconnected: ${socket.id}`);
        });
    });
};

module.exports = initializeSocketIO;
