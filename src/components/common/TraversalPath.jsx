import React from 'react';

/**
 * TraversalPath — Displays a horizontal sequence of visited nodes during traversal.
 *
 * Props:
 *   - sequence: Array of values (e.g., [10, 5, 3, 7])
 *   - currentIndex: Index of the currently active node (-1 if none)
 *   - label: Display label (e.g., "Inorder Traversal")
 *   - visible: Whether to show the panel
 */
export default function TraversalPath({
  sequence = [],
  currentIndex = -1,
  label = 'Traversal Path',
  visible = false,
}) {
  if (!visible && sequence.length === 0) return null;

  return (
    <div className="traversal-path-container glass">
      <div className="traversal-path-header">
        <span className="traversal-path-icon">🔀</span>
        <span className="output-label">{label}</span>
      </div>
      <div className="output-sequence">
        {sequence.length === 0 ? (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            Result will appear here...
          </span>
        ) : (
          sequence.map((val, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="output-arrow">→</span>}
              <span
                className={`output-node ${
                  index === currentIndex ? 'traversal-current' : ''
                } ${index < currentIndex ? 'traversal-visited' : ''}`}
              >
                {val}
              </span>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
