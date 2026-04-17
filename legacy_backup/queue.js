let memory = new Array(6).fill(null);
let front = 0;
let rear = -1;
let size = 0;
const MAX_CAPACITY = 6;
const MEM_START_ADDR = 1000;

// Engine State
let currentSteps = [];
let stepIndex = 0;
let isExecuting = false;
let isPaused = false;
let resolveNextStep = null;
let waitForNext = false;

// DOM Elements
const inputEl = document.getElementById('queue-input');
const btnEnqueue = document.getElementById('btn-enqueue');
const btnDequeue = document.getElementById('btn-dequeue');
const btnTraverse = document.getElementById('btn-traverse');
const btnReset = document.getElementById('btn-reset');

const btnPlay = document.querySelector('.play-btn');
const btnPause = document.querySelector('.pause-btn');
const btnNext = document.querySelector('.next-btn');

const queueTrack = document.getElementById('queue-track');
const pointerFront = document.getElementById('pointer-front');
const pointerRear = document.getElementById('pointer-rear');
const memoryContainer = document.getElementById('memory-container');
const sizeBadge = document.getElementById('queue-size-badge');
const statusLog = document.getElementById('status-log');
const codePanel = document.getElementById('code-panel');
const speedSlider = document.getElementById('queue-speed');

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

function updatePointers() {
    // Math logic based on CSS grid widths: 40px padding + 60px width + 20px gap.
    // Center of element i corresponds to: left = paddingLeft(40) + i*(width+gap)(80) + halfWidth(30)
    // Left = 70 + i * 80
    
    if (size === 0) {
        pointerFront.style.opacity = 0;
        pointerRear.style.opacity = 0;
    } else {
        pointerFront.style.opacity = 1;
        pointerFront.style.transform = `translateX(${70 + front * 80}px)`;
        
        pointerRear.style.opacity = 1;
        pointerRear.style.transform = `translateX(${70 + rear * 80}px)`;
    }
}

function renderQueue() {
    // Clear out track but keep pointers
    Array.from(queueTrack.children).forEach(child => {
        if (!child.classList.contains('queue-pointer')) {
            child.remove();
        }
    });
    
    // We strictly render existing elements from front to rear horizontally inside the track
    // using absolute margins or gap spacing by inserting null dummies up to front to maintain physical offset
    
    for (let i = 0; i < front; i++) {
        // Spacers to push valid elements to correctly map their indices
        const spacer = document.createElement('div');
        spacer.style.width = '60px'; // same as queue-item
        spacer.style.flexShrink = '0';
        queueTrack.insertBefore(spacer, pointerFront);
    }
    
    for (let i = front; i <= rear; i++) {
        const itemBody = document.createElement('div');
        itemBody.className = 'queue-item glow-item';
        
        const valSpan = document.createElement('span');
        valSpan.className = 'item-value';
        valSpan.textContent = memory[i];
        
        const idxSpan = document.createElement('span');
        idxSpan.className = 'item-index';
        idxSpan.textContent = i;
        
        itemBody.appendChild(valSpan);
        itemBody.appendChild(idxSpan);
        
        queueTrack.insertBefore(itemBody, pointerFront); // Append before pointer nodes
    }
    
    renderMemory();
    updatePointers();
    sizeBadge.textContent = `Size: ${size} / ${MAX_CAPACITY}`;
}

