import { useEffect } from "react";
import ReactDOM from "react-dom";
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

const TITLES: Record<AlertStatus, string> = {
  success: "Success",
  warning: "Warning",
  danger: "Error",
};

export function AlertMessage({ message, status, visible, onClose }: AlertMessageProps) {
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
