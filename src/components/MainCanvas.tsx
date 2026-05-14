import './MainCanvas.css';

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MainCanvas() {
  return (
    <main className="app-canvas">
      <button className="canvas-nav" type="button" aria-label="Previous screen">
        <ChevronLeft />
      </button>
      <div className="canvas-frames">
        <div className="phone-frame">
          <div className="phone-status-bar" />
          <div className="phone-screen" />
        </div>
        <div className="phone-frame phone-frame-active">
          <div className="phone-status-bar" />
          <div className="phone-screen" />
        </div>
      </div>
      <button className="canvas-nav" type="button" aria-label="Next screen">
        <ChevronRight />
      </button>
    </main>
  );
}
