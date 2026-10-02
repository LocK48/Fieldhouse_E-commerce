require("dotenv").config();

const http = require("node:http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDatabase = require("./config/database");
const registerChatSocket = require("./socket/chat.socket");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true },
  });
  registerChatSocket(io);
  server.listen(PORT, () => {
    console.log(`Fieldhouse API running on port ${PORT}`);
  });
};

startServer();
