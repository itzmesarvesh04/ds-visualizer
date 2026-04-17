let memoryPool = new Map(); // address -> { value, nextAddr }
let headAddr = null;
let size = 0;

// Engine State
let currentSteps = [];
let stepIndex = 0;
let isExecuting = false;
let isPaused = false;
let resolveNextStep = null;
let waitForNext = false;

// DOM Elements
const inputEl = document.getElementById('ll-input');
const btnInsertHead = document.getElementById('btn-insert-head');
const btnInsertTail = document.getElementById('btn-insert-tail');
const btnDelete = document.getElementById('btn-delete');
const btnTraverse = document.getElementById('btn-traverse');
const btnReset = document.getElementById('btn-reset');

const btnPlay = document.querySelector('.play-btn');
const btnPause = document.querySelector('.pause-btn');
const btnNext = document.querySelector('.next-btn');

const llTrack = document.getElementById('ll-track');
const headIndicator = document.getElementById('head-indicator');
const memoryContainer = document.getElementById('memory-container');
const sizeBadge = document.getElementById('ll-size-badge');
const statusLog = document.getElementById('status-log');
const codePanel = document.getElementById('code-panel');
const speedSlider = document.getElementById('ll-speed');

// Utility Functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

function updateCode(lines) {
    codePanel.innerHTML = lines.map((line, i) => {
        if (!line) return '<span class="code-line"></span>';
        if (i === 0) return `<span class="code-line active">${line}</span>`;
        return `<span class="code-line">${line}</span>`;
    }).join('\n');
}

function generateAddress() {
    let addr;
    do {
        addr = '0x' + Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0');
    } while (memoryPool.has(addr) || addr === '0x000');
    return addr;
}

// Rendering purely evaluates logical references
function renderLL() {
    // Clear existing track except head indicator
    Array.from(llTrack.children).forEach(child => {
        if (child.id !== 'head-indicator') {
            child.remove();
        }
    });
    
    let currentAddr = headAddr;
    let nodeCount = 0;
    
    if (!currentAddr) {
        headIndicator.style.opacity = 0;
    } else {
        headIndicator.style.opacity = 1;
    }
    
    while (currentAddr) {
        const nodeData = memoryPool.get(currentAddr);
        
        // Build Node Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'll-node-wrapper';
        wrapper.id = `node-${currentAddr}`;
        
        // Build Node CSS block
        let nextVisual = nodeData.nextAddr ? `<div class="dot"></div>` : `<div class="null-text">NULL</div>`;
        
        const nodeEl = document.createElement('div');
        nodeEl.className = 'll-node glow-item';
        nodeEl.innerHTML = `
            <div class="ll-node-data">${nodeData.value}</div>
            <div class="ll-node-next">${nextVisual}</div>
            <div class="ll-node-addr">[${currentAddr}]</div>
        `;
        
        wrapper.appendChild(nodeEl);
        
        // Build Arrow if pointing to next
        if (nodeData.nextAddr) {
            const arrow = document.createElement('div');
            arrow.className = 'll-arrow';
            wrapper.appendChild(arrow);
        }
        
        llTrack.appendChild(wrapper);
        currentAddr = nodeData.nextAddr;
        nodeCount++;
    }
    
    renderMemory();
    sizeBadge.textContent = `Nodes: ${size}`;
}

function renderMemory() {
    memoryContainer.innerHTML = '';
    
    if (memoryPool.size === 0) {
        memoryContainer.innerHTML = '<span style="color:var(--text-muted); margin:auto;">Heap Memory Empty</span>';
        return;
    }
    
    // Memory blocks are mapped in heap creation order to intentionally show fragmentation!
    for (let [addr, nodeData] of memoryPool.entries()) {
        const block = document.createElement('div');
        block.className = 'memory-block';
        block.id = `mem-${addr}`;
        
        let nextDisp = nodeData.nextAddr || 'NULL';
        
        let html = `
            <span class="mem-address">[${addr}]</span>
            <span class="mem-value">${nodeData.value}</span>
            <span class="mem-next-addr">NEXT: ${nextDisp}</span>
        `;
        
        if (addr === headAddr) {
            block.style.boxShadow = "inset 0 0 10px rgba(16, 185, 129, 0.3)";
        }
        
        block.innerHTML = html;
        memoryContainer.appendChild(block);
    }
}

// ---- ENGINE LOOP ---- //

async function runEngine() {
    if (isExecuting) return;
    isExecuting = true;
    
    while (stepIndex < currentSteps.length) {
        if (isPaused && !waitForNext) {
            await new Promise(r => { resolveNextStep = r; });
        }
        waitForNext = false;
        
        const stepFn = currentSteps[stepIndex];
        await stepFn(); 
        stepIndex++;
        
        if (!isPaused && stepIndex < currentSteps.length) {
            await sleep(getDelay());
        }
    }
    
    currentSteps = [];
    stepIndex = 0;
    isExecuting = false;
}

// Engine Controls
btnPlay.addEventListener('click', () => {
    logAction("Engine set to Auto-Play.", "info");
    isPaused = false;
    if (resolveNextStep) { resolveNextStep(); resolveNextStep = null; }
});

