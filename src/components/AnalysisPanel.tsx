import { useState } from 'react';
import ReactDOM from 'react-dom';
import type { AnalysisIssue } from '../utils/analysisUtils';
import './AnalysisPanel.css';

interface AnalysisPanelProps {
  issues: AnalysisIssue[];
  isAnalyzing: boolean;
  onClose: () => void;
  onRerun: () => void;
}

export function AnalysisPanel({ issues, isAnalyzing, onClose, onRerun }: AnalysisPanelProps) {
  const [openCat, setOpenCat] = useState<Set<number>>(new Set([1, 2]));

  const cat1 = issues.filter(i => i.category === 1);
  const cat2 = issues.filter(i => i.category === 2);

  function toggleCat(cat: number) {
    setOpenCat(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  return ReactDOM.createPortal(
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
    document.body,
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
      </button>
      {open && count > 0 && <div className="ap-section-body">{children}</div>}
      {open && count === 0 && <div className="ap-section-none">None</div>}
    </div>
  );
}

function IssueRow({ issue }: { issue: AnalysisIssue }) {
  return (
    <div className="ap-issue">
      <div className="ap-issue-meta">
        <span className="ap-issue-page">{issue.pageName}</span>
        <span className="ap-issue-location">{issue.location}</span>
      </div>
      <div className="ap-issue-detail" title={issue.value}>{issue.detail}</div>
    </div>
  );
}
