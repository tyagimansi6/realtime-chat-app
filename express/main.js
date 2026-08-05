const path = require('path');
const dotenv = require("dotenv");
// Load chatApp env before any module reads process.env (e.g. JWT_SECRET)
dotenv.config({ path: path.join(__dirname, 'projects/chatApp/.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const nginxRoute = require('./projects/ports.js');
const connectDBChat = require('./projects/chatApp/config/db.js');
const connectDBSolarium = require('./projects/solarium/config/db.js');
const initializeChatSocket = require("./projects/chatApp/middlewares/socketHandler");
const initializeSolariumSocket = require("./projects/solarium/middlewares/socketHandler");

const app = express();
const server = createServer(app);
const PORT = 3000;

// === Connect databases ===
const chatConn = connectDBChat();         // ✅ Only once
const solariumConn = connectDBSolarium(); // ✅ Only once

// === Initialize models with DB connections ===
const ChatModel = require('./projects/chatApp/models/Chat')(chatConn);
const MessageModel = require('./projects/chatApp/models/Message')(chatConn);
const UserModel = require('./projects/chatApp/models/User')(chatConn);


//Pressure point Model

const PressurePointsModel = require('./projects/solarium/models/pressurePoints')(solariumConn);

// === Load express apps (pass connection or models if needed) ===
const chatApp = require('./projects/chatApp/index')({ ChatModel, MessageModel, UserModel });
const solariumApp = require('./projects/solarium/index')(solariumConn);

// === Middleware ===
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// === Socket.IO setup ===
const ioChat = new Server(server, {
  path: "/chatApp/socket.io",
  cors: { origin: true, credentials: true, methods: ["GET", "POST"] }
});

const ioSolarium = new Server(server, {
  path: "/solarium/socket.io",
  cors: { origin: true, credentials: true, methods: ["GET", "POST"] }
});

// === Initialize socket handlers ===
initializeChatSocket(ioChat, { Chat: ChatModel, Message: MessageModel, User: UserModel });
initializeSolariumSocket(ioSolarium , {PressurePoints:PressurePointsModel});

// === Attach correct socket instance to requests ===
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/chatApp')) req.io = ioChat;
  else if (req.originalUrl.startsWith('/solarium')) req.io = ioSolarium;
  next();
});

// === Mount routes ===
app.use('/nginx', nginxRoute);
app.use('/chatApp', chatApp);
app.use('/solarium', solariumApp);

// === Start server ===
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
