import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from '../hooks/useVisualizerEngine';

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
  const [isDirected, setIsDirected] = useState(false); // Can be toggleable if desired, logic is built to handle it. Defaulting to undirected for simplicity of demo, but let's keep it undirected.

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

  const addVertex = () => {
      const name = vertexName.trim();
      if (!name) { showErrorToast("Please enter a vertex name."); return; }
      if (nodes[name]) { showErrorToast("Vertex already exists."); return; }
      
      const x = 100 + Math.random() * (svgDims.width - 200);
      const y = 100 + Math.random() * (svgDims.height - 200);
      
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

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">Graph Visualizer</h1>
        <p>Explore relationships between nodes using Undirected graphs. Learn BFS and DFS algorithms step-by-step.</p>
      </div>

      <div className="visualizer-workspace graph-upgrade-workspace">
        
        {/* Left: Graph SVG Canvas */}
        <div className="ds-container glass blue-glow-subtle" id="graph-canvas-container">
          <div className="ds-header">
             <h3 id="canvas-title">Visualization</h3>
             <span className="badge glass">Nodes: {Object.keys(nodes).length} | Edges: {edges.length}</span>
          </div>
          
          <div className="tree-wrapper" id="graph-wrapper" style={{ overflow: 'hidden', height: '500px', position: 'relative' }} ref={svgRef}>
             <svg id="graph-svg">
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" className="edge-arrow" />
                   </marker>
                   <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
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
                            <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} className={`graph-edge ${edgeClasses}`} markerEnd={isDirected ? 'url(#arrowhead)' : undefined} />
                            <circle cx={mx} cy={my} r="10" className="delete-btn" onClick={() => deleteEdge(edge.from, edge.to)} style={{cursor: 'pointer'}} />
                            <text x={mx} y={my} className="delete-text" onClick={() => deleteEdge(edge.from, edge.to)} style={{cursor: 'pointer'}}>×</text>
                        </g>
                    )
                })}
                
                {Object.values(nodes).map(node => {
                    const nodeClasses = elementStates[`node-${node.id}`] || '';
                    return (
                        <g key={node.id} className={`graph-node ${nodeClasses}`} transform={`translate(${node.x}, ${node.y})`}>
                            <circle cx="0" cy="0" r="22" className="node-circle" />
                            <text x="0" y="0" className="node-text">{node.id}</text>
                            
                            <circle cx="18" cy="-18" r="8" className="delete-btn" onClick={(e) => deleteVertex(node.id, e)} style={{cursor: 'pointer'}} />
                            <text x="18" y="-18" className="delete-text" onClick={(e) => deleteVertex(node.id, e)} style={{cursor: 'pointer'}}>×</text>
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

          <div className="explanation-panel glass properties-panel" style={{ marginTop: '1.5rem' }}>
             <div className="ds-header">
                <h3><span style={{ opacity: 0.6 }}>ⓘ</span> Graph Properties</h3>
             </div>
             
             <div className="property-section">
                <h4>Structure</h4>
                <p>A graph consists of a set of vertices (nodes) and a set of edges connecting these vertices. This implementation uses an adjacency list representation.</p>
             </div>

             <div className="property-section" style={{ marginTop: '1rem' }}>
                <h4>Time Complexity</h4>
                <table className="complexity-table">
                   <tbody>
                      <tr><td>Add Vertex:</td><td>O(1)</td></tr>
                      <tr><td>Add Edge:</td><td>O(1)</td></tr>
                      <tr><td>BFS/DFS:</td><td>O(V + E)</td></tr>
                   </tbody>
                </table>
             </div>
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
