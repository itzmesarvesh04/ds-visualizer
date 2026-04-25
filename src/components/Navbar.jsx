import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../App';

export default function Navbar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar glass">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }} onClick={closeMobileMenu}>
        <div className="logo-icon"></div>
        DS Visualizer
      </Link>
      
      <div className="navbar-actions">
        <button className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <ul className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={closeMobileMenu}>Home</Link>
          </li>
          <li>
            <Link to="/stack" className={location.pathname.includes('/stack') ? 'active' : ''} onClick={closeMobileMenu}>Stack</Link>
          </li>
          <li>
            <Link to="/queue" className={location.pathname.includes('/queue') ? 'active' : ''} onClick={closeMobileMenu}>Queue</Link>
          </li>
          <li>
            <Link to="/linkedlist" className={location.pathname.includes('/linkedlist') ? 'active' : ''} onClick={closeMobileMenu}>Linked List</Link>
          </li>
          <li>
            <Link to="/tree" className={location.pathname.includes('/tree') ? 'active' : ''} onClick={closeMobileMenu}>Tree</Link>
          </li>
          <li>
            <Link to="/graph" className={location.pathname.includes('/graph') ? 'active' : ''} onClick={closeMobileMenu}>Graph</Link>
          </li>
          <li className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <button 
              className={`dropdown-toggle ${location.pathname.includes('/code-visualizer') ? 'active' : ''}`}
              onClick={toggleDropdown}
            >
              Code Visualizer
              <span className="dropdown-arrow">▼</span>
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu glass">
                <li className="dropdown-category">
                  <span className="category-label">Stack</span>
                  <ul className="sub-menu">
                    <li>
                      <Link to="/code-visualizer/stack/parenthesis" onClick={closeMobileMenu}>Parenthesis Checker</Link>
                    </li>
                    <li>
                      <Link to="/code-visualizer/stack/reverse-string" onClick={closeMobileMenu}>Reverse a String</Link>
                    </li>
                    <li>
                      <Link to="/code-visualizer/stack/string-reversal" onClick={closeMobileMenu}>String Reversal (LIFO)</Link>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-category">
                  <span className="category-label">Queue</span>
                  <ul className="sub-menu">
                    <li>
                      <Link to="/code-visualizer/queue/lifo-stack" onClick={closeMobileMenu}>LIFO Stack using Two Queues</Link>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-category">
                  <span className="category-label">Linked List</span>
                  <ul className="sub-menu">
                    <li>
                      <Link to="/code-visualizer/linkedlist/middle-node" onClick={closeMobileMenu}>Middle Node</Link>
                    </li>
                    <li>
                      <Link to="/code-visualizer/linkedlist/reverse" onClick={closeMobileMenu}>Reverse Linked List</Link>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-category">
                  <span className="category-label">Tree</span>
                  <ul className="sub-menu">
                    <li>
                      <Link to="/code-visualizer/tree/max-depth" onClick={closeMobileMenu}>Maximum Depth</Link>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-category">
                  <span className="category-label">Graph</span>
                  <ul className="sub-menu">
                    <li>
                      <Link to="/code-visualizer/graph/bfs" onClick={closeMobileMenu}>BFS (Breadth-First Search)</Link>
                    </li>
                  </ul>
                </li>
              </ul>
            )}
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
      </div>
    </nav>
  );
}