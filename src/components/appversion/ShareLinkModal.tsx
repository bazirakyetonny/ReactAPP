import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/ShareLinkModal.css";

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
          <span className="slm-title">Share link for a preview</span>
          <button
            className="slm-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="slm-body">
          <p className="slm-description">
            A shareable link has been generated for you. Copy it and share for
            previews!
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
            <span className="slm-link-empty">No preview link available.</span>
          )}
        </div>

        <div className="slm-footer">
          <button className="slm-btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="slm-btn-primary"
            type="button"
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
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
