import React, { useState } from 'react';

/**
 * MemoryPanel — Reusable memory management visualization for Tree & Graph.
 *
 * Props:
 *   - nodes: Array of { id, address, value, pointers }
 *       • pointers for tree: { left: addr|null, right: addr|null }
 *       • pointers for graph: { neighbors: [addr, ...] }
 *   - type: "tree" | "graph"
 *   - visible: boolean (controlled toggle)
 *   - onToggle: () => void
 *   - highlightIds: Set of node ids to glow green (newly added)
 *   - deleteIds: Set of node ids to flash red (recently deleted)
 *   - addressMap: { [nodeId]: hexAddress } for resolving pointer display values
 */
export default function MemoryPanel({
  nodes = [],
  type = 'tree',
  visible = true,
  onToggle,
  highlightIds = new Set(),
  deleteIds = new Set(),
  addressMap = {},
}) {
  const [hoveredPointer, setHoveredPointer] = useState(null);

  if (!onToggle) {
    // Fallback uncontrolled toggle
    onToggle = () => {};
  }

  return (
    <div className="memory-panel-container glass">
      {/* Header with toggle */}
      <div className="memory-panel-header">
        <div className="memory-panel-title">
          <span className="memory-panel-icon">🧠</span>
          <h3>Memory Management</h3>
          <span className="badge glass" style={{ marginBottom: 0, fontSize: '0.75rem' }}>
            {type === 'tree' ? 'Heap' : 'Adjacency'} Layout
          </span>
        </div>
        <button
          className="memory-toggle-btn"
          onClick={onToggle}
          title={visible ? 'Hide Memory Panel' : 'Show Memory Panel'}
        >
          {visible ? '▼ Hide' : '▶ Show'}
        </button>
      </div>

      {/* Collapsible body */}
      <div className={`memory-panel-body ${visible ? 'expanded' : 'collapsed'}`}>
        {nodes.length === 0 ? (
          <div className="memory-empty-state">
            <span style={{ opacity: 0.4, fontSize: '1.5rem' }}>📭</span>
            <p>No nodes allocated in memory yet.</p>
          </div>
        ) : (
          <div className="memory-grid">
            {nodes.map((node) => {
              const isNew = highlightIds.has(node.id);
              const isDel = deleteIds.has(node.id);
              let cardClass = 'memory-card';
              if (isNew) cardClass += ' highlight-new';
              if (isDel) cardClass += ' highlight-delete';

              return (
                <div key={node.id} className={cardClass}>
                  {/* Address header */}
                  <div className="memory-card-addr">
                    <span className="memory-hex">{node.address}</span>
                  </div>

                  {/* Value */}
                  <div className="memory-card-value">
                    <span className="memory-label">Value</span>
                    <span className="memory-val">{node.value}</span>
                  </div>

                  {/* Pointers */}
                  {type === 'tree' && (
                    <div className="memory-card-pointers">
                      <div
                        className="pointer-field"
                        onMouseEnter={() =>
                          setHoveredPointer(`${node.id}-left`)
                        }
                        onMouseLeave={() => setHoveredPointer(null)}
                      >
                        <span className="pointer-label">L</span>
                        <span
                          className={`pointer-value ${
                            node.pointers?.left ? '' : 'null'
                          }`}
                        >
                          {node.pointers?.left || 'NULL'}
                        </span>
                        {hoveredPointer === `${node.id}-left` &&
                          node.pointers?.left && (
                            <span className="pointer-tooltip">
                              → {node.pointers.leftValue ?? '?'}
                            </span>
                          )}
                      </div>
                      <div
                        className="pointer-field"
                        onMouseEnter={() =>
                          setHoveredPointer(`${node.id}-right`)
                        }
                        onMouseLeave={() => setHoveredPointer(null)}
                      >
                        <span className="pointer-label">R</span>
                        <span
                          className={`pointer-value ${
                            node.pointers?.right ? '' : 'null'
                          }`}
                        >
                          {node.pointers?.right || 'NULL'}
                        </span>
                        {hoveredPointer === `${node.id}-right` &&
                          node.pointers?.right && (
                            <span className="pointer-tooltip">
                              → {node.pointers.rightValue ?? '?'}
                            </span>
                          )}
                      </div>
                    </div>
                  )}

                  {type === 'graph' && (
                    <div className="memory-card-adjacency">
                      <span className="pointer-label">Adj</span>
                      <div className="adjacency-list">
                        {node.pointers?.neighbors?.length > 0 ? (
                          node.pointers.neighbors.map((nAddr, i) => (
                            <span
                              key={i}
                              className="adjacency-chip"
                              title={`Connected to ${node.pointers.neighborNames?.[i] || nAddr}`}
                            >
                              {nAddr}
                            </span>
                          ))
                        ) : (
                          <span className="pointer-value null">∅</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary bar */}
        {nodes.length > 0 && (
          <div className="memory-summary">
            <span>
              <strong>{nodes.length}</strong> block{nodes.length > 1 ? 's' : ''} allocated
            </span>
            <span>
              Total: <strong>{nodes.length * 32} bytes</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}