import { useEffect } from "react";
import ReactDOM from "react-dom";
import { i18n } from "../i18n/i18n";
import "./AlertMessage.css";

export type AlertStatus = "success" | "warning" | "danger";

interface AlertMessageProps {
  message: string;
  status: AlertStatus;
  visible: boolean;
  onClose: () => void;
}

const ICONS: Record<AlertStatus, string> = {
  success: "✓",
  warning: "⚠",
  danger: "✕",
};

export function AlertMessage({ message, status, visible, onClose }: AlertMessageProps) {
  const TITLES: Record<AlertStatus, string> = {
    success: i18n.t("alert.success"),
    warning: i18n.t("alert.warning"),
    danger: i18n.t("alert.error"),
  };
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  const el = (
    <div className={`alm-container alm-${status}`} role="alert">
      <span className="alm-icon">{ICONS[status]}</span>
      <div className="alm-content">
        <span className="alm-title">{TITLES[status]}</span>
        <span className="alm-message">{message}</span>
      </div>
    </div>
  );

  return ReactDOM.createPortal(el, document.getElementById("root") ?? document.body);
}
