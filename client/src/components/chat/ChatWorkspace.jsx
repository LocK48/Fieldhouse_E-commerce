import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { refreshAccessToken } from "../../api/axios";
import {
  createConversation,
  getConversations,
  getMessages,
} from "../../api/chat.api";
import { useFeedback } from "../common/FeedbackContext";
import "./Chat.css";

const socketUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
).replace(/\/api\/v1\/?$/, "");
const messageText = (message) => message?.content || "Tệp đính kèm";

export default function ChatWorkspace({
  user,
  mode,
  initialStoreId,
  onClose,
  embedded = false,
}) {
  const { showToast } = useFeedback();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyCursor, setHistoryCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const selectedIdRef = useRef(null);
  const messageRequestRef = useRef(0);
  const endRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const preserveMessageScrollRef = useRef(false);
  const conversationsRef = useRef([]);
  const refreshingSocketTokenRef = useRef(false);
  const activeConversationRef = useRef(activeConversation);
  const activeConversationId = activeConversation?._id;
  const ownId = String(user?.id || user?._id || "");

  const loadConversations = useCallback(
    async (selectId) => {
      try {
        const next = await getConversations();
        conversationsRef.current = next;
        setConversations(next);
        if (selectId) {
          const selected = next.find((item) => item._id === selectId) || null;
          activeConversationRef.current = selected;
          setActiveConversation(selected);
        } else if (!activeConversationRef.current && next.length) {
          activeConversationRef.current = next[0];
          setActiveConversation(next[0]);
        }
        return next;
      } catch (reason) {
        showToast(
          reason.response?.data?.message ||
            reason.message ||
            "Không tải được hội thoại.",
          "error",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const startConversation = useCallback(
    async (type, storeId) => {
      try {
        const created = await createConversation({
          type,
          ...(storeId ? { storeId } : {}),
        });
        const next = await getConversations();
        conversationsRef.current = next;
        setConversations(next);
        const selected =
          next.find((item) => item._id === created._id) || created;
        activeConversationRef.current = selected;
        setActiveConversation(selected);
        return true;
      } catch (reason) {
        showToast(
          reason.response?.data?.message ||
            reason.message ||
            "Không thể bắt đầu hội thoại.",
          "error",
        );
        return false;
      }
    },
    [showToast],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!initialStoreId) return;
    startConversation("STORE", initialStoreId);
  }, [initialStoreId, startConversation]);

  useEffect(() => {
    const token = localStorage.getItem("fieldhouse-access-token");
    if (!token) return undefined;
    const socket = io(socketUrl, {
      auth: (callback) =>
        callback({ token: localStorage.getItem("fieldhouse-access-token") }),
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      refreshingSocketTokenRef.current = false;
      setConnected(true);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      setConnected(false);
      if (
        refreshingSocketTokenRef.current ||
        !/expired|invalid|authentication required/i.test(error.message || "")
      ) return;
      refreshingSocketTokenRef.current = true;
      refreshAccessToken()
        .then((token) => {
          socket.auth = { token };
          socket.connect();
        })
        .catch(() => {
          // Avoid retrying the refresh endpoint on every Socket.IO reconnect attempt.
        });
    });
    socket.on("chat:message:new", (message) => {
      if (String(message.conversation) === String(selectedIdRef.current)) {
        setMessages((items) =>
          items.some((item) => item._id === message._id)
            ? items
            : [...items, message],
        );
      }
      const exists = conversationsRef.current.some(
        (item) => String(item._id) === String(message.conversation),
      );
      const next = conversationsRef.current
          .map((item) =>
            String(item._id) === String(message.conversation)
              ? {
                  ...item,
                  lastMessage: message,
                  lastMessageAt: message.createdAt,
                }
              : item,
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0),
          );
      conversationsRef.current = next;
      setConversations(next);
      if (!exists) {
        getConversations().then((latest) => {
          conversationsRef.current = latest;
          setConversations(latest);
        }).catch(() => {});
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showToast]);

  useEffect(() => {
    selectedIdRef.current = activeConversationId || null;
    const requestId = ++messageRequestRef.current;
    if (!activeConversationId) {
      setMessages([]);
      setMessagesLoading(false);
      setHistoryHasMore(false);
      setHistoryCursor(null);
      return;
    }
    setMessagesLoading(true);
    getMessages(activeConversationId)
      .then((page) => {
        if (requestId === messageRequestRef.current) {
          setMessages(page.messages);
          setHistoryHasMore(page.hasMore);
          setHistoryCursor(page.nextCursor);
        }
      })
      .catch((reason) =>
        {
          if (requestId === messageRequestRef.current) {
            showToast(
              reason.response?.data?.message ||
                reason.message ||
                "Không tải được tin nhắn.",
              "error",
            );
          }
        },
      )
      .finally(() => {
        if (requestId === messageRequestRef.current) setMessagesLoading(false);
      });
  }, [activeConversationId, showToast]);

  async function loadOlderMessages() {
    if (!activeConversationId || !historyHasMore || !historyCursor || loadingOlder) return;
    const container = messagesContainerRef.current;
    const previousHeight = container?.scrollHeight || 0;
    setLoadingOlder(true);
    try {
      const page = await getMessages(activeConversationId, { before: historyCursor });
      if (String(selectedIdRef.current) !== String(activeConversationId)) return;
      setMessages((current) => {
        const known = new Set(current.map((message) => String(message._id)));
        preserveMessageScrollRef.current = true;
        return [...page.messages.filter((message) => !known.has(String(message._id))), ...current];
      });
      setHistoryHasMore(page.hasMore);
      setHistoryCursor(page.nextCursor);
      requestAnimationFrame(() => {
        if (container) container.scrollTop += container.scrollHeight - previousHeight;
      });
    } catch (reason) {
      showToast(reason.message || "Không tải được tin nhắn cũ.", "error");
    } finally {
      setLoadingOlder(false);
    }
  }

  useEffect(() => {
    if (!connected || !activeConversationId) return;
    socketRef.current?.emit(
      "chat:join",
      { conversationId: activeConversationId },
      (result) => {
        if (!result?.success)
          showToast(
            result?.message || "Không thể tham gia hội thoại.",
            "error",
          );
      },
    );
  }, [connected, activeConversationId, showToast]);

  useEffect(() => {
    if (preserveMessageScrollRef.current) {
      preserveMessageScrollRef.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function otherName(conversation) {
    if (conversation.type === "ADMIN")
      return mode === "admin"
        ? conversation.participants?.find(
            (person) => String(person._id) !== ownId,
          )?.name || "Khách hàng"
        : "Chăm sóc khách hàng";
    if (mode === "seller")
      return (
        conversation.participants?.find(
          (person) => String(person._id) !== ownId,
        )?.name || "Khách hàng"
      );
    return conversation.store?.name || "Người bán";
  }

  function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeConversation || sending) return;
    if (!connected) {
      showToast("Đang kết nối lại chat, vui lòng thử sau.", "error");
      return;
    }
    setSending(true);
    socketRef.current
      .timeout(10000)
      .emit(
        "chat:message:send",
        { conversationId: activeConversation._id, content },
        (timeoutError, result) => {
          setSending(false);
          if (timeoutError || !result?.success) {
            showToast(result?.message || "Không gửi được tin nhắn.", "error");
            return;
          }
          setMessages((items) =>
            items.some((item) => item._id === result.message._id)
              ? items
              : [...items, result.message],
          );
          setDraft("");
        },
      );
  }

  return (
    <section
      className={`chat-workspace ${embedded ? "chat-embedded" : ""} chat-mode-${mode}`}
    >
      <aside className="chat-conversation-list">
        <header>
          <div>
            <small>
              {mode === "admin"
                ? "FIELDHOUSE SUPPORT"
                : mode === "seller"
                  ? "SELLER INBOX"
                  : "FIELDHOUSE CHAT"}
            </small>
            <h2>
              {mode === "admin"
                ? "Hỗ trợ khách hàng"
                : mode === "seller"
                  ? "Tin nhắn & hỗ trợ"
                  : "Tin nhắn"}
            </h2>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Đóng hội thoại">
              ×
            </button>
          )}
        </header>
        {(mode === "customer" || mode === "seller") && (
          <div className="chat-start-actions">
            <button onClick={() => startConversation("ADMIN")}>
              ＋ Chat với CSKH / báo lỗi
            </button>
          </div>
        )}
        {loading ? (
          <p className="chat-empty">Đang tải hội thoại…</p>
        ) : conversations.length ? (
          conversations.map((conversation) => (
            <button
              key={conversation._id}
              className={`chat-thread ${activeConversation?._id === conversation._id ? "is-active" : ""}`}
              onClick={() => {
                activeConversationRef.current = conversation;
                setActiveConversation(conversation);
              }}
            >
              <span className="chat-thread-avatar">
                {conversation.type === "ADMIN"
                  ? "F"
                  : otherName(conversation).slice(0, 1).toUpperCase()}
              </span>
              <span className="chat-thread-copy">
                <strong>{otherName(conversation)}</strong>
                <small>
                  {messageText(conversation.lastMessage) ||
                    "Bắt đầu cuộc trò chuyện"}
                </small>
              </span>
              {conversation.lastMessageAt && (
                <time>
                  {new Date(conversation.lastMessageAt).toLocaleDateString(
                    "vi-VN",
                  )}
                </time>
              )}
            </button>
          ))
        ) : (
          <p className="chat-empty">
            {mode === "seller"
              ? "Chưa có khách nhắn tin."
              : mode === "admin"
                ? "Chưa có yêu cầu hỗ trợ."
                : "Chưa có hội thoại. Hãy bắt đầu chat với shop hoặc CSKH."}
          </p>
        )}
      </aside>
      <div className="chat-thread-view">
        {activeConversation ? (
          <>
            <header className="chat-thread-header">
              <span className="chat-thread-avatar">
                {otherName(activeConversation).slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{otherName(activeConversation)}</strong>
                <small>
                  <i className={connected ? "online" : "offline"} />
                  {connected ? "Đang kết nối" : "Đang kết nối lại…"}
                  {activeConversation.store?.name && mode === "seller"
                    ? ` · ${activeConversation.store.name}`
                    : ""}
                </small>
              </div>
            </header>
            <div className="chat-messages" ref={messagesContainerRef}>
              {!messagesLoading && historyHasMore && (
                <button
                  className="chat-load-older"
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
                </button>
              )}
              {messagesLoading ? (
                <p className="chat-empty">Đang tải tin nhắn…</p>
              ) : (
                messages.map((message) => {
                  const senderId = String(
                    message.sender?._id || message.sender,
                  );
                  const mine = senderId === ownId;
                  return (
                    <div
                      key={message._id}
                      className={`chat-message-row ${mine ? "mine" : ""}`}
                    >
                      <span className="chat-message-sender">
                        {mine
                          ? "Bạn"
                          : message.sender?.name ||
                            otherName(activeConversation)}
                      </span>
                      <p>{messageText(message)}</p>
                      <time>
                        {new Date(message.createdAt).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </time>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            <form className="chat-composer" onSubmit={sendMessage}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                rows={1}
                placeholder="Viết tin nhắn…"
                aria-label="Nội dung tin nhắn"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form.requestSubmit();
                  }
                }}
              />
              <button
                disabled={!draft.trim() || sending || !connected}
                aria-label="Gửi tin nhắn"
              >
                {sending ? "…" : "↑"}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <span>✳</span>
            <h3>Cuộc trò chuyện của bạn</h3>
            <p>Chọn hội thoại để đọc tin nhắn hoặc bắt đầu liên hệ.</p>
            {(mode === "customer" || mode === "seller") && (
              <button onClick={() => startConversation("ADMIN")}>
                Liên hệ CSKH / báo lỗi
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
