const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/chatApp/socket.io",
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  socket.emit("setup", "your_user_id_here");
  socket.emit("joinChat", "your_chat_id_here");

  // Send a test message (if backend supports it via socket)
  socket.emit("sendMessage", {
    chatId: "your_chat_id_here",
    content: "Hello from test client",
    sender: "your_user_id_here"
  });
});

socket.on("receiveMessage", (msg) => {
  console.log("📥 Message received:", msg);
});
