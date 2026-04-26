import React, { useState, useEffect, useRef } from 'react';

const MAX = 5;
const W = 800, H = 400;
const personWidth = 60;
const queueStartX = 150;
const personSpacing = 80;

// Easing functions
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t;

const PeopleQueue = () => {
  const [people, setPeople] = useState([]); // [{id, label}]
  const [isExecuting, setIsExecuting] = useState(false);
  
  const canvasRef = useRef(null);
  const animRef = useRef({ type: null, progress: 0, startTime: null, duration: 0 });
  const stateRef = useRef({ people: [] });
  const requestRef = useRef();

  useEffect(() => {
    stateRef.current.people = people;
    renderStatic();
  }, [people]);

  const renderStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawScene(ctx, stateRef.current, { type: null });
  };

  const startAnimation = (type, duration, onComplete) => {
    setIsExecuting(true);
    animRef.current = { type, progress: 0, startTime: null, duration };
    
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

  const enqueue = () => {
    if (isExecuting) return;
    if (people.length >= MAX) {
      triggerOverflow();
      return;
    }

    const nextId = Date.now();
    const nextLabel = `P${people.length + 1}`;

    startAnimation('ENQUEUE', 1000, () => {
      setPeople(prev => [...prev, { id: nextId, label: nextLabel }]);
    });
  };

  const dequeue = () => {
    if (isExecuting || people.length === 0) return;

    startAnimation('DEQUEUE', 1200, () => {
      setPeople(prev => prev.slice(1));
    });
  };

  const traverse = () => {
    if (isExecuting || people.length === 0) return;
    
    let i = 0;
    const runNext = () => {
      if (i >= people.length) return;
      startAnimation('TRAVERSE', 600, () => {
        i++;
        if (i < stateRef.current.people.length) setTimeout(runNext, 100);
      });
      animRef.current.personIndex = i;
    };
    runNext();
  };

  const triggerOverflow = () => {
    startAnimation('OVERFLOW', 1500, () => {});
  };

  const autoPlay = async () => {
    if (isExecuting) return;
    setPeople([]);
    await new Promise(r => setTimeout(r, 500));
    
    // 5 Enqueue
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => {
        const nextId = Date.now() + i;
        startAnimation('ENQUEUE', 1000, () => {
          setPeople(prev => [...prev, { id: nextId, label: `P${prev.length + 1}` }]);
          resolve();
        });
      });
      await new Promise(r => setTimeout(r, 400));
    }
    // 2 Dequeue
    for (let i = 0; i < 2; i++) {
      await new Promise(resolve => {
        startAnimation('DEQUEUE', 1200, () => {
          setPeople(prev => prev.slice(1));
          resolve();
        });
      });
      await new Promise(r => setTimeout(r, 400));
    }
    // Traverse
    traverse();
  };

  const drawScene = (ctx, state, anim) => {
    // 1. Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Floor
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, H - 100, W, 100);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H - 100); ctx.lineTo(W, H - 100); ctx.stroke();

    // Queue Area
    ctx.fillStyle = 'rgba(56, 139, 253, 0.05)';
    ctx.fillRect(queueStartX - 40, H - 100, MAX * personSpacing, 10);

    // 2. Draw People in Queue
    state.people.forEach((p, idx) => {
      let x = queueStartX + idx * personSpacing;
      let y = H - 100;
      let highlighted = false;
      let walkCycle = 0;

      if (anim.type === 'DEQUEUE') {
        // Everyone moves forward
        x -= anim.progress * personSpacing;
        walkCycle = anim.progress * 4;
      }

      if (anim.type === 'TRAVERSE' && anim.personIndex === idx) {
        highlighted = true;
        let jump = Math.sin(anim.progress * Math.PI) * 20;
        y -= jump;
      }

      // If it's the first person in Dequeue, they walk off to the left
      if (anim.type === 'DEQUEUE' && idx === 0) {
        let dequeueX = queueStartX - anim.progress * 300;
        drawPerson(ctx, dequeueX, y, p.label, false, anim.progress * 8);
      } else {
        drawPerson(ctx, x, y, p.label, highlighted, walkCycle);
      }
    });

    // 3. Animated Person (ENQUEUE)
    if (anim.type === 'ENQUEUE') {
      let targetX = queueStartX + state.people.length * personSpacing;
      let startX = W + 50;
      let x = startX - (startX - targetX) * anim.progress;
      drawPerson(ctx, x, H - 100, `P${state.people.length + 1}`, false, anim.progress * 10);
    }

    // 4. Overflow Person
    if (anim.type === 'OVERFLOW') {
      let t = anim.progress;
      let startX = W + 50;
      let targetX = W - 150;
      let x;
      let isReturning = t > 0.5;
      
      if (!isReturning) {
        x = startX - (startX - targetX) * (t * 2);
      } else {
        x = targetX + (startX - targetX) * ((t - 0.5) * 2);
      }

      drawPerson(ctx, x, H - 100, '?', false, t * 10, isReturning);

      // Overflow text
      if (t > 0.3 && t < 0.8) {
        ctx.fillStyle = '#f85149';
        ctx.font = 'bold 20px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Queue is Full!', targetX, H - 250);
      }
    }
  };

  const drawPerson = (ctx, x, y, label, highlighted = false, walkCycle = 0, facingRight = false) => {
    ctx.save();
    ctx.translate(x, y);
    if (facingRight) ctx.scale(-1, 1);

    const color = highlighted ? '#58a6ff' : '#c9d1d9';
    const legSwing = Math.sin(walkCycle * Math.PI) * 15;
    const armSwing = Math.sin(walkCycle * Math.PI) * 10;

    // Legs
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Leg 1
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(legSwing, 0);
    ctx.stroke();

    // Leg 2
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(-legSwing, 0);
    ctx.stroke();

    // Torso
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-10, -85, 20, 45, 10);
    ctx.fill();

    // Arms
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // Arm 1
    ctx.beginPath();
    ctx.moveTo(0, -75);
    ctx.lineTo(armSwing + 10, -50);
    ctx.stroke();

    // Arm 2
    ctx.beginPath();
    ctx.moveTo(0, -75);
    ctx.lineTo(-armSwing - 10, -50);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(0, -100, 12, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#0d1117';
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -78);

    ctx.restore();
  };

  return (
    <div className="people-queue-app">
      <style>{`
        .people-queue-app {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #0d1117;
          padding: 2rem;
          min-height: 500px;
          width: 100%;
        }
        .btn-bar {
          display: flex;
          gap: 12px;
          padding: 12px 24px;
          background: #161b22;
          border-radius: 40px;
          border: 1px solid #30363d;
          margin-bottom: 30px;
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
          background: linear-gradient(135deg, #388bfd, #1f6feb);
          color: #fff;
          border: none;
          box-shadow: 0 0 15px rgba(56, 139, 253, 0.3);
        }
        .btn-std {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
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
          background: #0d1117;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .capacity-badge {
          margin-top: 20px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 20px;
          padding: 6px 20px;
          color: #8b949e;
          font-size: 0.9rem;
        }
        .full {
          color: #f85149;
          border-color: #f85149;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div className="btn-bar">
        <button className="btn-ap" onClick={autoPlay} disabled={isExecuting}>Auto Play Sequence</button>
        <button className="btn-std" onClick={enqueue} disabled={isExecuting}>+ Person Enters (Rear)</button>
        <button className="btn-std" onClick={dequeue} disabled={isExecuting}>- Person Leaves (Front)</button>
        <button className="btn-std" onClick={traverse} disabled={isExecuting}>Check Queue</button>
        <button className="btn-std" onClick={() => setPeople([])} disabled={isExecuting}>Reset</button>
      </div>

      <canvas ref={canvasRef} width={W} height={H} />

      <div className={`capacity-badge ${people.length === MAX ? 'full' : ''}`}>
        People in Queue: {people.length} / {MAX}
      </div>
    </div>
  );
};

export default PeopleQueue;
