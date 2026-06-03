export function PhoneStatusBar({ rightExtra }: { rightExtra?: React.ReactNode }) {
  return (
    <div className="phone-status-bar">
      <span className="phone-time">9:27</span>
      <div className="phone-status-right">
        {rightExtra}
        <div className="phone-status-icons">
          <i className="fas fa-signal" aria-hidden="true" />
          <i className="fas fa-wifi" aria-hidden="true" />
          <i className="fas fa-battery-full" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
