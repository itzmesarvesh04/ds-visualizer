import React, { useState } from 'react';

const MiddleNode = () => {
    // Data from your uploaded images
    const examples = {
        odd: [1, 2, 3, 4, 5],        // Image 1
        even: [10, 20, 30, 40, 50, 60] // Image 2
    };

    const [currentMode, setCurrentMode] = useState('even');
    const [list, setList] = useState(examples.even);
    const [ptr, setPtr] = useState(-1);
    const [phase, setPhase] = useState("IDLE");
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(null);

    const switchExample = (mode) => {
        setCurrentMode(mode);
        setList(examples[mode]);
        setPhase("IDLE");
        setPtr(-1);
        setCount(0);
        setTarget(null);
    };

    const runVisualizer = async () => {
        setCount(0);
        setTarget(null);

        // PASS 1: getLength()
        setPhase("COUNTING");
        for (let i = 0; i < list.length; i++) {
            setPtr(i);
            setCount(prev => prev + 1);
            await new Promise(r => setTimeout(r, 500));
        }
        setPtr(-1);

        // CALCULATION
        setPhase("CALCULATING");
        const mid = Math.floor(list.length / 2);
        setTarget(mid);
        await new Promise(r => setTimeout(r, 1200));

        // PASS 2: Traverse to Middle
        setPhase("FINDING");
        for (let i = 0; i <= mid; i++) {
            setPtr(i);
            await new Promise(r => setTimeout(r, 700));
        }
        setPhase("DONE");
    };

    return (
        <div style={styles.container}>
            <div style={styles.glassPanel}>
                <h2 style={styles.title}>Linked List: Find Middle Node</h2>
                
                {/* Example Selector */}
                <div style={styles.selector}>
                    <button 
                        onClick={() => switchExample('odd')} 
                        style={{...styles.tab, borderBottom: currentMode === 'odd' ? '2px solid #00d4ff' : 'none'}}
                    >
                        Example 1 (Odd: 5 Nodes)
                    </button>
                    <button 
                        onClick={() => switchExample('even')} 
                        style={{...styles.tab, borderBottom: currentMode === 'even' ? '2px solid #00d4ff' : 'none'}}
                    >
                        Example 2 (Even: 6 Nodes)
                    </button>
                </div>

                <div style={styles.statusBoard}>
                    {phase === "IDLE" && <p>Using {currentMode} length list. Press start.</p>}
                    {phase === "COUNTING" && <p>Pass 1: Counting... <strong>Length = {count}</strong></p>}
                    {phase === "CALCULATING" && <p>Math: {list.length} / 2 = <strong>Index {target}</strong></p>}
                    {phase === "FINDING" && <p>Pass 2: Moving to Index {target}...</p>}
                    {phase === "DONE" && <p>Middle found: <span style={styles.success}>{list[target]}</span></p>}
                </div>

                <div style={styles.listArea}>
                    {list.map((val, idx) => (
                        <div key={idx} style={styles.nodeWrapper}>
                            <div style={{
                                ...styles.node,
                                border: ptr === idx ? '2px solid #00d4ff' : '1px solid rgba(255,255,255,0.2)',
                                background: (phase === "DONE" && idx === target) ? 'rgba(0, 255, 170, 0.2)' : 'rgba(255,255,255,0.05)',
                                boxShadow: ptr === idx ? '0 0 15px rgba(0,212,255,0.4)' : 'none'
                            }}>
                                {val}
                                {ptr === idx && <div style={styles.ptrLabel}>ptr</div>}
                            </div>
                        </div>
                    ))}
                    <div style={styles.nullNode}>NULL</div>
                </div>

                <button onClick={runVisualizer} style={styles.button} disabled={phase !== "IDLE" && phase !== "DONE"}>
                    Run Two-Pass Logic
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: 'calc(100vh - 200px)',
        paddingTop: '96px',
        color: '#fff'
    },
    glassPanel: { 
        background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(15px)', 
        padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: '90%' 
    },
    title: { marginBottom: '20px', fontSize: '24px' },
    selector: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' },
    tab: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '14px' },
    statusBoard: { background: 'rgba(0,0,0,0.2)', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', marginBottom: '30px' },
    listArea: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '5px' },
    nodeWrapper: { display: 'flex', alignItems: 'center' },
    node: { width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px', position: 'relative', transition: '0.3s' },
    ptrLabel: { position: 'absolute', top: '-25px', background: '#00d4ff', color: '#000', fontSize: '9px', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold' },
    arrow: { margin: '0 8px', color: 'rgba(255,255,255,0.2)' },
    nullNode: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '10px' },
    button: { background: '#00d4ff', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    success: { color: '#00ffaa', fontWeight: 'bold' }
};

export default MiddleNode;