import { useState, useRef, useEffect, useCallback } from 'react';

const DELAYS = { 1: 1500, 2: 1100, 3: 800, 4: 500, 5: 250 };

export function useVisualizerEngine() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(3);
  
  const [logs, setLogs] = useState([{ msg: "Visualizer initialized.", type: "info" }]);
  const [codeLines, setCodeLines] = useState([]);
  
  // Mutable state for the engine loop
  const engineState = useRef({
    steps: [],
    index: 0,
    resolveNext: null,
    waitForNext: false,
    isActive: false, // Prevents overlapping execution loops
  });

  const getDelay = useCallback(() => DELAYS[speed] || 800, [speed]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const logAction = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, id: Date.now() + Math.random() }]);
  }, []);

  const updateCode = useCallback((lines) => {
    setCodeLines(lines);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setCodeLines([]);
  }, []);

  // Engine control functions
  const play = () => {
    setIsPaused(false);
    logAction("Engine set to Auto-Play.", "info");
    if (engineState.current.resolveNext) {
      engineState.current.resolveNext();
      engineState.current.resolveNext = null;
    }
  };

  const pause = () => {
    setIsPaused(true);
    logAction("Engine Paused.", "error");
  };

  const nextStep = () => {
    setIsPaused(true);
    engineState.current.waitForNext = true;
    logAction("Executing next step manually.", "info");
    if (engineState.current.resolveNext) {
      engineState.current.resolveNext();
      engineState.current.resolveNext = null;
    }
  };

  const executeSteps = async (stepsArr) => {
    if (engineState.current.isActive) {
      logAction("Please wait for the current operation to finish.", "error");
      return;
    }

    engineState.current.isActive = true;
    engineState.current.steps = stepsArr;
    engineState.current.index = 0;
    setIsExecuting(true);

    while (engineState.current.index < engineState.current.steps.length) {
      // Check for pause
      // Using a function form of isPaused isn't possible directly in this simple loop
      // but we can check the ref if we bound it, or just rely on the component re-render 
      // Note: React state in an async loop captures the initial closure. We should use a ref for pause state if we want real-time pausing.
      // Let's optimize pause by relying on a separate ref if needed, but for simplicity we will check the latest state using a setter trick or ref.
      
      // Wait if paused
      if (engineState.current.paused && !engineState.current.waitForNext) {
          await new Promise(resolve => { engineState.current.resolveNext = resolve; });
      }

      engineState.current.waitForNext = false;
      
      const currentStepFn = engineState.current.steps[engineState.current.index];
      await currentStepFn();
      
      engineState.current.index++;

      if (!engineState.current.paused && engineState.current.index < engineState.current.steps.length) {
         await sleep(getDelay());
      }
    }

    // Teardown
    engineState.current.steps = [];
    engineState.current.index = 0;
    engineState.current.isActive = false;
    setIsExecuting(false);
  };

  // Sync isPaused to ref for the async loop to read freshest value
  useEffect(() => {
     engineState.current.paused = isPaused;
  }, [isPaused]);

  return {
    isExecuting,
    isPaused,
    speed,
    setSpeed,
    logs,
    codeLines,
    play,
    pause,
    nextStep,
    executeSteps,
    logAction,
    updateCode,
    clearLogs,
    sleep,
    getDelay
  };
}
