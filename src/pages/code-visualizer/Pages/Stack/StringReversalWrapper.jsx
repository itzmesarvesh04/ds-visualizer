import React, { useState, useEffect, useRef } from 'react';

const StringReversalWrapper = () => {
  const [input] = useState("HelloStudents");
  const [stack, setStack] = useState([]);
  const [output, setOutput] = useState("");
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState('pushing');
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready to start reversal");
  const intervalRef = useRef(null);

  // Animation speed (200-500ms)
  const animationSpeed = 350;

  // Automated state machine
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (phase === 'pushing') {
        if (cursor < input.length) {
          const char = input[cursor];
          setStack(prev => [...prev, char]);
          setCursor(prev => prev + 1);
          setStatusMessage(`Pushing '${char}' onto stack...`);
        } else {
          setPhase('popping');
          setStatusMessage("Stack full! Now popping from top...");
        }
      } else if (phase === 'popping') {
        if (stack.length > 0) {
          const popped = stack[stack.length - 1];
          setStack(prev => prev.slice(0, -1));
          setOutput(prev => prev + popped);
          setStatusMessage(`Popped '${popped}' from stack, output: "${output + popped}"`);
        } else {
          setPhase('finished');
          setIsRunning(false);
          setStatusMessage("Reversal Complete!");
        }
      }
    }, animationSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, phase, cursor, stack, input, output, animationSpeed]);

  const startReversal = () => {
    if (isRunning) return;
    resetReversal();
    setIsRunning(true);
    setStatusMessage("Starting string reversal...");
  };

  const resetReversal = () => {
    setStack([]);
    setOutput("");
    setCursor(0);
    setPhase('pushing');
    setIsRunning(false);
    setStatusMessage("Ready to start reversal");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const pauseReversal = () => {
    setIsRunning(false);
    setStatusMessage("Paused - Click Start to continue");
  };

  return (
    <main className="visualizer-page">
      <div className="visualizer-header">
        <h1 className="text-gradient">String Reversal using Stack (LIFO)</h1>
        <p>Watch how a stack's Last-In, First-Out property automatically reverses a string.</p>
      </div>

          <div className="controls-panel glass">
            <div className="control-group">
              <button onClick={startReversal} className="btn btn-primary" disabled={isRunning && phase !== 'finished'}>
                {phase === 'finished' ? 'Restart' : isRunning ? 'Running...' : 'Start Reversal'}
              </button>
              <button onClick={pauseReversal} className="btn btn-secondary glass" disabled={!isRunning}>
                Pause
              </button>
              <button onClick={resetReversal} className="btn btn-secondary glass">
                Reset
              </button>
            </div>

            <div className="control-divider"></div>

            <div className="status-display">
              <span className="badge glass">{phase.toUpperCase()}</span>
              <span className="status-text">{statusMessage}</span>
            </div>
          </div>

          <div className="visualizer-workspace string-reversal-visualizer">
            <div className="ds-container glass blue-glow-subtle">
              <div className="ds-header">
                <h3>Input String Tray</h3>
                <span className="badge glass">Cursor: {cursor}</span>
              </div>
              <div className="string-tray">
                {input.split('').map((char, index) => (
                  <div
                    key={index}
                    className={`char-box ${index === cursor && phase === 'pushing' ? 'highlight-current' : ''} ${index < cursor ? 'processed' : ''}`}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <div className="ds-container glass purple-glow-subtle">
              <div className="ds-header">
                <h3>Stack (LIFO)</h3>
                <span className="badge glass">Size: {stack.length}</span>
              </div>
              <div className="stack-container">
                {stack.map((char, index) => (
                  <div
                    key={index}
                    className="stack-char-box"
                    style={{
                      bottom: `${index * 26}px`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <div className="ds-container glass green-glow-subtle">
              <div className="ds-header">
                <h3>Output Result Tray</h3>
                <span className="badge glass">Length: {output.length}</span>
              </div>
              <div className="result-tray">
                {output.split('').map((char, index) => (
                  <div
                    key={index}
                    className="result-char-box"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
  );
};

export default StringReversalWrapper;