function renderMemory() {
    memoryContainer.innerHTML = '';
    
    // Renders left to right [0] through [5]
    for (let i = 0; i < MAX_CAPACITY; i++) {
        const addrHex = '0x' + (MEM_START_ADDR + i * 4).toString(16).toUpperCase();
        
        const block = document.createElement('div');
        block.className = 'memory-block';
        block.id = `mem-${i}`;
        
        const val = memory[i];
        const valClass = val === null ? 'mem-value null' : 'mem-value';
        const displayVal = val === null ? 'NULL' : val;
        
        let html = `
            <span class="mem-address">[${addrHex}]</span>
            <span class="mem-index">[${i}]</span>
            <span class="${valClass}">${displayVal}</span>
        `;
        
        if (i === front && size > 0) {
            html += `<span class="mem-front-indicator">FRONT</span>`;
            block.style.boxShadow = "inset 0 0 10px rgba(16, 185, 129, 0.2)";
        }
        if (i === rear && size > 0) {
            html += `<span class="mem-rear-indicator">REAR</span>`;
            block.style.boxShadow = "inset 0 0 10px rgba(245, 158, 11, 0.2)";
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
    if (resolveNextStep) {
        resolveNextStep();
        resolveNextStep = null;
    }
});

btnPause.addEventListener('click', () => {
    isPaused = true;
    logAction("Engine Paused.", "error");
});

btnNext.addEventListener('click', () => {
    isPaused = true;
    waitForNext = true;
    logAction("Executing next step manually.", "info");
    if (resolveNextStep) {
        resolveNextStep();
        resolveNextStep = null;
    }
});

// ---- QUEUE OPERATIONS ---- //

function enqueue() {
    const value = inputEl.value.trim();
    
    if (isExecuting) {
        logAction("Please wait for current operation to finish.", "error");
        return;
    }
    if (!value) {
        showErrorToast("Please enter a value to enqueue.");
        return;
    }
    // Naive implementation limits Rear from touching max boundary
    if (rear === MAX_CAPACITY - 1) {
        showErrorToast("Queue is full! (Rear pointer limit reached)");
        updateCode([
            `if (rear === MAX_CAPACITY - 1) { ... }`,
            `else { throw "Queue Overflow"; }`
        ]);
        return;
    }

    inputEl.value = '';
    
    currentSteps = [
        async () => {
            logAction("Step 1: Checking available space...", "info");
            updateCode([
                `if (rear < MAX_CAPACITY - 1) {`,
                `    // Space available`
            ]);
        },
        async () => {
            logAction(`Step 2: Securing memory cell at index [${rear + 1}]`, "info");
            const memBlockId = `mem-${rear + 1}`;
            let memBlock = document.getElementById(memBlockId);
            if (memBlock) memBlock.classList.add('highlight-mem');
        },
        async () => {
            logAction(`Step 3: Storing value '${value}' in memory`, "info");
            updateCode([
                `rear++;`,
                `queue[rear] = "${value}";`
            ]);
            rear++;
            size++;
            memory[rear] = value;
            
            const memBlockId = `mem-${rear}`;
            let memBlock = document.getElementById(memBlockId);
            if (memBlock) {
                const memValSpan = memBlock.querySelector('.mem-value');
                memValSpan.className = 'mem-value';
                memValSpan.textContent = value;
            }
        },
        async () => {
            logAction(`Step 4: Updating visual queue container`, "info");
            
            renderQueue(); // Draw new piece
            
            // Re-find the exact piece and animate it natively
            const domElements = queueTrack.querySelectorAll('.queue-item');
            const targetDOM = domElements[domElements.length - 1]; // newest one
            if (targetDOM) {
                targetDOM.classList.add('enqueue-animating');
                const animTime = getDelay() / 1000;
                targetDOM.style.animationDuration = `${animTime}s`;
                await sleep(getDelay()); // wait for slide
                
                targetDOM.classList.remove('enqueue-animating');
                targetDOM.classList.add('highlight-green');
                await sleep(getDelay() * 0.5);
                targetDOM.classList.remove('highlight-green');
            }
            
            const memBlock = document.getElementById(`mem-${rear}`);
            if (memBlock) memBlock.classList.remove('highlight-mem');
        },
        async () => {
            logAction(`Step 5: Pointers aligned to bounds`, "success");
            updateCode([
                `// Enqueue successful`,
                `size = ${size}`
            ]);
        }
    ];

    runEngine();
}

function dequeue() {
    if (isExecuting) {
        logAction("Please wait for current operation to finish.", "error");
        return;
    }
    if (size === 0) {
        showErrorToast("Queue is empty! Cannot dequeue.");
        updateCode([
            `if (front > rear) { ... }`,
            `else { throw "Queue Underflow"; }`
        ]);
        return;
    }
    
    currentSteps = [
        async () => {
            logAction("Step 1: Checking if queue is empty...", "info");
            updateCode([
                `if (front <= rear) {`,
                `    // Valid items exist to dequeue`
            ]);
        },
        async () => {
            logAction(`Step 2: Resolving Front element at index [${front}]`, "info");
            const domElements = queueTrack.querySelectorAll('.queue-item');
            const targetDOM = domElements[0]; // first valid piece mapping to Front
            const memBlock = document.getElementById(`mem-${front}`);
            
            if (targetDOM) targetDOM.classList.add('highlight-red');
            if (memBlock) memBlock.classList.add('highlight-mem-delete');
            
            updateCode([
                `let dequeued = queue[front];`,
                `// Retrieved value: ${memory[front]}`
            ]);
        },
        async () => {
            logAction(`Step 3: Removing element from visual queue`, "info");
            const domElements = queueTrack.querySelectorAll('.queue-item');
            const targetDOM = domElements[0];
            if (targetDOM) {
                targetDOM.classList.remove('highlight-red');
                targetDOM.classList.add('dequeue-animating');
                const animTime = getDelay() / 1000;
                targetDOM.style.animationDuration = `${animTime}s`;
            }
            await sleep(getDelay()); 
        },
        async () => {
            logAction(`Step 4: Clearing element from memory`, "info");
            const memBlock = document.getElementById(`mem-${front}`);
            if (memBlock) {
                const memValSpan = memBlock.querySelector('.mem-value');
                memValSpan.className = 'mem-value null';
                memValSpan.textContent = 'NULL';
            }
            updateCode([
                `queue[front] = NULL;`,
                `// Deallocated front chunk`
            ]);
        },
        async () => {
            const popped = memory[front];
            memory[front] = null;
            front++;
            size--;
            
            // If completely empty after dequeue, naive array conventionally soft-resets pointers
            // Or typically they just remain stranded! For educational purposes, if rear is maxed and size is 0,
            // we will hard reset the pointers so they can play more without reloading the page.
            if (size === 0) {
                 front = 0; rear = -1;
            }
            
            logAction(`Step 5: FRONT pointer shifted right. Returned: ${popped}`, "success");
            updateCode([
                `front++;`,
                `return dequeued;`
            ]);
            renderQueue();
        }
    ];

    runEngine();
}

function traverse() {
    if (isExecuting) {
        logAction("Please wait for current operation to finish.", "error");
        return;
    }
    if (size === 0) {
        showErrorToast("Queue is empty! Cannot traverse.");
        updateCode([`// Error: Queue is empty`]);
        return;
    }

    currentSteps = [];
    currentSteps.push(async () => {
        logAction("Initializing Traversal: FRONT to REAR", "info");
        updateCode([
            `for (let i = front; i <= rear; i++) {`,
            `    // Loop initialized`
        ]);
    });

    for (let i = front; i <= rear; i++) {
        currentSteps.push(async () => {
            logAction(`Accessing element at index [${i}]`, "info");
            
            const domElements = queueTrack.querySelectorAll('.queue-item');
            const domIndex = i - front; 
            const targetDOM = domElements[domIndex];
            const memBlock = document.getElementById(`mem-${i}`);
            
            if (targetDOM) targetDOM.classList.add('highlight-yellow', 'traverse-scale');
            if (memBlock) memBlock.classList.add('highlight-mem-pop'); 
            
            updateCode([
                `let current = queue[${i}];`,
                `console.log("Reading value:", current);`
            ]);
            
            logAction(`Reading value: ${memory[i]}`, "success");
            
            await sleep(getDelay() * 1.5);
            
            if (targetDOM) targetDOM.classList.remove('highlight-yellow', 'traverse-scale');
            if (memBlock) memBlock.classList.remove('highlight-mem-pop');
            
            if (i < rear) {
                logAction("Moving to next element...", "info");
            } else {
                logAction("Traversal Completed.", "success");
                updateCode([
                    `// End of loop`,
                    `// All valid items processed`
                ]);
            }
        });
    }

    runEngine();
}

function resetQueue() {
    if (isExecuting) {
        showErrorToast("Please wait for current sequence to complete before resetting.");
        return;
    }
    
    currentSteps = [
        async () => {
            logAction("Initiating System Reset...", "error");
            updateCode([`console.log("Emptying Queue...");`, `front = 0; rear = -1;`]);
            
            // Target elements for wipe
            const domElements = queueTrack.querySelectorAll('.queue-item');
            domElements.forEach(b => b.classList.add('fade-out-anim'));
            
            for (let i = 0; i < MAX_CAPACITY; i++) {
                const memBlock = document.getElementById(`mem-${i}`);
                if (memBlock) {
                    const valBox = memBlock.querySelector('.mem-value');
                    if (valBox && !valBox.classList.contains('null')) {
                         valBox.classList.add('fade-out-anim');
                    }
                }
            }
            await sleep(600); 
        },
        async () => {
            memory = new Array(MAX_CAPACITY).fill(null);
            front = 0;
            rear = -1;
            size = 0;
            statusLog.innerHTML = '';
            logAction(`System memory formally reset.`, "success");
            updateCode([`front = 0;`, `rear = -1;`, `queue = new Array(MAX_CAPACITY);`]);
            renderQueue(); 
        }
    ];

    runEngine();
}

// Event Bindings
btnEnqueue.addEventListener('click', enqueue);
btnDequeue.addEventListener('click', dequeue);
btnTraverse.addEventListener('click', traverse);
btnReset.addEventListener('click', resetQueue);

inputEl.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        enqueue();
    }
});

// Initialization
updateCode([
    `let MAX_CAPACITY = ${MAX_CAPACITY};`,
    `let queue = new Array(MAX_CAPACITY);`,
    `let front = 0;`,
    `let rear = -1;`
]);
renderQueue();
