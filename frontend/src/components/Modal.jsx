import { X } from "lucide-react";

export default function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={
        onClose
      }
    >
      <div
        className="modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <h2>
            {title}
          </h2>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <X />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

// ============================================================
// CHART TOOLTIP
// ============================================================

