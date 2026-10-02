import api from "./axios";

export async function getConversations() {
  const response = await api.get("/chat/conversations");
  return response.data.data.conversations;
}

export async function createConversation(input) {
  const response = await api.post("/chat/conversations", input);
  return response.data.data.conversation;
}

export async function getMessages(conversationId) {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`);
  return response.data.data.messages;
}
