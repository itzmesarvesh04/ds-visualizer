// Graph Visualization Logic - Upgraded
class GraphNode {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.neighbors = [];
    }
}

let nodes = new Map();
let edges = [];
let nextNodeId = 65; 
let isDirected = false;

// Engine State
let currentSteps = [];
let stepIndex = 0;
let isExecuting = false;
let isPaused = false;
let resolveNextStep = null;
let waitForNext = false;

// DOM Elements
const graphSvg = document.getElementById('graph-svg');
const statusLog = document.getElementById('status-log');
const codePanel = document.getElementById('code-panel');
const speedSlider = document.getElementById('graph-speed');
const statsBadge = document.getElementById('graph-stats');
const outputSeq = document.getElementById('output-sequence');

// Form Elements
const inputVertexName = document.getElementById('vertex-name');
const selectSource = document.getElementById('edge-source');
const selectTarget = document.getElementById('edge-target');
const selectTraversalType = document.getElementById('traversal-type');
const selectTraversalStart = document.getElementById('traversal-start');

// Buttons
const btnAddVertex = document.getElementById('btn-add-vertex');
const btnAddEdge = document.getElementById('btn-add-edge');
const btnStartTraversal = document.getElementById('btn-start-traversal');
const btnPlay = document.querySelector('.play-btn');
const btnPause = document.querySelector('.pause-btn');
const btnNext = document.querySelector('.next-btn');

// Utility
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getDelay = () => {
    const speed = parseInt(speedSlider?.value || 3);
    const delays = {1: 1500, 2: 1100, 3: 800, 4: 500, 5: 250};
    return delays[speed] || 800;
};

function logAction(msg, type = 'info') {
    const p = document.createElement('p');
    p.className = `log-entry ${type} animate-enter`;
    p.textContent = msg;
    statusLog.appendChild(p);
    statusLog.scrollTop = statusLog.scrollHeight;
}

function showErrorToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<div class="toast-icon">!</div> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.classList.add('fade-out'); 
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}

function updateCode(lines) {
    if (!codePanel) return;
    codePanel.innerHTML = lines.map((line, i) => {
        if (!line) return '<span class="code-line"></span>';
        const active = i === 0 ? 'active' : '';
        return `<span class="code-line ${active}">${line}</span>`;
    }).join('\n');
}

// ---- TABS ---- //
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// ---- DROPDOWNS ---- //
function refreshDropdowns() {
    const options = Array.from(nodes.keys()).map(id => `<option value="${id}">${id}</option>`).join('');
    selectSource.innerHTML = options;
    selectTarget.innerHTML = options;
    selectTraversalStart.innerHTML = options;
}

// ---- OPERATIONS ---- //

btnAddVertex.addEventListener('click', () => {
    const name = inputVertexName.value.trim();
    if (!name) { showErrorToast("Please enter a vertex name."); return; }
    if (nodes.has(name)) { showErrorToast("Vertex already exists."); return; }
    
    // Spawn at randomish center if click not used
    const x = 100 + Math.random() * (graphSvg.clientWidth - 200);
    const y = 100 + Math.random() * (graphSvg.clientHeight - 200);
    
    nodes.set(name, new GraphNode(name, x, y));
    inputVertexName.value = '';
    refreshDropdowns();
    renderGraph();
    logAction(`Vertex "${name}" added to graph.`, 'success');
});

btnAddEdge.addEventListener('click', () => {
    const from = selectSource.value;
    const to = selectTarget.value;
    
    if (!from || !to) { showErrorToast("Select both vertices."); return; }
    if (from === to) { showErrorToast("Self-loops not recommended."); return; }
    
    const exists = edges.some(e => (e.from === from && e.to === to) || (!isDirected && e.from === to && e.to === from));
    if (exists) { showErrorToast("Edge already exists."); return; }
    
    edges.push({ from, to });
    nodes.get(from).neighbors.push(to);
    if (!isDirected) nodes.get(to).neighbors.push(from);
    
    renderGraph();
    logAction(`Connected ${from} to ${to}.`, 'success');
});

function deleteVertex(id) {
    nodes.delete(id);
    edges = edges.filter(e => e.from !== id && e.to !== id);
    nodes.forEach(node => {
        node.neighbors = node.neighbors.filter(n => n !== id);
    });
    refreshDropdowns();
    renderGraph();
    logAction(`Vertex ${id} removed.`, 'info');
}

