const { verifyAccessToken } = require("../utils/jwt");
const { User } = require("../models");
const chatService = require("../services/chat.service");

const registerChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Authentication required");
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId).select("_id name role isActive");
      if (!user || !user.isActive) throw new Error("User is not available");
      socket.data.user = { _id: user._id, name: user.name, role: user.role };
      next();
    } catch (error) {
      next(new Error(error.message || "Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", async ({ conversationId } = {}, acknowledge = () => {}) => {
      try {
        const conversation = await chatService.getAccessibleConversation(socket.data.user, conversationId);
        socket.join(`conversation:${conversation._id}`);
        acknowledge({ success: true });
      } catch (error) {
        acknowledge({ success: false, message: error.message });
      }
    });

    socket.on("chat:message:send", async ({ conversationId, content } = {}, acknowledge = () => {}) => {
      try {
        const message = await chatService.sendMessage(socket.data.user, conversationId, content);
        io.to(`conversation:${conversationId}`).emit("chat:message:new", message);
        acknowledge({ success: true, message });
      } catch (error) {
        acknowledge({ success: false, message: error.message || "Could not send message" });
      }
    });
  });
};

module.exports = registerChatSocket;
