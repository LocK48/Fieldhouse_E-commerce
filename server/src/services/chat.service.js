const { Conversation, Message, Store } = require("../models");
const AppError = require("../utils/AppError");

const getConversations = async (user) => {
  let filter;
  if (user.role === "ADMIN") {
    filter = { type: "ADMIN" };
  } else if (user.role === "SELLER") {
    const store = await Store.findOne({ owner: user._id });
    if (!store) return [];
    filter = { type: "STORE", store: store._id };
  } else {
    filter = { participants: user._id };
  }

  return Conversation.find(filter)
    .populate("participants", "name avatar role")
    .populate({ path: "store", select: "name slug logo" })
    .populate({ path: "lastMessage", populate: { path: "sender", select: "name" } })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();
};

const createConversation = async (user, { type, storeId }) => {
  if (user.role !== "CUSTOMER") {
    throw new AppError("Only customers can start a conversation", 403);
  }

  if (type === "ADMIN") {
    const existing = await Conversation.findOne({ type: "ADMIN", store: null, participants: user._id });
    if (existing) return existing;
    return Conversation.create({ type: "ADMIN", store: null, participants: [user._id] });
  }

  const store = await Store.findOne({ _id: storeId, status: "ACTIVE" }).select("_id owner");
  if (!store) throw new AppError("Store not found", 404);
  if (String(store.owner) === String(user._id)) {
    throw new AppError("You cannot start a customer conversation with your own store", 400);
  }
  const existing = await Conversation.findOne({
    type: "STORE",
    store: store._id,
    participants: { $all: [user._id, store.owner] },
  });
  if (existing) return existing;
  return Conversation.create({ type: "STORE", store: store._id, participants: [user._id, store.owner] });
};

const getAccessibleConversation = async (user, conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);

  const isParticipant = conversation.participants.some((id) => String(id) === String(user._id));
  const isSupportAgent = user.role === "ADMIN" && conversation.type === "ADMIN";
  let isStoreOwner = false;
  if (user.role === "SELLER" && conversation.type === "STORE") {
    isStoreOwner = Boolean(await Store.exists({ _id: conversation.store, owner: user._id }));
  }
  if (!isParticipant && !isSupportAgent && !isStoreOwner) {
    throw new AppError("You cannot access this conversation", 403);
  }
  return conversation;
};

const getMessages = async (user, conversationId) => {
  const conversation = await getAccessibleConversation(user, conversationId);
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: user._id }, isRead: false },
    { $set: { isRead: true } },
  );
  return Message.find({ conversation: conversation._id })
    .populate("sender", "name avatar role")
    .sort({ createdAt: 1 })
    .limit(300)
    .lean();
};

const sendMessage = async (user, conversationId, input) => {
  const content = typeof input === "string" ? input.trim() : "";
  if (!content || content.length > 2000) throw new AppError("Message must be between 1 and 2000 characters", 400);
  const conversation = await getAccessibleConversation(user, conversationId);
  if (conversation.type === "ADMIN" && user.role === "ADMIN") {
    await Conversation.updateOne({ _id: conversation._id }, { $addToSet: { participants: user._id } });
  }
  const message = await Message.create({ conversation: conversation._id, sender: user._id, type: "TEXT", content });
  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { lastMessage: message._id, lastMessageAt: message.createdAt } },
  );
  return Message.findById(message._id).populate("sender", "name avatar role").lean();
};

module.exports = { getConversations, createConversation, getAccessibleConversation, getMessages, sendMessage };
