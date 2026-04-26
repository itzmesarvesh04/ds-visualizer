import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from '../hooks/useVisualizerEngine';

const MAX_CAPACITY = 6;
const MEM_START_ADDR = 1000;

export default function StackVisualizer({ isApplicationMode }) {

  const engine = useVisualizerEngine();
  const [stack, setStack] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const logContainerRef = useRef(null);
  
  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [engine.logs]);

  // Initial code state
  useEffect(() => {
    engine.updateCode([
      `let MAX_CAPACITY = ${MAX_CAPACITY};`,
      `let memory = new Array(MAX_CAPACITY);`,
      `let top = -1;`
    ]);
  }, []);

  const pushElement = () => {
    if (engine.isExecuting) {
      engine.logAction("Please wait for the current operation to finish.", "error");
      return;
    }
    const val = inputValue.trim();
    if (!val) {
      engine.logAction("Please enter a value to push.", "error");
      return;
    }
    if (stack.length >= MAX_CAPACITY) {
      engine.logAction("Stack is full! (Stack Overflow)", "error");
      engine.updateCode([
        `if (top < MAX_CAPACITY - 1) { ... }`,
        `else { throw "Stack Overflow"; }`
      ]);
      return;
    }

    setInputValue('');

    const targetIndex = stack.length;

    engine.executeSteps([
      async () => {
        engine.logAction("Step 1: Checking available space...", "info");
        engine.updateCode([`if (top < MAX_CAPACITY - 1) {`, `    // Space available`]);
      },
      async () => {
        engine.logAction(`Step 2: Preparing memory cell at index [${targetIndex}]`, "info");
        highlightMemBlock(targetIndex, 'highlight-mem');
      },
      async () => {
        engine.logAction(`Step 3: Storing value '${val}' in memory`, "info");
        engine.updateCode([`memory[top + 1] = "${val}";`, `// Value written successfully`]);
        setStack(prev => { 
          const next = [...prev]; 
          next[targetIndex] = { value: val, state: 'animating', id: Date.now() }; 
          return next; 
        });
      },
      async () => {
        engine.logAction(`Step 4: Updating visual stack container`, "info");
        await engine.sleep(engine.getDelay());
        setStack(prev => {
           const next = [...prev];
           if(next[targetIndex]) next[targetIndex].state = 'success';
           return next;
        });
        await engine.sleep(engine.getDelay() * 0.5);
      },
      async () => {
        engine.logAction(`Step 5: Updating TOP pointer`, "success");
        engine.updateCode([`top++;`, `// Push successful`]);
        highlightMemBlock(targetIndex, null);
        setStack(prev => {
           const next = [...prev];
           if(next[targetIndex]) next[targetIndex].state = 'idle';
           return next;
        });
      }
    ]);
  };

  const popElement = () => {
    if (engine.isExecuting) return engine.logAction("Wait for operation to finish.", "error");
    if (stack.length === 0) {
      engine.logAction("Stack is empty! (Stack Underflow)", "error");
      engine.updateCode([`if (top >= 0) { ... }`, `else { throw "Stack Underflow"; }`]);
      return;
    }

    const targetIndex = stack.length - 1;

    engine.executeSteps([
      async () => {
        engine.logAction("Step 1: Checking if stack is empty...", "info");
        engine.updateCode([`if (top >= 0) {`, `    // Stack has elements`]);
      },
      async () => {
        engine.logAction(`Step 2: Resolving top element at index [${targetIndex}]`, "info");
        highlightMemBlock(targetIndex, 'highlight-mem-delete');
        setStack(prev => {
          const next = [...prev];
          next[targetIndex].state = 'highlight-red';
          return next;
        });
        engine.updateCode([`let popped = memory[top];`, `// Retrieved value`]);
      },
      async () => {
        engine.logAction(`Step 3: Removing element from visual stack representation`, "info");
        setStack(prev => {
          const next = [...prev];
          next[targetIndex].state = 'pop-animating';
          return next;
        });
        await engine.sleep(engine.getDelay());
      },
      async () => {
        engine.logAction(`Step 4: Clearing element from memory`, "info");
        setStack(prev => prev.slice(0, targetIndex)); // actual remove
        highlightMemBlock(targetIndex, null);
        engine.updateCode([`memory[top] = NULL;`, `// Deallocated chunk`]);
      },
      async () => {
        engine.logAction(`Step 5: TOP pointer moved down.`, "success");
        engine.updateCode([`top--;`, `return popped;`]);
      }
    ]);
  };

  const peekElement = () => {
    if (engine.isExecuting) return;
    if (stack.length === 0) {
      engine.logAction("Stack is empty! Cannot peek.", "error");
      return;
    }
    const targetIndex = stack.length - 1;

    engine.executeSteps([
      async () => {
        engine.logAction("Step 1: Checking if stack is empty...", "info");
        engine.updateCode([`if (top >= 0) { ... }`]);
      },
      async () => {
        engine.logAction("Step 2: Resolving TOP memory address", "info");
        highlightMemBlock(targetIndex, 'highlight-mem-pop');
      },
      async () => {
        engine.logAction(`Step 3: Accessing memory block.`, "success");
        engine.updateCode([`return memory[top];`, `// Value isolated`]);
        setStack(prev => {
          const next = [...prev];
          next[targetIndex].state = 'highlight-yellow';
          return next;
        });
        await engine.sleep(engine.getDelay() * 1.5);
      },
      async () => {
        engine.logAction("Step 4: Operation complete.", "info");
        highlightMemBlock(targetIndex, null);
        setStack(prev => {
          const next = [...prev];
          if (next[targetIndex]) next[targetIndex].state = 'idle';
          return next;
        });
      }
    ]);
  };

  const traverseStack = () => {
    if (engine.isExecuting) return;
    if (stack.length === 0) return engine.logAction("Stack is empty! Cannot traverse.", "error");

    const steps = [
      async () => {
        engine.logAction("Initializing Traversal: TOP to BOTTOM", "info");
        engine.updateCode([`for (let i = top; i >= 0; i--) {`, `    // Loop initialized`]);
      }
    ];

    for (let i = stack.length - 1; i >= 0; i--) {
      steps.push(async () => {
        engine.logAction(`Accessing element at index [${i}]`, "info");
        highlightMemBlock(i, 'highlight-mem-pop');
        setStack(prev => {
          const next = [...prev];
          next[i].state = 'highlight-yellow traverse-scale';
          return next;
        });
        
        engine.updateCode([`let current = memory[${i}];`, `console.log("Reading:", current);`]);
        await engine.sleep(engine.getDelay() * 1.5);
        
        highlightMemBlock(i, null);
        setStack(prev => {
          const next = [...prev];
          next[i].state = 'idle';
          return next;
        });

        if (i === 0) {
           engine.logAction("Traversal Completed.", "success");
           engine.updateCode([`// End of loop`]);
        } else {
           engine.logAction("Moving to next element...", "info");
        }
      });
    }

    engine.executeSteps(steps);
  };

  const resetStack = () => {
    if (engine.isExecuting) return;
    engine.executeSteps([
      async () => {
        engine.logAction("Initiating System Reset...", "error");
        engine.updateCode([`top = -1;`]);
        setStack(prev => prev.map(item => ({ ...item, state: 'fade-out-anim' })));
        await engine.sleep(600);
      },
      async () => {
        setStack([]);
        engine.clearLogs();
        engine.logAction(`System memory formally reset.`, "success");
        engine.updateCode([`top = -1;`, `memory = new Array(MAX_CAPACITY);`]);
      }
    ]);
  };

  // Ugly DOM ref workaround for memory styling as pure state for this would be complex for a simple port
  const highlightMemBlock = (index, className) => {
    const el = document.getElementById(`mem-${index}`);
    if (el) {
       el.className = `memory-block ${className || ''}`;
       if (index === stack.length - 1) el.classList.add('is-top');
    }
  };

  // Calculate TOP pointer position
  // The stack renders reversed (top element is first visually), so the TOP pointer
  // should point at the first rendered element (top of stack-body)
  const stackHasElements = stack.length > 0;
  // Each stack-item is 50px tall + 8px margin-top. The stack is flex-end aligned.
  // The TOP pointer must be positioned relative to the top-most item.
  // Since flex-direction is column and justify-content is flex-end,
  // the last item in DOM (which is the bottom of stack) is at the bottom.
  // The first rendered item (reversed[0]) is at the top.
  // TOP pointer offset from top of stack-body: we need to track where the first item sits
  // With flex-end, items pile from bottom. Total items height = stack.length * (50 + 8) - 8 + some padding
  // The topmost item sits at: total_body_height - items_height
  // Let's calculate a simpler approach: position from the top of first visible item
  const itemHeight = 58; // 50px height + 8px margin-top
  const topPointerTop = stackHasElements 
    ? `calc(100% - ${stack.length * itemHeight}px - 10px + 17px)` // 10px padding, center of 50px item = 25px, but 17px looks cleaner
    : '0';

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">{isApplicationMode ? 'Undo/Redo (Stack)' : 'Stack Visualizer'}</h1>
        <p>{isApplicationMode ? 'Simulating an Undo/Redo system where each action is pushed to the stack.' : 'Master the LIFO (Last-In-First-Out) concept through interactive animations.'}</p>
      </div>


      <div className="controls-panel glass">
        <div className="control-group">
          <input type="text" className="input-glass" placeholder="Enter value..."
            value={inputValue} onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pushElement()} />
          <button onClick={pushElement} className="btn btn-primary small-btn">Push</button>
          <button onClick={popElement} className="btn btn-secondary glass small-btn">Pop</button>
          <button onClick={peekElement} className="btn btn-secondary glass small-btn">Peek</button>
          <button onClick={traverseStack} className="btn btn-secondary glass small-btn">Traverse</button>
          <button onClick={resetStack} className="btn btn-secondary glass small-btn">Reset</button>
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
        <div className="ds-container glass blue-glow-subtle">
          <div className="ds-header">
             <h3>Stack View</h3>
             <span className="badge glass">Size: {stack.length} / {MAX_CAPACITY}</span>
          </div>
          <div className="stack-wrapper">
            <div className="stack-body">
              {[...stack].reverse().map((item, idRev) => {
                const actualIndex = stack.length - 1 - idRev;
                let animClass = '';
                if (item.state === 'animating') animClass = 'push-animating';
                else if (item.state === 'success') animClass = 'highlight-green';
                else if (item.state && item.state !== 'idle') animClass = item.state;
                
                return (
                  <div key={item.id} className={`stack-item glow-item ${animClass}`} style={{animationDuration: `${engine.getDelay()/1000}s`}}>
                    <span className="item-value">{item.value}</span>
                    <span className="item-index">{actualIndex}</span>
                  </div>
                );
              })}
              <div className="stack-base"></div>

              {/* Dynamic TOP Pointer */}
              <div
                className="stack-top-pointer"
                style={{
                  top: topPointerTop,
                  opacity: stackHasElements ? 1 : 0,
                }}
              >
                <span className="top-arrow">←</span>
                <span className="top-label">TOP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ds-container glass purple-glow-subtle">
           <div className="ds-header">
             <h3>Memory Representation</h3>
             <span className="badge glass">Array Storage</span>
           </div>
           <div className="memory-wrapper">
              {Array.from({length: MAX_CAPACITY}).map((_, idx) => {
                 const revIdx = MAX_CAPACITY - 1 - idx;
                 const addrHex = '0x' + (MEM_START_ADDR + revIdx * 4).toString(16).toUpperCase();
                 const memVal = revIdx < stack.length ? stack[revIdx].value : 'NULL';
                 const isTop = revIdx === stack.length - 1 && stack.length > 0;
                 return (
                   <div key={revIdx} id={`mem-${revIdx}`} className={`memory-block ${isTop ? 'is-top' : ''}`}>
                      <span className="mem-address">[{addrHex}]</span>
                      <span className="mem-index">[{revIdx}]</span>
                      <span className={`mem-value ${memVal === 'NULL' ? 'null' : ''}`}>{memVal}</span>
                      {isTop && <span className="mem-top-indicator">← Top</span>}
                   </div>
                 );
              })}
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
             {engine.logs.map(log => (
               <p key={log.id} className={`log-entry ${log.type} animate-enter`}>{log.msg}</p>
             ))}
          </div>
        </div>
      </div>

      {/* Theory & Complexity Panel */}
      <section className="glass" style={{ margin: '2rem', padding: '1.5rem', borderRadius: '15px' }}>
         <div className="ds-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}><span style={{ opacity: 0.7, marginRight: '8px' }}>📚</span> Stack Theory & Mechanics</h3>
         </div>
         
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Left Column: What is a Stack */}
            <div style={{ flex: '1 1 300px' }}>
               <h4 style={{ color: 'var(--secondary-color)', marginBottom: '0.6rem', fontSize: '1rem' }}>What is a Stack?</h4>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  A Stack is a linear data structure that follows a precise execution order. The order is <strong>LIFO (Last In, First Out)</strong>. 
                  Think of it like a stack of plates in a cafeteria—you can only add or remove the plate located at the very top.
               </p>
               
               <h4 style={{ color: 'var(--secondary-color)', marginTop: '1.2rem', marginBottom: '0.6rem', fontSize: '1rem' }}>Core Operations</h4>
               <ul style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', paddingLeft: '1.2rem' }}>
                  <li><strong style={{ color: '#10B981' }}>Push:</strong> Adds an element to the top of the stack. If the stack is at maximum capacity, it throws an <em>Overflow</em> error.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#EF4444' }}>Pop:</strong> Removes the top element from the stack. If the stack is empty, it throws an <em>Underflow</em> error.</li>
                  <li style={{ marginTop: '0.4rem' }}><strong style={{ color: '#3b82f6' }}>Peek/Top:</strong> Returns the top element without removing it.</li>
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
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Push Operation</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Pop Operation</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#10B981' }}>O(1)</td>
                     </tr>
                     <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--secondary-color)' }}>Peek Operation</td>
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