btnPause.addEventListener('click', () => {
    isPaused = true;
    logAction("Engine Paused.", "error");
});

btnNext.addEventListener('click', () => {
    isPaused = true;
    waitForNext = true;
    logAction("Executing next step manually.", "info");
    if (resolveNextStep) { resolveNextStep(); resolveNextStep = null; }
});

// ---- LL OPERATIONS ---- //

function insertHead() {
    const value = inputEl.value.trim();
    if (isExecuting) { logAction("Please wait for current operation to finish.", "error"); return; }
    if (!value) { showErrorToast("Please enter a value to insert."); return; }

    const newAddr = generateAddress();
    
    currentSteps = [
        async () => {
            logAction("Step 1: Allocating new Heap Memory node...", "info");
            updateCode([`let newNode = new Node("${value}");`]);
            
            // Allocate physically to heap silently 
            memoryPool.set(newAddr, { value: value, nextAddr: null });
            renderMemory(); 
            
            const memBlock = document.getElementById(`mem-${newAddr}`);
            if (memBlock) memBlock.classList.add('highlight-mem');
        },
        async () => {
            logAction(`Step 2: Linking newNode.next to current HEAD [${headAddr || 'NULL'}]`, "info");
            updateCode([`newNode.next = head;`]);
            
            const node = memoryPool.get(newAddr);
            node.nextAddr = headAddr;
            
            renderMemory(); // updates NEXT physically
            const memBlock = document.getElementById(`mem-${newAddr}`);
            if (memBlock) memBlock.classList.add('highlight-mem');
        },
        async () => {
            logAction(`Step 3: Pointing global HEAD to newNode [${newAddr}]`, "info");
            updateCode([`head = newNode;`]);
            
            headAddr = newAddr;
            size++;
            
            renderLL(); 
            
            const newDOM = document.getElementById(`node-${newAddr}`);
            if (newDOM) {
                newDOM.querySelector('.ll-node').classList.add('ll-insert-anim', 'highlight-green');
                const arrow = newDOM.querySelector('.ll-arrow');
                if (arrow) arrow.classList.add('ll-arrow-grow');
            }
            
            await sleep(getDelay());
            if (newDOM) newDOM.querySelector('.ll-node').classList.remove('highlight-green');
            
            const memBlock = document.getElementById(`mem-${newAddr}`);
            if (memBlock) memBlock.classList.remove('highlight-mem');
        }
    ];

    inputEl.value = '';
    runEngine();
}

function insertTail() {
    const value = inputEl.value.trim();
    if (isExecuting) { logAction("Wait for operation to finish.", "error"); return; }
    if (!value) { showErrorToast("Please enter a value."); return; }

    if (!headAddr) {
        logAction("List is empty. Redirecting to Insert Head.", "info");
        insertHead();
        return;
    }

    const newAddr = generateAddress();
    
    currentSteps = [
        async () => {
             logAction("Step 1: Traversing to find Tail...", "info");
             updateCode([`let temp = head;`, `while(temp.next != null) { temp = temp.next; }`]);
        }
    ];

    let currentAddr = headAddr;
    while (currentAddr) {
        let loopAddr = currentAddr;
        let nodeData = memoryPool.get(loopAddr);
        
        currentSteps.push(async () => {
            logAction(`Checking node at [${loopAddr}]`, "info");
            const dom = document.getElementById(`node-${loopAddr}`);
            if (dom) dom.querySelector('.ll-node').classList.add('highlight-yellow', 'traverse-scale');
            await sleep(getDelay());
            if (dom) dom.querySelector('.ll-node').classList.remove('highlight-yellow', 'traverse-scale');
        });
        
        if (!nodeData.nextAddr) {
            // Found tail!
            currentSteps.push(async () => {
                logAction(`Step 2: Allocating new Heap node [${newAddr}]`, "info");
                updateCode([`let newNode = new Node("${value}");`]);
                memoryPool.set(newAddr, { value: value, nextAddr: null });
                renderMemory();
            });
            
            currentSteps.push(async () => {
                logAction(`Step 3: Linking Tail node [${loopAddr}] to new node [${newAddr}]`, "success");
                updateCode([`temp.next = newNode;`]);
                
                let tailObj = memoryPool.get(loopAddr);
                tailObj.nextAddr = newAddr;
                size++;
                
                renderLL();
                
                const newDOM = document.getElementById(`node-${newAddr}`);
                if (newDOM) {
                    newDOM.querySelector('.ll-node').classList.add('ll-insert-anim', 'highlight-green');
                }
            });
            break;
        }
        currentAddr = nodeData.nextAddr;
    }
    
    inputEl.value = '';
    runEngine();
}

