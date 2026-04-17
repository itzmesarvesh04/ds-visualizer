class TreeNode {
    constructor(value, id) {
        this.value = value;
        this.id = id;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
}

let root = null;
let nodeCount = 0;
let sizeCounter = 0;
const MAX_NODES = 15;

// Engine State
let currentSteps = [];
let stepIndex = 0;
let isExecuting = false;
let isPaused = false;
let resolveNextStep = null;
let waitForNext = false;

// DOM Elements
const inputEl = document.getElementById('tree-input');
const btnInsert = document.getElementById('btn-insert');
const btnSearch = document.getElementById('btn-search');
const btnDelete = document.getElementById('btn-delete');
const btnInorder = document.getElementById('btn-inorder');
const btnPreorder = document.getElementById('btn-preorder');
const btnPostorder = document.getElementById('btn-postorder');
const btnReset = document.getElementById('btn-reset');

const btnPlay = document.querySelector('.play-btn');
const btnPause = document.querySelector('.pause-btn');
const btnNext = document.querySelector('.next-btn');

const treeSvg = document.getElementById('tree-svg');
const statusLog = document.getElementById('status-log');
const codePanel = document.getElementById('code-panel');
const speedSlider = document.getElementById('tree-speed');
const sizeBadge = document.getElementById('tree-size-badge');

// Utility
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function getDelay() {
    const speed = parseInt(speedSlider.value);
    const delays = {1: 1500, 2: 1100, 3: 800, 4: 500, 5: 250};
    return delays[speed] || 800;
}
function logAction(msg, type = 'info') {
    const p = document.createElement('p');
    p.className = `log-entry ${type} animate-enter`;
    p.textContent = msg;
    statusLog.appendChild(p);
    statusLog.scrollTop = statusLog.scrollHeight;
}
function showErrorToast(errorMessage) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    logAction(errorMessage, "error");
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<div class="toast-icon">!</div> <span>${errorMessage}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }, 3500);
}
function updateCode(lines) {
    codePanel.innerHTML = lines.map((line, i) => {
        if (!line) return '<span class="code-line"></span>';
        if (i === 0) return `<span class="code-line active">${line}</span>`;
        return `<span class="code-line">${line}</span>`;
    }).join('\n');
}

// ---- SVG RENDERING ---- //

function calculateCoordinates(node, x, y, dx) {
    if (!node) return;
    node.x = x;
    node.y = y;
    // Map left branches organically narrowing scale to strictly prevent arbitrary depth layout collisions 
    calculateCoordinates(node.left, x - dx, y + 80, dx * 0.55);
    calculateCoordinates(node.right, x + dx, y + 80, dx * 0.55);
}

function drawEdges(node, svg) {
    if (!node) return;
    if (node.left) {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", node.x); line.setAttribute("y1", node.y);
        line.setAttribute("x2", node.left.x); line.setAttribute("y2", node.left.y);
        line.setAttribute("class", "tree-edge");
        line.setAttribute("id", `edge-${node.id}-${node.left.id}`);
        svg.appendChild(line);
        drawEdges(node.left, svg);
    }
    if (node.right) {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", node.x); line.setAttribute("y1", node.y);
        line.setAttribute("x2", node.right.x); line.setAttribute("y2", node.right.y);
        line.setAttribute("class", "tree-edge");
        line.setAttribute("id", `edge-${node.id}-${node.right.id}`);
        svg.appendChild(line);
        drawEdges(node.right, svg);
    }
}

function drawNodes(node, svg) {
    if (!node) return;
    
    let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "tree-node-group");
    g.setAttribute("id", `node-${node.id}`);
    g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "22");
    circle.setAttribute("class", "tree-node-circle");
    
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "tree-node-text");
    text.textContent = node.value;
    
    g.appendChild(circle);
    g.appendChild(text);
    svg.appendChild(g);
    
    drawNodes(node.left, svg);
    drawNodes(node.right, svg);
}

function drawTree() {
    treeSvg.innerHTML = ''; 
    if (!root) return;
    
    const wrapper = document.getElementById('tree-wrapper');
    const width = wrapper.clientWidth || 800;
    
    calculateCoordinates(root, width / 2, 40, width / 4);
    
    drawEdges(root, treeSvg);
    drawNodes(root, treeSvg);
    
    sizeBadge.textContent = `Nodes: ${sizeCounter} / ${MAX_NODES}`;
}