function deleteEdge(from, to) {
    edges = edges.filter(e => !(e.from === from && e.to === to));
    nodes.get(from).neighbors = nodes.get(from).neighbors.filter(n => n !== to);
    if (!isDirected) {
        nodes.get(to).neighbors = nodes.get(to).neighbors.filter(n => n !== from);
    }
    renderGraph();
    logAction(`Edge ${from}-${to} removed.`, 'info');
}

// ---- RENDERING ---- //

function renderGraph() {
    graphSvg.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" class="edge-arrow" />
            </marker>
        </defs>
    `;

    // Render Edges
    edges.forEach(edge => {
        const fromNode = nodes.get(edge.from);
        const toNode = nodes.get(edge.to);
        if (!fromNode || !toNode) return;
        
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", fromNode.x);
        line.setAttribute("y1", fromNode.y);
        line.setAttribute("x2", toNode.x);
        line.setAttribute("y2", toNode.y);
        line.setAttribute("class", "graph-edge");
        line.setAttribute("id", `edge-${edge.from}-${edge.to}`);
        if (isDirected) line.setAttribute("marker-end", "url(#arrowhead)");
        
        // Edge Delete Button
        const mx = (fromNode.x + toNode.x) / 2;
        const my = (fromNode.y + toNode.y) / 2;
        
        const delBtn = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        delBtn.setAttribute("cx", mx);
        delBtn.setAttribute("cy", my);
        delBtn.setAttribute("r", "8");
        delBtn.setAttribute("class", "delete-btn");
        delBtn.onclick = () => deleteEdge(edge.from, edge.to);
        
        const delX = document.createElementNS("http://www.w3.org/2000/svg", "text");
        delX.setAttribute("x", mx);
        delX.setAttribute("y", my);
        delX.setAttribute("class", "delete-text");
        delX.textContent = "×";
        
        g.appendChild(line);
        g.appendChild(delBtn);
        g.appendChild(delX);
        graphSvg.appendChild(g);
    });

    // Render Nodes
    nodes.forEach(node => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "graph-node");
        g.setAttribute("id", `node-group-${node.id}`);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", node.x);
        circle.setAttribute("cy", node.y);
        circle.setAttribute("r", "22");
        circle.setAttribute("class", "node-circle");
        circle.setAttribute("id", `node-${node.id}`);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", node.x);
        text.setAttribute("y", node.y);
        text.setAttribute("class", "node-text");
        text.textContent = node.id;
        
        // Node Delete Button
        const delBtn = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        delBtn.setAttribute("cx", node.x + 18);
        delBtn.setAttribute("cy", node.y - 18);
        delBtn.setAttribute("r", "8");
        delBtn.setAttribute("class", "delete-btn");
        delBtn.onclick = (e) => { e.stopPropagation(); deleteVertex(node.id); };
        
        const delX = document.createElementNS("http://www.w3.org/2000/svg", "text");
        delX.setAttribute("x", node.x + 18);
        delX.setAttribute("y", node.y - 18);
        delX.setAttribute("class", "delete-text");
        delX.textContent = "×";

        g.appendChild(circle);
        g.appendChild(text);
        g.appendChild(delBtn);
        g.appendChild(delX);
        graphSvg.appendChild(g);
    });

    statsBadge.textContent = `Nodes: ${nodes.size} | Edges: ${edges.length}`;
}

// ---- ENGINE ---- //

async function runEngine() {
    if (isExecuting) return;
    isExecuting = true;
    while (stepIndex < currentSteps.length) {
        if (isPaused && !waitForNext) {
            await new Promise(r => resolveNextStep = r);
        }
        waitForNext = false;
        
        const stepFn = currentSteps[stepIndex];
        await stepFn();
        stepIndex++;
        
        if (!isPaused && stepIndex < currentSteps.length) await sleep(getDelay());
    }
    isExecuting = false;
    stepIndex = 0;
    currentSteps = [];
}

btnPlay?.addEventListener('click', () => {
    isPaused = false;
    if (resolveNextStep) { resolveNextStep(); resolveNextStep = null; }
});
btnPause?.addEventListener('click', () => isPaused = true);
btnNext?.addEventListener('click', () => {
    isPaused = true;
    waitForNext = true;
    if (resolveNextStep) { resolveNextStep(); resolveNextStep = null; }
});

// ---- ALGORITHMS ---- //

function resetStates() {
    nodes.forEach(n => {
        const el = document.getElementById(`node-group-${n.id}`);
        if (el) el.classList.remove('node-visited', 'node-current', 'node-queued');
    });
    edges.forEach(e => {
        const el = document.getElementById(`edge-${e.from}-${e.to}`);
        if (el) el.classList.remove('edge-traversed');
        // Check undirected rev
        const revEl = document.getElementById(`edge-${e.to}-${e.from}`);
        if (revEl) revEl.classList.remove('edge-traversed');
    });
    outputSeq.innerHTML = '';
}

function updateOutput(id) {
    if (outputSeq.innerHTML.includes('Result will appear')) outputSeq.innerHTML = '';
    
    if (outputSeq.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'output-arrow';
        arrow.textContent = '→';
        outputSeq.appendChild(arrow);
    }
    
    const span = document.createElement('span');
    span.className = 'output-node';
    span.textContent = id;
    outputSeq.appendChild(span);
}

btnStartTraversal.addEventListener('click', () => {
    const type = selectTraversalType.value;
    const start = selectTraversalStart.value;
    
    if (!start) { showErrorToast("Select a starting vertex."); return; }
    
    if (type === 'bfs') bfs(start);
    else dfs(start);
});

function bfs(startNodeId) {
    if (isExecuting) return;
    resetStates();
    currentSteps = [];
    
    const queue = [startNodeId];
    const visited = new Set([startNodeId]);
    
    currentSteps.push(async () => {
        logAction(`Starting BFS from node ${startNodeId}`, 'info');
        updateCode([`let queue = [${startNodeId}];`, `let visited = {${startNodeId}};`]);
        document.getElementById(`node-group-${startNodeId}`).classList.add('node-queued');
    });

    while (queue.length > 0) {
        const u = queue.shift();
        
        currentSteps.push(async () => {
            logAction(`Visiting node ${u}`, 'info');
            const el = document.getElementById(`node-group-${u}`);
            el.classList.remove('node-queued');
            el.classList.add('node-current');
            updateOutput(u);
        });

        const neighbors = nodes.get(u).neighbors;
        for (const v of neighbors) {
            if (!visited.has(v)) {
                visited.add(v);
                queue.push(v);
                
                const from = u, to = v;
                currentSteps.push(async () => {
                    logAction(`Discovered neighbor ${to} from ${from}`, 'success');
                    const edgeEl = document.getElementById(`edge-${from}-${to}`) || document.getElementById(`edge-${to}-${from}`);
                    if (edgeEl) edgeEl.classList.add('edge-traversed');
                    document.getElementById(`node-group-${to}`).classList.add('node-queued');
                });
            }
        }

        currentSteps.push(async () => {
            document.getElementById(`node-group-${u}`).classList.replace('node-current', 'node-visited');
        });
    }

    currentSteps.push(async () => logAction("BFS traversal completed", "success"));
    runEngine();
}

function dfs(startNodeId) {
    if (isExecuting) return;
    resetStates();
    currentSteps = [];
    
    const visited = new Set();
    
    currentSteps.push(async () => {
        logAction(`Starting DFS from node ${startNodeId}`, 'info');
    });

    function dfsRecursive(u, p = null) {
        visited.add(u);
        
        currentSteps.push(async () => {
            logAction(`Visiting node ${u}`, 'info');
            if (p) {
                const edgeEl = document.getElementById(`edge-${p}-${u}`) || document.getElementById(`edge-${u}-${p}`);
                if (edgeEl) edgeEl.classList.add('edge-traversed');
            }
            document.getElementById(`node-group-${u}`).classList.add('node-current');
            updateOutput(u);
        });

        const neighbors = nodes.get(u).neighbors;
        for (const v of neighbors) {
            if (!visited.has(v)) {
                dfsRecursive(v, u);
            }
        }

        currentSteps.push(async () => {
            logAction(`Backtracking from ${u}`, 'info');
            document.getElementById(`node-group-${u}`).classList.replace('node-current', 'node-visited');
        });
    }

    dfsRecursive(startNodeId);
    currentSteps.push(async () => logAction("DFS traversal completed", "success"));
    runEngine();
}

// Initialization
renderGraph();
logAction("Graph Visualizer Upgraded. Use the Operations panel to build your graph.");
