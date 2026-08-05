const router = require('express').Router();
const chatDB = require('../config/db')();

const Chat = require('../models/Chat')(chatDB);
const Message = require('../models/Message')(chatDB);
const User = require('../models/User')(chatDB);
const File = require('../models/File')(chatDB);
const {Storage} = require('@google-cloud/storage');


const storage = new Storage();
const bucketName = 'devclub_bucket';

// Pass scoped models into controller
const chatController = require('../controllers/chatController')({ Chat, Message, User , File  , storage , bucketName });

// Middleware (needs to also be scoped)
const authorizer = require('../middlewares/authorizer')(User);

router.post('/sendMessage', authorizer, chatController.sendMessage);
router.post('/newChat', authorizer, chatController.newChat);
router.post('/getChats', authorizer, chatController.getChats);
router.post('/getMessages', authorizer, chatController.getMessages);
router.get('/allUsers', authorizer, chatController.getAllUsers);
router.post('/getUploadUrl', authorizer, chatController.getUploadUrl);
router.post('/getDownloadUrl',authorizer, chatController.getDownloadUrl);

module.exports = router;