// ---- ENGINE LOOP ---- //

async function runEngine() {
    if (isExecuting) return;
    isExecuting = true;
    while (stepIndex < currentSteps.length) {
        if (isPaused && !waitForNext) { await new Promise(r => { resolveNextStep = r; }); }
        waitForNext = false;
        
        const stepFn = currentSteps[stepIndex];
        await stepFn(); 
        stepIndex++;
        
        if (!isPaused && stepIndex < currentSteps.length) await sleep(getDelay());
    }
    currentSteps = []; stepIndex = 0; isExecuting = false;
}

btnPlay.addEventListener('click', () => { isPaused = false; if (resolveNextStep) { resolveNextStep(); resolveNextStep = null; } });
btnPause.addEventListener('click', () => { isPaused = true; });
btnNext.addEventListener('click', () => { isPaused = true; waitForNext = true; if (resolveNextStep) { resolveNextStep(); resolveNextStep = null; } });

// ---- BINARY SEARCH TREE (BST) LOGIC ---- //

function insertNode() {
    if (isExecuting) return;
    let val = parseInt(inputEl.value.trim());
    if (isNaN(val)) { showErrorToast("Please enter a valid numeric value."); return; }
    
    if (sizeCounter >= MAX_NODES) {
        showErrorToast(`Visualizer limit reached (${MAX_NODES} nodes)!`);
        return;
    }
    
    inputEl.value = '';
    currentSteps = [];

    const newNodeId = ++nodeCount;
    const newNode = new TreeNode(val, newNodeId);

    if (!root) {
        currentSteps.push(async () => {
             logAction(`Inserting root node: ${val}`, "success");
             updateCode([`root = new Node(${val});`]);
             root = newNode;
             sizeCounter++;
             drawTree();
             const domNode = document.getElementById(`node-${newNode.id}`);
             if (domNode) domNode.classList.add('tree-node-insert');
             await sleep(getDelay() * 1.5);
             if (domNode) domNode.classList.remove('tree-node-insert');
        });
        runEngine();
        return;
    }

    // Traverse to locate position
    let curr = root;
    let parent = null;
    let isLeft = false;
    
    currentSteps.push(async () => {
        logAction(`Starting BST search to insert '${val}'`, "info");
        updateCode([`let current = root;`, `while (current != null) { ... }`]);
    });

    // We emulate physical traversal logic while buffering logical steps
    while (curr !== null) {
        let loopNode = curr;
        currentSteps.push(async () => {
            logAction(`Comparing ${val} with Node [${loopNode.value}]`, "info");
            const domNode = document.getElementById(`node-${loopNode.id}`);
            if (domNode) domNode.classList.add('tree-node-highlight');
            updateCode([
                `if (value < current.value) current = current.left;`,
                `else current = current.right;`
            ]);
            await sleep(getDelay() * 1.2);
            if (domNode) domNode.classList.remove('tree-node-highlight');
        });
        
        parent = curr;
        if (val < curr.value) {
            curr = curr.left;
            isLeft = true;
            currentSteps.push(async () => {
                logAction(`Value ${val} is smaller \u2192 go left`, "success");
            });
            if (curr) {
                const nextNode = curr; // Block-scoped capture for closure
                currentSteps.push(async () => {
                    const edgeDOM = document.getElementById(`edge-${loopNode.id}-${nextNode.id}`);
                    if (edgeDOM) edgeDOM.classList.add('tree-edge-highlight');
                    await sleep(getDelay() * 1.2);
                    if (edgeDOM) edgeDOM.classList.remove('tree-edge-highlight');
                });
            }
        } else if (val > curr.value) {
            curr = curr.right;
            isLeft = false;
            currentSteps.push(async () => {
                logAction(`Value ${val} is greater \u2192 go right`, "success");
            });
            if (curr) {
                const nextNode = curr; // Block-scoped capture for closure
                currentSteps.push(async () => {
                    const edgeDOM = document.getElementById(`edge-${loopNode.id}-${nextNode.id}`);
                    if (edgeDOM) edgeDOM.classList.add('tree-edge-highlight');
                    await sleep(getDelay() * 1.2);
                    if (edgeDOM) edgeDOM.classList.remove('tree-edge-highlight');
                });
            }
        } else {
             currentSteps.push(async () => {
                 showErrorToast(`BST inherently prevents duplicate values (${val} already exists).`);
             });
             runEngine();
             return;
        }
    }

    currentSteps.push(async () => {
        let parentObj = parent; 
        logAction(`Found empty leaf spot. Attaching ${val} as ${isLeft ? 'LEFT' : 'RIGHT'} child of ${parentObj.value}`, "success");
        updateCode([
            `let newNode = new Node(${val});`,
            `if (val < parent.val) parent.left = newNode;`,
            `else parent.right = newNode;`
        ]);
        
        if (isLeft) parentObj.left = newNode;
        else parentObj.right = newNode;
        sizeCounter++;
        
        drawTree(); 
        
        const domNode = document.getElementById(`node-${newNode.id}`);
        const domEdge = document.getElementById(`edge-${parentObj.id}-${newNode.id}`);
        
        if (domNode) domNode.classList.add('tree-node-insert');
        if (domEdge) domEdge.classList.add('tree-edge-highlight');
        
        await sleep(getDelay() * 2);
        
        if (domNode) domNode.classList.remove('tree-node-insert');
        if (domEdge) domEdge.classList.remove('tree-edge-highlight');
    });

    runEngine();
}

