import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from '../hooks/useVisualizerEngine';

const MAX_NODES = 15;

export default function TreeVisualizer() {
  const engine = useVisualizerEngine();
  
  // nodesMap: { [id]: { id, value, leftId, rightId } }
  const [nodesMap, setNodesMap] = useState({});
  const [rootId, setRootId] = useState(null);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [sizeCounter, setSizeCounter] = useState(0);
  
  const [inputValue, setInputValue] = useState('');
  const logContainerRef = useRef(null);
  const svgRef = useRef(null);
  const [svgWidth, setSvgWidth] = useState(800);
  
  const [elementStates, setElementStates] = useState({});
  const [toasts, setToasts] = useState([]);

  const showErrorToast = (msg) => {
      engine.logAction(msg, "error");
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, msg }]);
      setTimeout(() => {
          setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
          setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== id));
          }, 400);
      }, 3500);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [engine.logs]);

  useEffect(() => {
     if(svgRef.current) setSvgWidth(svgRef.current.clientWidth || 800);
     const handler = () => { if(svgRef.current && !engine.isExecuting) setSvgWidth(svgRef.current.clientWidth || 800); };
     window.addEventListener('resize', handler);
     return () => window.removeEventListener('resize', handler);
  }, [engine.isExecuting]);

  useEffect(() => {
    engine.updateCode([
      `class Node { constructor(v) { this.val = v; this.left = this.right = null; } }`,
      `let root = null;`
    ]);
  }, []);

  const highlightNode = (id, className) => {
    setElementStates(prev => ({ ...prev, [`node-${id}`]: className }));
  };
  const highlightEdge = (parentId, childId, className) => {
    setElementStates(prev => ({ ...prev, [`edge-${parentId}-${childId}`]: className }));
  };

  const insertNode = () => {
    if (engine.isExecuting) return;
    const val = parseInt(inputValue.trim());
    if (isNaN(val)) { showErrorToast("Please enter a valid numeric value."); return; }
    
    if (sizeCounter >= MAX_NODES) {
        showErrorToast(`Visualizer limit reached (${MAX_NODES} nodes)!`);
        return;
    }
    
    setInputValue('');
    const newNodeId = nextNodeId;
    setNextNodeId(prev => prev + 1);

    if (!rootId) {
        engine.executeSteps([
            async () => {
                 engine.logAction(`Inserting root node: ${val}`, "success");
                 engine.updateCode([`root = new Node(${val});`]);
                 
                 setNodesMap(prev => ({ ...prev, [newNodeId]: { id: newNodeId, value: val, leftId: null, rightId: null } }));
                 setRootId(newNodeId);
                 setSizeCounter(1);
                 
                 highlightNode(newNodeId, 'tree-node-insert');
                 await engine.sleep(engine.getDelay() * 1.5);
                 highlightNode(newNodeId, null);
            }
        ]);
        return;
    }

    const steps = [
        async () => {
            engine.logAction(`Starting BST search to insert '${val}'`, "info");
            engine.updateCode([`let current = root;`, `while (current != null) { ... }`]);
        }
    ];

    let currId = rootId;
    let parentId = null;
    let isLeft = false;

    // Simulate traversal to find insertion point
    // We capture states to build steps, meaning we need to trace values without modifying state yet
    let simulatedMap = JSON.parse(JSON.stringify(nodesMap));
    
    while (currId) {
        let loopId = currId;
        let loopVal = simulatedMap[loopId].value;
        
        steps.push(async () => {
            engine.logAction(`Comparing ${val} with Node [${loopVal}]`, "info");
            highlightNode(loopId, 'tree-node-highlight');
            engine.updateCode([`if (value < current.value) current = current.left;`, `else current = current.right;`]);
            await engine.sleep(engine.getDelay() * 1.2);
            highlightNode(loopId, null);
        });

        parentId = currId;
        
        if (val < loopVal) {
            currId = simulatedMap[currId].leftId;
            isLeft = true;
            steps.push(async () => engine.logAction(`Value ${val} is smaller → go left`, "success"));
            if (currId) {
                const nextNodeId = currId;
                steps.push(async () => {
                    highlightEdge(loopId, nextNodeId, 'tree-edge-highlight');
                    await engine.sleep(engine.getDelay() * 1.2);
                    highlightEdge(loopId, nextNodeId, null);
                });
            }
        } else if (val > loopVal) {
            currId = simulatedMap[currId].rightId;
            isLeft = false;
            steps.push(async () => engine.logAction(`Value ${val} is greater → go right`, "success"));
            if (currId) {
                const nextNodeId = currId;
                steps.push(async () => {
                    highlightEdge(loopId, nextNodeId, 'tree-edge-highlight');
                    await engine.sleep(engine.getDelay() * 1.2);
                    highlightEdge(loopId, nextNodeId, null);
                });
            }
        } else {
             steps.push(async () => {
                 showErrorToast(`BST inherently prevents duplicate values (${val} already exists).`);
             });
             engine.executeSteps(steps);
             return;
        }
    }

    const capturedParentId = parentId;
    
    steps.push(async () => {
        const pVal = simulatedMap[capturedParentId].value;
        engine.logAction(`Found empty leaf spot. Attaching ${val} as ${isLeft ? 'LEFT' : 'RIGHT'} child of ${pVal}`, "success");
        engine.updateCode([`let newNode = new Node(${val});`, `if (val < parent.val) parent.left = newNode;`, `else parent.right = newNode;`]);
        
        setNodesMap(prev => {
            const next = { ...prev, [newNodeId]: { id: newNodeId, value: val, leftId: null, rightId: null } };
            next[capturedParentId] = { ...next[capturedParentId] };
            if (isLeft) next[capturedParentId].leftId = newNodeId;
            else next[capturedParentId].rightId = newNodeId;
            return next;
        });
        setSizeCounter(prev => prev + 1);
        
        highlightNode(newNodeId, 'tree-node-insert');
        highlightEdge(capturedParentId, newNodeId, 'tree-edge-highlight');
        
        await engine.sleep(engine.getDelay() * 2);
        
        highlightNode(newNodeId, null);
        highlightEdge(capturedParentId, newNodeId, null);
    });

    engine.executeSteps(steps);
  };

  const searchNode = () => {
    if (engine.isExecuting) return;
    const val = parseInt(inputValue.trim());
    if (isNaN(val)) { showErrorToast("Please enter a numeric value to search."); return; }
    setInputValue('');

    if (!rootId) { showErrorToast("Tree is empty!"); return; }

    const steps = [
        async () => {
            engine.logAction(`Searching for value '${val}'...`, "info");
            engine.updateCode([`let current = root;`, `while (current != null) { ... }`]);
        }
    ];

    let currId = rootId;
    let found = false;
    let simulatedMap = nodesMap;

    while (currId) {
        let loopId = currId;
        let loopVal = simulatedMap[loopId].value;
        
        steps.push(async () => {
            engine.logAction(`Checking Node [${loopVal}]`, "info");
            highlightNode(loopId, 'tree-node-highlight');
            engine.updateCode([
                `if (val === current.value) return current;`,
                `if (val < current.value) current = current.left;`,
                `else current = current.right;`
            ]);
            await engine.sleep(engine.getDelay() * 1.5);
            highlightNode(loopId, null);
        });

        if (val === loopVal) {
            found = true;
            steps.push(async () => {
                engine.logAction(`Value ${val} FOUND in the tree!`, "success");
                highlightNode(loopId, 'tree-node-highlight');
                await engine.sleep(engine.getDelay() * 2);
                highlightNode(loopId, null);
            });
            break;
        } else if (val < loopVal) {
            currId = simulatedMap[currId].leftId;
            steps.push(async () => engine.logAction(`${val} < ${loopVal} → Going LEFT`, "info"));
        } else {
            currId = simulatedMap[currId].rightId;
            steps.push(async () => engine.logAction(`${val} > ${loopVal} → Going RIGHT`, "info"));
        }

        if (currId) {
            const nextNodeId = currId;
            steps.push(async () => {
                highlightEdge(loopId, nextNodeId, 'tree-edge-highlight');
                await engine.sleep(engine.getDelay() * 1);
                highlightEdge(loopId, nextNodeId, null);
            });
        }
    }

    if (!found) {
        steps.push(async () => {
            showErrorToast(`Value ${val} not found in the BST.`);
        });
    }

    engine.executeSteps(steps);
  };

  const deleteNode = () => {
    if (engine.isExecuting) return;
    const val = parseInt(inputValue.trim());
    if (isNaN(val)) { showErrorToast("Please enter a numeric value to delete."); return; }
    setInputValue('');

    if (!rootId) { showErrorToast("Tree is empty!"); return; }

    const steps = [
        async () => {
            engine.logAction(`Initiating deletion for '${val}'`, "info");
            engine.updateCode([`root = deleteRecursive(root, ${val});`]);
        }
    ];

    let parentId = null;
    let currId = rootId;
    let found = false;
    let simulatedMap = JSON.parse(JSON.stringify(nodesMap));

    while (currId) {
        let loopId = currId;
        let loopVal = simulatedMap[loopId].value;
        
        steps.push(async () => {
            engine.logAction(`Locating ${val}: Checking Node [${loopVal}]`, "info");
            highlightNode(loopId, 'tree-node-highlight');
            await engine.sleep(engine.getDelay() * 1);
            highlightNode(loopId, null);
        });

        if (val === loopVal) { found = true; break; }
        
        parentId = currId;
        if (val < loopVal) {
            currId = simulatedMap[currId].leftId;
            steps.push(async () => engine.logAction(`${val} < ${loopVal} → Left`, "info"));
        } else {
            currId = simulatedMap[currId].rightId;
            steps.push(async () => engine.logAction(`${val} > ${loopVal} → Right`, "info"));
        }
    }

    if (!found) {
        steps.push(async () => showErrorToast(`Value ${val} not found. Deletion aborted.`));
        engine.executeSteps(steps);
        return;
    }

    const targetNodeId = currId;
    const targetParentId = parentId;
    const targetNode = simulatedMap[targetNodeId];

    steps.push(async () => {
        engine.logAction(`Node [${targetNode.value}] found. Determining deletion case...`, "info");
        highlightNode(targetNodeId, 'tree-node-highlight');
        await engine.sleep(engine.getDelay() * 1.5);
    });

    if (targetNode.leftId === null || targetNode.rightId === null) {
        let replacementId = targetNode.leftId ? targetNode.leftId : targetNode.rightId;

        steps.push(async () => {
            if (!replacementId) {
                engine.logAction(`Case 1: [${targetNode.value}] is a leaf node. Removing...`, "success");
                engine.updateCode([`if (!node.left && !node.right) return null;`]);
            } else {
                engine.logAction(`Case 2: [${targetNode.value}] has one child. Passing to parent...`, "success");
                engine.updateCode([`return node.left || node.right;`]);
            }
            highlightNode(targetNodeId, 'tree-node-delete');
            await engine.sleep(engine.getDelay() * 1.5);
            highlightNode(targetNodeId, 'tree-node-fade-out');
            await engine.sleep(engine.getDelay() * 0.5);
        });

        steps.push(async () => {
            setNodesMap(prev => {
                const next = { ...prev };
                delete next[targetNodeId];
                if (targetParentId === null) {
                } else {
                    next[targetParentId] = { ...next[targetParentId] };
                    if (next[targetParentId].leftId === targetNodeId) next[targetParentId].leftId = replacementId;
                    else next[targetParentId].rightId = replacementId;
                }
                return next;
            });
            if (targetParentId === null) setRootId(replacementId);
            setSizeCounter(prev => prev - 1);
            engine.logAction(`Structural update complete.`, "info");
        });
    } else {
        steps.push(async () => {
            engine.logAction(`Case 3: [${targetNode.value}] has TWO children.`, "info");
            engine.updateCode([`node.value = findMin(node.right);`, `node.right = delete(node.right, min);`]);
        });

        let succCurrId = targetNode.rightId;
        let succParentId = targetNodeId;
        while (simulatedMap[succCurrId].leftId !== null) {
            succParentId = succCurrId;
            succCurrId = simulatedMap[succCurrId].leftId;
        }
        
        const successorId = succCurrId;
        const successorParentId = succParentId;
        const successorVal = simulatedMap[successorId].value;

        steps.push(async () => {
            engine.logAction(`Successor [${successorVal}] found. Swapping values...`, "success");
            highlightNode(targetNodeId, 'tree-node-highlight');
            highlightNode(successorId, 'tree-node-highlight');
            await engine.sleep(engine.getDelay() * 2);
            
            setNodesMap(prev => ({
                ...prev,
                [targetNodeId]: { ...prev[targetNodeId], value: successorVal }
            }));
            
            engine.logAction(`Value swapped to [${successorVal}]. Now deleting original successor...`, "info");
            highlightNode(targetNodeId, null);
            highlightNode(successorId, null);
        });

        steps.push(async () => {
            highlightNode(successorId, 'tree-node-delete');
            await engine.sleep(engine.getDelay() * 1.5);
            highlightNode(successorId, 'tree-node-fade-out');
            await engine.sleep(engine.getDelay() * 0.5);

            setNodesMap(prev => {
                const next = { ...prev };
                const succRightId = next[successorId].rightId;
                delete next[successorId];
                next[successorParentId] = { ...next[successorParentId] };
                if (next[successorParentId].leftId === successorId) next[successorParentId].leftId = succRightId;
                else next[successorParentId].rightId = succRightId;
                return next;
            });
            setSizeCounter(prev => prev - 1);
        });
    }

    engine.executeSteps(steps);
  };

  const initiateTraversal = (type) => {
    if (engine.isExecuting) return;
    if (!rootId) { showErrorToast("Tree is empty!"); return; }
    
    const steps = [
        async () => engine.logAction(`Initializing ${type} Traversal`, "info")
    ];

    const mappedSteps = [];
    const simulatedMap = nodesMap;

    const traverseInorder = (nodeId) => {
        if (!nodeId) return;
        traverseInorder(simulatedMap[nodeId].leftId);
        let loopId = nodeId;
        let loopVal = simulatedMap[nodeId].value;
        mappedSteps.push(async () => {
            engine.logAction(`Visiting Node: ${loopVal}`, "success");
            engine.updateCode([`inorder(node.left);`, `console.log(node.value);`, `inorder(node.right);`]);
            highlightNode(loopId, 'tree-node-highlight');
            await engine.sleep(engine.getDelay() * 1.5);
            highlightNode(loopId, null);
        });
        traverseInorder(simulatedMap[nodeId].rightId);
    };

    const traversePreorder = (nodeId) => {
        if (!nodeId) return;
        let loopId = nodeId;
        let loopVal = simulatedMap[nodeId].value;
        mappedSteps.push(async () => {
            engine.logAction(`Visiting Node: ${loopVal}`, "success");
            engine.updateCode([`console.log(node.value);`, `preorder(node.left);`, `preorder(node.right);`]);
            highlightNode(loopId, 'tree-node-highlight');
            await engine.sleep(engine.getDelay() * 1.5);
            highlightNode(loopId, null);
        });
        traversePreorder(simulatedMap[nodeId].leftId);
        traversePreorder(simulatedMap[nodeId].rightId);
    };

    const traversePostorder = (nodeId) => {
        if (!nodeId) return;
        traversePostorder(simulatedMap[nodeId].leftId);
        traversePostorder(simulatedMap[nodeId].rightId);
        let loopId = nodeId;
        let loopVal = simulatedMap[nodeId].value;
        mappedSteps.push(async () => {
            engine.logAction(`Visiting Node: ${loopVal}`, "success");
            engine.updateCode([`postorder(node.left);`, `postorder(node.right);`, `console.log(node.value);`]);
            highlightNode(loopId, 'tree-node-highlight');
            await engine.sleep(engine.getDelay() * 1.5);
            highlightNode(loopId, null);
        });
    };

    if (type === 'Inorder') traverseInorder(rootId);
    else if (type === 'Preorder') traversePreorder(rootId);
    else if (type === 'Postorder') traversePostorder(rootId);
    
    steps.push(...mappedSteps);
    steps.push(async () => engine.logAction(`${type} Traversal Completed.`, "success"));
    
    engine.executeSteps(steps);
  };

  const resetTree = () => {
    if (engine.isExecuting) return;
    engine.executeSteps([
         async () => {
             const newStates = {};
             Object.keys(nodesMap).forEach(id => newStates[`node-${id}`] = 'tree-node-fade-out');
             setElementStates(newStates);
             await engine.sleep(600);
         },
         async () => {
             setRootId(null);
             setSizeCounter(0);
             setNextNodeId(1);
             setNodesMap({});
             engine.clearLogs();
             engine.logAction("Tree wiped structurally.", "success");
             engine.updateCode([`root = null;`]);
             setElementStates({});
         }
    ]);
  };

  // Derive layout
  const layoutMap = JSON.parse(JSON.stringify(nodesMap));
  const buildLayout = (id, x, y, dx) => {
      if (!id) return;
      layoutMap[id].x = x;
      layoutMap[id].y = y;
      buildLayout(layoutMap[id].leftId, x - dx, y + 80, dx * 0.55);
      buildLayout(layoutMap[id].rightId, x + dx, y + 80, dx * 0.55);
  };
  buildLayout(rootId, svgWidth / 2, 40, svgWidth / 4);

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">Binary Search Tree</h1>
        <p>A hierarchical structure where left children are strictly less than the parent, and right children are strictly greater. Includes fundamental traversals.</p>
      </div>

      <div className="controls-panel glass">
        <div className="control-group">
          <input type="number" className="input-glass" placeholder="Enter value..."
            value={inputValue} onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && insertNode()} />
          <button onClick={insertNode} className="btn btn-primary small-btn">Insert</button>
          <button onClick={searchNode} className="btn btn-secondary glass small-btn">Search</button>
          <button onClick={deleteNode} className="btn btn-secondary glass small-btn" style={{ '--btn-secondary': '#ef4444' }}>Delete</button>
          
          <div className="control-divider"></div>
          
          <button onClick={() => initiateTraversal('Inorder')} className="btn btn-secondary glass small-btn">Inorder</button>
          <button onClick={() => initiateTraversal('Preorder')} className="btn btn-secondary glass small-btn">Preorder</button>
          <button onClick={() => initiateTraversal('Postorder')} className="btn btn-secondary glass small-btn">Postorder</button>
          <button onClick={resetTree} className="btn btn-secondary glass small-btn">Reset</button>
        </div>
        
        <div className="control-divider"></div>
        
        <div className="control-group animation-controls">
          <button className="icon-btn play-btn" title="Play" onClick={engine.play}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button className="icon-btn pause-btn" title="Pause" onClick={engine.pause}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <button className="icon-btn next-btn" title="Next Step" onClick={engine.nextStep}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
          </button>
          
          <div className="speed-slider-container">
            <label>Speed</label>
            <input type="range" min="1" max="5" value={engine.speed} onChange={e => engine.setSpeed(Number(e.target.value))} className="slider" />
          </div>
        </div>
      </div>

      <div className="visualizer-workspace tree-workspace">
        <div className="ds-container glass blue-glow-subtle" id="tree-canvas-container">
          <div className="ds-header">
             <h3>Tree Canvas</h3>
             <span className="badge glass">Nodes: {sizeCounter} / {MAX_NODES}</span>
          </div>
          
          <div className="tree-wrapper" ref={svgRef}>
             <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                 
                {/* Edges Layer */}
                {Object.values(layoutMap).map(node => {
                    const leftNode = node.leftId ? layoutMap[node.leftId] : null;
                    const rightNode = node.rightId ? layoutMap[node.rightId] : null;
                    return (
                        <React.Fragment key={`edges-${node.id}`}>
                            {leftNode && <line x1={node.x} y1={node.y} x2={leftNode.x} y2={leftNode.y} 
                                className={`tree-edge ${elementStates[`edge-${node.id}-${leftNode.id}`] || ''}`} />}
                            {rightNode && <line x1={node.x} y1={node.y} x2={rightNode.x} y2={rightNode.y} 
                                className={`tree-edge ${elementStates[`edge-${node.id}-${rightNode.id}`] || ''}`} />}
                        </React.Fragment>
                    );
                })}

                {/* Nodes Layer */}
                {Object.values(layoutMap).map(node => {
                    const nodeClassModifier = elementStates[`node-${node.id}`] || '';
                    return (
                        <g key={node.id} className={`tree-node-group ${nodeClassModifier}`} transform={`translate(${node.x || 0}, ${node.y || 0})`}>
                           <circle r="22" className="tree-node-circle" />
                           <text className="tree-node-text">{node.value}</text>
                        </g>
                    );
                })}
             </svg>
          </div>
        </div>

        <div className="explanation-panel glass">
          <h3>Execution Details</h3>
          <div className="code-execution">
            <pre><code>
              {engine.codeLines.map((line, i) => (
                <span key={i} className={`code-line ${i === 0 && line ? 'active' : ''}`}>{line || ' '}</span>
              ))}
            </code></pre>
          </div>
          
          <div className="status-log" ref={logContainerRef}>
             {engine.logs.map((log) => (
               <p key={log.id} className={`log-entry ${log.type} animate-enter`}>{log.msg}</p>
             ))}
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
