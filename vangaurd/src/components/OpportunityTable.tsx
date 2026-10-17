import { useState } from 'react';
import type { Opportunity } from '../services/tinyfish';
import OpportunityModal from './OpportunityModal';

// ─── Utility: deadline helpers ────────────────────────────────────────────────
function parseDeadline(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function daysUntil(iso: string): number {
  const now = new Date();
  const deadline = parseDeadline(iso);
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadline(iso: string): string {
  const d = parseDeadline(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: Opportunity['category'] }) {
  const map = {
    Scholarship: { cls: 'scholarship', icon: '🎓' },
    Internship:  { cls: 'internship',  icon: '💼' },
    Hackathon:   { cls: 'hackathon',   icon: '⚡' },
  };
  const { cls, icon } = map[category];
  return (
    <span className={`category-badge ${cls}`} aria-label={`Category: ${category}`}>
      <span aria-hidden="true">{icon}</span> {category}
    </span>
  );
}

function DeadlinePill({ deadline }: { deadline: string }) {
  const days = daysUntil(deadline);
  const urgent = days <= 7;
  const label = days <= 0
    ? 'Closed'
    : days === 1
      ? `${formatDeadline(deadline)} • 1d left`
      : `${formatDeadline(deadline)} • ${days}d left`;

  return (
    <div className={`deadline-pill ${urgent ? 'urgent' : ''}`} aria-label={`Deadline: ${label}`}>
      <span className="deadline-dot" aria-hidden="true" />
      {label}
    </div>
  );
}

function SourceLinkPill({ url, domain, onClick }: { url: string; domain: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-link-pill"
      onClick={onClick}
      aria-label={`Open source page: ${domain}`}
    >
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M2 10L10 2M10 2H5M10 2v5" />
      </svg>
      {domain}
    </a>
  );
}

function BookmarkButton({
  saved,
  onClick,
}: {
  saved: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      className={`btn-bookmark ${saved ? 'saved' : ''}`}
      onClick={onClick}
      aria-label={saved ? 'Remove bookmark' : 'Bookmark this opportunity'}
      aria-pressed={saved}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    </button>
  );
}

// ─── Main Row ─────────────────────────────────────────────────────────────────
interface OpportunityRowProps {
  opportunity: Opportunity;
  index: number;
  onToggleSave: (id: string) => void;
}

function OpportunityRow({ opportunity: opp, index, onToggleSave }: OpportunityRowProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const stopAndSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(opp.id);
  };

  const stopAndOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow native link behavior
  };

  const staggerClass = `stagger-${Math.min(index + 1, 9)}`;

  return (
    <>
      <article
        className={`opportunity-row animate-slide-up ${staggerClass}`}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        aria-label={`Open details for ${opp.title} by ${opp.organization}`}
      >
        <div className="opportunity-row-left">
          {/* Title + org + badge */}
          <div className="opp-title-row">
            <span className="opp-title">{opp.title}</span>
            <span className="opp-org">{opp.organization}</span>
            <CategoryBadge category={opp.category} />
          </div>

          {/* Match tag */}
          <div className="opp-match-tag">
            <span className="opp-match-dot" aria-hidden="true" />
            {opp.matchTag}
          </div>
        </div>

        <div className="opportunity-row-right">
          {/* Deadline */}
          <DeadlinePill deadline={opp.deadline} />

          {/* Source + Bookmark */}
          <div className="source-link-row">
            <SourceLinkPill
              url={opp.sourceUrl}
              domain={opp.sourceDomain}
              onClick={stopAndOpen}
            />
            <BookmarkButton saved={!!opp.saved} onClick={stopAndSave} />
          </div>
        </div>
      </article>

      {modalOpen && (
        <OpportunityModal
          opportunity={opp}
          onClose={() => setModalOpen(false)}
          onToggleSave={() => onToggleSave(opp.id)}
        />
      )}
    </>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
interface OpportunityTableProps {
  opportunities: Opportunity[];
  onToggleSave: (id: string) => void;
}

export default function OpportunityTable({ opportunities, onToggleSave }: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
        }}
        role="status"
        aria-label="No opportunities in this category"
      >
        No opportunities in this filter.
      </div>
    );
  }

  return (
    <div className="opportunity-list" role="list" aria-label="Opportunity results">
      {opportunities.map((opp, i) => (
        <OpportunityRow
          key={opp.id}
          opportunity={opp}
          index={i}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
