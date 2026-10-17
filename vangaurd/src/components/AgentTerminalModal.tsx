import { useEffect, useRef } from 'react';

// The full agent log modal — accessible via the scan pill
interface AgentTerminalModalProps {
  onClose: () => void;
  pagesVisited: number;
}

const LOG_LINES = [
  { prefix: '→', label: 'Search API', text: 'Querying live web for B.Tech + AI/ML opportunities…', status: 'done' },
  { prefix: '✓', label: '',           text: 'Retrieved 214 candidate URLs from search index', status: 'done' },
  { prefix: '→', label: 'Web Agent',  text: 'Navigating 28 university, company & hackathon pages…', status: 'done' },
  { prefix: '·', label: '',           text: 'Visited: buildyourfuture.withgoogle.com', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: microsoft.com/en-us/research/academic-program/phd-fellowship', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: research.adobe.com/scholarship', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: careers.google.com/programs/step', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: stripe.com/jobs/university', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: deepmind.google/about/careers', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: mlh.io/seasons/2027/events', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: sih.gov.in', status: 'muted' },
  { prefix: '·', label: '',           text: 'Visited: devpost.com/hackathons', status: 'muted' },
  { prefix: '·', label: '',           text: '… and 19 additional pages', status: 'muted' },
  { prefix: '→', label: 'Fetch API',  text: 'Extracting eligibility criteria and closing dates…', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-10-25 from research.adobe.com (conf: 0.93)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-10-28 from mlh.io (conf: 0.96)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-11-01 from deepmind.google (conf: 0.91)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-11-12 from buildyourfuture.withgoogle.com (conf: 0.97)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-11-18 from devpost.com (conf: 0.97)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-11-30 from careers.google.com (conf: 0.98)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-12-01 from microsoft.com (conf: 0.95)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-12-15 from stripe.com (conf: 0.94)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Extracted deadline: 2026-12-20 from sih.gov.in (conf: 0.89)', status: 'done' },
  { prefix: '✓', label: '',           text: 'Shortlist ready: 9 verified matches with active deadlines.', status: 'final' },
];

export default function AgentTerminalModal({ onClose, pagesVisited }: AgentTerminalModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Vanguard agent scan log"
    >
      <div className="modal-box animate-modal-in" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="modal-header">
          <button className="modal-close" onClick={onClose} aria-label="Close log">✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              Vanguard Agent Log
            </span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Live Scan Report
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {pagesVisited} pages visited · 9 matches found · ~3.5s
          </p>
        </div>

        {/* Terminal body */}
        <div className="modal-body" style={{ paddingTop: 12 }}>
          <div
            className="terminal-body"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              maxHeight: 380,
              overflowY: 'auto',
              gap: 7,
            }}
            role="log"
            aria-label="Vanguard scan log"
          >
            {LOG_LINES.map((line, i) => (
              <div
                key={i}
                className="terminal-line"
                style={{
                  color:
                    line.status === 'final' ? 'var(--accent-emerald)' :
                    line.status === 'done'  ? 'var(--text-secondary)' :
                                              'var(--text-muted)',
                  fontSize: 12,
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 600, color: line.status === 'final' || line.prefix === '✓' ? 'var(--accent-emerald)' : 'var(--text-muted)', minWidth: 10, flexShrink: 0 }}>
                  {line.prefix}
                </span>
                {line.label && (
                  <span className="terminal-label" style={{ fontSize: 9 }}>{line.label}</span>
                )}
                <span>{line.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
