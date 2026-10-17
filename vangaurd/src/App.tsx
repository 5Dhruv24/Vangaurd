import { useState, useCallback } from 'react';
import './index.css';

import ParticleCanvas from './components/ParticleCanvas';
import Navbar from './components/Navbar';
import CommandInput from './components/CommandInput';
import AgentTerminal from './components/AgentTerminal';
import ResultsView from './components/ResultsView';
import AgentTerminalModal from './components/AgentTerminalModal';

import { runFullSearch } from './services/tinyfish';
import type { Opportunity } from './services/tinyfish';

// ─── App State Machine ────────────────────────────────────────────────────────
type AppState = 'home' | 'scanning' | 'results';

export default function App() {
  const [appState, setAppState]         = useState<AppState>('home');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pagesVisited, setPagesVisited]  = useState(0);
  const [showLogModal, setShowLogModal]  = useState(false);
  const [isVisible, setIsVisible]        = useState(true); // for fade transitions
  const [searchDone, setSearchDone]      = useState(false);
  const [error, setError]                = useState<string | null>(null);

  // ─── Handle Search Submit ─────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (query: {
      degree: string;
      skills: string[];
      categories: ('Scholarships' | 'Internships' | 'Hackathons')[];
      rawText: string;
    }) => {
      // Map UI category labels to data category labels
      const categoryMap: Record<string, Opportunity['category']> = {
        Scholarships: 'Scholarship',
        Internships:  'Internship',
        Hackathons:   'Hackathon',
      };

      const mappedCategories = query.categories.map((c) => categoryMap[c]).filter(Boolean) as Opportunity['category'][];

      setError(null);
      setSearchDone(false);

      // Fade out hero
      setIsVisible(false);
      setTimeout(() => {
        setAppState('scanning');
        setIsVisible(true);
      }, 300);

      try {
        // Calls your backend (can take 1-3 minutes)
        const result = await runFullSearch({
          degree: query.degree,
          skills: query.skills,
          categories: mappedCategories,
          rawText: query.rawText,
        });

        setOpportunities(result.opportunities);
        setPagesVisited(result.pagesVisited);
        setSearchDone(true); // the terminal now moves on to results
      } catch (err) {
        console.error(err);
        setError('Could not reach the Vanguard backend. Check that it is running, then try again.');
        setTimeout(() => {
          setAppState('home');
          setIsVisible(true);
        }, 400);
      }
    },
    []
  );

  // ─── Handle Scan Complete → Show Results ─────────────────────────────────
  const handleScanComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setAppState('results');
      setIsVisible(true);
    }, 300);
  }, []);

  // ─── Handle Edit Search (Reset to Home) ──────────────────────────────────
  const handleReset = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setAppState('home');
      setIsVisible(true);
      setOpportunities([]);
      setSearchDone(false);
    }, 300);
  }, []);

  // ─── Toggle Save ──────────────────────────────────────────────────────────
  const handleToggleSave = useCallback((id: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, saved: !o.saved } : o))
    );
  }, []);

  return (
    <>
      {/* Ambient background particles — always present */}
      <ParticleCanvas />

      {/* Navbar — always present */}
      <Navbar
        onReset={handleReset}
        engineReady={appState !== 'scanning'}
      />

      {/* ─── State 1: Home / Hero ─────────────────────────────────────── */}
      {appState === 'home' && (
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Hero */}
          <section
            className="hero-section"
            id="hero"
            aria-labelledby="hero-headline"
          >
            <div className="container-input">

              <h1
                id="hero-headline"
                className="hero-headline animate-fade-in stagger-2"
              >
                Find scholarships, internships, and hackathons—
                <em>verified from the live web.</em>
              </h1>

              <p className="hero-subtext animate-fade-in stagger-3">
                Enter your degree and skills. Vanguard searches the web, visits
                relevant pages, and creates a personalized shortlist with exact
                deadlines.
              </p>

              {error && (
                <p role="alert" style={{ color: '#F87171', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <CommandInput onSubmit={handleSearch} />
            </div>
          </section>

          {/* Below-the-fold: MacBook scroll preview */}
          <section
            className="macbook-section"
            aria-label="Preview of the Vanguard results workspace"
          >
            <div
              className="macbook-frame animate-fade-in stagger-4"
              role="img"
              aria-label="Vanguard shortlist preview"
            >
              <div className="macbook-bar">
                <div className="terminal-dot red" aria-hidden="true" />
                <div className="terminal-dot yellow" aria-hidden="true" />
                <div className="terminal-dot green" aria-hidden="true" />
              </div>
              <div className="macbook-screen">
                {/* Mock rows */}
                {[
                  { lineClass: '', short: false, accent: 'emerald' },
                  { lineClass: '', short: true,  accent: 'amber' },
                  { lineClass: '', short: false, accent: 'emerald' },
                  { lineClass: '', short: true,  accent: '' },
                  { lineClass: '', short: false, accent: 'amber' },
                ].map((row, i) => (
                  <div key={i} className="macbook-preview-row">
                    <div
                      className={`macbook-preview-dot ${row.accent === 'emerald' ? 'emerald' : row.accent === 'amber' ? 'amber' : ''}`}
                      style={{
                        background:
                          row.accent === 'emerald' ? 'rgba(16,185,129,0.3)' :
                          row.accent === 'amber'   ? 'rgba(245,158,11,0.3)' :
                                                     'rgba(255,255,255,0.08)',
                      }}
                    />
                    <div className="macbook-preview-line" />
                    <div className="macbook-preview-line" style={{ maxWidth: 140 }} />
                    <div
                      className={`macbook-preview-line ${row.accent}`}
                      style={{
                        maxWidth: row.short ? 70 : 100,
                        background:
                          row.accent === 'emerald' ? 'rgba(16,185,129,0.2)' :
                          row.accent === 'amber'   ? 'rgba(245,158,11,0.2)' :
                                                     'rgba(255,255,255,0.05)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── State 2: Scanning Terminal ───────────────────────────────── */}
      {appState === 'scanning' && (
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <AgentTerminal
            onComplete={handleScanComplete}
            searchDone={searchDone}
            matchCount={opportunities.length}
          />
        </div>
      )}

      {/* ─── State 3: Results ────────────────────────────────────────── */}
      {appState === 'results' && (
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <ResultsView
            opportunities={opportunities}
            pagesVisited={pagesVisited}
            onEditSearch={handleReset}
            onShowLog={() => setShowLogModal(true)}
            onToggleSave={handleToggleSave}
          />
        </div>
      )}

      {/* Agent Log Modal (accessible from scan pill) */}
      {showLogModal && (
        <AgentTerminalModal onClose={() => setShowLogModal(false)} pagesVisited={pagesVisited} />
      )}
    </>
  );
}