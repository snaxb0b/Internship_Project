import {
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import Icon from "./Icon";


function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);


  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame =
      window.requestAnimationFrame(() => {
        cancelButtonRef.current?.focus();
      });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll(
          "button:not([disabled])"
        );

      if (!focusableElements?.length) {
        return;
      }

      const firstElement =
        focusableElements[0];

      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose, open]);


  if (!open) {
    return null;
  }


  return createPortal(
    <div className="confirmation-layer">
      <button
        className="confirmation-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close confirmation dialog"
      />

      <div
        ref={dialogRef}
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        <div className="confirmation-heading-row">
          <span className="confirmation-icon">
            <Icon name="trash" size={20} />
          </span>

          <span className="confirmation-label">
            Confirm action
          </span>

          <button
            className="confirmation-close-button"
            type="button"
            onClick={onClose}
            aria-label="Close confirmation dialog"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="confirmation-copy">
          <h2 id="confirmation-title">
            {title}
          </h2>

          <p id="confirmation-message">
            {message}
          </p>
        </div>

        <div className="confirmation-actions">
          <button
            ref={cancelButtonRef}
            className="confirmation-cancel-button"
            type="button"
            onClick={onClose}
          >
            {cancelLabel}
          </button>

          <button
            className="confirmation-confirm-button"
            type="button"
            onClick={onConfirm}
          >
            <Icon name="trash" size={16} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


export default ConfirmationDialog;