function traverse() {
    if (isExecuting) return;
    if (!headAddr) { showErrorToast("List is empty!"); return; }

    currentSteps = [
        async () => {
            logAction("Initializing Traversal", "info");
            updateCode([`let temp = head;`, `while (temp != null) { ... }`]);
        }
    ];

    let currentAddr = headAddr;
    while (currentAddr) {
        let loopAddr = currentAddr;
        currentSteps.push(async () => {
            const data = memoryPool.get(loopAddr);
            logAction(`Visiting Node [${loopAddr}] - Value: ${data.value}`, "success");
            
            const dom = document.getElementById(`node-${loopAddr}`);
            if (dom) dom.querySelector('.ll-node').classList.add('highlight-yellow', 'traverse-scale');
            
            const memBlock = document.getElementById(`mem-${loopAddr}`);
            if (memBlock) memBlock.classList.add('highlight-mem-pop');
            
            updateCode([`console.log(temp.data);`, `temp = temp.next;`]);
            await sleep(getDelay() * 1.5);
            
            if (dom) dom.querySelector('.ll-node').classList.remove('highlight-yellow', 'traverse-scale');
            if (memBlock) memBlock.classList.remove('highlight-mem-pop');
            
            if (!data.nextAddr) logAction("Reached NULL. Traversal Complete.", "success");
        });
        currentAddr = memoryPool.get(currentAddr).nextAddr;
    }

    runEngine();
}

function deleteNode() {
    const value = inputEl.value.trim();
    if (isExecuting) return;
    if (!headAddr) { showErrorToast("List is empty!"); return; }
    if (!value) { showErrorToast("Enter a value to delete."); return; }

    inputEl.value = '';
    currentSteps = [
        async () => {
            logAction(`Step 1: Searching for value '${value}'...`, "info");
            updateCode([`let temp = head, prev = null;`]);
        }
    ];

    let currentAddr = headAddr;
    let prevAddr = null;
    let found = false;

    while (currentAddr) {
        const loopAddr = currentAddr;
        const prevScopeAddr = prevAddr;
        const nodeData = memoryPool.get(loopAddr);
        
        currentSteps.push(async () => {
            const dom = document.getElementById(`node-${loopAddr}`);
            if (dom) dom.querySelector('.ll-node').classList.add('highlight-yellow');
            await sleep(getDelay());
            if (dom) dom.querySelector('.ll-node').classList.remove('highlight-yellow');
        });

        if (nodeData.value === value) {
            found = true;
            // Deletion steps wrapper
            currentSteps.push(async () => {
                logAction(`Step 2: Value localized at [${loopAddr}]. Target locked.`, "info");
                const dom = document.getElementById(`node-${loopAddr}`);
                if (dom) dom.querySelector('.ll-node').classList.add('highlight-red');
                
                const memBlock = document.getElementById(`mem-${loopAddr}`);
                if (memBlock) memBlock.classList.add('highlight-mem-delete');
                await sleep(getDelay());
            });

            currentSteps.push(async () => {
                logAction(`Step 3: Pointer rerouting. Bypassing target node.`, "info");
                
                const dom = document.getElementById(`node-${loopAddr}`);
                if (dom) dom.classList.add('fade-out-anim'); // generic UI fade out for wrapper
                
                if (prevScopeAddr === null) {
                    // Deleting head
                    updateCode([`head = temp.next;`]);
                    headAddr = nodeData.nextAddr;
                } else {
                    // Deleting from middle/end
                    updateCode([`prev.next = temp.next;`]);
                    let prevObj = memoryPool.get(prevScopeAddr);
                    prevObj.nextAddr = nodeData.nextAddr;
                }
                
                await sleep(getDelay());
            });
            
            currentSteps.push(async () => {
                logAction(`Step 4: Physically freeing Heap memory block at [${loopAddr}].`, "success");
                memoryPool.delete(loopAddr);
                size--;
                renderLL(); 
                updateCode([`// Node memory implicitly freed`]);
            });
            
            break; // Stop loop building
        }
        
        prevAddr = currentAddr;
        currentAddr = nodeData.nextAddr;
    }

    if (!found) {
        currentSteps.push(async () => {
            showErrorToast(`Value '${value}' not found in the list!`);
        });
    }

    runEngine();
}

function resetList() {
    if (isExecuting) { showErrorToast("Please wait before resetting."); return; }
    
    currentSteps = [
        async () => {
            logAction("Initiating Heap wiping sequence...", "error");
            updateCode([`head = null;`]);
            
            const nodes = llTrack.querySelectorAll('.ll-node-wrapper');
            nodes.forEach(b => b.classList.add('fade-out-anim'));
            
            const mems = memoryContainer.querySelectorAll('.memory-block');
            mems.forEach(m => m.classList.add('fade-out-anim'));
            
            await sleep(600); 
        },
        async () => {
            memoryPool.clear();
            headAddr = null;
            size = 0;
            statusLog.innerHTML = '';
            logAction(`System memory formally reset.`, "success");
            updateCode([`head = null;`, `size = 0;`]);
            renderLL(); 
        }
    ];

    runEngine();
}

// Event Bindings
btnInsertHead.addEventListener('click', insertHead);
btnInsertTail.addEventListener('click', insertTail);
btnDelete.addEventListener('click', deleteNode);
btnTraverse.addEventListener('click', traverse);
btnReset.addEventListener('click', resetList);

inputEl.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') insertTail();
});

// Init
updateCode([
    `class Node { constructor(v) { this.value = v; this.next = null; } }`,
    `let head = null;`
]);
renderLL();
