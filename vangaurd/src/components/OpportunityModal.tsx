import { useState, useEffect, useRef } from 'react';
import type { Opportunity } from '../services/tinyfish';

interface OpportunityModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onToggleSave: () => void;
}

export default function OpportunityModal({
  opportunity: opp,
  onClose,
  onToggleSave,
}: OpportunityModalProps) {
  const [extractionOpen, setExtractionOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape or backdrop click
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const categoryColor = {
    Scholarship: '#818CF8',
    Internship:  '#2DD4BF',
    Hackathon:   '#FB923C',
  }[opp.category];

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`${opp.title} details`}
    >
      <div className="modal-box animate-modal-in">
        {/* Header */}
        <div className="modal-header">
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close detail view"
          >
            ✕
          </button>

          {/* Category + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: categoryColor,
                fontFamily: 'var(--font-mono)',
                background: `${categoryColor}18`,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${categoryColor}30`,
              }}
            >
              {opp.category}
            </span>
          </div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            {opp.title}
          </h2>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
            {opp.organization}
          </p>

          {/* Match tag */}
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              marginTop: 4,
            }}
          >
            {opp.matchTag}
          </p>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Description */}
          <div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {opp.description}
            </p>
          </div>

          {/* Eligibility */}
          <div>
            <p className="modal-section-title">
              Verified Eligibility
            </p>
            <div className="eligibility-list">
              {opp.eligibility.map((item, i) => (
                <div key={i} className="eligibility-item">
                  <div className={`eligibility-icon ${item.met ? 'met' : 'unmet'}`} aria-hidden="true">
                    {item.met ? '✓' : '○'}
                  </div>
                  <span
                    style={{
                      color: item.met ? 'var(--text-secondary)' : 'var(--text-muted)',
                      textDecoration: item.met ? 'none' : 'none',
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <a
            href={opp.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-apply"
            id={`apply-btn-${opp.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
            Apply on {opp.sourceDomain}
          </a>

          {/* Footer row: bookmark */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onToggleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: opp.saved ? 'var(--accent-amber-dim)' : 'transparent',
                border: `1px solid ${opp.saved ? 'rgba(245,158,11,0.25)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                color: opp.saved ? 'var(--accent-amber)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
              }}
              aria-pressed={!!opp.saved}
              aria-label={opp.saved ? 'Remove bookmark' : 'Save to bookmarks'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={opp.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              {opp.saved ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* TinyFish Raw Extraction Accordion */}
          {opp.rawExtraction && (
            <div>
              <button
                className="accordion-trigger"
                onClick={() => setExtractionOpen((o) => !o)}
                aria-expanded={extractionOpen}
                aria-controls={`extraction-${opp.id}`}
                id={`extraction-trigger-${opp.id}`}
              >
                <span>
                  <span style={{ color: 'var(--accent-emerald)', marginRight: 6 }}>⬡</span>
                  View Live Extraction Data
                </span>
                <span
                  style={{
                    transform: extractionOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    display: 'inline-block',
                  }}
                >
                  ▾
                </span>
              </button>

              {extractionOpen && (
                <div
                  className="accordion-body animate-fade-in"
                  id={`extraction-${opp.id}`}
                  role="region"
                  aria-label="Raw extraction data"
                >
                  {opp.rawExtraction}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
