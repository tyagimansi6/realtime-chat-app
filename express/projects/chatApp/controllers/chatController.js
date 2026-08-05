const path = require('path');
module.exports = ({Chat, Message, User, File, storage, bucketName}) => ({

    sendMessage: async (req, res) => {
        const {content, chatId} = req.body;

        if (!content || !chatId) {
            return res.status(400).json({success: false, message: "Missing content or chatId"});
        }

        try {
            let newMessage = await Message.create({
                sender: req.user._id,
                content,
                chat: chatId
            });

            newMessage = await newMessage.populate([
                {path: 'sender', select: 'username email'},
                {path: 'attachment', select: ''},
                {
                    path: 'chat',
                    populate: {
                        path: 'participants',
                        select: 'username email'
                    }
                }
            ]);

            await Chat.findByIdAndUpdate(chatId, {latestMessage: newMessage});

            // Broadcast to all users in the chat except the sender
            // Get all participants in the chat
            const participants = newMessage.chat.participants.map(p => p._id.toString());

            // Broadcast to each participant except the sender
            participants.forEach(participantId => {
                if (participantId !== req.user._id.toString()) {
                    req.io.to(participantId).emit('messageReceived', newMessage);
                    // console.log(`message sent by ${req.user._id} to ${participantId}`)
                }
            });

            res.status(200).json(newMessage);
        } catch (err) {
            console.error("Error sending message:", err.message);
            return res.status(500).json({success: false, message: "Error sending message"});
        }
    },
    getUploadUrl: async (req, res) => {
        try {
            const MAX_FILE_SIZE = 10 * 1024 * 1024;
            const {filename, contentType, chatId, content} = req.body;

            if (!filename || !contentType || !chatId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: filename, contentType, and chatId."
                });
            }

            const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
            const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
            const file = storage.bucket(bucketName).file(uniqueFilename);

            const [policy] = await file.generateSignedPostPolicyV4({
                expires: Date.now() + 15 * 60 * 1000,
                fields: {
                    'Content-Type': contentType
                },
                conditions: [
                    ['content-length-range', 0, MAX_FILE_SIZE],
                    ['eq', '$Content-Type', contentType]
                ],
            });

            const chat = await Chat.findById(chatId).select('participants');
            if (!chat) {
                return res.status(404).json({
                    success: false,
                    message: "Invalid ChatID: Chat not found."
                });
            }

            const newFile = await File.create({
                originalFilename: filename,
                fileKey: uniqueFilename,
                sender: req.user.id,
                chatId: chatId,
                fileType: contentType,
                authorizedUsers: chat.participants,
                contentType: contentType,
            });

            let newMessage = await Message.create({
                sender: req.user._id,
                content: content || "Attachment",
                chat: chatId,
                hasAttachment: true,
                attachment: newFile._id,
            });

            newMessage = await newMessage.populate([
                {path: 'sender', select: 'username email'},
                {path: 'attachment', select: ''},
                {
                    path: 'chat',
                    populate: {
                        path: 'participants',
                        select: 'username email'
                    }
                }
            ]);

            await Chat.findByIdAndUpdate(chatId, {latestMessage: newMessage._id});

            const participants = newMessage.chat.participants.map(p => p._id.toString());
            participants.forEach(participantId => {
                if (participantId !== req.user._id.toString()) {
                    req.io.to(participantId).emit('messageReceived', newMessage);
                }
            });

            return res.status(200).json({
                success: true,
                uploadUrl: policy.url,
                uploadFields: policy.fields,
                fileKey: uniqueFilename,
                file: newMessage
            });

        } catch (error) {
            console.error("Error in getUploadUrl:", error);
            return res.status(500).json({
                success: false,
                message: "An internal server error occurred. Ensure file size is under 10MB."
            });
        }
    },

    newChat: async (req, res) => {
        try {
            const {name, participants} = req.body;
            const groupAdmin = req.user._id;
            const isGroupChat = participants.length !== 2;

            if (!participants.includes(groupAdmin.toString())) {
                return res.status(401).json({success: false, message: "Select yourself"});
            }

            if (!name && isGroupChat) {
                return res.status(400).json({success: false, message: "Missing name chat"});
            }

            if (!participants || participants.length < 2) {
                return res.status(400).json({success: false, message: "Missing participants"});
            }

            const existingChat = await Chat.findOne({
                participants: {
                    $all: participants,
                    $size: participants.length
                }
            });

            if (existingChat) {
                return res.status(400).json({success: false, message: "Chat already exists with these participants."});
            }

            let newChat = await Chat.create({
                participants,
                name,
                groupAdmin,
                isGroupChat
            });

            const welcomeContent = isGroupChat
                ? `Welcome to the group "${name}"`
                : `Private chat started`;

            const welcomeMessage = await Message.create({
                sender: groupAdmin,
                content: welcomeContent,
                chat: newChat._id
            });

            newChat.latestMessage = welcomeMessage._id;

            newChat = await newChat.populate([
                {path: 'groupAdmin', select: 'username email'},
                {path: 'participants', select: 'username email'},
                {path: 'latestMessage', select: 'content chat sender media'}
            ]);


            await newChat.save();

            participants
                .filter(participant => participant !== req.user._id.toString())
                .forEach(participant => {
                    console.log("Participants are : ", participants);
                    req.io.to(participant).emit("newChatCreated", newChat);
                    req.io.emit("test", "fuckYou")
                    req.io.to(participant).emit("test","Cheater");
                    req.io.to("688f3064853c549afa17f7cf").emit("test","looser")
                    console.log('intimation sent to ', participant);
                });

            res.status(200).json({chat: newChat, success: true, message: "Chat created successfully."});

        } catch (err) {
            console.error("Error creating chat:", err.message);
            return res.status(500).json({success: false, message: "Error creating chat."});
        }
    },

    getChats: async (req, res) => {
        try {
            const user = req.user.id;

            const chats = await Chat.find({participants: {$in: user}})
                .populate([
                    {path: 'groupAdmin', select: 'username email'},
                    {path: 'participants', select: 'username email'},
                    {path: 'latestMessage', select: 'content chat sender media'}
                ]);

            return res.status(200).json(chats);
        } catch (err) {
            console.error("Error getting chats from chat:", err.message);
            return res.status(500).json({success: false, message: "Error getting chats"});
        }
    },

    getMessages: async (req, res) => {
        try {
            const chat = req.body.chat;
            const messages = await Message.find({chat}).populate([
                {path: 'sender', select: 'username email _id'}, {path: 'attachment', select: ''}
            ]);
            return res.status(200).json(messages);
        } catch (err) {
            console.error("Error getting messages:", err.message);
            return res.status(500).json({success: false, message: "Error getting messages"});
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const allUsers = await User.find({}).select('_id email username');
            return res.status(200).json(allUsers);
        } catch (err) {
            console.error("Error getting users:", err.message);
            return res.status(500).json({success: false, message: "Error getting Users."});
        }
    },


    getDownloadUrl: async (req, res) => {

        try {
            const {fileKey} = req.body;
            const userId = req.user.id;

            if (!fileKey) {
                return res.status(400).json({success: false, message: "File key is required."});
            }

            //PERMISSION CHECK ---
            const file = await File.findOne({fileKey: fileKey, authorizedUsers: userId});
            if (!file) {
                return res.status(403).json({success: false, message: "Forbidden"});
            }

            const options = {
                version: 'v4',
                action: 'read',
                expires: Date.now() + 10 * 60 * 1000,
            };

            const [url] = await storage
                .bucket(bucketName)
                .file(fileKey)
                .getSignedUrl(options);

            return res.status(200).json({
                success: true,
                downloadUrl: url
            });

        } catch (error) {
            console.error("Error generating download URL:", error);
            return res.status(500).json({success: false, message: "Could not generate download URL."});
        }
    }

});