// ---- BST SEARCH LOGIC ---- //

function searchNode() {
    if (isExecuting) return;
    let val = parseInt(inputEl.value.trim());
    if (isNaN(val)) { showErrorToast("Please enter a numeric value to search."); return; }
    
    inputEl.value = '';
    currentSteps = [];

    if (!root) {
        showErrorToast("Tree is empty!");
        return;
    }

    let curr = root;
    let found = false;
    
    currentSteps.push(async () => {
        logAction(`Searching for value '${val}'...`, "info");
        updateCode([`let current = root;`, `while (current != null) { ... }`]);
    });

    while (curr !== null) {
        let loopNode = curr;
        currentSteps.push(async () => {
            logAction(`Checking Node [${loopNode.value}]`, "info");
            const domNode = document.getElementById(`node-${loopNode.id}`);
            if (domNode) domNode.classList.add('tree-node-highlight');
            updateCode([
                `if (val === current.value) return current;`,
                `if (val < current.value) current = current.left;`,
                `else current = current.right;`
            ]);
            await sleep(getDelay() * 1.5);
            if (domNode) domNode.classList.remove('tree-node-highlight');
        });

        if (val === curr.value) {
            found = true;
            currentSteps.push(async () => {
                logAction(`Value ${val} FOUND in the tree!`, "success");
                const domNode = document.getElementById(`node-${loopNode.id}`);
                if (domNode) domNode.classList.add('traverse-scale');
                await sleep(getDelay() * 2);
                if (domNode) domNode.classList.remove('traverse-scale');
            });
            break;
        } else if (val < curr.value) {
            curr = curr.left;
            currentSteps.push(async () => logAction(`${val} < ${loopNode.value} \u2192 Going LEFT`, "info"));
        } else {
            curr = curr.right;
            currentSteps.push(async () => logAction(`${val} > ${loopNode.value} \u2192 Going RIGHT`, "info"));
        }

        if (curr) {
            const nextNode = curr;
            currentSteps.push(async () => {
                const edgeDOM = document.getElementById(`edge-${loopNode.id}-${nextNode.id}`);
                if (edgeDOM) edgeDOM.classList.add('tree-edge-highlight');
                await sleep(getDelay() * 1);
                if (edgeDOM) edgeDOM.classList.remove('tree-edge-highlight');
            });
        }
    }

    if (!found) {
        currentSteps.push(async () => {
            logAction(`Value ${val} NOT FOUND in the tree.`, "error");
            showErrorToast(`${val} does not exist in the BST.`);
        });
    }

    runEngine();
}

// ---- BST DELETE LOGIC ---- //

