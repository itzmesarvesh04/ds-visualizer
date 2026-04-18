import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../App';

export default function Navbar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="navbar glass">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
        <div className="logo-icon"></div>
        DS Visualizer
      </Link>
      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        </li>
        <li>
          <Link to="/stack" className={location.pathname.includes('/stack') ? 'active' : ''}>Stack</Link>
        </li>
        <li>
          <Link to="/queue" className={location.pathname.includes('/queue') ? 'active' : ''}>Queue</Link>
        </li>
        <li>
          <Link to="/linkedlist" className={location.pathname.includes('/linkedlist') ? 'active' : ''}>Linked List</Link>
        </li>
        <li>
          <Link to="/tree" className={location.pathname.includes('/tree') ? 'active' : ''}>Tree</Link>
        </li>
        <li>
          <Link to="/graph" className={location.pathname.includes('/graph') ? 'active' : ''}>Graph</Link>
        </li>
      </ul>

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle dark/light mode"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="theme-toggle-track">
          <span className="theme-toggle-thumb">
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </span>
        </span>
        <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
      </button>
    </nav>
  );
}