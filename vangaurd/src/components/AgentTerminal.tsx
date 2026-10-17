import { useState, useEffect } from 'react';

interface ScanStep {
  prefix: string;
  label: string;
  text: string;
  done: boolean;
}

interface AgentTerminalProps {
  onComplete: () => void;
  searchDone: boolean;
  matchCount: number;
}

const STEPS: ScanStep[] = [
  {
    prefix: '→',
    label: 'Search API',
    text: 'Querying live web for opportunities that match your profile…',
    done: false,
  },
  {
    prefix: '→',
    label: 'Web Agent',
    text: 'Visiting the most relevant pages…',
    done: false,
  },
  {
    prefix: '→',
    label: 'Fetch API',
    text: 'Extracting eligibility criteria and closing dates…',
    done: false,
  },
  {
    prefix: '✓',
    label: '',
    text: 'Shortlist ready: 9 verified matches with active deadlines.',
    done: true,
  },
];

const STEP_DELAYS = [600, 1300, 2200]; // first 3 steps appear on a timer; the last waits for the backend

export default function AgentTerminal({ onComplete, searchDone, matchCount }: AgentTerminalProps) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Steps 1-3 appear on a timer
  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setVisibleSteps((v) => Math.max(v, i + 1)), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Final step appears only when the backend has really finished
  useEffect(() => {
    if (!searchDone || visibleSteps < STEP_DELAYS.length) return;
    setVisibleSteps(STEPS.length);
    const t1 = setTimeout(() => setCompleted(true), 600);
    const t2 = setTimeout(onComplete, 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [searchDone, visibleSteps, onComplete]);

  const steps = STEPS.map((step) =>
    step.done
      ? {
          ...step,
          text:
            matchCount > 0
              ? `Shortlist ready: ${matchCount} verified ${matchCount === 1 ? 'match' : 'matches'} with active deadlines.`
              : 'Scan finished: no matches with confirmed deadlines were found.',
        }
      : step
  );

  return (
    <div className="terminal-wrapper">
      <div className="container-terminal">
        <div
          className="terminal-box animate-fade-in"
          role="log"
          aria-label="Vanguard agent scan log"
          aria-live="polite"
        >
          {/* Title bar */}
          <div className="terminal-titlebar">
            <div className="terminal-dot red" aria-hidden="true" />
            <div className="terminal-dot yellow" aria-hidden="true" />
            <div className="terminal-dot green" aria-hidden="true" />
            <span className="terminal-title">vanguard-agent — live scan</span>
          </div>

          {/* Body */}
          <div className="terminal-body">
            {steps.slice(0, visibleSteps).map((step, i) => {
              const isLast = i === visibleSteps - 1 && !completed;
              return (
                <div
                  key={i}
                  className={`terminal-line animate-fade-in ${step.done ? 'done' : 'active'}`}
                  style={{ animationDelay: '0ms' }}
                >
                  {/* Prefix + label */}
                  <span style={{
                    color: step.done ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: 600,
                    minWidth: 12,
                  }}>
                    {step.prefix}
                  </span>

                  {step.label && (
                    <span className="terminal-label">{step.label}</span>
                  )}

                  <span style={{
                    color: step.done ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    flex: 1,
                  }}>
                    {step.text}
                    {isLast && <span className="terminal-cursor" aria-hidden="true" />}
                  </span>
                </div>
              );
            })}

            {/* Idle cursor before first step */}
            {visibleSteps === 0 && (
              <div className="terminal-line active">
                <span className="terminal-cursor" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}