function deleteNode() {
    if (isExecuting) return;
    let val = parseInt(inputEl.value.trim());
    if (isNaN(val)) { showErrorToast("Please enter a numeric value to delete."); return; }
    
    inputEl.value = '';
    currentSteps = [];

    if (!root) {
        showErrorToast("Tree is empty!");
        return;
    }

    performDeletion(val);
}

async function performDeletion(val) {
    let parent = null;
    let curr = root;
    let found = false;

    currentSteps.push(async () => {
        logAction(`Initiating deletion for '${val}'`, "info");
        updateCode([`root = deleteRecursive(root, ${val});`]);
    });

    // 1. Search for node
    while (curr !== null) {
        let loopNode = curr;
        currentSteps.push(async () => {
            logAction(`Locating ${val}: Checking Node [${loopNode.value}]`, "info");
            const domNode = document.getElementById(`node-${loopNode.id}`);
            if (domNode) domNode.classList.add('tree-node-highlight');
            await sleep(getDelay() * 1);
            if (domNode) domNode.classList.remove('tree-node-highlight');
        });

        if (val === curr.value) {
            found = true;
            break;
        }
        parent = curr;
        if (val < curr.value) {
            curr = curr.left;
            currentSteps.push(async () => logAction(`${val} < ${loopNode.value} \u2192 Left`, "info"));
        } else {
            curr = curr.right;
            currentSteps.push(async () => logAction(`${val} > ${loopNode.value} \u2192 Right`, "info"));
        }
    }

    if (!found) {
        currentSteps.push(async () => {
            logAction(`Value ${val} not found. Deletion aborted.`, "error");
            showErrorToast(`${val} is not in the tree.`);
        });
        runEngine();
        return;
    }

    const targetNode = curr;
    const targetParent = parent;

    currentSteps.push(async () => {
        logAction(`Node [${targetNode.value}] found. Determining deletion case...`, "info");
        const domNode = document.getElementById(`node-${targetNode.id}`);
        if (domNode) domNode.classList.add('traverse-scale');
        await sleep(getDelay() * 1.5);
    });

    if (curr.left === null || curr.right === null) {
        let replacement = curr.left ? curr.left : curr.right;

        currentSteps.push(async () => {
            if (!replacement) {
                logAction(`Case 1: [${targetNode.value}] is a leaf node. Removing...`, "success");
                updateCode([`if (!node.left && !node.right) return null;`]);
            } else {
                logAction(`Case 2: [${targetNode.value}] has one child. Passing to parent...`, "success");
                updateCode([`return node.left || node.right;`]);
            }
            const domNode = document.getElementById(`node-${targetNode.id}`);
            if (domNode) domNode.classList.add('fade-out');
            await sleep(getDelay() * 1.5);
        });

        currentSteps.push(async () => {
            if (targetParent === null) {
                root = replacement;
            } else if (targetParent.left === targetNode) {
                targetParent.left = replacement;
            } else {
                targetParent.right = replacement;
            }
            sizeCounter--;
            drawTree();
            logAction(`Structural update complete.`, "info");
        });
    } else {
        currentSteps.push(async () => {
            logAction(`Case 3: [${targetNode.value}] has TWO children.`, "info");
            updateCode([`node.value = findMin(node.right);`, `node.right = delete(node.right, min);`]);
        });

        let successorInfo = await findMinSuccessor(curr.right, curr);
        const successorNode = successorInfo.node;
        const successorParent = successorInfo.parent;

        currentSteps.push(async () => {
            logAction(`Successor [${successorNode.value}] found. Swapping values...`, "success");
            const domTarget = document.getElementById(`node-${targetNode.id}`);
            const domSuccessor = document.getElementById(`node-${successorNode.id}`);
            if (domTarget) domTarget.classList.add('tree-node-highlight');
            if (domSuccessor) domSuccessor.classList.add('tree-node-highlight');
            await sleep(getDelay() * 2);
            
            targetNode.value = successorNode.value;
            drawTree();
            logAction(`Value swapped to [${targetNode.value}]. Now deleting original successor...`, "info");
        });

        currentSteps.push(async () => {
            const domSuccessor = document.getElementById(`node-${successorNode.id}`);
            if (domSuccessor) domSuccessor.classList.add('fade-out');
            await sleep(getDelay() * 1.5);

            if (successorParent.left === successorNode) successorParent.left = successorNode.right;
            else successorParent.right = successorNode.right;

            sizeCounter--;
            drawTree();
        });
    }

    runEngine();
}

