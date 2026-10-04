const { Conversation, Message, Store } = require("../models");
const AppError = require("../utils/AppError");

const upsertConversation = async (conversationKey, fields) => {
  try {
    return await Conversation.findOneAndUpdate(
      { conversationKey },
      { $setOnInsert: { ...fields, conversationKey } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Conversation.findOne({ conversationKey });
  }
};

const bindConversationKey = async (conversation, conversationKey) => {
  try {
    await Conversation.updateOne(
      { _id: conversation._id, conversationKey: { $exists: false } },
      { $set: { conversationKey } },
    );
    return conversation;
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Conversation.findOne({ conversationKey });
  }
};

const getConversations = async (user) => {
  let filter;
  if (user.role === "ADMIN") {
    filter = { $or: [{ type: "ADMIN" }, { type: "STORE", participants: user._id }] };
  } else if (user.role === "SELLER") {
    const store = await Store.findOne({ owner: user._id });
    filter = {
      $or: [
        // Sellers may also contact other shops as buyers. Include every
        // conversation they participate in, not only their own store inbox.
        { participants: user._id },
        ...(store ? [{ type: "STORE", store: store._id }] : []),
      ],
    };
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
  if (type === "ADMIN") {
    if (user.role === "ADMIN") {
      throw new AppError("Admin accounts cannot open a support conversation with themselves", 400);
    }
    const conversationKey = `admin:${user._id}`;
    const existing = await Conversation.findOne({ type: "ADMIN", store: null, participants: user._id });
    if (existing) return bindConversationKey(existing, conversationKey);
    return upsertConversation(conversationKey, {
      type: "ADMIN",
      store: null,
      participants: [user._id],
    });
  }

  const store = await Store.findOne({ _id: storeId, status: "ACTIVE" }).select("_id owner");
  if (!store) throw new AppError("Store not found", 404);
  if (String(store.owner) === String(user._id)) {
    throw new AppError("You cannot start a customer conversation with your own store", 400);
  }
  const participants = [String(user._id), String(store.owner)].sort();
  const conversationKey = `store:${store._id}:${participants.join(":")}`;
  const existing = await Conversation.findOne({
    type: "STORE",
    store: store._id,
    participants: { $all: [user._id, store.owner] },
  });
  if (existing) return bindConversationKey(existing, conversationKey);
  return upsertConversation(conversationKey, {
    type: "STORE",
    store: store._id,
    participants: [user._id, store.owner],
  });
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

const getMessages = async (user, conversationId, { before, limit = 50 } = {}) => {
  const conversation = await getAccessibleConversation(user, conversationId);
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const filter = { conversation: conversation._id };
  if (before) {
    const cursor = await Message.findOne({ _id: before, conversation: conversation._id })
      .select("_id createdAt")
      .lean();
    if (!cursor) throw new AppError("Invalid message history cursor", 400);
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ];
  }
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: user._id }, isRead: false },
    { $set: { isRead: true } },
  );
  const results = await Message.find(filter)
    .populate("sender", "name avatar role")
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .lean();
  const hasMore = results.length > pageSize;
  const messages = results.slice(0, pageSize).reverse();
  return {
    messages,
    hasMore,
    nextCursor: hasMore ? String(messages[0]._id) : null,
  };
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
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "name avatar role")
    .lean();
  const participantIds = conversation.participants.map(String);
  if (conversation.store) {
    const store = await Store.findById(conversation.store).select("owner").lean();
    if (store?.owner) participantIds.push(String(store.owner));
  }
  return {
    message: populatedMessage,
    participantIds: [...new Set(participantIds)],
    type: conversation.type,
  };
};

module.exports = { getConversations, createConversation, getAccessibleConversation, getMessages, sendMessage };
