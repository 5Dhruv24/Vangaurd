import { useState, useEffect } from 'react';

interface NavbarProps {
  onReset: () => void;
  engineReady: boolean;
}

export default function Navbar({ onReset, engineReady }: NavbarProps) {
  const [theme, setTheme] = useState<'moonlight' | 'nocturne'>(() => {
    return (localStorage.getItem('vanguard_theme') as 'moonlight' | 'nocturne') || 'moonlight';
  });

  useEffect(() => {
    if (theme === 'nocturne') {
      document.documentElement.setAttribute('data-theme', 'nocturne');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('vanguard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'moonlight' ? 'nocturne' : 'moonlight'));
  };

  return (
    <nav className="navbar" role="banner">
      <button
        onClick={onReset}
        className="navbar-wordmark"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="Vanguard — return to home"
      >
        <span className="navbar-wordmark-dot" aria-hidden="true" />
        Vanguard
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'moonlight' ? 'Nocturne (Dark Moon)' : 'Moonlight (Warm Yellow)'}`}
          aria-label="Toggle theme"
        >
          {theme === 'moonlight' ? '🌕 Moonlight' : '🌑 Nocturne'}
        </button>

        <div className="navbar-status" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          {engineReady ? 'Ready' : 'Scanning…'}
        </div>
      </div>
    </nav>
  );
}
