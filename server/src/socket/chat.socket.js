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
    socket.join(`user:${socket.data.user._id}`);
    if (socket.data.user.role === "ADMIN") socket.join("role:ADMIN");

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
        const result = await chatService.sendMessage(socket.data.user, conversationId, content);
        const rooms = [
          `conversation:${conversationId}`,
          ...result.participantIds
            .filter((id) => id !== String(socket.data.user._id))
            .map((id) => `user:${id}`),
        ];
        if (result.type === "ADMIN") rooms.push("role:ADMIN");
        io.to(rooms).emit("chat:message:new", result.message);
        acknowledge({ success: true, message: result.message });
      } catch (error) {
        acknowledge({ success: false, message: error.message || "Could not send message" });
      }
    });
  });
};

module.exports = registerChatSocket;
