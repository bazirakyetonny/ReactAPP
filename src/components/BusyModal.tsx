import { useState } from "react";
import ReactDOM from "react-dom";
import { releaseToolbox } from "../services/toolboxApi";
import "./BusyModal.css";

interface BusyModalProps {
  onReviewOnly: () => void;
}

export function BusyModal({ onReviewOnly }: BusyModalProps) {
  const [taking, setTaking] = useState(false);

  async function handleTakeControl() {
    setTaking(true);
    try {
      await releaseToolbox();
      window.location.reload();
    } catch {
      setTaking(false);
    }
  }

  const modal = (
    <div className="bm-overlay">
      <div className="bm-modal">
        <div className="bm-header">
          <span className="bm-title">Access Blocked</span>
        </div>

        <div className="bm-body">
          <p className="bm-message">
            Access blocked — two receptionists or managers are already using
            this app builder. You can review the content in read-only mode, take
            control by releasing the current session, or go back.
          </p>
        </div>

        <div className="bm-footer">
          <button
            className="bm-btn-ghost"
            type="button"
            onClick={() => window.history.back()}
          >
            Close
          </button>
          <div className="bm-footer-right">
            <button
              className="bm-btn-secondary"
              type="button"
              onClick={onReviewOnly}
            >
              Review only
            </button>
            <button
              className="bm-btn-primary"
              type="button"
              disabled={taking}
              onClick={handleTakeControl}
            >
              {taking ? "Taking control…" : "Take control"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body,
  );
}
