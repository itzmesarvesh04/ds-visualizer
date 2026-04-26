import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from '../hooks/useVisualizerEngine';

export default function LinkedListVisualizer({ isApplicationMode }) {

  const engine = useVisualizerEngine();
  
  // memoryPool array elements: { addr: '0x1A2', value: '10', nextAddr: '0x3F4' }
  const [memoryPool, setMemoryPool] = useState([]); 
  const [headAddr, setHeadAddr] = useState(null);
  
  const [inputValue, setInputValue] = useState('');
  const [inputIndex, setInputIndex] = useState('');
  const logContainerRef = useRef(null);
  
  // Track animation classes for physical nodes, arrows, and memory blocks
  const [elementStates, setElementStates] = useState({});

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [engine.logs]);

  useEffect(() => {
    engine.updateCode([
      `class Node { constructor(v) { this.value = v; this.next = null; } }`,
      `let head = null;`
    ]);
  }, []);

  const generateAddress = () => {
    let addr;
    do {
        addr = '0x' + Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0');
    } while (memoryPool.find(n => n.addr === addr) || addr === '0x000');
    return addr;
  };

  const highlightMemBlock = (addr, className) => {
    setElementStates(prev => ({
       ...prev,
       [addr]: { ...prev[addr], memState: className }
    }));
  };

  const highlightNode = (addr, className) => {
    setElementStates(prev => ({
       ...prev,
       [addr]: { ...prev[addr], nodeState: className }
    }));
  };

  const setWrapperState = (addr, className) => {
    setElementStates(prev => ({
       ...prev,
       [addr]: { ...prev[addr], wrapperState: className }
    }));
  };

  const setArrowState = (addr, className) => {
    setElementStates(prev => ({
       ...prev,
       [addr]: { ...prev[addr], arrowState: className }
    }));
  };

  const insertHead = (valueOverride = null) => {
    const value = valueOverride || inputValue.trim();
    if (engine.isExecuting) { engine.logAction("Wait for operation to finish.", "error"); return; }
    if (!value) { engine.logAction("Please enter a value to insert.", "error"); return; }

    const newAddr = generateAddress();
    setInputValue('');

    const targetHead = headAddr; // capture current state at execution time

    engine.executeSteps([
        async () => {
            engine.logAction("Step 1: Allocating new Heap Memory node...", "info");
            engine.updateCode([`let newNode = new Node("${value}");`]);
            
            // Allocate physically to heap silently 
            setMemoryPool(prev => [...prev, { addr: newAddr, value: value, nextAddr: null }]);
            highlightMemBlock(newAddr, 'highlight-mem');
        },
        async () => {
            engine.logAction(`Step 2: Linking newNode.next to current HEAD [${targetHead || 'NULL'}]`, "info");
            engine.updateCode([`newNode.next = head;`]);
            
            setMemoryPool(prev => prev.map(m => m.addr === newAddr ? { ...m, nextAddr: targetHead } : m));
            highlightMemBlock(newAddr, 'highlight-mem');
        },
        async () => {
            engine.logAction(`Step 3: Pointing global HEAD to newNode [${newAddr}]`, "info");
            engine.updateCode([`head = newNode;`]);
            
            setHeadAddr(newAddr);
            
            highlightNode(newAddr, 'll-insert-anim highlight-green');
            setArrowState(newAddr, 'll-arrow-grow');
            
            await engine.sleep(engine.getDelay());
            
            highlightNode(newAddr, 'idle');
            highlightMemBlock(newAddr, null);
        }
    ]);
  };

  const insertTail = () => {
    const value = inputValue.trim();
    if (engine.isExecuting) { engine.logAction("Wait for operation to finish.", "error"); return; }
    if (!value) { engine.logAction("Please enter a value.", "error"); return; }

    if (!headAddr) {
        engine.logAction("List is empty. Redirecting to Insert Head.", "info");
        insertHead(value);
        return;
    }

    const newAddr = generateAddress();
    setInputValue('');

    const steps = [
        async () => {
             engine.logAction("Step 1: Traversing to find Tail...", "info");
             engine.updateCode([`let temp = head;`, `while(temp.next != null) { temp = temp.next; }`]);
        }
    ];

    let currentAddr = headAddr;
    while (currentAddr) {
        let loopAddr = currentAddr;
        let nodeData = memoryPool.find(n => n.addr === loopAddr);
        
        steps.push(async () => {
            engine.logAction(`Checking node at [${loopAddr}]`, "info");
            highlightNode(loopAddr, 'highlight-yellow traverse-scale');
            await engine.sleep(engine.getDelay());
            highlightNode(loopAddr, 'idle');
        });
        
        if (!nodeData.nextAddr) {
            steps.push(async () => {
                engine.logAction(`Step 2: Allocating new Heap node [${newAddr}]`, "info");
                engine.updateCode([`let newNode = new Node("${value}");`]);
                setMemoryPool(prev => [...prev, { addr: newAddr, value: value, nextAddr: null }]);
            });
            
            steps.push(async () => {
                engine.logAction(`Step 3: Linking Tail node [${loopAddr}] to new node [${newAddr}]`, "success");
                engine.updateCode([`temp.next = newNode;`]);
                
                setMemoryPool(prev => prev.map(m => m.addr === loopAddr ? { ...m, nextAddr: newAddr } : m));
                
                highlightNode(newAddr, 'll-insert-anim highlight-green');
                await engine.sleep(engine.getDelay());
                highlightNode(newAddr, 'idle');
            });
            break;
        }
        currentAddr = nodeData.nextAddr;
    }
    
    engine.executeSteps(steps);
  };

  const insertAtIndex = () => {
    const value = inputValue.trim();
    const indexStr = inputIndex.trim();
    
    if (engine.isExecuting) { engine.logAction("Wait for operation to finish.", "error"); return; }
    if (!value) { engine.logAction("Please enter a value.", "error"); return; }
    if (indexStr === "") { engine.logAction("Please enter an index.", "error"); return; }
    
    const index = parseInt(indexStr);
    const listLength = memoryPool.length;

    if (isNaN(index) || index < 0 || index > listLength) {
        engine.logAction(`Invalid index. Must be between 0 and ${listLength}.`, "error");
        return;
    }

    if (index === 0) {
        insertHead(value);
        return;
    }

    if (index === listLength) {
        insertTail();
        return;
    }

    const newAddr = generateAddress();
    setInputValue('');
    setInputIndex('');

    const steps = [
        async () => {
             engine.logAction(`Step 1: Traversing to index ${index-1}...`, "info");
             engine.updateCode([`let temp = head;`, `for(let i=0; i<${index-1}; i++) { temp = temp.next; }`]);
        }
    ];

    let currentAddr = headAddr;
    for (let i = 0; i < index; i++) {
        let loopAddr = currentAddr;
        let nodeData = memoryPool.find(n => n.addr === loopAddr);
        
        if (i < index - 1) {
            steps.push(async () => {
                engine.logAction(`Visiting index ${i} [${loopAddr}]`, "info");
                highlightNode(loopAddr, 'highlight-yellow traverse-scale');
                await engine.sleep(engine.getDelay());
                highlightNode(loopAddr, 'idle');
            });
            currentAddr = nodeData.nextAddr;
        } else {
            // We are at index - 1
            steps.push(async () => {
                engine.logAction(`Reached index ${index-1} [${loopAddr}]. Target found.`, "success");
                highlightNode(loopAddr, 'highlight-yellow');
                await engine.sleep(engine.getDelay());
            });

            steps.push(async () => {
                engine.logAction(`Step 2: Allocating new node [${newAddr}]`, "info");
                engine.updateCode([`let newNode = new Node("${value}");`]);
                setMemoryPool(prev => [...prev, { addr: newAddr, value: value, nextAddr: null }]);
                highlightMemBlock(newAddr, 'highlight-mem');
            });

            steps.push(async () => {
                engine.logAction(`Step 3: Linking newNode.next = temp.next`, "info");
                engine.updateCode([`newNode.next = head;`]); // Note: Using newNode.next = temp.next in logic but head is just a placeholder here
                setMemoryPool(prev => prev.map(m => m.addr === newAddr ? { ...m, nextAddr: nodeData.nextAddr } : m));
                await engine.sleep(engine.getDelay());
            });

            steps.push(async () => {
                engine.logAction(`Step 4: Linking temp.next = newNode`, "success");
                engine.updateCode([`temp.next = newNode;`]);
                setMemoryPool(prev => prev.map(m => m.addr === loopAddr ? { ...m, nextAddr: newAddr } : m));
                
                highlightNode(newAddr, 'll-insert-anim highlight-green');
                setArrowState(newAddr, 'll-arrow-grow');
                
                await engine.sleep(engine.getDelay());
                highlightNode(loopAddr, 'idle');
                highlightNode(newAddr, 'idle');
                highlightMemBlock(newAddr, null);
            });
        }
    }

    engine.executeSteps(steps);
  };

  const deleteHead = () => {
    if (engine.isExecuting) return;
    if (!headAddr) { engine.logAction("List is empty!", "error"); return; }

    const targetAddr = headAddr;
    const nodeData = memoryPool.find(n => n.addr === targetAddr);

    engine.executeSteps([
        async () => {
            engine.logAction(`Step 1: Targeting current HEAD [${targetAddr}]`, "info");
            engine.updateCode([`let temp = head;`]);
            highlightNode(targetAddr, 'highlight-red');
            highlightMemBlock(targetAddr, 'highlight-mem-delete');
            await engine.sleep(engine.getDelay());
        },
        async () => {
            engine.logAction(`Step 2: Pointing head to head.next [${nodeData.nextAddr || 'NULL'}]`, "info");
            engine.updateCode([`head = head.next;`]);
            setWrapperState(targetAddr, 'fade-out-anim');
            setHeadAddr(nodeData.nextAddr);
            await engine.sleep(engine.getDelay());
        },
        async () => {
            engine.logAction(`Step 3: Freeing memory at [${targetAddr}]`, "success");
            setMemoryPool(prev => prev.filter(m => m.addr !== targetAddr));
            engine.updateCode([`// Memory freed`]);
        }
    ]);
  };

  const deleteTail = () => {
    if (engine.isExecuting) return;
    if (!headAddr) { engine.logAction("List is empty!", "error"); return; }

    const nodes = [];
    let curr = headAddr;
    while(curr) {
        const data = memoryPool.find(n => n.addr === curr);
        nodes.push(data);
        curr = data.nextAddr;
    }

    if (nodes.length === 1) {
        deleteHead();
        return;
    }

    const steps = [
        async () => {
            engine.logAction("Step 1: Traversing to find the second-to-last node...", "info");
            engine.updateCode([`let temp = head;`, `while(temp.next.next != null) { temp = temp.next; }`]);
        }
    ];

    for (let i = 0; i < nodes.length - 1; i++) {
        const loopAddr = nodes[i].addr;
        steps.push(async () => {
            highlightNode(loopAddr, 'highlight-yellow traverse-scale');
            await engine.sleep(engine.getDelay());
            highlightNode(loopAddr, 'idle');
        });
    }

    const penultNode = nodes[nodes.length - 2];
    const lastNode = nodes[nodes.length - 1];

    steps.push(async () => {
        engine.logAction(`Step 2: Targeting tail node [${lastNode.addr}]`, "info");
        highlightNode(lastNode.addr, 'highlight-red');
        highlightMemBlock(lastNode.addr, 'highlight-mem-delete');
        await engine.sleep(engine.getDelay());
    });

    steps.push(async () => {
        engine.logAction(`Step 3: Setting penultimate node's next to NULL`, "info");
        engine.updateCode([`temp.next = null;`]);
        setWrapperState(lastNode.addr, 'fade-out-anim');
        setMemoryPool(prev => prev.map(m => m.addr === penultNode.addr ? { ...m, nextAddr: null } : m));
        await engine.sleep(engine.getDelay());
    });

    steps.push(async () => {
        engine.logAction(`Step 4: Freeing memory at [${lastNode.addr}]`, "success");
        setMemoryPool(prev => prev.filter(m => m.addr !== lastNode.addr));
        engine.updateCode([`// Memory freed`]);
    });

    engine.executeSteps(steps);
  };

  const traverse = () => {
    if (engine.isExecuting) return;
    if (!headAddr) { engine.logAction("List is empty!", "error"); return; }

    const steps = [
        async () => {
            engine.logAction("Initializing Traversal", "info");
            engine.updateCode([`let temp = head;`, `while (temp != null) { ... }`]);
        }
    ];

    let currentAddr = headAddr;
    while (currentAddr) {
        let loopAddr = currentAddr;
        let nodeData = memoryPool.find(n => n.addr === loopAddr);

        steps.push(async () => {
            engine.logAction(`Visiting Node [${loopAddr}] - Value: ${nodeData.value}`, "success");
            
            highlightNode(loopAddr, 'highlight-yellow traverse-scale');
            highlightMemBlock(loopAddr, 'highlight-mem-pop');
            
            engine.updateCode([`console.log(temp.data);`, `temp = temp.next;`]);
            await engine.sleep(engine.getDelay() * 1.5);
            
            highlightNode(loopAddr, 'idle');
            highlightMemBlock(loopAddr, null);
            
            if (!nodeData.nextAddr) engine.logAction("Reached NULL. Traversal Complete.", "success");
        });
        currentAddr = nodeData.nextAddr;
    }

    engine.executeSteps(steps);
  };

  const deleteNode = () => {
    const value = inputValue.trim();
    if (engine.isExecuting) return;
    if (!headAddr) { engine.logAction("List is empty!", "error"); return; }
    if (!value) { engine.logAction("Enter a value to delete.", "error"); return; }

    setInputValue('');
    
    const steps = [
        async () => {
            engine.logAction(`Step 1: Searching for value '${value}'...`, "info");
            engine.updateCode([`let temp = head, prev = null;`]);
        }
    ];

    let currentAddr = headAddr;
    let prevAddr = null;
    let found = false;

    while (currentAddr) {
        const loopAddr = currentAddr;
        const prevScopeAddr = prevAddr;
        const nodeData = memoryPool.find(n => n.addr === loopAddr);
        
        steps.push(async () => {
            highlightNode(loopAddr, 'highlight-yellow');
            await engine.sleep(engine.getDelay());
            highlightNode(loopAddr, 'idle');
        });

        if (nodeData.value === value) {
            found = true;
            steps.push(async () => {
                engine.logAction(`Step 2: Value localized at [${loopAddr}]. Target locked.`, "info");
                highlightNode(loopAddr, 'highlight-red');
                highlightMemBlock(loopAddr, 'highlight-mem-delete');
                await engine.sleep(engine.getDelay());
            });

            steps.push(async () => {
                engine.logAction(`Step 3: Pointer rerouting. Bypassing target node.`, "info");
                setWrapperState(loopAddr, 'fade-out-anim');
                
                if (prevScopeAddr === null) {
                    engine.updateCode([`head = temp.next;`]);
                    setHeadAddr(nodeData.nextAddr);
                } else {
                    engine.updateCode([`prev.next = temp.next;`]);
                    setMemoryPool(prev => prev.map(m => m.addr === prevScopeAddr ? { ...m, nextAddr: nodeData.nextAddr } : m));
                }
                await engine.sleep(engine.getDelay());
            });
            
            steps.push(async () => {
                engine.logAction(`Step 4: Physically freeing Heap memory block at [${loopAddr}].`, "success");
                setMemoryPool(prev => prev.filter(m => m.addr !== loopAddr));
                engine.updateCode([`// Node memory implicitly freed`]);
            });
            
            break;
        }
        
        prevAddr = currentAddr;
        currentAddr = nodeData.nextAddr;
    }

    if (!found) {
        steps.push(async () => {
            engine.logAction(`Value '${value}' not found in the list!`, "error");
        });
    }

    engine.executeSteps(steps);
  };

  const resetList = () => {
    if (engine.isExecuting) return;
    
    engine.executeSteps([
        async () => {
            engine.logAction("Initiating Heap wiping sequence...", "error");
            engine.updateCode([`head = null;`]);
            
            const newStates = {};
            memoryPool.forEach(node => {
                newStates[node.addr] = { wrapperState: 'fade-out-anim', memState: 'fade-out-anim' };
            });
            setElementStates(newStates);
            
            await engine.sleep(600); 
        },
        async () => {
            setMemoryPool([]);
            setHeadAddr(null);
            setElementStates({});
            engine.clearLogs();
            engine.logAction(`System memory formally reset.`, "success");
            engine.updateCode([`head = null;`, `size = 0;`]);
        }
    ]);
  };

  // Derive logical Linked List array for rendering the track
  const linkedListNodes = [];
  let curr = headAddr;
  while(curr) {
     const data = memoryPool.find(n => n.addr === curr);
     if(data) {
        linkedListNodes.push(data);
        curr = data.nextAddr;
     } else break; 
  }

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">{isApplicationMode ? 'Music Player (Linked List)' : 'Linked List Visualizer'}</h1>
        <p>{isApplicationMode ? 'Each song is a node pointing to the next, just like a music playlist.' : 'Understand dynamic memory allocation and pointer traversal.'}</p>
      </div>


      <div className="controls-panel glass">
        <div className="control-group">
          <div className="input-row">
            <input type="text" className="input-glass" placeholder="Value..."
              value={inputValue} onChange={e => setInputValue(e.target.value)} />
            <input type="number" className="input-glass" style={{ width: '80px' }} placeholder="Index..."
              value={inputIndex} onChange={e => setInputIndex(e.target.value)} />
          </div>
          
          <div className="button-row">
            <button onClick={() => insertHead()} className="btn btn-primary small-btn">Insert Head</button>
            <button onClick={() => insertAtIndex()} className="btn btn-primary small-btn">Insert @ Index</button>
            <button onClick={insertTail} className="btn btn-primary small-btn">Insert Tail</button>
          </div>

          <div className="button-row">
            <button onClick={deleteHead} className="btn btn-secondary glass small-btn">Delete Head</button>
            <button onClick={deleteTail} className="btn btn-secondary glass small-btn">Delete Tail</button>
            <button onClick={deleteNode} className="btn btn-secondary glass small-btn">Delete (Value)</button>
          </div>
          
          <div className="button-row">
            <button onClick={traverse} className="btn btn-secondary glass small-btn">Traverse</button>
            <button onClick={resetList} className="btn btn-secondary glass small-btn">Reset</button>
          </div>
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

      <div className="visualizer-workspace">
        <div className="ds-container glass blue-glow-subtle" style={{ gridColumn: '1 / -1', minHeight: '250px' }}>
          <div className="ds-header">
             <h3>Linked List View</h3>
             <span className="badge glass">Nodes: {memoryPool.length}</span>
          </div>
          <div className="ll-wrapper">
            <div className="ll-track">
               <div className="ll-pointer-indicator" style={{ opacity: headAddr ? 1 : 0 }}>HEAD</div>
               
               {linkedListNodes.map((node) => {
                   const stateDef = elementStates[node.addr] || {};
                   let nClass = stateDef.nodeState && stateDef.nodeState !== 'idle' ? stateDef.nodeState : '';
                   let wClass = stateDef.wrapperState && stateDef.wrapperState !== 'idle' ? stateDef.wrapperState : '';
                   let aClass = stateDef.arrowState && stateDef.arrowState !== 'idle' ? stateDef.arrowState : '';

                   const nextVisual = node.nextAddr ? <div className="dot"></div> : <div className="null-text">NULL</div>;

                   return (
                     <div className={`ll-node-wrapper ${wClass}`} key={node.addr} id={`node-${node.addr}`}>
                        <div className={`ll-node glow-item ${nClass}`} style={{animationDuration: `${engine.getDelay()/1000}s`}}>
                            <div className="ll-node-data">{node.value}</div>
                            <div className="ll-node-next">{nextVisual}</div>
                            <div className="ll-node-addr">[{node.addr}]</div>
                        </div>
                        {node.nextAddr && (
                            <div className={`ll-arrow ${aClass}`}></div>
                        )}
                     </div>
                   );
               })}
            </div>
          </div>
        </div>

        <div className="ds-container glass purple-glow-subtle" style={{ gridColumn: '1 / 3' }}>
           <div className="ds-header">
             <h3>Dynamic Memory</h3>
             <span className="badge glass">Heap Allocation Maps</span>
           </div>
           <div className="memory-wrapper horizontal-memory">
              {memoryPool.length === 0 ? (
                 <span style={{ color: 'var(--text-muted)', margin: 'auto' }}>Heap Memory Empty</span>
              ) : (
                 memoryPool.map((node) => {
                     const isHead = node.addr === headAddr;
                     const stateDef = elementStates[node.addr] || {};
                     let mClass = stateDef.memState && stateDef.memState !== 'idle' ? stateDef.memState : '';
                     
                     // Keep track of the subtle green shadow injected for the head
                     let mStyle = isHead ? { boxShadow: "inset 0 0 10px rgba(16, 185, 129, 0.3)" } : {};

                     return (
                         <div key={node.addr} id={`mem-${node.addr}`} className={`memory-block ${mClass}`} style={mStyle}>
                            <span className="mem-address">[{node.addr}]</span>
                            <span className="mem-value">{node.value}</span>
                            <span className="mem-next-addr">NEXT: {node.nextAddr || 'NULL'}</span>
                         </div>
                     );
                 })
              )}
           </div>
        </div>

        <div className="explanation-panel glass" style={{ gridColumn: '3 / -1' }}>
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

      {/* Theory & Complexity Panel */}
      <section className="glass" style={{ margin: '2rem', padding: '1.5rem', borderRadius: '15px' }}>
         <div className="ds-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}><span style={{ opacity: 0.7, marginRight: '8px' }}>📚</span> Linked List Theory & Mechanics</h3>
         </div>
         
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Left Column: What is a Linked List */}
            <div style={{ flex: '1 1 300px' }}>
               <h4 style={{ color: 'var(--secondary-color)', marginBottom: '0.6rem', fontSize: '1rem' }}>What is a Linked List?</h4>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  A Linked List is a linear data structure composed of <strong>Nodes</strong>. Unlike arrays, nodes are not stored contiguously in memory. 
                  Each node stores both its <strong>Data/Value</strong> and a specific <strong>Pointer/Address</strong> referencing the next node in sequence.
               </p>
               
               <h4 style={{ color: 'var(--secondary-color)', marginTop: '1.2rem', marginBottom: '0.6rem', fontSize: '1rem' }}>Core Operations</h4>
               <ul style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', paddingLeft: '1.2rem' }}>
                  <li><strong style={{ color: '#10B981' }}>Insert:</strong> Dynamically allocate memory for a new node. Map its pointer to the subsequent node, then remap the preceding node's pointer.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#EF4444' }}>Delete:</strong> Find the preceding block and re-attach its pointer to leap over the target node.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#3b82f6' }}>Traverse:</strong> Linear shift starting directly from the Head pointer navigating via each memory link.</li>
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
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Insert (Head/Tail)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Insert/Delete (Mid)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#EAB308' }}>O(N)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Search</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#EAB308' }}>O(N)</td>
                     </tr>
                     <tr>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Space Complexity</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#EAB308' }}>O(N)</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </section>
    </main>
  );
}
