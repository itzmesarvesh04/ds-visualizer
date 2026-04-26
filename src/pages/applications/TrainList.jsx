import React, { useState, useEffect, useRef } from 'react';

const W = 1000, H = 400;
const coachWidth = 120;
const coachHeight = 60;
const coachSpacing = 40;
const startX = 50;
const groundY = H - 100;

// Easing functions
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);

const TrainList = () => {
  // Engine is always index 0. Coaches follow.
  const [nodes, setNodes] = useState([{ id: 'engine', label: 'Engine', type: 'engine' }]); 
  const [isExecuting, setIsExecuting] = useState(false);
  
  const canvasRef = useRef(null);
  const animRef = useRef({ type: null, progress: 0, startTime: null, duration: 0 });
  const stateRef = useRef({ nodes: [] });
  const requestRef = useRef();

  useEffect(() => {
    stateRef.current.nodes = nodes;
    renderStatic();
  }, [nodes]);

  const renderStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawScene(ctx, stateRef.current, { type: null });
  };

  const startAnimation = (type, duration, onComplete, extra = {}) => {
    setIsExecuting(true);
    animRef.current = { type, progress: 0, startTime: null, duration, ...extra };
    
    const tick = (timestamp) => {
      const anim = animRef.current;
      if (!anim.startTime) anim.startTime = timestamp;
      anim.progress = Math.min((timestamp - anim.startTime) / anim.duration, 1);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawScene(ctx, stateRef.current, anim);
      }

      if (anim.progress < 1) {
        requestRef.current = requestAnimationFrame(tick);
      } else {
        onComplete();
        setIsExecuting(false);
      }
    };
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const insert = (pos) => {
    if (isExecuting) return;
    
    let index;
    if (pos === 'start') index = 1;
    else if (pos === 'middle') index = Math.max(1, Math.floor(nodes.length / 2));
    else index = nodes.length;

    const nextId = Date.now();
    const nextLabel = `C${nodes.length}`;

    startAnimation('INSERT', 1200, () => {
      setNodes(prev => {
        const next = [...prev];
        next.splice(index, 0, { id: nextId, label: nextLabel, type: 'coach' });
        return next;
      });
    }, { insertIndex: index });
  };

  const remove = (pos) => {
    if (isExecuting || nodes.length <= 1) return; // Cannot remove engine

    let index;
    if (pos === 'start') index = 1;
    else if (pos === 'middle') index = Math.max(1, Math.floor(nodes.length / 2));
    else index = nodes.length - 1;

    startAnimation('DELETE', 1200, () => {
      setNodes(prev => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    }, { deleteIndex: index });
  };

  const traverse = () => {
    if (isExecuting || nodes.length <= 1) return;
    
    let i = 0;
    const runNext = () => {
      if (i >= nodes.length) return;
      startAnimation('TRAVERSE', 600, () => {
        i++;
        if (i < stateRef.current.nodes.length) setTimeout(runNext, 100);
      });
      animRef.current.traverseIndex = i;
    };
    runNext();
  };

  const autoPlay = async () => {
    if (isExecuting) return;
    setNodes([{ id: 'engine', label: 'Engine', type: 'engine' }]);
    await new Promise(r => setTimeout(r, 500));
    
    // Insert 3
    insert('end');
    await new Promise(r => setTimeout(r, 1500));
    insert('start');
    await new Promise(r => setTimeout(r, 1500));
    insert('middle');
    await new Promise(r => setTimeout(r, 1500));
    
    // Delete 1
    remove('middle');
    await new Promise(r => setTimeout(r, 1500));
    
    // Traverse
    traverse();
  };

  const drawScene = (ctx, state, anim) => {
    // Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, W, H);

    // Tracks
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x + 10, groundY + 10); ctx.stroke();
    }

    const totalSpacing = coachWidth + coachSpacing;

    // Draw existing nodes
    state.nodes.forEach((node, idx) => {
      let x = startX + idx * totalSpacing;
      let y = groundY - 10;
      let highlighted = false;

      // Handle shift during INSERT
      if (anim.type === 'INSERT' && idx >= anim.insertIndex) {
        x += anim.progress * totalSpacing;
      }
      // Handle shift during DELETE
      if (anim.type === 'DELETE' && idx > anim.deleteIndex) {
        x -= anim.progress * totalSpacing;
      }

      if (anim.type === 'TRAVERSE' && anim.traverseIndex === idx) {
        highlighted = true;
      }

      // Draw node unless it's being deleted right now (handled separately)
      if (!(anim.type === 'DELETE' && idx === anim.deleteIndex)) {
        drawCoach(ctx, x, y, node.label, node.type === 'engine', highlighted);
        // Link to next
        if (idx < state.nodes.length - 1) {
            let linkX = x + coachWidth;
            let linkProgress = 1;
            if (anim.type === 'INSERT' && idx === anim.insertIndex - 1) linkProgress = 0; // Break link
            if (anim.type === 'DELETE' && idx === anim.deleteIndex - 1) linkProgress = 1 - anim.progress;
            
            if (linkProgress > 0) drawLink(ctx, linkX, y - 20, coachSpacing * linkProgress);
        }
      }
    });

    // Draw animated coach for INSERT
    if (anim.type === 'INSERT') {
      let targetX = startX + anim.insertIndex * totalSpacing;
      let t = anim.progress;
      let coachX;
      if (t < 0.7) {
        // Roll in from top/right
        coachX = W - (W - targetX) * (t / 0.7);
        drawCoach(ctx, coachX, groundY - 10, `C${state.nodes.length}`, false, false);
      } else {
        // Connect
        drawCoach(ctx, targetX, groundY - 10, `C${state.nodes.length}`, false, false);
        let linkX = startX + (anim.insertIndex - 1) * totalSpacing + coachWidth;
        let connectT = (t - 0.7) / 0.3;
        drawLink(ctx, linkX, groundY - 30, coachSpacing * connectT);
        if (anim.insertIndex < state.nodes.length) {
            drawLink(ctx, targetX + coachWidth, groundY - 30, coachSpacing * connectT);
        }
      }
    }

    // Draw animated coach for DELETE
    if (anim.type === 'DELETE') {
      let targetX = startX + anim.deleteIndex * totalSpacing;
      let t = anim.progress;
      let coachX = targetX + t * 400; // Roll out to right
      let node = state.nodes[anim.deleteIndex];
      drawCoach(ctx, coachX, groundY - 10, node.label, false, false);
    }
  };

  const drawCoach = (ctx, x, y, label, isEngine = false, highlighted = false) => {
    ctx.save();
    ctx.translate(x, y - coachHeight);

    // Body
    const gradient = ctx.createLinearGradient(0, 0, 0, coachHeight);
    if (isEngine) {
      gradient.addColorStop(0, '#e74c3c');
      gradient.addColorStop(1, '#c0392b');
    } else {
      gradient.addColorStop(0, highlighted ? '#f1c40f' : '#3498db');
      gradient.addColorStop(1, highlighted ? '#f39c12' : '#2980b9');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, coachWidth, coachHeight, 5);
    ctx.fill();

    // Windows
    ctx.fillStyle = highlighted ? '#fff' : 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(15 + i * 35, 15, 20, 20);
    }

    // Wheels
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(25, coachHeight + 5, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(coachWidth - 25, coachHeight + 5, 8, 0, Math.PI * 2); ctx.fill();
    
    // Hubcaps
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(25, coachHeight + 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(coachWidth - 25, coachHeight + 5, 3, 0, Math.PI * 2); ctx.fill();

    // Engine specific parts
    if (isEngine) {
      ctx.fillStyle = '#222';
      ctx.fillRect(coachWidth - 20, -15, 15, 20); // Chimney
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.arc(coachWidth - 12, -25, 10, 0, Math.PI * 2); ctx.fill(); // Smoke
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, coachWidth / 2, coachHeight + 25);

    ctx.restore();
  };

  const drawLink = (ctx, x, y, length) => {
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();

    // Link detail
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x + length, y - 2);
    ctx.stroke();
  };

  return (
    <div className="train-list-app">
      <style>{`
        .train-list-app {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #0a0c14;
          padding: 2rem;
          min-height: 500px;
          width: 100%;
        }
        .btn-bar {
          display: flex;
          gap: 12px;
          padding: 12px 24px;
          background: #1a1c2e;
          border-radius: 40px;
          border: 1px solid #2a2d45;
          margin-bottom: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-bar button {
          border-radius: 20px;
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .btn-ap {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #fff;
          border: none;
          box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
        }
        .btn-std {
          background: #2c3e50;
          color: #ecf0f1;
          border: 1px solid #34495e;
        }
        .btn-bar button:hover:not(:disabled) {
          filter: brightness(1.2);
          transform: translateY(-1px);
        }
        .btn-bar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        canvas {
          background: #0a0c14;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .controls-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .group-label {
          color: #7f8c8d;
          font-size: 0.8rem;
          text-transform: uppercase;
          margin-right: 4px;
        }
      `}</style>

      <div className="btn-bar">
        <button className="btn-ap" onClick={autoPlay} disabled={isExecuting}>Auto Play Sequence</button>
        <div className="controls-group">
          <span className="group-label">Insert:</span>
          <button className="btn-std" onClick={() => insert('start')} disabled={isExecuting}>Start</button>
          <button className="btn-std" onClick={() => insert('middle')} disabled={isExecuting}>Middle</button>
          <button className="btn-std" onClick={() => insert('end')} disabled={isExecuting}>End</button>
        </div>
        <div className="controls-group">
          <span className="group-label">Delete:</span>
          <button className="btn-std" onClick={() => remove('start')} disabled={isExecuting}>Start</button>
          <button className="btn-std" onClick={() => remove('middle')} disabled={isExecuting}>Middle</button>
          <button className="btn-std" onClick={() => remove('end')} disabled={isExecuting}>End</button>
        </div>
        <button className="btn-std" onClick={traverse} disabled={isExecuting}>Traverse Lights</button>
        <button className="btn-std" onClick={() => setNodes([{ id: 'engine', label: 'Engine', type: 'engine' }])} disabled={isExecuting}>Reset</button>
      </div>

      <canvas ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default TrainList;
