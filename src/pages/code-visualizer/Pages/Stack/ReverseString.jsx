import React, { useState, useEffect, useRef } from 'react';

const ReverseString = () => {
  const testCase = 'HelloStudents';
  const [input] = useState(testCase);
  const [stack, setStack] = useState([]);
  const [output, setOutput] = useState("");
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState('pushing'); // 'pushing', 'popping', 'manual'
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [manualStep, setManualStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready to start automatic animation");
  const intervalRef = useRef(null);

  // Animation speed
  const animationSpeed = 800;

  // Automatic animation logic
  useEffect(() => {
    if (!isAutoRunning) return;

    intervalRef.current = setInterval(() => {
      if (phase === 'pushing') {
        if (cursor < input.length) {
          const char = input[cursor];
          setStack(prev => [...prev, char]);
          setCursor(prev => prev + 1);
          setStatusMessage(`Automatically pushing '${char}' onto stack...`);
        } else {
          setPhase('popping');
          setStatusMessage("Automatic pushing complete! Now popping automatically...");
        }
      } else if (phase === 'popping') {
        if (stack.length > 0) {
          const popped = stack[stack.length - 1];
          setStack(prev => prev.slice(0, -1));
          setOutput(prev => prev + popped);
          setStatusMessage(`Automatically popping '${popped}' from stack, output: "${output + popped}"`);
        } else {
          setPhase('manual');
          setIsAutoRunning(false);
          setStatusMessage("Automatic animation complete! Use Next/Back buttons for manual control.");
        }
      }
    }, animationSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRunning, phase, cursor, stack, input, output, animationSpeed]);

  const startAutoAnimation = () => {
    if (isAutoRunning) return;
    resetAnimation();
    setIsAutoRunning(true);
    setStatusMessage("Starting automatic character-by-character animation...");
  };

  const resetAnimation = () => {
    setStack([]);
    setOutput("");
    setCursor(0);
    setPhase('pushing');
    setIsAutoRunning(false);
    setManualStep(0);
    setStatusMessage("Ready to start automatic animation");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const pauseAutoAnimation = () => {
    setIsAutoRunning(false);
    setStatusMessage("Automatic animation paused. Use Next/Back for manual control.");
  };

  // Manual step controls (only available after automatic animation)
  const nextStep = () => {
    if (phase !== 'manual') return;

    const maxSteps = input.length * 2; // push + pop for each character
    if (manualStep < maxSteps) {
      const stepIndex = manualStep % input.length;
      const isPushPhase = manualStep < input.length;

      if (isPushPhase) {
        // Manual push step
        const char = input[stepIndex];
        setStack(prev => [...prev, char]);
        setStatusMessage(`Manual Step ${manualStep + 1}: Pushed '${char}' onto stack`);
      } else {
        // Manual pop step
        const popped = stack[stack.length - 1];
        setStack(prev => prev.slice(0, -1));
        setOutput(prev => prev + popped);
        setStatusMessage(`Manual Step ${manualStep + 1}: Popped '${popped}' from stack, output: "${output + popped}"`);
      }
      setManualStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (phase !== 'manual' || manualStep <= 0) return;

    const stepIndex = (manualStep - 1) % input.length;
    const isPushPhase = (manualStep - 1) < input.length;

    if (isPushPhase) {
      // Undo push step
      setStack(prev => prev.slice(0, -1));
      setStatusMessage(`Manual Step ${manualStep}: Undid push of '${input[stepIndex]}'`);
    } else {
      // Undo pop step
      const lastOutputChar = output[output.length - 1];
      setOutput(prev => prev.slice(0, -1));
      setStack(prev => [...prev, lastOutputChar]);
      setStatusMessage(`Manual Step ${manualStep}: Undid pop of '${lastOutputChar}'`);
    }
    setManualStep(prev => prev - 1);
  };

  const canGoNext = phase === 'manual' && manualStep < (input.length * 2);
  const canGoPrev = phase === 'manual' && manualStep > 0;

  return (
    <div className="single-column-container">
      <main className="visualizer-page compact">
        <div className="visualizer-header compact">
          <h1 className="text-gradient">Reverse a String using Stack</h1>
          <p>Watch automatic character-by-character animation, then manually control stack operations.</p>
        </div>

        <div className="controls-panel glass compact">
          <div className="control-group">
            <button onClick={startAutoAnimation} className="btn btn-primary compact" disabled={isAutoRunning}>
              {phase === 'manual' ? 'Restart Auto' : isAutoRunning ? 'Running...' : 'Start Auto'}
            </button>
            <button onClick={pauseAutoAnimation} className="btn btn-secondary glass compact" disabled={!isAutoRunning}>
              Pause
            </button>
            <button onClick={resetAnimation} className="btn btn-secondary glass compact">
              Reset
            </button>
          </div>

          <div className="control-group">
            <button onClick={prevStep} className="btn btn-secondary glass compact" disabled={!canGoPrev}>
              ⬅️ Back
            </button>
            <button onClick={nextStep} className="btn btn-primary compact" disabled={!canGoNext}>
              Next ➡️
            </button>
          </div>

          <div className="status-display compact">
            <span className="badge glass">{phase.toUpperCase()}</span>
            <span className="status-text">{statusMessage}</span>
          </div>
        </div>

        <div className="visualizer-workspace string-reversal-compact">
          <div className="ds-container glass blue-glow-subtle compact">
            <div className="ds-header compact">
              <h3>Input String</h3>
              <span className="badge glass">Cursor: {cursor}</span>
            </div>
            <div className="string-tray compact">
              {input.split('').map((char, index) => (
                <div
                  key={index}
                  className={`char-box compact ${index === cursor && phase === 'pushing' && isAutoRunning ? 'highlight-current' : ''} ${index < cursor ? 'processed' : ''}`}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>

          <div className="ds-container glass purple-glow-subtle compact">
            <div className="ds-header compact">
              <h3>Stack (LIFO)</h3>
              <span className="badge glass">Size: {stack.length}</span>
            </div>
            <div className="stack-container compact">
              {stack.map((char, index) => (
                <div
                  key={index}
                  className="stack-char-box compact"
                  style={{
                    bottom: `${index * 35}px`,
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>

          <div className="ds-container glass green-glow-subtle compact" style={{ gridColumn: '1 / -1' }}>
            <div className="ds-header compact">
              <h3>Output Result</h3>
              <span className="badge glass">Length: {output.length}</span>
            </div>
            <div className="result-tray compact">
              {output.split('').map((char, index) => (
                <div
                  key={index}
                  className="result-char-box compact"
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

        <div className="python-panel glass compact">
          <div className="python-header compact">
            <h3>Algorithm Result</h3>
            <span className="badge glass">Output</span>
          </div>
          <div className="python-output-box glass compact">
            <h4>Output</h4>
            <div className="output-content">
              <p>Result: Input "{testCase}" → Output "stnedutSolleh"</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReverseString;
