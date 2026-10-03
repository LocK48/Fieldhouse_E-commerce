const service = require("../services/chat.service");

const listConversations = async (req, res) =>
  res.json({
    success: true,
    data: { conversations: await service.getConversations(req.user) },
  });

const createConversation = async (req, res) => {
  const conversation = await service.createConversation(req.user, req.body);
  await conversation.populate([
    { path: "participants", select: "name avatar role" },
    { path: "store", select: "name slug logo" },
  ]);
  res.status(201).json({ success: true, data: { conversation } });
};

const getMessages = async (req, res) =>
  res.json({
    success: true,
    data: {
      messages: await service.getMessages(req.user, req.params.conversationId),
    },
  });

module.exports = { listConversations, createConversation, getMessages };
