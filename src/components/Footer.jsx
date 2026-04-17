import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer glass" style={{ marginTop: '50px' }}>
      <div className="footer-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="footer-brand" style={{ flex: 1, minWidth: '250px' }}>
          <div className="logo">
            <div className="logo-icon small"></div>
            DS Visualizer
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', marginTop: '1rem' }}>
            Making Data Structures accessible and easy to learn with interactive visually-driven experiences.
          </p>
        </div>
        <div className="footer-links" style={{ display: 'flex', gap: '4rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Visualizers</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/stack" style={{ color: 'var(--secondary-color)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Stack</Link></li>
              <li><Link to="/queue" style={{ color: 'var(--secondary-color)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Queue</Link></li>
              <li><Link to="/linkedlist" style={{ color: 'var(--secondary-color)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Linked List</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Hierarchical</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/tree" style={{ color: 'var(--secondary-color)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Binary Tree (BST)</Link></li>
              <li><Link to="/graph" style={{ color: 'var(--secondary-color)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Graph</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom" style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&copy; {new Date().getFullYear()} DS Visualizer. React Version.</p>
      </div>
    </footer>
  );
}
