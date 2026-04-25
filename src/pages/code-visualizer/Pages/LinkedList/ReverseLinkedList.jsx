import React, { useState, useEffect } from 'react';
import { useVisualizerEngine } from "../../../../hooks/useVisualizerEngine";

const INITIAL_VALUES = [1, 2, 3, 4, 5];
const CARD_WIDTH = 108;
const GAP_WIDTH = 68;
const SLOT_WIDTH = CARD_WIDTH + GAP_WIDTH;
const PYTHON_LINES = [
  'prev = None',
  'curr = head',
  'while curr:',
  '    next = curr.next',
  '    curr.next = prev',
  '    prev = curr',
  '    curr = next',
  'return prev',
];
const JS_LINES = [
  'let prev = null;',
  'let curr = head;',
  'while (curr) {',
  '  const next = curr.next;',
  '  curr.next = prev;',
  '  prev = curr;',
  '  curr = next;',
  '}',
  'return prev;',
];

const makeForwardLinks = (length) => Array.from({ length }, (_, index) => (index < length - 1 ? index + 1 : null));

const getGapDirection = (links, gapIndex) => {
  if (links[gapIndex] === gapIndex + 1) {
    return 'forward';
  }

  if (links[gapIndex + 1] === gapIndex) {
    return 'backward';
  }

  return 'none';
};

const buildTrackNodes = (values) => values.map((value, index) => ({ id: index, value }));

