import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from '../hooks/useVisualizerEngine';
import MemoryPanel from '../components/common/MemoryPanel';

const MEM_BASE_ADDR = 0x2A0; // Base simulated memory address for graph

export default function GraphVisualizer() {
  const engine = useVisualizerEngine();

  // State structures
  // nodes: { [id]: { id, x, y, neighbors: [] } }
  const [nodes, setNodes] = useState({});
  const [edges, setEdges] = useState([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('vertex');
  const [vertexName, setVertexName] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [traversalType, setTraversalType] = useState('dfs');
  const [traversalStart, setTraversalStart] = useState('');
  
  const [elementStates, setElementStates] = useState({});
  const [outputSequence, setOutputSequence] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  const svgRef = useRef(null);
  const logContainerRef = useRef(null);
  const [svgDims, setSvgDims] = useState({ width: 800, height: 500 });
  const [isDirected, setIsDirected] = useState(false);

  // Memory Panel state
  const [showMemory, setShowMemory] = useState(true);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [engine.logs]);

  useEffect(() => {
    if (svgRef.current) {
        setSvgDims({
            width: svgRef.current.clientWidth || 800,
            height: svgRef.current.clientHeight || 500
        });
    }
  }, []);

  const showErrorToast = (msg) => {
      engine.logAction(msg, "error");
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, msg }]);
      setTimeout(() => {
          setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
      }, 3500);
  };

  const updateNodeState = (id, stateStr) => {
      setElementStates(prev => ({ ...prev, [`node-${id}`]: stateStr }));
  };

  const updateEdgeState = (from, to, stateStr) => {
      setElementStates(prev => ({ 
          ...prev, 
          [`edge-${from}-${to}`]: stateStr,
          [`edge-${to}-${from}`]: stateStr 
      }));
  };

  const resetAlgorithmStates = () => {
      setElementStates({});
      setOutputSequence([]);
  };

  // --- Helper: Generate hex address for a node name ---
  const getGraphHexAddr = (name) => {
    // Simple hash: sum char codes, use as offset
    let hash = 0;
    for (let i = 0; i < String(name).length; i++) {
      hash = ((hash << 5) - hash + String(name).charCodeAt(i)) | 0;
    }
    return '0x' + ((MEM_BASE_ADDR + (Math.abs(hash) % 0x400)) * 1).toString(16).toUpperCase();
  };

  // --- Build memory nodes for MemoryPanel ---
  const buildGraphMemoryNodes = () => {
    const nodeIds = Object.keys(nodes);
    // Create a stable address map
    const addrMap = {};
    nodeIds.forEach((id, i) => {
      addrMap[id] = '0x' + (MEM_BASE_ADDR + i * 4).toString(16).toUpperCase();
    });

    return nodeIds.map(id => ({
      id,
      address: addrMap[id],
      value: id,
      pointers: {
        neighbors: nodes[id].neighbors.map(nId => addrMap[nId] || '???'),
        neighborNames: nodes[id].neighbors,
      }
    }));
  };

  const addVertex = () => {
      const name = vertexName.trim();
      if (!name) { showErrorToast("Please enter a vertex name."); return; }
      if (nodes[name]) { showErrorToast("Vertex already exists."); return; }
      
      let x, y;
      let validPosition = false;
      let attempts = 0;
      
      // Prevent overlapping by enforcing minimum 110px distance between centers
      while (!validPosition && attempts < 50) {
          x = 150 + Math.random() * 500;
          y = 100 + Math.random() * 300;
          validPosition = true;
          
          for (const key in nodes) {
              const existingNode = nodes[key];
              const dist = Math.sqrt(Math.pow(existingNode.x - x, 2) + Math.pow(existingNode.y - y, 2));
              if (dist < 110) {
                  validPosition = false;
                  break;
              }
          }
          attempts++;
      }
      
      setNodes(prev => ({ ...prev, [name]: { id: name, x, y, neighbors: [] } }));
      
      // Auto-select in dropdowns if empty
      if (!edgeSource) setEdgeSource(name);
      if (!edgeTarget) setEdgeTarget(name);
      if (!traversalStart) setTraversalStart(name);
      
      setVertexName('');
      engine.logAction(`Vertex "${name}" added to graph.`, 'success');
  };

  const addEdge = () => {
      if (!edgeSource || !edgeTarget) { showErrorToast("Select both vertices."); return; }
      if (edgeSource === edgeTarget) { showErrorToast("Self-loops not recommended."); return; }
      
      const exists = edges.some(e => 
          (e.from === edgeSource && e.to === edgeTarget) || 
          (!isDirected && e.from === edgeTarget && e.to === edgeSource)
      );
      if (exists) { showErrorToast("Edge already exists."); return; }
      
      setEdges(prev => [...prev, { from: edgeSource, to: edgeTarget }]);
      
      setNodes(prev => {
          const next = { ...prev };
          next[edgeSource] = { ...next[edgeSource], neighbors: [...next[edgeSource].neighbors, edgeTarget] };
          if (!isDirected) {
              next[edgeTarget] = { ...next[edgeTarget], neighbors: [...next[edgeTarget].neighbors, edgeSource] };
          }
          return next;
      });
      
      engine.logAction(`Connected ${edgeSource} to ${edgeTarget}.`, 'success');
  };

  const deleteVertex = (id, e) => {
      if (e) e.stopPropagation();
      setNodes(prev => {
          const next = { ...prev };
          delete next[id];
          Object.keys(next).forEach(key => {
              next[key] = { ...next[key], neighbors: next[key].neighbors.filter(n => n !== id) };
          });
          return next;
      });
      setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
      
      if (edgeSource === id) setEdgeSource('');
      if (edgeTarget === id) setEdgeTarget('');
      if (traversalStart === id) setTraversalStart('');
      
      engine.logAction(`Vertex ${id} removed.`, 'info');
  };

  const deleteEdge = (from, to) => {
      setEdges(prev => prev.filter(e => !(e.from === from && e.to === to)));
      setNodes(prev => {
          const next = { ...prev };
          if (next[from]) next[from] = { ...next[from], neighbors: next[from].neighbors.filter(n => n !== to) };
          if (!isDirected && next[to]) next[to] = { ...next[to], neighbors: next[to].neighbors.filter(n => n !== from) };
          return next;
      });
      engine.logAction(`Edge ${from}-${to} removed.`, 'info');
  };

  const handleBfs = () => {
     if (engine.isExecuting) return;
     if (!traversalStart) { showErrorToast("Select a starting vertex."); return; }
     
     resetAlgorithmStates();
     
     const steps = [
         async () => {
             engine.logAction(`Starting BFS from node ${traversalStart}`, 'info');
             engine.updateCode([`let queue = [${traversalStart}];`, `let visited = {${traversalStart}};`]);
             updateNodeState(traversalStart, 'node-queued');
         }
     ];

     const queue = [traversalStart];
     const visited = new Set([traversalStart]);
     
     // Simulation to register steps
     let queueSim = [...queue];
     let visitedSim = new Set([...visited]);
     
     while (queueSim.length > 0) {
         const u = queueSim.shift();
         
         const captureU = u;
         steps.push(async () => {
             engine.logAction(`Visiting node ${captureU}`, 'info');
             updateNodeState(captureU, 'node-current');
             setOutputSequence(prev => [...prev, captureU]);
         });

         const neighbors = nodes[u].neighbors;
         for (const v of neighbors) {
             if (!visitedSim.has(v)) {
                 visitedSim.add(v);
                 queueSim.push(v);
                 
                 const captureV = v;
                 steps.push(async () => {
                     engine.logAction(`Discovered neighbor ${captureV} from ${captureU}`, 'success');
                     updateEdgeState(captureU, captureV, 'edge-traversed');
                     updateNodeState(captureV, 'node-queued');
                 });
             }
         }

         steps.push(async () => {
             updateNodeState(captureU, 'node-visited');
         });
     }

     steps.push(async () => engine.logAction("BFS traversal completed", "success"));
     engine.executeSteps(steps);
  };

  const handleDfs = () => {
     if (engine.isExecuting) return;
     if (!traversalStart) { showErrorToast("Select a starting vertex."); return; }
     
     resetAlgorithmStates();
     
     const steps = [
         async () => {
             engine.logAction(`Starting DFS from node ${traversalStart}`, 'info');
             engine.updateCode([`function dfs(node) {`, `  visited.add(node);`, `  for(let n of node.neighbors) { dfs(n); }`, `}`]);
         }
     ];

     const visitedSim = new Set();

     function dfsRecursive(u, p = null) {
         visitedSim.add(u);
         
         const captureU = u;
         const captureP = p;
         
         steps.push(async () => {
             engine.logAction(`Visiting node ${captureU}`, 'info');
             if (captureP) {
                 updateEdgeState(captureP, captureU, 'edge-traversed');
             }
             updateNodeState(captureU, 'node-current');
             setOutputSequence(prev => [...prev, captureU]);
         });

         const neighbors = nodes[u].neighbors;
         for (const v of neighbors) {
             if (!visitedSim.has(v)) {
                 dfsRecursive(v, u);
             }
         }

         steps.push(async () => {
             engine.logAction(`Backtracking from ${captureU}`, 'info');
             updateNodeState(captureU, 'node-visited');
         });
     }

     dfsRecursive(traversalStart);
     steps.push(async () => engine.logAction("DFS traversal completed", "success"));
     
     engine.executeSteps(steps);
  };

  const startTraversal = () => {
      if (traversalType === 'bfs') handleBfs();
      else handleDfs();
  };

  const nodeOptions = Object.keys(nodes).map(id => <option key={id} value={id}>{id}</option>);

  // Build memory data for MemoryPanel
  const graphMemoryNodes = buildGraphMemoryNodes();

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">Graph Visualizer</h1>
        <p>Explore relationships between nodes using Undirected graphs. Learn BFS and DFS algorithms step-by-step.</p>
      </div>

      <div className="visualizer-workspace graph-upgrade-workspace">
        
        {/* Left: Graph SVG Canvas */}
        <div className="ds-container glass blue-glow-subtle" id="graph-canvas-container">
          <div className="ds-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
             <h3 id="canvas-title">Visualization</h3>
             <span className="badge glass">Nodes: {Object.keys(nodes).length} | Edges: {edges.length}</span>
          </div>

          <div className="graph-legend" style={{ display: 'flex', gap: '1.2rem', padding: '0 1.5rem', fontSize: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.95)', border: '2px solid var(--primary-color)' }}></div> <span style={{ color: 'var(--text-muted)' }}>Unvisited</span></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div> <span style={{ color: 'var(--text-muted)' }}>Queued/Discovered</span></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-color)' }}></div> <span style={{ color: 'var(--text-muted)' }}>Current Node</span></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div> <span style={{ color: 'var(--text-muted)' }}>Visited</span></div>
          </div>
          
          <div className="tree-wrapper" id="graph-wrapper" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <svg id="graph-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="40" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.7)" />
                   </marker>
                   <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="40" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
                   </marker>
                </defs>
                {edges.map((edge, i) => {
                    const fromNode = nodes[edge.from];
                    const toNode = nodes[edge.to];
                    if (!fromNode || !toNode) return null;
                    
                    const mx = (fromNode.x + toNode.x) / 2;
                    const my = (fromNode.y + toNode.y) / 2;
                    
                    const edgeClasses = elementStates[`edge-${edge.from}-${edge.to}`] || '';

                    return (
                        <g key={`edge-${i}`}>
                            <line 
                                x1={fromNode.x} y1={fromNode.y} 
                                x2={toNode.x} y2={toNode.y} 
                                stroke={edgeClasses.includes('edge-traversed') ? '#F59E0B' : 'rgba(255, 255, 255, 0.6)'} 
                                strokeWidth={edgeClasses.includes('edge-traversed') ? '6' : '4'} 
                                markerEnd={isDirected ? 'url(#arrowhead)' : undefined} 
                            />
                            
                            <g className="delete-group" onClick={() => deleteEdge(edge.from, edge.to)} style={{cursor: 'pointer'}}>
                               <circle cx={mx} cy={my} r="14" fill="#ef4444" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                               <text x={mx} y={my + 1} fill="white" fontSize="16px" textAnchor="middle" dominantBaseline="central" fontWeight="bold">×</text>
                            </g>
                        </g>
                    )
                })}
                
                {Object.values(nodes).map(node => {
                    const nodeClasses = elementStates[`node-${node.id}`] || '';
                    return (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                            <circle cx="0" cy="0" r="30" fill={nodeClasses.includes('current') ? 'var(--primary-color)' : nodeClasses.includes('visited') ? '#10B981' : nodeClasses.includes('queued') ? '#F59E0B' : 'rgba(15, 23, 42, 0.95)'} stroke={nodeClasses ? 'white' : 'var(--primary-color)'} strokeWidth="4" />
                            <text x="0" y="2" fill="white" fontSize="22px" fontWeight="bold" textAnchor="middle" dominantBaseline="central">{node.id}</text>
                            
                            <g className="delete-group" onClick={(e) => deleteVertex(node.id, e)} style={{cursor: 'pointer'}}>
                               <circle cx="26" cy="-26" r="10" fill="#ef4444" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                               <text x="26" y="-24" fill="white" fontSize="12px" textAnchor="middle" dominantBaseline="central" fontWeight="bold">×</text>
                            </g>
                        </g>
                    );
                })}
             </svg>
          </div>

          <div className="traversal-output-container glass" style={{ margin: '1rem' }}>
             <div className="output-label">Traversal Path:</div>
             <div className="output-sequence">
                {outputSequence.length === 0 ? (
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Result will appear here...</span>
                ) : (
                    outputSequence.map((id, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <span className="output-arrow">→</span>}
                            <span className="output-node">{id}</span>
                        </React.Fragment>
                    ))
                )}
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column-stack">
          
          <div className="explanation-panel glass operations-panel">
            <div className="ds-header">
               <h3>Operations</h3>
            </div>

            <div className="tabs-container">
               <button className={`tab-btn ${activeTab === 'vertex' ? 'active' : ''}`} onClick={() => setActiveTab('vertex')}>Vertex</button>
               <button className={`tab-btn ${activeTab === 'edge' ? 'active' : ''}`} onClick={() => setActiveTab('edge')}>Edge</button>
               <button className={`tab-btn ${activeTab === 'traversal' ? 'active' : ''}`} onClick={() => setActiveTab('traversal')}>Traversal</button>
            </div>

            {activeTab === 'vertex' && (
                <div className="tab-content active">
                   <div className="form-group">
                      <label>Vertex Name</label>
                      <input type="text" className="input-glass" placeholder="Enter vertex name" 
                             value={vertexName} onChange={e => setVertexName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addVertex()}/>
                      <button onClick={addVertex} className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>+ Add Vertex</button>
                   </div>
                </div>
            )}

            {activeTab === 'edge' && (
                <div className="tab-content active">
                   <div className="form-group">
                      <label>Source Vertex</label>
                      <select className="select-glass" value={edgeSource} onChange={e => setEdgeSource(e.target.value)}>
                         <option value="">Select...</option>
                         {nodeOptions}
                      </select>
                   </div>
                   <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label>Target Vertex</label>
                      <select className="select-glass" value={edgeTarget} onChange={e => setEdgeTarget(e.target.value)}>
                         <option value="">Select...</option>
                         {nodeOptions}
                      </select>
                   </div>
                   <button onClick={addEdge} className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>+ Add Edge</button>
                </div>
            )}

            {activeTab === 'traversal' && (
                <div className="tab-content active">
                   <div className="form-group">
                      <label>Traversal Type</label>
                      <select className="select-glass" value={traversalType} onChange={e => setTraversalType(e.target.value)}>
                         <option value="dfs">Depth-First Search (DFS)</option>
                         <option value="bfs">Breadth-First Search (BFS)</option>
                      </select>
                   </div>
                   <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label>Start Vertex</label>
                      <select className="select-glass" value={traversalStart} onChange={e => setTraversalStart(e.target.value)}>
                         <option value="">Select...</option>
                         {nodeOptions}
                      </select>
                   </div>
                   <button onClick={startTraversal} className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>Start Traversal</button>

                   <div className="control-group animation-controls" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                     <button className="icon-btn play-btn" onClick={engine.play}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
                     <button className="icon-btn pause-btn" onClick={engine.pause}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>
                     <div className="speed-slider-container">
                       <input type="range" min="1" max="5" value={engine.speed} onChange={e => engine.setSpeed(Number(e.target.value))} className="slider" />
                     </div>
                   </div>
                </div>
            )}
          </div>

          <div className="explanation-panel glass status-panel" style={{ marginTop: '1.5rem' }}>
             <h3>Execution Details</h3>
             <div className="status-log" ref={logContainerRef}>
                {engine.logs.map(log => (
                    <p key={log.id} className={`log-entry ${log.type} animate-enter`}>{log.msg}</p>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Memory Management Panel — full width below workspace */}
      <MemoryPanel
        nodes={graphMemoryNodes}
        type="graph"
        visible={showMemory}
        onToggle={() => setShowMemory(prev => !prev)}
      />
      
      {/* Theory & Complexity Panel */}
      <section className="glass" style={{ margin: '2rem', padding: '1.5rem', borderRadius: '15px' }}>
         <div className="ds-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}><span style={{ opacity: 0.7, marginRight: '8px' }}>📚</span> Graph Theory & Mechanics</h3>
         </div>
         
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Left Column: What is a Graph */}
            <div style={{ flex: '1 1 300px' }}>
               <h4 style={{ color: 'var(--secondary-color)', marginBottom: '0.6rem', fontSize: '1rem' }}>What is a Graph?</h4>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  A Graph is a non-linear data structure consisting of <strong>Vertices (Nodes)</strong> and <strong>Edges (Lines)</strong>. 
                  Unlike trees, graphs can have closed loops (cycles) and do not require a central root node. They are used to represent complex networks like roads or social connections.
               </p>
               
               <h4 style={{ color: 'var(--secondary-color)', marginTop: '1.2rem', marginBottom: '0.6rem', fontSize: '1rem' }}>Core Operations</h4>
               <ul style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', paddingLeft: '1.2rem' }}>
                  <li><strong style={{ color: '#10B981' }}>Add Node/Edge:</strong> In an Adjacency List topology, inserting a vertex or mapping an edge connection operates locally without rebinding the whole map.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#EF4444' }}>DFS (Depth-First Search):</strong> Plunges deep down a single branch until it hits a dead end before backtracking. Powered recursively strictly via a Stack.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#3b82f6' }}>BFS (Breadth-First Search):</strong> Scans neighbors radially layer-by-layer starting from the origin point. Powered strictly via a Queue.</li>
               </ul>
            </div>

            {/* Right Column: Complexities */}
            <div style={{ flex: '1 1 300px', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#A855F7', marginRight: '8px' }}>⚡</span> Time & Space Complexity
               </h4>
               
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <tbody>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Add Vertex/Edge</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Remove Vertex</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#EAB308' }}>O(V + E)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>BFS Traversal</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(V + E)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>DFS Traversal</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(V + E)</td>
                     </tr>
                     <tr>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Space Complexity</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#EAB308' }}>O(V + E)</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </section>

      <div className="toast-container">
         {toasts.map(t => (
            <div key={t.id} className={`toast ${t.fading ? 'fade-out' : ''}`}>
               <div className="toast-icon">!</div> <span>{t.msg}</span>
            </div>
         ))}
      </div>
    </main>
  );
}
