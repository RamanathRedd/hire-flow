import type { ReactNode } from "react";

interface ModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  icon: ReactNode;
  confirmClassString: string;
}

const Modal = (props: ModalProps) => {
  const {
    onConfirm,
    onCancel,
    title,
    message,
    cancelText,
    confirmText,
    icon,
    confirmClassString,
  } = props;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-profile-title"
      className="modal-backdrop"
    >
      <div className="save-modal">
        <svg
          className="mx-auto mb-4 text-fg-disabled w-12 h-12"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
        <button
          className="modal-close"
          type="button"
          onClick={onCancel}
          aria-label="Close modal"
        >
          <span aria-hidden="true">×</span> Close
        </button>
        <div className="save-modal-copy">
          <h2 id="save-profile-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="save-modal-actions">
          <button
            type="button"
            className="modal-button modal-button-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`modal-button modal-button-primary ${confirmClassString}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