async function findMinSuccessor(startNode, startParent) {
    let curr = startNode;
    let parent = startParent;
    while (curr.left !== null) {
        parent = curr;
        curr = curr.left;
    }
    return { node: curr, parent: parent };
}

function traverseInorderQueue(node) {
    if (!node) return;
    traverseInorderQueue(node.left);
    let loopNode = node;
    currentSteps.push(async () => {
        logAction(`Visiting Node: ${loopNode.value}`, "success");
        updateCode([`inorder(node.left);`, `console.log(node.value);`, `inorder(node.right);`]);
        const domNode = document.getElementById(`node-${loopNode.id}`);
        if (domNode) domNode.classList.add('tree-node-highlight', 'traverse-scale');
        await sleep(getDelay() * 1.5);
        if (domNode) domNode.classList.remove('tree-node-highlight', 'traverse-scale');
    });
    traverseInorderQueue(node.right);
}

function traversePreorderQueue(node) {
    if (!node) return;
    let loopNode = node;
    currentSteps.push(async () => {
        logAction(`Visiting Node: ${loopNode.value}`, "success");
        updateCode([`console.log(node.value);`, `preorder(node.left);`, `preorder(node.right);`]);
        const domNode = document.getElementById(`node-${loopNode.id}`);
        if (domNode) domNode.classList.add('tree-node-highlight', 'traverse-scale');
        await sleep(getDelay() * 1.5);
        if (domNode) domNode.classList.remove('tree-node-highlight', 'traverse-scale');
    });
    traversePreorderQueue(node.left);
    traversePreorderQueue(node.right);
}

function traversePostorderQueue(node) {
    if (!node) return;
    traversePostorderQueue(node.left);
    traversePostorderQueue(node.right);
    let loopNode = node;
    currentSteps.push(async () => {
        logAction(`Visiting Node: ${loopNode.value}`, "success");
        updateCode([`postorder(node.left);`, `postorder(node.right);`, `console.log(node.value);`]);
        const domNode = document.getElementById(`node-${loopNode.id}`);
        if (domNode) domNode.classList.add('tree-node-highlight', 'traverse-scale');
        await sleep(getDelay() * 1.5);
        if (domNode) domNode.classList.remove('tree-node-highlight', 'traverse-scale');
    });
}

function initiateTraversal(type) {
    if (isExecuting) return;
    if (!root) { showErrorToast("Tree is empty!"); return; }
    
    currentSteps = [];
    currentSteps.push(async () => logAction(`Initializing ${type} Traversal`, "info"));
    
    if (type === 'Inorder') traverseInorderQueue(root);
    else if (type === 'Preorder') traversePreorderQueue(root);
    else if (type === 'Postorder') traversePostorderQueue(root);
    
    currentSteps.push(async () => logAction(`${type} Traversal Completed.`, "success"));
    runEngine();
}

btnInorder.addEventListener('click', () => initiateTraversal('Inorder'));
btnPreorder.addEventListener('click', () => initiateTraversal('Preorder'));
btnPostorder.addEventListener('click', () => initiateTraversal('Postorder'));
btnInsert.addEventListener('click', insertNode);
btnSearch.addEventListener('click', searchNode);
btnDelete.addEventListener('click', deleteNode);
inputEl.addEventListener('keypress', (e) => { if(e.key === 'Enter') insertNode(); });

btnReset.addEventListener('click', () => {
    if (isExecuting) { showErrorToast("Wait before resetting."); return; }
    root = null; sizeCounter = 0; nodeCount = 0;
    statusLog.innerHTML = '';
    logAction("Tree wiped structurally.", "success");
    updateCode([`root = null;`]);
    drawTree();
});

// Init
window.addEventListener('resize', () => { if(!isExecuting) drawTree(); });
updateCode([`class Node { constructor(v) { this.val = v; this.left = this.right = null; } }`, `let root = null;`]);
drawTree();
