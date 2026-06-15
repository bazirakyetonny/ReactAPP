import { useState } from "react";
import ReactDOM from "react-dom";
import { releaseToolbox } from "../services/toolboxApi";
import { i18n } from "../i18n/i18n";
import "./BusyModal.css";

interface BusyModalProps {
  onReviewOnly: () => void;
}

export function BusyModal({ onReviewOnly }: BusyModalProps) {
  const [taking, setTaking] = useState(false);

  async function handleTakeControl() {
    setTaking(true);
    try {
      await releaseToolbox(true);
      window.location.reload();
    } catch {
      setTaking(false);
    }
  }

  const modal = (
    <div className="bm-overlay">
      <div className="bm-modal">
        <div className="bm-header">
          <span className="bm-title">{i18n.t("busy_modal.title")}</span>
        </div>

        <div className="bm-body">
          <p className="bm-message">{i18n.t("busy_modal.message")}</p>
        </div>

        <div className="bm-footer">
          <button
            className="bm-btn-ghost"
            type="button"
            onClick={() => window.history.back()}
          >
            {i18n.t("navbar.share.close")}
          </button>
          <div className="bm-footer-right">
            <button
              className="bm-btn-secondary"
              type="button"
              onClick={onReviewOnly}
            >
              {i18n.t("busy_modal.review_only")}
            </button>
            <button
              className="bm-btn-primary"
              type="button"
              disabled={taking}
              onClick={handleTakeControl}
            >
              {taking ? i18n.t("busy_modal.taking_control") : i18n.t("busy_modal.take_control")}
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