const ReverseLinkedList = () => {
  const engine = useVisualizerEngine();
  const [displayNodes, setDisplayNodes] = useState(buildTrackNodes(INITIAL_VALUES));
  const [links, setLinks] = useState(makeForwardLinks(INITIAL_VALUES.length));
  const [pointerSlots, setPointerSlots] = useState({ prev: 0, curr: 1, next: 2 });
  const [activeGapIndex, setActiveGapIndex] = useState(null);
  const [snapDirection, setSnapDirection] = useState('none');
  const [activePythonLine, setActivePythonLine] = useState(0);
  const [activeJsLine, setActiveJsLine] = useState(0);
  const [status, setStatus] = useState('Ready to reverse 1 -> 2 -> 3 -> 4 -> 5');
  const [phase, setPhase] = useState('idle');
  const [completed, setCompleted] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [outputReveal, setOutputReveal] = useState('');

  useEffect(() => {
    if (!completed) {
      setOutputReveal('Pending reversal output');
      return undefined;
    }

    const finalOutput = `${displayNodes.map((node) => node.value).join(' -> ')} -> NULL`;
    setOutputReveal('');

    let frameIndex = 0;
    const timer = window.setInterval(() => {
      frameIndex += 1;
      setOutputReveal(finalOutput.slice(0, frameIndex));
      if (frameIndex >= finalOutput.length) {
        window.clearInterval(timer);
      }
    }, 45);

    return () => window.clearInterval(timer);
  }, [completed, displayNodes]);

  const resetBoard = () => {
    if (engine.isExecuting) {
      return;
    }

    engine.clearLogs();
    setDisplayNodes(buildTrackNodes(INITIAL_VALUES));
    setLinks(makeForwardLinks(INITIAL_VALUES.length));
    setPointerSlots({ prev: 0, curr: 1, next: 2 });
    setActiveGapIndex(null);
    setSnapDirection('none');
    setActivePythonLine(0);
    setActiveJsLine(0);
    setStatus('Ready to reverse 1 -> 2 -> 3 -> 4 -> 5');
    setPhase('idle');
    setCompleted(false);
    setIteration(0);
    setOutputReveal('Pending reversal output');
    engine.logAction('Board reset to the original linked list.', 'info');
  };

  const runReverse = () => {
    if (engine.isExecuting) {
      engine.logAction('Wait for the current animation to finish.', 'error');
      return;
    }

    const total = INITIAL_VALUES.length;
    const nextLinks = makeForwardLinks(total);
    const steps = [];
    let buildPrevIndex = null;
    let buildCurrIndex = 0;

    steps.push(async () => {
      engine.clearLogs();
      setDisplayNodes(buildTrackNodes(INITIAL_VALUES));
      setLinks(makeForwardLinks(total));
      setPointerSlots({ prev: 0, curr: 1, next: 2 });
      setActiveGapIndex(null);
      setSnapDirection('none');
      setActivePythonLine(0);
      setActiveJsLine(0);
      setStatus('Initialize prev = NULL and curr = head');
      setPhase('init');
      setCompleted(false);
      setIteration(0);
      setOutputReveal('Pending reversal output');
      engine.logAction('Starting iterative reverse of the linked list.', 'info');
    });

    steps.push(async () => {
      setActivePythonLine(1);
      setActiveJsLine(1);
      setStatus('curr now points to node 1');
      engine.logAction('curr is positioned at the head node.', 'info');
    });

    while (buildCurrIndex !== null) {
      const stepIndex = buildCurrIndex;
      const nextIndex = stepIndex < total - 1 ? stepIndex + 1 : null;
      const nextSlot = nextIndex === null ? total + 1 : nextIndex + 1;
      const prevIndexForStep = buildPrevIndex;

      steps.push(async () => {
        setPhase('store-next');
        setIteration(stepIndex + 1);
        setActivePythonLine(3);
        setActiveJsLine(3);
        setPointerSlots({
          prev: prevIndexForStep === null ? 0 : prevIndexForStep + 1,
          curr: stepIndex + 1,
          next: nextSlot,
        });
        setActiveGapIndex(nextIndex === null ? null : stepIndex);
        setSnapDirection('forward');
        setStatus(
          nextIndex === null
            ? `Step ${stepIndex + 1}: next = NULL because curr is at the tail`
            : `Step ${stepIndex + 1}: store next = ${INITIAL_VALUES[nextIndex]}`
        );
        engine.logAction(
          nextIndex === null
            ? `Iteration ${stepIndex + 1}: next is NULL.`
            : `Iteration ${stepIndex + 1}: next points to node ${INITIAL_VALUES[nextIndex]}.`,
          'info'
        );
      });

      steps.push(async () => {
        setPhase('snap-link');
        setActivePythonLine(4);
        setActiveJsLine(4);
        setActiveGapIndex(stepIndex);
        setSnapDirection(prevIndexForStep === null ? 'to-null' : 'backward');
        setStatus(
          prevIndexForStep === null
            ? `Step ${stepIndex + 1}: detach node ${INITIAL_VALUES[stepIndex]} from the forward chain`
            : `Step ${stepIndex + 1}: snap node ${INITIAL_VALUES[stepIndex]}'s arrow backward`
        );
        await engine.sleep(Math.max(180, engine.getDelay() * 0.45));
      });

      steps.push(async () => {
        nextLinks[stepIndex] = prevIndexForStep;
        setPhase('reverse-link');
        setActivePythonLine(4);
        setActiveJsLine(4);
        setLinks([...nextLinks]);
        setStatus(
          prevIndexForStep === null
            ? `Step ${stepIndex + 1}: break node ${INITIAL_VALUES[stepIndex]}'s forward link to point to NULL`
            : `Step ${stepIndex + 1}: flip node ${INITIAL_VALUES[stepIndex]}'s arrow backward to ${INITIAL_VALUES[prevIndexForStep]}`
        );
        engine.logAction(
          prevIndexForStep === null
            ? `curr.next now points to NULL.`
            : `curr.next now points backward to node ${INITIAL_VALUES[prevIndexForStep]}.`,
          'success'
        );
        await engine.sleep(Math.max(220, engine.getDelay() * 0.55));
      });

      steps.push(async () => {
        const nextPrevIndex = stepIndex;
        const nextCurrIndex = nextIndex;
        const upcomingNextIndex = nextCurrIndex === null ? null : nextCurrIndex < total - 1 ? nextCurrIndex + 1 : null;
        setPhase('shift-pointers');
        setActivePythonLine(5);
        setActiveJsLine(5);
        setPointerSlots({
          prev: nextPrevIndex + 1,
          curr: nextCurrIndex === null ? total + 1 : nextCurrIndex + 1,
          next: upcomingNextIndex === null ? total + 1 : upcomingNextIndex + 1,
        });
        setActiveGapIndex(nextCurrIndex === null ? null : nextCurrIndex);
        setSnapDirection(nextCurrIndex === null ? 'none' : 'forward');
        setStatus(
          nextCurrIndex === null
            ? `Shift pointers: prev moves to ${INITIAL_VALUES[nextPrevIndex]}, curr advances to NULL`
            : `Shift pointers: prev = ${INITIAL_VALUES[nextPrevIndex]}, curr = ${INITIAL_VALUES[nextCurrIndex]}`
        );
        engine.logAction('Shift prev and curr one step forward.', 'info');
      });

      steps.push(async () => {
        setActivePythonLine(6);
        setActiveJsLine(6);
      });

      buildPrevIndex = stepIndex;
      buildCurrIndex = nextIndex;
    }

    steps.push(async () => {
      const reversedValues = [...INITIAL_VALUES].reverse();
      setDisplayNodes(buildTrackNodes(reversedValues));
      setLinks(makeForwardLinks(reversedValues.length));
      setPointerSlots({ prev: 1, curr: reversedValues.length + 1, next: reversedValues.length + 1 });
      setActiveGapIndex(null);
      setSnapDirection('none');
      setActivePythonLine(7);
      setActiveJsLine(8);
      setStatus('Reversal complete: new head is 5 and the order is 5 -> 4 -> 3 -> 2 -> 1');
      setPhase('done');
      setCompleted(true);
      engine.logAction('Reversal complete. The new head is 5.', 'success');
    });

    engine.executeSteps(steps);
  };

  const totalSlots = displayNodes.length + 2;
  const pointerLeft = (slot) => slot * SLOT_WIDTH;
  const prevNodeIndex = pointerSlots.prev > 0 && pointerSlots.prev <= displayNodes.length ? pointerSlots.prev - 1 : null;
  const currNodeIndex = pointerSlots.curr > 0 && pointerSlots.curr <= displayNodes.length ? pointerSlots.curr - 1 : null;
  const nextNodeIndex = pointerSlots.next > 0 && pointerSlots.next <= displayNodes.length ? pointerSlots.next - 1 : null;

  return (
    <div className="reverse-ll-page">
      <div className="reverse-ll-main glass">
        <section className="reverse-ll-stage glass">
          <div className="reverse-ll-headline-row">
            <div>
              <p className="reverse-ll-kicker">Linked List Code Visualizer</p>
              <h1>Reverse Linked List</h1>
              <p className="reverse-ll-subtitle">
                Iterative reverse using three pointers with $O(n)$ time and $O(1)$ space.
              </p>
            </div>
            <div className="reverse-ll-stats glass">
              <span>Phase: {phase}</span>
              <span>Iteration: {iteration}</span>
              <span>New Head: {completed ? displayNodes[0].value : '-'}</span>
            </div>
          </div>

          <div className="reverse-ll-status glass">{status}</div>

          <div className="reverse-ll-track-shell">
            <div className="reverse-ll-pointer-layer" style={{ width: `${totalSlots * SLOT_WIDTH}px` }}>
              <div className="reverse-ll-pointer prev" style={{ transform: `translateX(${pointerLeft(pointerSlots.prev)}px)` }}>
                prev
              </div>
              <div className="reverse-ll-pointer curr" style={{ transform: `translateX(${pointerLeft(pointerSlots.curr)}px)` }}>
                curr
              </div>
              <div className="reverse-ll-pointer next" style={{ transform: `translateX(${pointerLeft(pointerSlots.next)}px)` }}>
                next
              </div>
            </div>

            <div className="reverse-ll-track">
              <div className="reverse-ll-null left glass">NULL</div>
              {displayNodes.map((node, index) => (
                <React.Fragment key={`${node.id}-${node.value}-${index}`}>
                  <div
                    className={[
                      'reverse-ll-node',
                      'glass',
                      completed && index === 0 ? 'new-head' : '',
                      prevNodeIndex === index ? 'is-prev-node' : '',
                      currNodeIndex === index ? 'is-curr-node' : '',
                      nextNodeIndex === index ? 'is-next-node' : '',
                      currNodeIndex === index && (phase === 'snap-link' || phase === 'reverse-link') ? 'is-reversing' : '',
                      prevNodeIndex === index && (phase === 'snap-link' || phase === 'reverse-link') ? 'is-anchor' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="reverse-ll-node-label">Node</span>
                    <strong>{node.value}</strong>
                    {completed && index === 0 && <span className="reverse-ll-chip">new head</span>}
                  </div>
                  {index < displayNodes.length - 1 && (
                    <div
                      className={[
                        'reverse-ll-gap',
                        getGapDirection(links, index),
                        activeGapIndex === index ? 'is-active' : '',
                        activeGapIndex === index && snapDirection === 'backward' ? 'is-snapping-backward' : '',
                        activeGapIndex === index && snapDirection === 'forward' ? 'is-snapping-forward' : '',
                        activeGapIndex === index && snapDirection === 'to-null' ? 'is-snapping-null' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <svg viewBox="0 0 72 48" className="reverse-ll-arrow" aria-hidden="true">
                        <g className="reverse-ll-arrow-forward-shape">
                          <path className="reverse-ll-arrow-line" d="M8 24 H60" />
                          <path className="reverse-ll-arrow-head" d="M48 12 L60 24 L48 36" />
                        </g>
                        <g className="reverse-ll-arrow-backward-shape">
                          <path className="reverse-ll-arrow-line curved" d="M60 34 C46 8, 26 8, 12 24" />
                          <path className="reverse-ll-arrow-head curved" d="M23 14 L12 24 L26 28" />
                        </g>
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <div className="reverse-ll-null right glass">NULL</div>
            </div>
          </div>

          <div className="reverse-ll-controls">
            <button className="btn btn-primary" onClick={runReverse} disabled={engine.isExecuting}>
              Run Reverse
            </button>
            <button className="btn btn-secondary glass" onClick={resetBoard} disabled={engine.isExecuting}>
              Reset
            </button>
            <div className="reverse-ll-speed glass">
              <label htmlFor="reverse-ll-speed">Speed</label>
              <input
                id="reverse-ll-speed"
                type="range"
                min="1"
                max="5"
                value={engine.speed}
                onChange={(event) => engine.setSpeed(Number(event.target.value))}
              />
            </div>
          </div>

          <div className={`reverse-ll-output glass ${completed ? 'is-visible' : ''}`}>
            <span className="reverse-ll-output-label">Output</span>
            <strong>
              {outputReveal}
              {completed && outputReveal.length < `${displayNodes.map((node) => node.value).join(' -> ')} -> NULL`.length && (
                <span className="reverse-ll-output-cursor">|</span>
              )}
            </strong>
          </div>

          <div className="reverse-ll-log glass">
            <h3>Activity Log</h3>
            <div className="reverse-ll-log-list">
              {engine.logs.map((log, index) => (
                <div key={log.id || index} className={`reverse-ll-log-item ${log.type}`}>
                  {log.msg}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <style>{`
        .reverse-ll-page {
          padding: 112px 4.5% 72px;
          color: #eff9ff;
        }

        .reverse-ll-main {
          max-width: 1480px;
          margin: 0 auto;
          width: 100%;
        }

        .glass {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
        }

        .reverse-ll-stage {
          border-radius: 28px;
          padding: 1.3rem;
        }

        .reverse-ll-headline-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }

        .reverse-ll-kicker {
          margin: 0 0 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.76rem;
          color: #9fdcf9;
        }

        .reverse-ll-headline-row h1 {
          margin: 0;
          font-size: clamp(1.9rem, 3.5vw, 3rem);
        }

        .reverse-ll-subtitle {
          margin: 0.55rem 0 0;
          max-width: 680px;
          color: rgba(233, 245, 255, 0.78);
          line-height: 1.6;
        }

        .reverse-ll-stats {
          min-width: 210px;
          padding: 0.95rem 1rem;
          border-radius: 20px;
          display: grid;
          gap: 0.35rem;
          font-weight: 600;
        }

        .reverse-ll-status {
          margin-top: 1rem;
          padding: 0.9rem 1rem;
          border-radius: 18px;
          color: #dff3ff;
        }

        .reverse-ll-track-shell {
          overflow-x: auto;
          padding: 1.1rem 0 0.5rem;
        }

        .reverse-ll-pointer-layer {
          position: relative;
          height: 64px;
        }

        .reverse-ll-pointer {
          position: absolute;
          top: 10px;
          left: 0;
          min-width: 74px;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          text-align: center;
          font-size: 0.76rem;
          font-weight: 800;
          color: #0b1820;
          transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .reverse-ll-pointer::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -7px;
          width: 12px;
          height: 12px;
          transform: translateX(-50%) rotate(45deg);
          border-radius: 2px;
          background: inherit;
        }

        .reverse-ll-pointer.prev {
          background: linear-gradient(135deg, #ffdb8b, #ffb467);
          box-shadow: 0 0 24px rgba(255, 184, 94, 0.4);
        }

        .reverse-ll-pointer.curr {
          background: linear-gradient(135deg, #7fe8ff, #4fc4ff);
          box-shadow: 0 0 24px rgba(79, 196, 255, 0.42);
        }

        .reverse-ll-pointer.next {
          background: linear-gradient(135deg, #d0b3ff, #9e7cff);
          box-shadow: 0 0 22px rgba(158, 124, 255, 0.34);
          color: #15112a;
        }

        .reverse-ll-track {
          display: flex;
          align-items: center;
          width: fit-content;
        }

        .reverse-ll-null,
        .reverse-ll-node {
          width: ${CARD_WIDTH}px;
          min-width: ${CARD_WIDTH}px;
          min-height: 108px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .reverse-ll-null {
          color: rgba(238, 247, 255, 0.7);
          border-style: dashed;
        }

        .reverse-ll-null.left {
          margin-right: ${GAP_WIDTH / 2}px;
        }

        .reverse-ll-null.right {
          margin-left: ${GAP_WIDTH / 2}px;
        }

        .reverse-ll-node {
          position: relative;
          gap: 0.15rem;
          transition: transform 380ms ease, box-shadow 300ms ease, border-color 260ms ease, background 260ms ease;
        }

        .reverse-ll-node strong {
          font-size: 1.55rem;
        }

        .reverse-ll-node-label {
          font-size: 0.73rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(229, 244, 255, 0.65);
        }

        .reverse-ll-node.new-head {
          border-color: rgba(143, 255, 210, 0.9);
          box-shadow: 0 0 28px rgba(143, 255, 210, 0.24);
          transform: scale(1.04);
        }

        .reverse-ll-node.is-prev-node {
          border-color: rgba(255, 191, 102, 0.55);
          box-shadow: 0 0 18px rgba(255, 191, 102, 0.16);
        }

        .reverse-ll-node.is-curr-node {
          border-color: rgba(111, 226, 255, 0.72);
          box-shadow: 0 0 22px rgba(111, 226, 255, 0.22);
        }

        .reverse-ll-node.is-next-node {
          border-color: rgba(176, 142, 255, 0.5);
          box-shadow: 0 0 18px rgba(176, 142, 255, 0.16);
        }

        .reverse-ll-node.is-reversing {
          animation: reverse-ll-pulse 720ms ease-in-out infinite alternate;
        }

        .reverse-ll-node.is-anchor {
          animation: reverse-ll-tilt 780ms ease-in-out infinite alternate;
        }

        .reverse-ll-chip {
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          background: rgba(143, 255, 210, 0.12);
          color: #b8ffe7;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .reverse-ll-gap {
          width: ${GAP_WIDTH}px;
          min-width: ${GAP_WIDTH}px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .reverse-ll-arrow {
          width: 72px;
          height: 48px;
          overflow: visible;
          transform-origin: center;
          transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease, filter 260ms ease;
          filter: drop-shadow(0 0 8px rgba(111, 225, 255, 0.45));
        }

        .reverse-ll-gap.forward .reverse-ll-arrow {
          transform: rotate(0deg);
          opacity: 1;
        }

        .reverse-ll-gap.backward .reverse-ll-arrow {
          transform: scale(1.04) translateY(-2px);
          opacity: 1;
        }

        .reverse-ll-gap.none .reverse-ll-arrow {
          opacity: 0.12;
          transform: scaleX(0.76);
        }

        .reverse-ll-gap.is-active .reverse-ll-arrow {
          filter: drop-shadow(0 0 16px rgba(111, 225, 255, 0.92));
        }

        .reverse-ll-gap.is-snapping-forward .reverse-ll-arrow {
          transform: rotate(0deg) scale(1.12) translateY(-2px);
        }

        .reverse-ll-gap.is-snapping-backward .reverse-ll-arrow {
          transform: scale(1.24) translateY(-6px);
        }

        .reverse-ll-gap.is-snapping-null .reverse-ll-arrow {
          transform: rotate(130deg) scale(0.94);
          opacity: 0.46;
        }

        .reverse-ll-arrow-line,
        .reverse-ll-arrow-head {
          fill: none;
          stroke: #71e2ff;
          stroke-width: 3.6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .reverse-ll-arrow-backward-shape {
          opacity: 0;
          transition: opacity 260ms ease;
        }

        .reverse-ll-arrow-forward-shape {
          opacity: 1;
          transition: opacity 260ms ease;
        }

        .reverse-ll-gap.backward .reverse-ll-arrow-forward-shape,
        .reverse-ll-gap.is-snapping-backward .reverse-ll-arrow-forward-shape {
          opacity: 0;
        }

        .reverse-ll-gap.backward .reverse-ll-arrow-backward-shape,
        .reverse-ll-gap.is-snapping-backward .reverse-ll-arrow-backward-shape {
          opacity: 1;
        }

        .reverse-ll-gap.is-snapping-null .reverse-ll-arrow-forward-shape,
        .reverse-ll-gap.is-snapping-null .reverse-ll-arrow-backward-shape {
          opacity: 0.4;
        }

        .reverse-ll-output {
          margin-top: 1rem;
          border-radius: 20px;
          padding: 0.95rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          opacity: 0.72;
          transition: opacity 260ms ease, box-shadow 260ms ease, border-color 260ms ease;
        }

        .reverse-ll-output.is-visible {
          opacity: 1;
          border-color: rgba(143, 255, 210, 0.5);
          box-shadow: 0 0 24px rgba(143, 255, 210, 0.16);
        }

        .reverse-ll-output-label {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(231, 245, 255, 0.64);
        }

        .reverse-ll-output-cursor {
          display: inline-block;
          margin-left: 0.08rem;
          color: #8fe4ff;
          animation: reverse-ll-cursor-blink 700ms step-end infinite;
        }

        .reverse-ll-controls {
          margin-top: 1rem;
          display: flex;
          gap: 0.9rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .reverse-ll-speed {
          margin-left: auto;
          border-radius: 999px;
          padding: 0.75rem 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        .reverse-ll-log {
          margin-top: 1rem;
          border-radius: 20px;
          padding: 1rem;
        }

        .reverse-ll-log h3,
        .reverse-ll-code h3 {
          margin: 0 0 0.7rem;
        }

        .reverse-ll-log-list {
          display: grid;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .reverse-ll-log-item {
          padding: 0.75rem 0.85rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .reverse-ll-log-item.success {
          border-color: rgba(143, 255, 210, 0.28);
        }

        .reverse-ll-log-item.error {
          border-color: rgba(255, 141, 141, 0.3);
        }

        @keyframes reverse-ll-pulse {
          from {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 18px rgba(111, 226, 255, 0.2);
          }
          to {
            transform: translateY(-8px) scale(1.06);
            box-shadow: 0 0 34px rgba(111, 226, 255, 0.34);
          }
        }

        @keyframes reverse-ll-tilt {
          from {
            transform: rotate(-2deg) translateY(0);
          }
          to {
            transform: rotate(2deg) translateY(-4px);
          }
        }

        @keyframes reverse-ll-cursor-blink {
          50% {
            opacity: 0;
          }
        }

        @media (max-width: 720px) {
          .reverse-ll-page {
            padding-top: 98px;
          }

          .reverse-ll-headline-row {
            flex-direction: column;
          }

          .reverse-ll-speed {
            margin-left: 0;
            width: 100%;
            justify-content: space-between;
          }

          .reverse-ll-output {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ReverseLinkedList;