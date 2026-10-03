import { useEffect, useRef, useState } from "react";
import ChatWorkspace from "./ChatWorkspace";

export default function CustomerChatWidget({ user, startRequest }) {
  const [open, setOpen] = useState(false);
  const handledRequest = useRef(null);
  useEffect(() => {
    if (startRequest?.id && handledRequest.current !== startRequest.id) {
      handledRequest.current = startRequest.id;
      setOpen(true);
    }
  }, [startRequest]);
  if (!user || user.role !== "CUSTOMER") return null;
  return (
    <div className="customer-chat-launcher">
      {open ? (
        <ChatWorkspace
          key={startRequest?.id || "default"}
          user={user}
          mode="customer"
          initialStoreId={startRequest?.storeId}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button className="chat-fab" onClick={() => setOpen(true)}>
          <span>✳</span> Nhắn tin
        </button>
      )}
    </div>
  );
}
