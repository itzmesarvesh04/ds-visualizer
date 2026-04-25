import React, { useEffect, useRef, useState } from 'react';
import { useVisualizerEngine } from '../../../../hooks/useVisualizerEngine';

const STEP_MS = 820;

const jsCodeLines = [
  'class StackUsingQueuesPopCostly {',
  '  constructor() {',
  '    this.q1 = [];',
  '    this.q2 = [];',
  '  }',
  '',
  '  push(x) {',
  '    this.q1.push(x); // O(1)',
  '  }',
  '',
  '  pop() {',
  '    while (this.q1.length > 1) {',
  '      this.q2.push(this.q1.shift());',
  '    }',
  '    const popped = this.q1.shift();',
  '    [this.q1, this.q2] = [this.q2, this.q1];',
  '    return popped;',
  '  }',
  '',
  '  top() {',
  '    while (this.q1.length > 1) {',
  '      this.q2.push(this.q1.shift());',
  '    }',
  '    const topValue = this.q1[0];',
  '    this.q2.push(this.q1.shift());',
  '    [this.q1, this.q2] = [this.q2, this.q1];',
  '    return topValue;',
  '  }',
  '}',
];

const pyCodeLines = [
  'from collections import deque',
  '',
  'class MyStack:',
  '    def __init__(self):',
  '        self.q1 = deque()',
  '        self.q2 = deque()',
  '',
  '    def push(self, x):',
  '        self.q1.append(x)  # O(1)',
  '',
  '    def pop(self):',
  '        while len(self.q1) > 1:',
  '            self.q2.append(self.q1.popleft())',
  '        popped_val = self.q1.popleft()',
  '        self.q1, self.q2 = self.q2, self.q1',
  '        return popped_val',
  '',
  '    def top(self):',
  '        while len(self.q1) > 1:',
  '            self.q2.append(self.q1.popleft())',
  '        top_val = self.q1[0]',
  '        self.q2.append(self.q1.popleft())',
  '        self.q1, self.q2 = self.q2, self.q1',
  '        return top_val',
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeNode = (id, value) => ({ id, value, state: 'idle' });

export default function StackUsingQueuesPopCostly() {
  const engine = useVisualizerEngine();
  const idRef = useRef(1);
  const q1Ref = useRef([]);
  const q2Ref = useRef([]);

  const [queue1, setQueue1] = useState([]);
  const [queue2, setQueue2] = useState([]);
  const [activeQueue, setActiveQueue] = useState('q1');
  const [swappingLabels, setSwappingLabels] = useState(false);
  const [result, setResult] = useState('-');
  const [consoleLines, setConsoleLines] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const syncQueues = (nextQ1, nextQ2) => {
    q1Ref.current = nextQ1;
    q2Ref.current = nextQ2;
    setQueue1(nextQ1);
    setQueue2(nextQ2);
  };

  const pushLog = (line) => setConsoleLines((prev) => [...prev, line]);

  const resetBoard = () => {
    idRef.current = 1;
    setActiveQueue('q1');
    setSwappingLabels(false);
    setResult('-');
    setConsoleLines([]);
    syncQueues([], []);
    engine.clearLogs();
    engine?.clearLogs?.();
  };

  const animatePush = async (value) => {
    setActiveQueue('q1');
    pushLog(`push(${value}) -> O(1): append to Queue 1`);

    const entering = { ...makeNode(idRef.current++, value), state: 'entering' };
    const nextQ1 = [...q1Ref.current, entering];
    syncQueues(nextQ1, q2Ref.current);
    await wait(STEP_MS * 0.7);

    const settledQ1 = nextQ1.map((node) =>
      node.id === entering.id ? { ...node, state: 'idle' } : node
    );
    syncQueues(settledQ1, q2Ref.current);
    await wait(STEP_MS * 0.3);
  };

  const shiftFrontFromQ1ToQ2 = async () => {
    if (!q1Ref.current.length) return;

    setActiveQueue('both');

    const front = q1Ref.current[0];
    const restQ1 = q1Ref.current.slice(1);
    syncQueues(restQ1, q2Ref.current);

    await wait(STEP_MS * 0.45);

    const moving = { ...front, state: 'trail' };
    const nextQ2 = [...q2Ref.current, moving];
    syncQueues(restQ1, nextQ2);
    pushLog(`transfer ${front.value}: Q1 front -> Q2 back`);

    await wait(STEP_MS * 0.55);

    const settledQ2 = nextQ2.map((node) =>
      node.id === moving.id ? { ...node, state: 'idle' } : node
    );
    syncQueues(restQ1, settledQ2);
  };

  const animateSwap = async () => {
    setSwappingLabels(true);
    pushLog('swap labels: Queue 2 becomes main storage');
    await wait(STEP_MS * 0.7);

    const swapped = [...q2Ref.current];
    syncQueues(swapped, []);
    setSwappingLabels(false);
    setActiveQueue('q1');
    await wait(STEP_MS * 0.3);
  };

  const animateTop = async () => {
    if (!q1Ref.current.length) {
      pushLog('top() -> stack empty');
      return;
    }

    pushLog('top() start: migrate n-1 elements');
    while (q1Ref.current.length > 1) {
      await shiftFrontFromQ1ToQ2();
    }

    const topNode = q1Ref.current[0];
    if (!topNode) return;

    const pulsing = { ...topNode, state: 'pulse' };
    syncQueues([pulsing], q2Ref.current);
    setResult(topNode.value);
    pushLog(`top() -> ${topNode.value}`);

    await wait(STEP_MS);

    const movedTop = { ...topNode, state: 'trail' };
    syncQueues([], [...q2Ref.current, movedTop]);
    await wait(STEP_MS * 0.6);

    const settledQ2 = q2Ref.current.map((node) =>
      node.id === movedTop.id ? { ...node, state: 'idle' } : node
    );
    syncQueues([], settledQ2);

    await animateSwap();
  };

  const animatePop = async () => {
    if (!q1Ref.current.length) {
      pushLog('pop() -> stack empty');
      return;
    }

    pushLog('pop() start: migrate n-1 elements');
    while (q1Ref.current.length > 1) {
      await shiftFrontFromQ1ToQ2();
    }

    const topNode = q1Ref.current[0];
    if (!topNode) return;

    const popping = { ...topNode, state: 'popping' };
    syncQueues([popping], q2Ref.current);
    pushLog(`pop() removes ${topNode.value}`);

    await wait(STEP_MS);

    syncQueues([], q2Ref.current);
    await animateSwap();
  };

  const runDriver = async () => {
    if (isRunning) return;

    setIsRunning(true);
    resetBoard();
    await wait(220);

    await animatePush(1);
    await animatePush(2);
    await animatePush(3);
    await animateTop();
    await animatePop();
    await animateTop();
    await animatePop();
    await animateTop();

    pushLog(`size() -> ${q1Ref.current.length}`);
    setIsRunning(false);
  };

  useEffect(() => {
    runDriver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="parenthesis-wrapper-container">
      <div className="visualizer-section">
        <section className="sqpc-board glass">
          <div className="sqpc-metric-badge">Push: O(1) | Pop: O(n)</div>

          <div className="sqpc-queues-wrap">
            <article className={`sqpc-queue-card ${activeQueue === 'q1' || activeQueue === 'both' ? 'sqpc-active' : ''}`}>
              <header className={`sqpc-queue-title ${swappingLabels ? 'sqpc-swap-left' : ''}`}>
                Queue 1 (Main Storage)
              </header>
              <div className="sqpc-queue-track">
                <div className="sqpc-flow-label">Outlet</div>
                <div className="sqpc-node-row">
                  {queue1.map((node) => (
                    <div key={`q1-${node.id}`} className={`sqpc-node sqpc-${node.state}`}>
                      {node.value}
                    </div>
                  ))}
                </div>
                <div className="sqpc-flow-label">Inlet</div>
              </div>
            </article>

            <article className={`sqpc-queue-card ${activeQueue === 'q2' || activeQueue === 'both' ? 'sqpc-active' : ''}`}>
              <header className={`sqpc-queue-title ${swappingLabels ? 'sqpc-swap-right' : ''}`}>
                Queue 2 (Transfer Buffer)
              </header>
              <div className="sqpc-queue-track">
                <div className="sqpc-flow-label">Outlet</div>
                <div className="sqpc-node-row">
                  {queue2.map((node) => (
                    <div key={`q2-${node.id}`} className={`sqpc-node sqpc-${node.state}`}>
                      {node.value}
                    </div>
                  ))}
                </div>
                <div className="sqpc-flow-label">Inlet</div>
              </div>
            </article>
          </div>

          <div className="sqpc-bottom-row">
            <div className="sqpc-result-box glass">
              <span className="sqpc-result-label">Result</span>
              <span className="sqpc-result-value">{result}</span>
            </div>

            <div className="sqpc-controls">
              <button className="btn btn-secondary glass" onClick={runDriver} disabled={isRunning}>
                Replay
              </button>
              <button className="btn btn-secondary glass" onClick={resetBoard} disabled={isRunning}>
                Reset
              </button>
            </div>
          </div>
        </section>
      </div>

      <aside className="python-panel glass">
        <div className="python-header">
          <h3>Stack Using Queues (Pop-Costly)</h3>
        </div>



        <div className="terminal-output">
          <h4>Live Console</h4>
          <div className="terminal-content sqpc-console">
            {consoleLines.length === 0 && <p>Waiting for sequence...</p>}
            {consoleLines.map((line, idx) => (
              <p key={`log-${idx}`}>{line}</p>
            ))}
          </div>
        </div>
      </aside>

      <style>{`
        .sqpc-board {
          position: relative;
          padding: 1.5rem;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(15px);
          background: linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
        }

        .sqpc-metric-badge {
          position: absolute;
          top: -12px;
          right: 16px;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.45rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(20, 24, 35, 0.72);
          color: #d8f4ff;
          box-shadow: 0 0 16px rgba(0, 212, 255, 0.26);
        }

        .sqpc-queues-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.1rem;
          margin-top: 0.8rem;
        }

        .sqpc-queue-card {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(15px);
          padding: 1rem;
          transition: box-shadow 260ms ease, border-color 260ms ease;
        }

        .sqpc-active {
          border-color: rgba(0, 212, 255, 0.7);
          box-shadow: 0 0 22px rgba(0, 212, 255, 0.28);
        }

        .sqpc-queue-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #e6f7ff;
          margin-bottom: 0.6rem;
          transition: transform 500ms ease;
        }

        .sqpc-swap-left {
          transform: translateX(18px);
        }

        .sqpc-swap-right {
          transform: translateX(-18px);
        }

        .sqpc-queue-track {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          min-height: 86px;
          padding: 0.65rem 0.75rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(11, 14, 22, 0.34);
        }

        .sqpc-flow-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #9ed6f0;
          opacity: 0.92;
          min-width: 52px;
          text-align: center;
        }

        .sqpc-node-row {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.55rem;
          min-height: 58px;
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .sqpc-node {
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 800;
          color: #eaf7ff;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.36), rgba(0,212,255,0.24));
          box-shadow: 0 0 16px rgba(0, 212, 255, 0.4);
          transition: transform 300ms ease, opacity 300ms ease, filter 300ms ease;
        }

        .sqpc-entering {
          animation: sqpc-enter 620ms ease;
        }

        .sqpc-trail {
          filter: blur(0.9px);
          box-shadow: 0 0 22px rgba(0, 212, 255, 0.72);
          animation: sqpc-trail 680ms ease;
        }

        .sqpc-pulse {
          animation: sqpc-pulse 900ms ease-in-out infinite;
        }

        .sqpc-popping {
          box-shadow: 0 0 22px rgba(255, 75, 43, 0.72);
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.32), rgba(255, 75, 43, 0.33));
          animation: sqpc-popout 620ms ease forwards;
        }

        .sqpc-bottom-row {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .sqpc-result-box {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.7rem 0.95rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .sqpc-result-label {
          font-size: 0.82rem;
          color: #9ab6d9;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .sqpc-result-value {
          min-width: 20px;
          font-size: 1.05rem;
          font-weight: 800;
          color: #f4fbff;
        }

        .sqpc-controls {
          display: flex;
          gap: 0.7rem;
        }

        .sqpc-code-block h4 {
          margin: 0.4rem 0 0.6rem;
          color: #c0ecff;
          font-size: 0.9rem;
          letter-spacing: 0.03em;
        }

        .sqpc-code-block pre {
          margin-bottom: 0.8rem;
        }

        .sqpc-highlight-line {
          display: block;
          background: rgba(255, 209, 102, 0.18);
          border-left: 3px solid rgba(255, 209, 102, 0.8);
          padding-left: 0.35rem;
        }

        .sqpc-console {
          max-height: 210px;
          overflow-y: auto;
        }

        @keyframes sqpc-enter {
          from {
            transform: translateX(30px) scale(0.92);
            opacity: 0.45;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes sqpc-trail {
          0% {
            transform: translateX(-6px);
          }
          50% {
            transform: translateX(10px);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes sqpc-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 14px rgba(0, 212, 255, 0.45);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 24px rgba(255, 120, 72, 0.55);
          }
        }

        @keyframes sqpc-popout {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-16px) scale(0.78);
          }
        }
      `}</style>
    </div>
  );
}
