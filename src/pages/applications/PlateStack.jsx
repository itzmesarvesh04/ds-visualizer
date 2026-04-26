import React, { useState, useEffect, useRef } from 'react';

const MAX = 5;
const W = 680, H = 600;
const tubX = 210, tubY = 80, tubW = 260, tubH = 440, wallW = 22;
const tubInnerW = tubW - wallW * 2;
const tubMouthY = tubY;
const tubBottomY = tubY + tubH;

// Easing functions
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeIn = t => t * t * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const elastic = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * (2 * Math.PI) / 3);

const PlateStack = () => {
  const [plates, setPlates] = useState([]); // [{id, label}]
  const [isExecuting, setIsExecuting] = useState(false);
  
  const canvasRef = useRef(null);
  const animRef = useRef({ type: null, progress: 0, startTime: null, duration: 0 });
  const stateRef = useRef({ plates: [] });
  const requestRef = useRef();

  // Update stateRef whenever plates change
  useEffect(() => {
    stateRef.current.plates = plates;
    if (!isExecuting) renderStatic();
  }, [plates, isExecuting]);

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

  const push = async () => {
    if (isExecuting) return;
    if (plates.length >= MAX) {
      triggerOverflow();
      return;
    }

    const nextId = Date.now();
    const nextLabel = `P${plates.length + 1}`;

    startAnimation('PUSH', 900, () => {
      setPlates(prev => [...prev, { id: nextId, label: nextLabel }]);
    });
  };

  const pop = async () => {
    if (isExecuting || plates.length === 0) return;

    startAnimation('POP', 850, () => {
      setPlates(prev => prev.slice(0, -1));
    });
  };

  const traverse = async () => {
    if (isExecuting || plates.length === 0) return;
    
    const count = plates.length;
    let i = count - 1;

    const runNext = () => {
      if (i < 0) return;
      startAnimation('TRAVERSE', 600, () => {
        i--;
        if (i >= 0) setTimeout(runNext, 200);
      });
      // We override animRef.current.plateIndex inside startAnimation call context
      animRef.current.plateIndex = i;
    };
    
    runNext();
  };

  const triggerOverflow = () => {
    startAnimation('OVERFLOW', 1400, () => {});
  };

  const autoPlay = async () => {
    if (isExecuting) return;
    setPlates([]);
    await new Promise(r => setTimeout(r, 500));
    
    // Auto play logic
    const sequence = async () => {
      // 5 Push
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => {
          const nextId = Date.now() + i;
          startAnimation('PUSH', 900, () => {
            setPlates(prev => [...prev, { id: nextId, label: `P${prev.length + 1}` }]);
            resolve();
          });
        });
        await new Promise(r => setTimeout(r, 500));
      }
      // 2 Pop
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => {
          startAnimation('POP', 850, () => {
            setPlates(prev => prev.slice(0, -1));
            resolve();
          });
        });
        await new Promise(r => setTimeout(r, 500));
      }
      // Traverse
      traverse();
    };
    sequence();
  };

  const drawScene = (ctx, state, anim) => {
    // 1. Background
    ctx.fillStyle = '#0c0e1a';
    ctx.fillRect(0, 0, W, H);
    let vig = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W/2+100);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // 2. Tub Walls
    drawTub(ctx, anim);

    // 3. Plates (Clipped)
    ctx.save();
    ctx.beginPath();
    ctx.rect(tubX + wallW, tubY, tubW - wallW * 2, tubH - 10);
    ctx.clip();
    
    // Draw stable plates
    state.plates.forEach((p, idx) => {
      let py = tubBottomY - 22 - (idx * 36); // 18 gap + 18 half height? Spec says 18px gap between centers. 
      // Wait, spec: "18px vertical gap between plate centers. Bottom plate center at y = tubBottomY - 22. Stack grows upward."
      // Let's use 36 as center-to-center if gap is 18 and height is 18.
      
      let isTraversing = anim.type === 'TRAVERSE' && anim.plateIndex === idx;
      let drawY = py;
      let highlighted = false;

      if (isTraversing) {
        highlighted = true;
        if (anim.progress < 0.3) drawY -= (anim.progress / 0.3) * 22;
        else if (anim.progress < 0.7) drawY -= 22;
        else drawY -= (1 - (anim.progress - 0.7) / 0.3) * 22;
      }

      drawPlate(ctx, W/2, drawY, p.label, highlighted);
    });

    // 4. Animated Plate (PUSH/POP/OVERFLOW)
    if (anim.type === 'PUSH') {
      let t = anim.progress;
      let handX = 520, handY, plateY;
      if (t < 0.45) {
        let nt = t / 0.45;
        handY = -100 + (tubMouthY + 140) * easeInOut(nt);
        plateY = handY + 70;
      } else if (t < 0.55) {
        let nt = (t - 0.45) / 0.1;
        handY = tubMouthY + 40;
        let finalY = tubBottomY - 22 - (state.plates.length * 36);
        plateY = (finalY - 18) + 18 * easeIn(nt);
      } else {
        let nt = (t - 0.55) / 0.45;
        handY = (tubMouthY + 40) - (tubMouthY + 190) * easeOut(nt);
        plateY = -999;
      }
      // To center plate at W/2 (340) while hand is at 520, offset is -180
      if (plateY > -500) drawPlate(ctx, handX - 180, plateY, `P${state.plates.length + 1}`);
    }

    if (anim.type === 'POP') {
      let t = anim.progress;
      let handX = 480, handY, plateY;
      let startPlateY = tubBottomY - 22 - ((state.plates.length - 1) * 36);
      if (t < 0.3) {
        let nt = t / 0.3;
        handY = -150 + (startPlateY - 100 + 150) * easeOut(nt);
        plateY = -999;
      } else if (t < 0.4) {
        handY = startPlateY - 100;
        plateY = -999;
      } else {
        let nt = (t - 0.4) / 0.6;
        handY = (startPlateY - 100) - (startPlateY + 50) * easeOut(nt);
        plateY = handY + 70;
      }
      // Center plate at 340 while hand is at 480 -> offset -140
      if (plateY > -500) drawPlate(ctx, handX - 140, plateY, state.plates[state.plates.length - 1].label);
    }

    if (anim.type === 'OVERFLOW') {
        let t = anim.progress;
        let handX = 520, plateX = 340, plateY;
        if (t < 0.3) {
            let nt = t / 0.3;
            let handY = -100 + (tubMouthY + 140) * easeInOut(nt);
            plateY = handY + 70;
            drawPlate(ctx, plateX, plateY, '!');
        } else if (t < 0.4) {
            let nt = (t - 0.3) / 0.1;
            let bounce = 10 * elastic(nt);
            drawPlate(ctx, plateX, tubMouthY + 110 - bounce, '!');
        } else if (t < 0.7) {
            let nt = (t - 0.4) / 0.3;
            ctx.save();
            ctx.translate(plateX + 220 * nt, tubMouthY + 110 + 60 * nt);
            ctx.rotate((80 * nt) * Math.PI / 180);
            drawPlate(ctx, 0, 0, '!', false);
            ctx.restore();
        } else {
            let nt = (t - 0.7) / 0.3;
            drawShards(ctx, plateX + 220, tubMouthY + 170, nt);
        }
    }

    ctx.restore();

    // 5. Hand (Above Tub)
    if (anim.type === 'PUSH' || anim.type === 'POP' || anim.type === 'OVERFLOW') {
      let t = anim.progress;
      let hx = 520, hy = -999, grip = false;
      
      if (anim.type === 'PUSH') {
        if (t < 0.45) hy = -100 + (tubMouthY + 140) * easeInOut(t/0.45);
        else if (t < 0.55) hy = tubMouthY + 40;
        else hy = (tubMouthY + 40) - (tubMouthY + 190) * easeOut((t-0.55)/0.45);
      } else if (anim.type === 'POP') {
        let startPlateY = tubBottomY - 22 - ((state.plates.length - 1) * 36);
        if (t < 0.3) hy = -150 + (startPlateY - 100 + 150) * easeOut(t/0.3);
        else if (t < 0.4) { hy = startPlateY - 100; grip = true; }
        else { hy = (startPlateY - 100) - (startPlateY + 50) * easeOut((t-0.4)/0.6); grip = true; }
        hx = 480;
      } else if (anim.type === 'OVERFLOW') {
        if (t < 0.3) hy = -100 + (tubMouthY + 140) * easeInOut(t/0.3);
        else if (t < 0.4) hy = tubMouthY + 40;
        else hy = (tubMouthY + 40) - (tubMouthY + 190) * easeOut((t-0.4)/0.6);
      }

      if (hy > -200) drawHand(ctx, hx, hy, grip);
    }


    // 6. Overflow Text
    if (anim.type === 'OVERFLOW' && anim.progress > 0.6) {
        let alpha = 1 - (anim.progress - 0.6) / 0.4;
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Stack Overflow!', W/2, tubY - 20);
    }
  };

  const drawTub = (ctx, anim) => {
    // Red flash logic
    let flash = 0;
    if (anim.type === 'OVERFLOW' && anim.progress > 0.3 && anim.progress < 0.6) {
        flash = Math.sin((anim.progress - 0.3) / 0.3 * Math.PI);
    }

    // Left wall
    let lgLeft = ctx.createLinearGradient(tubX, 0, tubX+wallW, 0);
    lgLeft.addColorStop(0, lerpColor('#4a4a4a', '#ef4444', flash));
    lgLeft.addColorStop(0.3, lerpColor('#8a8a8a', '#ef4444', flash));
    lgLeft.addColorStop(0.6, lerpColor('#6a6a6a', '#ef4444', flash));
    lgLeft.addColorStop(1, lerpColor('#3a3a3a', '#ef4444', flash));
    ctx.fillStyle = lgLeft;
    ctx.beginPath();
    ctx.roundRect(tubX, tubY, wallW, tubH, [4,4,0,0]);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tubX+5, tubY+20); ctx.lineTo(tubX+5, tubY+tubH-30); ctx.stroke();
    
    // Right wall
    let lgRight = ctx.createLinearGradient(tubX+tubW-wallW, 0, tubX+tubW, 0);
    lgRight.addColorStop(0, lerpColor('#3a3a3a', '#ef4444', flash));
    lgRight.addColorStop(0.4, lerpColor('#6a6a6a', '#ef4444', flash));
    lgRight.addColorStop(0.7, lerpColor('#8a8a8a', '#ef4444', flash));
    lgRight.addColorStop(1, lerpColor('#4a4a4a', '#ef4444', flash));
    ctx.fillStyle = lgRight;
    ctx.beginPath();
    ctx.roundRect(tubX+tubW-wallW, tubY, wallW, tubH, [4,4,0,0]);
    ctx.fill();
    
    // Base
    let lgBase = ctx.createLinearGradient(0, tubY+tubH, 0, tubY+tubH+28);
    lgBase.addColorStop(0, '#555'); lgBase.addColorStop(1, '#222');
    ctx.fillStyle = lgBase;
    ctx.beginPath();
    ctx.roundRect(tubX-4, tubY+tubH-10, tubW+8, 28, 8);
    ctx.fill();
    
    // Inner cavity
    ctx.fillStyle = '#0f1018';
    ctx.fillRect(tubX+wallW, tubY, tubW-wallW*2, tubH - 10);
    
    // Inner Shadows
    let innerShadowL = ctx.createLinearGradient(tubX+wallW, 0, tubX+wallW+20, 0);
    innerShadowL.addColorStop(0, 'rgba(0,0,0,0.6)'); innerShadowL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerShadowL;
    ctx.fillRect(tubX+wallW, tubY, 20, tubH - 10);
    
    let innerShadowR = ctx.createLinearGradient(tubX+tubW-wallW-20, 0, tubX+tubW-wallW, 0);
    innerShadowR.addColorStop(0, 'rgba(0,0,0,0)'); innerShadowR.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = innerShadowR;
    ctx.fillRect(tubX+tubW-wallW-20, tubY, 20, tubH - 10);
    
    // Bolts
    [[tubX+11, tubY+30],[tubX+11, tubY+tubH-30],[tubX+tubW-11, tubY+30],[tubX+tubW-11, tubY+tubH-30]].forEach(([bx,by]) => {
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#333'; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(bx-2,by); ctx.lineTo(bx+2,by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx,by-2); ctx.lineTo(bx,by+2); ctx.stroke();
    });
  };

  const drawPlate = (ctx, cx, cy, label, highlighted = false) => {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(cx, cy+8, 88, 9, 0, 0, Math.PI*2); ctx.fill();
    
    let rimGrad = ctx.createRadialGradient(cx-20, cy-3, 10, cx, cy, 90);
    rimGrad.addColorStop(0, highlighted ? '#f0d080' : '#dedad4');
    rimGrad.addColorStop(0.7, highlighted ? '#c8a840' : '#b8b4ae');
    rimGrad.addColorStop(1, highlighted ? '#a08830' : '#8a8680');
    ctx.fillStyle = rimGrad;
    ctx.beginPath(); ctx.ellipse(cx, cy, 86, 9, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, cy-1, 82, 7, 0, Math.PI*1.1, Math.PI*1.9); ctx.stroke();
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, 68, 7, 0, 0, Math.PI*2); ctx.stroke();
    
    let wellGrad = ctx.createRadialGradient(cx-15, cy-2, 5, cx, cy, 58);
    wellGrad.addColorStop(0, highlighted ? '#f8e898' : '#eeebe6');
    wellGrad.addColorStop(1, highlighted ? '#d4a830' : '#ccc8c2');
    ctx.fillStyle = wellGrad;
    ctx.beginPath(); ctx.ellipse(cx, cy, 64, 6.5, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.ellipse(cx-18, cy-2, 14, 2.5, -0.3, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = highlighted ? '#7a5500' : '#666260';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  };

  const drawHand = (ctx, handX, handY, gripping = false) => {
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(0.43); // 25 degrees
    
    // Wrist/forearm (comes from upper right)
    let forearmGrad = ctx.createLinearGradient(-15, -120, 15, 0);
    forearmGrad.addColorStop(0, '#c49070');
    forearmGrad.addColorStop(0.5, '#e8b48a');
    forearmGrad.addColorStop(1, '#d4a070');
    ctx.fillStyle = forearmGrad;
    ctx.beginPath();
    ctx.roundRect(-18, -180, 36, 140, 10);
    ctx.fill();
    
    // Palm base
    let palmGrad = ctx.createRadialGradient(0, 10, 5, 0, 0, 50);
    palmGrad.addColorStop(0, '#efc090');
    palmGrad.addColorStop(1, '#c88a60');
    ctx.fillStyle = palmGrad;
    ctx.beginPath();
    ctx.roundRect(-32, -40, 64, 60, [6,6,12,12]);
    ctx.fill();
    
    // Knuckle ridge
    ctx.strokeStyle = 'rgba(160,100,60,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-28, -35); ctx.quadraticCurveTo(0, -42, 28, -35); ctx.stroke();
    
    // 4 Fingers
    const fingers = [
      {x:-22, w:11, len: gripping ? 48 : 42, rot: gripping ? 0.15 : 0.05},
      {x:-8,  w:13, len: gripping ? 52 : 46, rot: gripping ? 0.05 : -0.02},
      {x: 7,  w:13, len: gripping ? 50 : 44, rot: gripping ? -0.05 : -0.05},
      {x: 21, w:10, len: gripping ? 44 : 38, rot: gripping ? -0.18 : -0.12},
    ];
    fingers.forEach(f => {
      ctx.save();
      ctx.translate(f.x, -38);
      ctx.rotate(f.rot);
      let fg = ctx.createLinearGradient(-f.w/2, 0, f.w/2, 0);
      fg.addColorStop(0, '#c88060'); fg.addColorStop(0.4, '#efc090'); fg.addColorStop(1, '#c88060');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.roundRect(-f.w/2, -f.len, f.w, f.len, [f.w/2, f.w/2, 3, 3]); ctx.fill();
      // Knuckle lines
      ctx.strokeStyle='rgba(150,90,50,0.35)'; ctx.lineWidth=0.8;
      [0.33,0.6].forEach(t => {
        ctx.beginPath();
        ctx.moveTo(-f.w/2+2, -f.len*t); ctx.lineTo(f.w/2-2, -f.len*t); ctx.stroke();
      });
      // Nail
      ctx.fillStyle='#d4956a';
      ctx.beginPath(); ctx.roundRect(-f.w/2+1.5, -f.len+1, f.w-3, f.len*0.28, [f.w/2-1]);ctx.fill();
      ctx.restore();
    });
    
    // Thumb (left side)
    ctx.save();
    ctx.translate(-34, -10);
    ctx.rotate(-1.1);
    let tg = ctx.createLinearGradient(-7,0,7,0);
    tg.addColorStop(0,'#c88060'); tg.addColorStop(0.5,'#efb080'); tg.addColorStop(1,'#c88060');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.roundRect(-7, -32, 14, 34, [7,7,3,3]); ctx.fill();
    ctx.fillStyle='#d4956a';
    ctx.beginPath(); ctx.roundRect(-5.5, -31, 11, 10, 5); ctx.fill();
    ctx.restore();
    
    ctx.restore();
  };


  const drawShards = (ctx, cx, cy, t) => {
    const shards = [
      {pts:[0,0, -20,-8, -12,-28], dx:-90, dy:-50, dr:-140},
      {pts:[0,0,  18,-6,  14,-30], dx:70,  dy:-80, dr:110},
      {pts:[0,0,  22, 10, 8,  26], dx:100, dy:40,  dr:-80},
      {pts:[0,0, -8,  18, -26,12], dx:-70, dy:60,  dr:160},
      {pts:[0,0,  10, 22, -10,24], dx:20,  dy:90,  dr:-200},
      {pts:[0,0, -24, 4,  -18,20], dx:-50, dy:30,  dr:90},
    ];
    shards.forEach(s => {
      ctx.save();
      ctx.translate(cx + s.dx * t, cy + s.dy * t);
      ctx.rotate(s.dr * t * Math.PI / 180);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#dedad4';
      ctx.beginPath();
      ctx.moveTo(s.pts[0], s.pts[1]);
      for (let i = 2; i < s.pts.length; i += 2) ctx.lineTo(s.pts[i], s.pts[i+1]);
      ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  };

  const lerpColor = (a, b, t) => {
    const ah = parseInt(a.replace(/#/g, ''), 16),
          bh = parseInt(b.replace(/#/g, ''), 16),
          ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
          br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
          rr = ar + t * (br - ar),
          rg = ag + t * (bg - ag),
          rb = ab + t * (bb - ab);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
  };

  return (
    <div className="canvas-plate-stack">
      <style>{`
        .canvas-plate-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #0c0e1a;
          padding: 2rem;
          min-height: 750px;
        }
        .btn-bar {
          display: flex;
          gap: 10px;
          padding: 12px 20px;
          background: #0f1120;
          border-radius: 40px;
          border: 1px solid #1e2140;
          margin-bottom: 20px;
        }
        .btn-bar button {
          border-radius: 24px;
          padding: 10px 18px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-ap {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #fff;
          border: none;
          box-shadow: 0 0 18px rgba(124, 58, 237, 0.45);
          padding: 10px 22px !important;
          font-weight: 600 !important;
        }
        .btn-std {
          background: #1a1c2e;
          color: #ccc;
          border: 1px solid #2a2d45;
        }
        .btn-bar button:hover:not(:disabled) {
          filter: brightness(1.15);
        }
        .btn-bar button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .capacity-pill {
          margin-top: 20px;
          background: #161828;
          border: 1px solid #2a2d45;
          border-radius: 20px;
          padding: 6px 20px;
          color: #aaa;
          font-size: 13px;
          transition: all 0.3s;
        }
        .pill-full {
          border-color: #ef4444;
          color: #ef4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        canvas {
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          border-radius: 12px;
          background: #0c0e1a;
        }
      `}</style>

      <div className="btn-bar">
        <button className="btn-ap" onClick={autoPlay} disabled={isExecuting}>Auto Play</button>
        <button className="btn-std" onClick={push} disabled={isExecuting}>+ Add Plate (Push)</button>
        <button className="btn-std" onClick={pop} disabled={isExecuting}>- Remove Top (Pop)</button>
        <button className="btn-std" onClick={traverse} disabled={isExecuting}>Check All (Traverse)</button>
        <button className="btn-std" onClick={() => setPlates([])} disabled={isExecuting}>Reset</button>
      </div>

      <canvas ref={canvasRef} width={W} height={H} />

      <div className={`capacity-pill ${plates.length === MAX ? 'pill-full' : ''}`}>
        Capacity: {plates.length} / {MAX}
      </div>
    </div>
  );
};

export default PlateStack;
