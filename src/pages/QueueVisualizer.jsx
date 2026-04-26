import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from '../hooks/useVisualizerEngine';

const MAX_CAPACITY = 6;
const MEM_START_ADDR = 1000;

export default function QueueVisualizer({ isApplicationMode }) {

  const engine = useVisualizerEngine();
  const [memory, setMemory] = useState(new Array(MAX_CAPACITY).fill(null));
  const [queueState, setQueueState] = useState({ front: 0, rear: -1, size: 0 });
  const [inputValue, setInputValue] = useState('');
  const logContainerRef = useRef(null);
  
  // Element states for animating specific elements in track
  const [elementStates, setElementStates] = useState({});

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [engine.logs]);

  useEffect(() => {
    engine.updateCode([
      `let MAX_CAPACITY = ${MAX_CAPACITY};`,
      `let queue = new Array(MAX_CAPACITY);`,
      `let front = 0;`,
      `let rear = -1;`
    ]);
  }, []);

  const highlightMemBlock = (index, className) => {
    const el = document.getElementById(`mem-${index}`);
    if (el) {
       el.className = `memory-block ${className || ''}`;
    }
  };

  const enqueue = () => {
    const value = inputValue.trim();
    if (engine.isExecuting) {
      engine.logAction("Please wait for current operation to finish.", "error");
      return;
    }
    if (!value) {
      engine.logAction("Please enter a value to enqueue.", "error");
      return;
    }
    const currentRear = queueState.rear;
    if (currentRear === MAX_CAPACITY - 1) {
      engine.logAction("Queue is full! (Rear pointer limit reached)", "error");
      engine.updateCode([
        `if (rear < MAX_CAPACITY - 1) { ... }`,
        `else { throw "Queue Overflow"; }`
      ]);
      return;
    }

    setInputValue('');

    const targetIndex = currentRear + 1;

    engine.executeSteps([
      async () => {
        engine.logAction("Step 1: Checking available space...", "info");
        engine.updateCode([`if (rear < MAX_CAPACITY - 1) {`, `    // Space available`]);
      },
      async () => {
        engine.logAction(`Step 2: Securing memory cell at index [${targetIndex}]`, "info");
        highlightMemBlock(targetIndex, 'highlight-mem');
      },
      async () => {
        engine.logAction(`Step 3: Storing value '${value}' in memory`, "info");
        engine.updateCode([`rear++;`, `queue[rear] = "${value}";`]);
        
        setMemory(prev => {
          const next = [...prev];
          next[targetIndex] = value;
          return next;
        });
        setQueueState(prev => ({ ...prev, rear: targetIndex, size: prev.size + 1 }));
        setElementStates(prev => ({ ...prev, [targetIndex]: { state: 'enqueue-animating' } }));
      },
      async () => {
        engine.logAction(`Step 4: Updating visual queue container`, "info");
        await engine.sleep(engine.getDelay());
        
        setElementStates(prev => ({ ...prev, [targetIndex]: { state: 'highlight-green' } }));
        await engine.sleep(engine.getDelay() * 0.5);
        setElementStates(prev => ({ ...prev, [targetIndex]: { state: 'idle' } }));
        
        highlightMemBlock(targetIndex, null);
      },
      async () => {
        engine.logAction(`Step 5: Pointers aligned to bounds`, "success");
        engine.updateCode([`// Enqueue successful`, `size = ${queueState.size + 1}`]);
      }
    ]);
  };

  const dequeue = () => {
    if (engine.isExecuting) return engine.logAction("Wait for operation to finish.", "error");
    if (queueState.size === 0) {
      engine.logAction("Queue is empty! Cannot dequeue.", "error");
      engine.updateCode([`if (front <= rear) { ... }`, `else { throw "Queue Underflow"; }`]);
      return;
    }

    const targetIndex = queueState.front;

    engine.executeSteps([
      async () => {
        engine.logAction("Step 1: Checking if queue is empty...", "info");
        engine.updateCode([`if (front <= rear) {`, `    // Valid items exist to dequeue`]);
      },
      async () => {
        engine.logAction(`Step 2: Resolving Front element at index [${targetIndex}]`, "info");
        setElementStates(prev => ({ ...prev, [targetIndex]: { state: 'highlight-red' } }));
        highlightMemBlock(targetIndex, 'highlight-mem-delete');
        engine.updateCode([`let dequeued = queue[front];`, `// Retrieved value: ${memory[targetIndex]}`]);
      },
      async () => {
        engine.logAction(`Step 3: Removing element from visual queue`, "info");
        setElementStates(prev => ({ ...prev, [targetIndex]: { state: 'dequeue-animating' } }));
        await engine.sleep(engine.getDelay());
      },
      async () => {
        engine.logAction(`Step 4: Clearing element from memory`, "info");
        highlightMemBlock(targetIndex, null);
        setMemory(prev => {
          const next = [...prev];
          next[targetIndex] = null;
          return next;
        });
        engine.updateCode([`queue[front] = NULL;`, `// Deallocated front chunk`]);
      },
      async () => {
        const poppedValue = memory[targetIndex];
        let nextFront = targetIndex + 1;
        let nextRear = queueState.rear;
        let nextSize = queueState.size - 1;
        
        if (nextSize === 0) {
           nextFront = 0; 
           nextRear = -1;
        }

        setQueueState({ front: nextFront, rear: nextRear, size: nextSize });
        
        engine.logAction(`Step 5: FRONT pointer shifted right. Returned: ${poppedValue}`, "success");
        engine.updateCode([`front++;`, `return dequeued;`]);
      }
    ]);
  };

  const traverse = () => {
    if (engine.isExecuting) return;
    if (queueState.size === 0) return engine.logAction("Queue is empty! Cannot traverse.", "error");

    const steps = [
      async () => {
        engine.logAction("Initializing Traversal: FRONT to REAR", "info");
        engine.updateCode([`for (let i = front; i <= rear; i++) {`, `    // Loop initialized`]);
      }
    ];

    for (let i = queueState.front; i <= queueState.rear; i++) {
      steps.push(async () => {
        engine.logAction(`Accessing element at index [${i}]`, "info");
        
        setElementStates(prev => ({ ...prev, [i]: { state: 'highlight-yellow traverse-scale' } }));
        highlightMemBlock(i, 'highlight-mem-pop');
        
        engine.updateCode([`let current = queue[${i}];`, `console.log("Reading:", current);`]);
        await engine.sleep(engine.getDelay() * 1.5);
        
        setElementStates(prev => ({ ...prev, [i]: { state: 'idle' } }));
        highlightMemBlock(i, null);

        if (i === queueState.rear) {
           engine.logAction("Traversal Completed.", "success");
           engine.updateCode([`// End of loop`, `// All valid items processed`]);
        } else {
           engine.logAction("Moving to next element...", "info");
        }
      });
    }

    engine.executeSteps(steps);
  };

  const resetQueue = () => {
    if (engine.isExecuting) return;
    engine.executeSteps([
      async () => {
        engine.logAction("Initiating System Reset...", "error");
        engine.updateCode([`console.log("Emptying Queue...");`, `front = 0; rear = -1;`]);
        
        const newStates = {};
        for (let i=queueState.front; i<=queueState.rear; i++) {
            newStates[i] = { state: 'fade-out-anim' };
        }
        setElementStates(newStates);
        await engine.sleep(600);
      },
      async () => {
        setMemory(new Array(MAX_CAPACITY).fill(null));
        setQueueState({ front: 0, rear: -1, size: 0 });
        setElementStates({});
        engine.clearLogs();
        engine.logAction(`System memory formally reset.`, "success");
        engine.updateCode([`front = 0;`, `rear = -1;`, `queue = new Array(MAX_CAPACITY);`]);
      }
    ]);
  };

  // Reconstruct the valid track pieces based on front and rear pointers
  const validPieces = [];
  for (let i = queueState.front; i <= queueState.rear; i++) {
      validPieces.push({
          index: i,
          value: memory[i],
          stateDef: elementStates[i] || { state: 'idle' }
      });
  }

  // Calculate pointer transformations
  const pointerFrontX = queueState.size > 0 ? 70 + queueState.front * 80 : 0;
  const pointerRearX = queueState.size > 0 ? 70 + queueState.rear * 80 : 0;
  const pointerOpacity = queueState.size > 0 ? 1 : 0;

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">{isApplicationMode ? 'Print Spooler (Queue)' : 'Queue Visualizer'}</h1>
        <p>{isApplicationMode ? 'Simulating a printer queue where jobs are processed in order.' : 'Explore the FIFO (First-In-First-Out) schedule with interactive pointers.'}</p>
      </div>


      <div className="controls-panel glass">
        <div className="control-group">
          <input type="text" className="input-glass" placeholder="Enter value..."
            value={inputValue} onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enqueue()} />
          <button onClick={enqueue} className="btn btn-primary small-btn">Enqueue</button>
          <button onClick={dequeue} className="btn btn-secondary glass small-btn">Dequeue</button>
          <button onClick={traverse} className="btn btn-secondary glass small-btn">Traverse</button>
          <button onClick={resetQueue} className="btn btn-secondary glass small-btn">Reset</button>
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
             <h3>Queue View</h3>
             <span className="badge glass">Size: {queueState.size} / {MAX_CAPACITY}</span>
          </div>
          <div className="queue-wrapper">
             <div className="queue-track">
                {/* Spacers to push valid elements to correctly map their indices visually */}
                {Array.from({ length: queueState.front }).map((_, i) => (
                    <div key={`spacer-${i}`} style={{ width: '60px', flexShrink: 0 }}></div>
                ))}

                {validPieces.map(item => {
                    let animClass = '';
                    if (item.stateDef.state && item.stateDef.state !== 'idle') {
                        animClass = item.stateDef.state;
                    }
                    return (
                        <div key={item.index} className={`queue-item glow-item ${animClass}`} style={{animationDuration: `${engine.getDelay()/1000}s`}}>
                            <span className="item-value">{item.value}</span>
                            <span className="item-index">{item.index}</span>
                        </div>
                    );
                })}

                {/* Dynamic Pointer Overlays */}
                <div className="queue-pointer pointer-front" style={{ left: 0, transform: `translateX(${pointerFrontX}px)`, opacity: pointerOpacity }}>
                    <span className="pointer-arrow-down">FRONT</span>
                </div>
                <div className="queue-pointer pointer-rear" style={{ left: 0, transform: `translateX(${pointerRearX}px)`, opacity: pointerOpacity }}>
                    <span className="pointer-arrow-up">REAR</span>
                </div>
             </div>
          </div>
        </div>

        <div className="ds-container glass purple-glow-subtle" style={{ gridColumn: '1 / 3' }}>
           <div className="ds-header">
             <h3>Memory Representation</h3>
             <span className="badge glass">Array Storage</span>
           </div>
           <div className="memory-wrapper horizontal-memory">
              {Array.from({length: MAX_CAPACITY}).map((_, i) => {
                 const addrHex = '0x' + (MEM_START_ADDR + i * 4).toString(16).toUpperCase();
                 const val = memory[i];
                 const isFront = i === queueState.front && queueState.size > 0;
                 const isRear = i === queueState.rear && queueState.size > 0;
                 const boxHighlight = isFront ? {boxShadow: "inset 0 0 10px rgba(16, 185, 129, 0.2)"} : (isRear ? {boxShadow: "inset 0 0 10px rgba(245, 158, 11, 0.2)"} : {});

                 return (
                   <div key={i} id={`mem-${i}`} className="memory-block" style={boxHighlight}>
                      <span className="mem-address">[{addrHex}]</span>
                      <span className="mem-index">[{i}]</span>
                      <span className={`mem-value ${val === null ? 'null' : ''}`}>{val === null ? 'NULL' : val}</span>
                      {isFront && <span className="mem-front-indicator">FRONT</span>}
                      {isRear && <span className="mem-rear-indicator">REAR</span>}
                   </div>
                 );
              })}
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
             {engine.logs.map((log, i) => (
               <p key={log.id} className={`log-entry ${log.type} animate-enter`}>{log.msg}</p>
             ))}
          </div>
        </div>
      </div>

      {/* Theory & Complexity Panel */}
      <section className="glass" style={{ margin: '2rem', padding: '1.5rem', borderRadius: '15px' }}>
         <div className="ds-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}><span style={{ opacity: 0.7, marginRight: '8px' }}>📚</span> Queue Theory & Mechanics</h3>
         </div>
         
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Left Column: What is a Queue */}
            <div style={{ flex: '1 1 300px' }}>
               <h4 style={{ color: 'var(--secondary-color)', marginBottom: '0.6rem', fontSize: '1rem' }}>What is a Queue?</h4>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  A Queue is a linear data structure that processes commands in a <strong>FIFO (First In, First Out)</strong> order. 
                  Imagine a line of people waiting for a ticket—the first person to join the line is the exactly the first person to be served.
               </p>
               
               <h4 style={{ color: 'var(--secondary-color)', marginTop: '1.2rem', marginBottom: '0.6rem', fontSize: '1rem' }}>Core Operations</h4>
               <ul style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', paddingLeft: '1.2rem' }}>
                  <li><strong style={{ color: '#10B981' }}>Enqueue:</strong> Adds an element to the <em>rear</em> of the queue. Throws an Overflow error if full.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#EF4444' }}>Dequeue:</strong> Removes and returns the element at the <em>front</em>. Throws an Underflow error if empty.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#3b82f6' }}>Peek/Front:</strong> Returns the front element without evaluating a removal operation.</li>
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
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Enqueue</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Dequeue</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Peek</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
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
