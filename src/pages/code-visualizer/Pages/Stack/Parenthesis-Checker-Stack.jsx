import React, { useState, useEffect, useRef } from 'react';
import { useVisualizerEngine } from "../../../../hooks/useVisualizerEngine";

const ParenthesisCheckerStack = ({ testCase = "({[()]})" }) => {
  const engine = useVisualizerEngine();
  const [stack, setStack] = useState([]);
  const [expression] = useState(testCase); // Use the prop
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isBalanced, setIsBalanced] = useState(null);
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
      `function isBalanced(expression) {`,
      `  const stack = [];`,
      `  const pairs = { ')': '(', '}': '{', ']': '[' };`,
      `  for (let char of expression) {`,
      `    // Check each character`,
      `  }`,
      `  return stack.length === 0;`,
      `}`
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkParentheses = () => {
    if (engine.isExecuting) {
      engine.logAction("Please wait for the current operation to finish.", "error");
      return;
    }

    setStack([]);
    setCurrentIndex(-1);
    setIsBalanced(null);

    const pairs = { ')': '(', '}': '{', ']': '[' };
    let localStack = [];
    let balanced = true;

    const steps = [
      async () => {
        engine.logAction("Starting parenthesis check for: " + expression, "info");
        engine.updateCode([
          `function isBalanced("${expression}") {`,
          `  const stack = [];`
        ]);
      }
    ];

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      steps.push(async () => {
        setCurrentIndex(i);
        engine.logAction(`Processing character '${char}' at position ${i}`, "info");
        engine.updateCode([
          `for (let char of "${expression}") {`,
          `  // Current: '${char}'`
        ]);
        await engine.sleep(engine.getDelay() * 0.5);
      });

      if (['(', '{', '['].includes(char)) {
        steps.push(async () => {
          localStack.push(char);
          setStack([...localStack]);
          engine.logAction(`Pushing '${char}' to stack`, "success");
          engine.updateCode([
            `if (['(', '{', '['].includes('${char}')) {`,
            `  stack.push('${char}'); // Stack: [${localStack.join(', ')}]`,
            `}`
          ]);
          await engine.sleep(engine.getDelay());
        });
      } else if ([')', '}', ']'].includes(char)) {
        steps.push(async () => {
          if (localStack.length === 0 || localStack[localStack.length - 1] !== pairs[char]) {
            balanced = false;
            engine.logAction(`Mismatch! Expected '${pairs[char]}' but stack is empty or has '${localStack[localStack.length - 1]}'`, "error");
            engine.updateCode([
              `} else if ([')', '}', ']'].includes('${char}')) {`,
              `  if (stack.length === 0 || stack[stack.length-1] !== '${pairs[char]}') {`,
              `    return false; // Mismatch!`,
              `  }`
            ]);
            return;
          } else {
            const popped = localStack.pop();
            setStack([...localStack]);
            engine.logAction(`Popping '${popped}' from stack (matches '${char}')`, "success");
            engine.updateCode([
              `} else if ([')', '}', ']'].includes('${char}')) {`,
              `  if (stack.length > 0 && stack[stack.length-1] === '${pairs[char]}') {`,
              `    stack.pop(); // Popped: '${popped}'`,
              `  }`
            ]);
            await engine.sleep(engine.getDelay());
          }
        });
      }
    }

    steps.push(async () => {
      if (balanced && localStack.length === 0) {
        setIsBalanced(true);
        engine.logAction("Check complete: Expression is balanced!", "success");
        engine.updateCode([
          `  return stack.length === 0; // true`,
          `}`
        ]);
      } else {
        setIsBalanced(false);
        engine.logAction("Check complete: Expression is NOT balanced!", "error");
        engine.updateCode([
          `  return stack.length === 0; // false`,
          `}`
        ]);
      }
    });

    engine.executeSteps(steps);
  };

  const resetChecker = () => {
    if (engine.isExecuting) return;
    engine.executeSteps([
      async () => {
        engine.logAction("Resetting checker...", "info");
        setStack([]);
        setCurrentIndex(-1);
        setIsBalanced(null);
        engine.clearLogs();
        engine.updateCode([
          `function isBalanced(expression) {`,
          `  const stack = [];`,
          `  // Ready for new check`,
          `}`
        ]);
      }
    ]);
  };

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">Parenthesis Checker</h1>
        <p>Visualize stack-based parenthesis balancing with step-by-step animations.</p>
      </div>

      <div className="controls-panel glass">
        <div className="control-group">
          <button onClick={checkParentheses} className="btn btn-primary">Check Parentheses</button>
          <button onClick={resetChecker} className="btn btn-secondary glass">Reset</button>
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

      <div className="visualizer-workspace parenthesis-visualizer">
        <div className="ds-container glass blue-glow-subtle">
          <div className="ds-header">
            <h3>Expression</h3>
          </div>
          <div className="expression-display">
            {expression.split('').map((char, index) => (
              <span key={index} className={`char ${index === currentIndex ? 'highlight-current' : ''}`}>
                {char}
              </span>
            ))}
          </div>
          {isBalanced !== null && (
            <div className={`result ${isBalanced ? 'success' : 'error'}`}>
              {isBalanced ? 'Balanced' : 'Not Balanced'}
            </div>
          )}
        </div>

        <div className="ds-container glass purple-glow-subtle">
          <div className="ds-header">
            <h3>Stack</h3>
            <span className="badge glass">Size: {stack.length}</span>
          </div>
          <div className="stack-wrapper">
            <div className="stack-body">
              {stack.slice().reverse().map((item, idRev) => (
                <div key={idRev} className="stack-item">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ds-container glass">
          <div className="ds-header">
            <h3>Activity Log</h3>
          </div>
          <div className="log-container" ref={logContainerRef}>
            {engine.logs.map((log, index) => (
              <div key={log.id || index} className={`log-entry ${log.type}`}>
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ParenthesisCheckerStack;