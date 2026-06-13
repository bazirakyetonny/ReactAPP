import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/ShareLinkModal.css";
import { i18n } from "../../i18n/i18n";

interface ShareLinkModalProps {
  shareLink: string;
  onClose: () => void;
}

export function ShareLinkModal({ shareLink, onClose }: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const modal = (
    <div className="slm-overlay" onMouseDown={onClose}>
      <div className="slm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="slm-header">
          <span className="slm-title">{i18n.t("navbar.share.modal_title")}</span>
          <button
            className="slm-close"
            type="button"
            aria-label={i18n.t("navbar.share.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="slm-body">
          <p className="slm-description">
            {i18n.t("navbar.share.modal_description")}
          </p>
          {shareLink ? (
            <a
              className="slm-link-anchor"
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shareLink}
            </a>
          ) : (
            <span className="slm-link-empty">{i18n.t("navbar.share.no_link")}</span>
          )}
        </div>

        <div className="slm-footer">
          <button className="slm-btn-secondary" type="button" onClick={onClose}>
            {i18n.t("navbar.share.cancel")}
          </button>
          <button
            className="slm-btn-primary"
            type="button"
            onClick={handleCopy}
          >
            {copied ? i18n.t("navbar.share.copied_short") : i18n.t("navbar.share.copy")}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body,
  );
}
