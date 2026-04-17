import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

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
    </nav>
  );
}
