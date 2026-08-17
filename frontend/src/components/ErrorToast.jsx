import { X } from "lucide-react";

export default function ErrorToast({
  message,
  onClose,
}) {
  return (
    <div className="error-toast">
      <div>
        <strong>
          Something went wrong
        </strong>

        <span>
          {message}
        </span>
      </div>

      <button
        onClick={
          onClose
        }
      >
        <X />
      </button>
    </div>
  );

}
