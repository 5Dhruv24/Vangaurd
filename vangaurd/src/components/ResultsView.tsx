import { useState } from 'react';
import type { Opportunity } from '../services/tinyfish';
import OpportunityTable from './OpportunityTable';

type FilterKey = 'All' | 'Scholarships' | 'Internships' | 'Hackathons' | 'Saved';

const FILTER_TABS: FilterKey[] = ['All', 'Scholarships', 'Internships', 'Hackathons', 'Saved'];

const CATEGORY_FILTER_MAP: Record<FilterKey, Opportunity['category'] | null | 'saved'> = {
  All: null,
  Scholarships: 'Scholarship',
  Internships: 'Internship',
  Hackathons: 'Hackathon',
  Saved: 'saved',
};

interface ResultsViewProps {
  opportunities: Opportunity[];
  pagesVisited: number;
  onEditSearch: () => void;
  onShowLog: () => void;
  onToggleSave: (id: string) => void;
}

export default function ResultsView({
  opportunities,
  pagesVisited,
  onEditSearch,
  onShowLog,
  onToggleSave,
}: ResultsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');

  const countFor = (key: FilterKey): number => {
    const cat = CATEGORY_FILTER_MAP[key];
    if (cat === null) return opportunities.length;
    if (cat === 'saved') return opportunities.filter((o) => o.saved).length;
    return opportunities.filter((o) => o.category === cat).length;
  };

  const filtered = (() => {
    const cat = CATEGORY_FILTER_MAP[activeFilter];
    if (cat === null) return opportunities;
    if (cat === 'saved') return opportunities.filter((o) => o.saved);
    return opportunities.filter((o) => o.category === cat);
  })();

  return (
    <main className="results-view" id="results-workspace">
      <div className="container-workspace">

        {/* Scan summary pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <button
            className="scan-pill"
            onClick={onShowLog}
            id="scan-summary-pill"
            aria-label="View agent scan log"
          >
            <span>✓</span>
            Scanned {pagesVisited} live pages from the web
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>· Click to view agent log</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <nav
            className="filter-tabs"
            role="tablist"
            aria-label="Filter opportunities by category"
          >
            {FILTER_TABS.map((tab) => {
              const count = countFor(tab);
              return (
                <button
                  key={tab}
                  className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
                  onClick={() => setActiveFilter(tab)}
                  role="tab"
                  aria-selected={activeFilter === tab}
                  id={`filter-tab-${tab.toLowerCase()}`}
                >
                  {tab}
                  <span className="filter-tab-count" aria-label={`${count} items`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          <button
            className="btn-edit-search"
            onClick={onEditSearch}
            id="edit-search-btn"
            aria-label="Edit your search"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Search
          </button>
        </div>

        {/* Results count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
            aria-live="polite"
            role="status"
          >
            {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
            {activeFilter !== 'All' && ` · ${activeFilter}`}
          </p>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Sorted by deadline ↑
          </p>
        </div>

        {/* Opportunity table */}
        <OpportunityTable
          opportunities={filtered.sort(
            (a, b) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          )}
          onToggleSave={onToggleSave}
        />
      </div>
    </main>
  );
}
