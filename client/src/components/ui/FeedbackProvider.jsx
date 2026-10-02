import { useCallback, useEffect, useRef, useState } from "react";
import { FeedbackContext } from "./FeedbackContext";
import "./FeedbackProvider.css";

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const sequence = useRef(0);
  const resolveConfirmation = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    sequence.current += 1;
    setToast({ id: sequence.current, message, type });
  }, []);

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    resolveConfirmation.current = resolve;
    setConfirmation({
      title: options.title || "Bạn có chắc chắn?",
      description: options.description || "Thao tác này sẽ cập nhật dữ liệu của bạn.",
      confirmLabel: options.confirmLabel || "Xác nhận",
      cancelLabel: options.cancelLabel || "Quay lại",
      danger: options.danger !== false,
    });
  }), []);

  const finishConfirmation = useCallback((accepted) => {
    resolveConfirmation.current?.(accepted);
    resolveConfirmation.current = null;
    setConfirmation(null);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!confirmation) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") finishConfirmation(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmation, finishConfirmation]);

  return (
    <FeedbackContext.Provider value={{ showToast, confirm }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toast && (
          <div key={toast.id} className={`app-toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
            <span className="toast-icon" aria-hidden="true">{toast.type === "error" ? "!" : "✓"}</span>
            <p>{toast.message}</p>
            <button className="toast-close" onClick={() => setToast(null)} aria-label="Đóng thông báo">×</button>
            <span className="toast-progress" />
          </div>
        )}
      </div>
      {confirmation && (
        <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) finishConfirmation(false); }}>
          <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <span className={`confirm-symbol ${confirmation.danger ? "confirm-danger" : "confirm-neutral"}`} aria-hidden="true">{confirmation.danger ? "!" : "?"}</span>
            <h2 id="confirm-title">{confirmation.title}</h2>
            <p id="confirm-description">{confirmation.description}</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => finishConfirmation(false)}>{confirmation.cancelLabel}</button>
              <button className={confirmation.danger ? "confirm-submit confirm-submit-danger" : "confirm-submit"} onClick={() => finishConfirmation(true)} autoFocus>{confirmation.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
