const { AccessToken } = require("livekit-server-sdk");

const onlineUsers = new Map();

const emitOnlineUsers = (io) => {
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
};

const initializeSocketIO = (io, { Chat, Message, User }) => {
    io.on("connection", (socket) => {
        console.log(`Client Connected: ${socket.id}`);

        socket.on('setup', (userId) => {
            socket.join(userId);
            socket.emit('connected');
            if (userId) {
                socket.userId = userId;
                onlineUsers.set(userId, socket.id);
                emitOnlineUsers(io);
                console.log(`User ${userId} setup and joined personal room.`);
            }
        });

        socket.on('joinChat', (chatId, callback) => {
            socket.join(chatId);
            console.log(`User ${socket.id} joined chat room: ${chatId}`);
            if (callback && typeof callback === 'function') {
                callback({ success: true, message: "Joined chat successfully" });
            }
        });

        socket.on('newMessage', async (messageData) => {
            const { chatId, message, senderId } = messageData;
            const savedMessage = await Message.create({
                chat: chatId,
                sender: senderId,
                content: message
            });
            const populatedMessage = await savedMessage.populate([
                { path: 'sender', select: 'username email' },
                { path: 'chat', populate: { path: 'participants', select: 'username email' } }
            ]);
            await Chat.findByIdAndUpdate(chatId, { latestMessage: savedMessage._id });
            socket.to(chatId).emit('messageReceived', populatedMessage);
            console.log(`Message sent in chat ${chatId} by ${senderId}`);
        });

        socket.on('typing', ({ chatId, user }) => {
            socket.to(chatId).emit('typing', { user, chatId });
        });

        socket.on('stopTyping', ({ chatId, user }) => {
            socket.to(chatId).emit('stopTyping', { user, chatId });
        });

        socket.on('initiateVideoCall', async ({ chatId }) => {
            try {
                const chat = await Chat.findById(chatId).populate('participants', 'username email');
                if (chat) {
                    const initiatorId = socket.userId;
                    if (initiatorId) {
                        socket.to(chatId).emit('videoCallInitiated', { chat, initiatorId });
                        console.log(`Video call initiated in chat ${chatId} by user ${initiatorId}`);
                    } else {
                        console.error('Could not identify video call initiator: socket.userId not set.');
                    }
                }
            } catch (error) {
                console.error('Error initiating video call:', error);
            }
        });

        socket.on('leaveVideoCall', ({ chatId }) => {
            socket.to(chatId).emit('videoCallEnded', { chatId });
            console.log(`A user left the video call in chat ${chatId}. Notifying room.`);
        });
        // --- End of Video Call Handlers ---

        socket.on('join-video-room', async (data, callback) => {
            const { roomId, creator } = data;
            try {
                let token = new AccessToken(
                    process.env.LIVEKIT_API_KEY,
                    process.env.LIVEKIT_API_SECRET,
                    { identity: creator, ttl: '1h' }
                );
                token.addGrant({
                    roomJoin: true,
                    room: roomId,
                    canPublish: true,
                    canSubscribe: true,
                });
                const jwt = await token.toJwt();
                callback({ success: true, token: jwt });
            } catch (error) {
                console.error("Error generating Video Token", error);
                callback({ success: false, message: "Could not generate token." });
            }
        });

        socket.on("disconnect", () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                emitOnlineUsers(io);
            }
            console.log(`Client Disconnected: ${socket.id}`);
        });
    });
};

module.exports = initializeSocketIO;
