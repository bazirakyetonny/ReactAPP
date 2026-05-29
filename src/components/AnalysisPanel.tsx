import ReactDOM from 'react-dom';
import type { AnalysisIssue } from '../utils/analysisUtils';
import './AnalysisPanel.css';

interface AnalysisPanelProps {
  issues: AnalysisIssue[];
  isAnalyzing: boolean;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onRerun: () => void;
}

export function AnalysisPanel({ issues, isAnalyzing, currentIndex, onPrev, onNext, onClose, onRerun }: AnalysisPanelProps) {
  const total = issues.length;
  const safeIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0;
  const current = total > 0 ? issues[safeIndex] : null;

  return ReactDOM.createPortal(
    <div className="ap-bar">
      <button className="ap-nav-btn" onClick={onPrev} disabled={total === 0} aria-label="Previous issue">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button className="ap-nav-btn" onClick={onNext} disabled={total === 0} aria-label="Next issue">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span className="ap-counter">{total === 0 ? '—' : `${safeIndex + 1} / ${total}`}</span>

      <div className="ap-sep" />

      <div className="ap-current">
        {isAnalyzing && total === 0 ? (
          <span className="ap-status"><span className="ap-spinner" /> Analysing…</span>
        ) : total === 0 ? (
          <span className="ap-status ap-status--ok">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="#22c55e" strokeWidth="1.4" />
              <path d="M4 7l2.5 2.5L10 5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            No issues found
          </span>
        ) : current ? (
          <span className="ap-current-text">
            <span className="ap-current-page">{current.pageName}</span>
            <span className="ap-current-dot"> · </span>
            <span className="ap-current-loc">{current.location}</span>
            <span className="ap-current-dot"> — </span>
            <span className="ap-current-detail">{current.detail}</span>
          </span>
        ) : null}
      </div>

      <div className="ap-sep" />

      <button className="ap-icon-btn" onClick={onRerun} disabled={isAnalyzing} title="Re-run analysis" aria-label="Re-run analysis">
        {isAnalyzing
          ? <span className="ap-spinner" />
          : (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M12 7A5 5 0 1 1 7 2a5 5 0 0 1 3.54 1.46L9 5h3V2l-1.17 1.17A6 6 0 1 0 13 7h-1z" fill="currentColor" />
            </svg>
          )
        }
      </button>

      <button className="ap-icon-btn ap-icon-btn--close" onClick={onClose} aria-label="Close analysis">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>,
    document.getElementById('root') ?? document.body,
  );
}
