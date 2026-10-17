import { useState, useRef, useEffect } from 'react';

type Degree = 'B.Tech' | 'M.S.' | 'Undergrad' | 'Ph.D.';
type Skill  = 'Python' | 'React' | 'AI/ML' | 'Design' | 'ML' | 'Java';
type Target = 'Scholarships' | 'Internships' | 'Hackathons';

const DEGREES: Degree[] = ['B.Tech', 'Undergrad', 'M.S.', 'Ph.D.'];
const SKILLS:  Skill[]  = ['Python', 'React', 'AI/ML', 'Design', 'Java'];
const TARGETS: Target[] = ['Scholarships', 'Internships', 'Hackathons'];

interface CommandInputProps {
  onSubmit: (query: {
    degree: string;
    skills: string[];
    categories: Target[];
    rawText: string;
  }) => void;
}

export default function CommandInput({ onSubmit }: CommandInputProps) {
  const [text, setText] = useState('');
  const [degree, setDegree] = useState<Degree | ''>('');
  const [skills, setSkills] = useState<Set<Skill>>(new Set());
  const [targets, setTargets] = useState<Set<Target>>(new Set(['Scholarships', 'Internships', 'Hackathons']));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  const toggleSkill = (s: Skill) => {
    setSkills((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const toggleTarget = (t: Target) => {
    setTargets((prev) => {
      const next = new Set(prev);
      if (next.has(t) && next.size === 1) return prev; // keep at least one
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!degree && skills.size === 0 && !text.trim()) return;
    onSubmit({
      degree,
      skills: Array.from(skills),
      categories: Array.from(targets),
      rawText: text.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="command-input-wrapper animate-fade-in">
      <div className="command-input-box" onClick={() => textareaRef.current?.focus()}>
        {/* Text area */}
        <textarea
          ref={textareaRef}
          className="command-textarea"
          placeholder="B.Tech in AI/ML student seeking internships and scholarships…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Describe your background and goals"
          id="command-input"
        />

        <div className="command-input-divider" />

        {/* Degree pills */}
        <div className="command-pills-row" style={{ marginBottom: 8 }}>
          <span className="pill-label">Degree</span>
          {DEGREES.map((d) => (
            <button
              key={d}
              className={`pill ${degree === d ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setDegree(degree === d ? '' : d); }}
              aria-pressed={degree === d}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Skills + action row */}
        <div className="command-action-row">
          <div className="pill-row-section">
            <span className="pill-label">Skills</span>
            {SKILLS.map((s) => (
              <button
                key={s}
                className={`pill ${skills.has(s) ? 'active-emerald' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleSkill(s); }}
                aria-pressed={skills.has(s)}
              >
                {skills.has(s) ? '✓' : '+'} {s}
              </button>
            ))}
          </div>

          <button
            className="btn-search"
            onClick={handleSubmit}
            id="search-submit-btn"
            aria-label="Search live opportunities"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            Search
          </button>
        </div>

        {/* Target toggles */}
        <div className="command-pills-row" style={{ marginTop: 8 }}>
          <span className="pill-label">Find</span>
          {TARGETS.map((t) => (
            <button
              key={t}
              className={`pill ${targets.has(t) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleTarget(t); }}
              aria-pressed={targets.has(t)}
            >
              {t}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ⌘↵ to search
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="how-it-works" style={{ marginTop: 24 }}>
        {[
          { n: '1', api: 'Search API', desc: 'Live web retrieval' },
          { n: '2', api: 'Web Agent', desc: 'Multi-step navigation' },
          { n: '3', api: 'Fetch API', desc: 'Eligibility extraction' },
        ].map((step, i) => (
          <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div className="how-step" style={{ minWidth: 0 }}>
              <div className="how-step-number">{step.n}</div>
              <div className="how-step-content">
                <span className="how-step-api">{step.api}</span>
                <span className="how-step-desc">{step.desc}</span>
              </div>
            </div>
            {i < 2 && <span className="how-step-arrow">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
