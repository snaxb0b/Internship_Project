import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { ToastContext } from "../context/toastContext";
import Icon from "./Icon";


const TOAST_ICON = {
  success: "check",
  error: "alert",
  info: "info",
};


function ToastProvider({ children }) {
  const [toasts, setToasts] =
    useState([]);

  const timers = useRef(new Map());
  const nextId = useRef(0);


  const dismissToast = useCallback(
    (id) => {
      setToasts((current) =>
        current.filter(
          (toast) => toast.id !== id
        )
      );

      const timer =
        timers.current.get(id);

      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    },
    []
  );


  const showToast = useCallback(
    ({
      type = "info",
      message,
      duration = 4200,
    }) => {
      if (!message) {
        return undefined;
      }

      nextId.current += 1;
      const id = nextId.current;

      setToasts((current) => [
        ...current,
        { id, type, message },
      ]);

      const timer = setTimeout(
        () => dismissToast(id),
        duration
      );

      timers.current.set(id, timer);

      return id;
    },
    [dismissToast]
  );


  useEffect(() => {
    const timerMap = timers.current;

    return () => {
      timerMap.forEach((timer) =>
        clearTimeout(timer)
      );
      timerMap.clear();
    };
  }, []);


  return (
    <ToastContext.Provider
      value={showToast}
    >
      {children}

      {createPortal(
        <div
          className="toast-viewport"
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast--${toast.type}`}
              role="status"
            >
              <span className="toast-icon">
                <Icon
                  name={
                    TOAST_ICON[toast.type] ??
                    "info"
                  }
                  size={17}
                />
              </span>

              <p>{toast.message}</p>

              <button
                type="button"
                className="toast-close"
                onClick={() =>
                  dismissToast(toast.id)
                }
                aria-label="Dismiss notification"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}


export default ToastProvider;
