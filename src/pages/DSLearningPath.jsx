import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { dsConfig } from '../data/dsConfig';

export default function DSLearningPath() {
  const { ds } = useParams();
  const config = dsConfig[ds.toLowerCase()];

  if (!config) {
    return (
      <div className="error-page" style={{ padding: '120px 5%', textAlign: 'center' }}>
        <h2>Data Structure Not Found</h2>
        <p>The DS "{ds}" is not supported yet.</p>
        <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="learning-path-page" style={{ padding: '120px 5% 60px' }}>
      <div className="section-header" style={{ marginBottom: '4rem' }}>
        <div className="badge" style={{ marginBottom: '1rem' }}>Learning Path</div>
        <h1>Mastering <span className="text-gradient">{config.title}</span></h1>
        <p style={{ maxWidth: '700px', margin: '0 auto' }}>{config.description}</p>
      </div>

      <div className="card-grid" style={{ maxWidth: '1100px' }}>
        {/* Theory + Implementation */}
        <Link to={`/${ds}/theory`} className="card glass interactive">
          <div className="card-icon blue-glow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <h3>Theory + Implementation</h3>
          <p>Deep dive into the conceptual working and visual implementation of {config.title}.</p>
          <div className="card-footer" style={{ marginTop: '1.5rem', fontWeight: '600', color: 'var(--primary-color)' }}>
            Start Learning →
          </div>
        </Link>

        {/* Application Based Implementation */}
        <Link to={`/${ds}/application`} className="card glass interactive">
          <div className="card-icon purple-glow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h3>Application based implementation</h3>
          <p>See how {config.title} is used in real-world scenarios like {config.application.title}.</p>
          <div className="card-footer" style={{ marginTop: '1.5rem', fontWeight: '600', color: 'var(--secondary-color)' }}>
            View Application →
          </div>
        </Link>

        {/* DS Understanding */}
        <Link to={`/${ds}/quiz`} className="card glass interactive">
          <div className="card-icon pink-glow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>DS understanding</h3>
          <p>Test your knowledge with a short quiz and get instant feedback on your progress.</p>
          <div className="card-footer" style={{ marginTop: '1.5rem', fontWeight: '600', color: '#F472B6' }}>
            Take Quiz →
          </div>
        </Link>
      </div>
    </div>
  );
}
