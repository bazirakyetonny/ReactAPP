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
<<<<<<< HEAD
    <div className="ap-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ap-panel">
        <div className="ap-header">
          <span className="ap-title">
            Analysis
            {issues.length > 0 && <span className="ap-badge">{issues.length}</span>}
          </span>
          <div className="ap-header-actions">
            <button
              className="ap-rerun-btn"
              onClick={onRerun}
              disabled={isAnalyzing}
              title="Re-run analysis"
            >
              {isAnalyzing ? (
                <span className="ap-spinner" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M12 7A5 5 0 1 1 7 2a5 5 0 0 1 3.54 1.46L9 5h3V2l-1.17 1.17A6 6 0 1 0 13 7h-1z" fill="currentColor" />
                </svg>
              )}
              {isAnalyzing ? 'Analysing…' : 'Re-run'}
            </button>
            <button className="ap-close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="ap-body">
          {isAnalyzing && issues.length === 0 ? (
            <div className="ap-empty">
              <span className="ap-spinner ap-spinner--lg" />
              <span>Analysing content…</span>
            </div>
          ) : issues.length === 0 ? (
            <div className="ap-empty ap-empty--ok">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="#22c55e" strokeWidth="1.5" />
                <path d="M6 10l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              No issues found
            </div>
          ) : (
            <>
              <Section
                label="Category 1 — Invalid URLs"
                count={cat1.length}
                open={openCat.has(1)}
                onToggle={() => toggleCat(1)}
                colorClass="ap-section--red"
              >
                {cat1.map(issue => <IssueRow key={issue.id} issue={issue} />)}
              </Section>
              <Section
                label="Category 2 — Long Tile Text"
                count={cat2.length}
                open={openCat.has(2)}
                onToggle={() => toggleCat(2)}
                colorClass="ap-section--amber"
              >
                {cat2.map(issue => <IssueRow key={issue.id} issue={issue} />)}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("root") ?? document.body,
  );
}

function Section({ label, count, open, onToggle, colorClass, children }: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  colorClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`ap-section ${colorClass}`}>
      <button className="ap-section-header" onClick={onToggle}>
        <span className="ap-section-chevron">{open ? '▾' : '▸'}</span>
        <span className="ap-section-label">{label}</span>
        <span className="ap-section-count">{count}</span>
=======
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
>>>>>>> main
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
