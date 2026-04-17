let stack = [];
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
const inputEl = document.getElementById('stack-input');
const btnPush = document.getElementById('btn-push');
const btnPop = document.getElementById('btn-pop');
const btnPeek = document.getElementById('btn-peek');
const btnTraverse = document.getElementById('btn-traverse');
const btnReset = document.getElementById('btn-reset');

const btnPlay = document.querySelector('.play-btn');
const btnPause = document.querySelector('.pause-btn');
const btnNext = document.querySelector('.next-btn');

const stackContainer = document.getElementById('stack-container');
const memoryContainer = document.getElementById('memory-container');
const sizeBadge = document.getElementById('stack-size-badge');
const statusLog = document.getElementById('status-log');
const codePanel = document.getElementById('code-panel');
const speedSlider = document.querySelector('.slider');

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
    
    // Always log as well
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

function renderStack() {
    stackContainer.innerHTML = '<div class="stack-base"></div>';
    
    for (let i = 0; i < stack.length; i++) {
        const itemBody = document.createElement('div');
        itemBody.className = 'stack-item glow-item';
        
        const valSpan = document.createElement('span');
        valSpan.className = 'item-value';
        valSpan.textContent = stack[i];
        
        const idxSpan = document.createElement('span');
        idxSpan.className = 'item-index';
        idxSpan.textContent = i;
        
        itemBody.appendChild(valSpan);
        itemBody.appendChild(idxSpan);
        
        stackContainer.insertBefore(itemBody, stackContainer.firstChild);
    }
    
    renderMemory();
    sizeBadge.textContent = `Size: ${stack.length} / ${MAX_CAPACITY}`;
}

function renderMemory() {
    memoryContainer.innerHTML = '';
    for (let i = MAX_CAPACITY - 1; i >= 0; i--) {
        const addrHex = '0x' + (MEM_START_ADDR + i * 4).toString(16).toUpperCase();
        
        const block = document.createElement('div');
        block.className = 'memory-block';
        block.id = `mem-${i}`;
        
        const val = i < stack.length ? stack[i] : 'NULL';
        const valClass = val === 'NULL' ? 'mem-value null' : 'mem-value';
        
        let html = `
            <span class="mem-address">[${addrHex}]</span>
            <span class="mem-index">[${i}]</span>
            <span class="${valClass}">${val}</span>
        `;
        
        if (i === stack.length - 1 && stack.length > 0) {
            block.classList.add('is-top');
            html += `<span class="mem-top-indicator">← Top</span>`;
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
            // Block engine until Play or Next is clicked
            await new Promise(r => { resolveNextStep = r; });
        }
        
        waitForNext = false; // Reset single step flag
        
        const stepFn = currentSteps[stepIndex];
        await stepFn(); // Execute the step function
        stepIndex++;
        
        if (!isPaused && stepIndex < currentSteps.length) {
            await sleep(getDelay());
        }
    }
    
    // Teardown sequence
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

// ---- STACK OPERATIONS ---- //

function pushElement(value) {
    if (isExecuting) {
        logAction("Please wait for the current operation to finish.", "error");
        return;
    }
    if (!value) {
        logAction("Please enter a value to push.", "error");
        return;
    }
    if (stack.length >= MAX_CAPACITY) {
        showErrorToast("Stack is full! (Stack Overflow)");
        updateCode([
            `if (top < MAX_CAPACITY - 1) { ... }`,
            `else { throw "Stack Overflow"; }`
        ]);
        return;
    }

    inputEl.value = '';
    
    // Enqueue 5 formal steps
    currentSteps = [
        async () => {
            logAction("Step 1: Checking available space...", "info");
            updateCode([
                `if (top < MAX_CAPACITY - 1) {`,
                `    // Space available`
            ]);
        },
        async () => {
            logAction(`Step 2: Preparing memory cell at index [${stack.length}]`, "info");
            const memBlockId = `mem-${stack.length}`;
            let memBlock = document.getElementById(memBlockId);
            if (memBlock) memBlock.classList.add('highlight-mem');
        },
        async () => {
            logAction(`Step 3: Storing value '${value}' in memory`, "info");
            updateCode([
                `memory[top + 1] = "${value}";`,
                `// Value written successfully`
            ]);
            const memBlockId = `mem-${stack.length}`;
            let memBlock = document.getElementById(memBlockId);
            if (memBlock) {
                const memValSpan = memBlock.querySelector('.mem-value');
                memValSpan.className = 'mem-value';
                memValSpan.textContent = value;
            }
        },
        async () => {
            logAction(`Step 4: Updating visual stack container`, "info");
            const itemBody = document.createElement('div');
            itemBody.className = 'stack-item glow-item push-animating';
            itemBody.innerHTML = `<span class="item-value">${value}</span><span class="item-index">${stack.length}</span>`;
            
            const animTime = getDelay() / 1000;
            itemBody.style.animationDuration = `${animTime}s`;
            
            stackContainer.insertBefore(itemBody, stackContainer.firstChild);
            
            await sleep(getDelay()); // Wait for bounce
            itemBody.classList.add('highlight-green');
            await sleep(getDelay() * 0.5); // Provide brief viewing of the green success validation
        },
        async () => {
            logAction(`Step 5: Updating TOP pointer`, "success");
            updateCode([
                `top++;`,
                `// Push successful`
            ]);
            const topElementDOM = stackContainer.firstChild;
            if (topElementDOM) topElementDOM.classList.remove('push-animating', 'highlight-green');
            
            const memBlock = document.getElementById(`mem-${stack.length}`);
            if (memBlock) memBlock.classList.remove('highlight-mem');
            
            stack.push(value);
            renderStack(); // Resolves pure physical mapping pointers internally
        }
    ];

    runEngine();
}

function popElement() {
    if (isExecuting) {
        logAction("Please wait for the current operation to finish.", "error");
        return;
    }
    if (stack.length === 0) {
        showErrorToast("Stack is empty! (Stack Underflow)");
        updateCode([
            `if (top >= 0) { ... }`,
            `else { throw "Stack Underflow"; }`
        ]);
        return;
    }
    
    currentSteps = [
        async () => {
            logAction("Step 1: Checking if stack is empty...", "info");
            updateCode([
                `if (top >= 0) {`,
                `    // Stack has elements`
            ]);
        },
        async () => {
            logAction(`Step 2: Resolving top element at index [${stack.length - 1}]`, "info");
            const topElementDOM = stackContainer.firstChild;
            const memBlock = document.getElementById(`mem-${stack.length - 1}`);
            
            if (topElementDOM) topElementDOM.classList.add('highlight-red');
            if (memBlock) memBlock.classList.add('highlight-mem-delete');
            
            updateCode([
                `let popped = memory[top];`,
                `// Retrieved value: ${stack[stack.length-1]}`
            ]);
        },
        async () => {
            logAction(`Step 3: Removing element from visual stack representation`, "info");
            const topElementDOM = stackContainer.firstChild;
            if (topElementDOM) {
                topElementDOM.classList.remove('highlight-red');
                topElementDOM.classList.add('pop-animating');
                const animTime = getDelay() / 1000;
                topElementDOM.style.animationDuration = `${animTime}s`;
            }
            await sleep(getDelay()); // Frame buffer internal
        },
        async () => {
            logAction(`Step 4: Clearing element from memory`, "info");
            const memBlock = document.getElementById(`mem-${stack.length - 1}`);
            if (memBlock) {
                const memValSpan = memBlock.querySelector('.mem-value');
                memValSpan.className = 'mem-value null';
                memValSpan.textContent = 'NULL';
            }
            updateCode([
                `memory[top] = NULL;`,
                `// Deallocated chunk`
            ]);
        },
        async () => {
            const popped = stack.pop();
            logAction(`Step 5: TOP pointer moved down. Returned: ${popped}`, "success");
            updateCode([
                `top--;`,
                `return popped;`
            ]);
            renderStack();
        }
    ];

    runEngine();
}

function peekElement() {
    if (isExecuting) {
        logAction("Please wait for the current operation to finish.", "error");
        return;
    }
    if (stack.length === 0) {
        showErrorToast("Stack is empty! Cannot peek.");
        updateCode([`// Error: Stack is empty`]);
        return;
    }

    currentSteps = [
        async () => {
            logAction("Step 1: Checking if stack is empty...", "info");
            updateCode([`if (top >= 0) { ... }`]);
        },
        async () => {
            logAction("Step 2: Resolving TOP memory address", "info");
            const memBlock = document.getElementById(`mem-${stack.length - 1}`);
            if (memBlock) memBlock.classList.add('highlight-mem-pop');
        },
        async () => {
            const top = stack[stack.length - 1];
            logAction(`Step 3: Accessing memory block. Value is ${top}`, "success");
            updateCode([
                `return memory[top];`,
                `// Value isolated`
            ]);
            const topElementDOM = stackContainer.firstChild;
            if (topElementDOM) topElementDOM.classList.add('highlight-yellow');
            
            await sleep(getDelay() * 1.5);
        },
        async () => {
            logAction("Step 4: Operation complete. Memory state untouched.", "info");
            const topElementDOM = stackContainer.firstChild;
            const memBlock = document.getElementById(`mem-${stack.length - 1}`);
            
            if (topElementDOM) topElementDOM.classList.remove('highlight-yellow');
            if (memBlock) memBlock.classList.remove('highlight-mem-pop');
        }
    ];

    runEngine();
}

function traverseStack() {
    if (isExecuting) {
        logAction("Please wait for the current operation to finish.", "error");
        return;
    }
    if (stack.length === 0) {
        showErrorToast("Stack is empty! Cannot traverse.");
        updateCode([`// Error: Stack is empty`]);
        return;
    }

    currentSteps = [];
    
    // Initial Setup Step
    currentSteps.push(async () => {
        logAction("Initializing Traversal: TOP to BOTTOM", "info");
        updateCode([
            `for (let i = top; i >= 0; i--) {`,
            `    // Loop initialized`
        ]);
    });

    // We build the steps dynamically for each element from top element (stack.length - 1) down to 0
    for (let i = stack.length - 1; i >= 0; i--) {
        currentSteps.push(async () => {
            logAction(`Accessing element at index [${i}]`, "info");
            
            // Map DOM elements
            // Because our UI prepends, the first DOM stack child is index (length - 1)
            const visualBlocks = stackContainer.querySelectorAll('.stack-item');
            const targetVisualIndex = (stack.length - 1) - i;
            const topElementDOM = visualBlocks[targetVisualIndex];
            
            const memBlock = document.getElementById(`mem-${i}`);
            
            // Step 1 & 2: Highlight
            if (topElementDOM) topElementDOM.classList.add('highlight-yellow', 'traverse-scale');
            if (memBlock) memBlock.classList.add('highlight-mem-pop');
            
            // Step 3: Show message
            updateCode([
                `let current = memory[${i}];`,
                `console.log("Reading value:", current);`
            ]);
            
            logAction(`Reading value: ${stack[i]}`, "success");
            
            // Step 4: Wait
            await sleep(getDelay() * 1.5);
            
            // Step 5: Clean it up and move to next
            if (topElementDOM) topElementDOM.classList.remove('highlight-yellow', 'traverse-scale');
            if (memBlock) memBlock.classList.remove('highlight-mem-pop');
            
            if (i > 0) {
                logAction("Moving to next element...", "info");
            } else {
                logAction("Traversal Completed.", "success");
                updateCode([
                    `// End of loop`,
                    `// 0 items remaining`
                ]);
            }
        });
    }

    runEngine();
}

function resetStack() {
    if (isExecuting) {
        logAction("Please wait for the current operation to finish before resetting.", "error");
        return;
    }
    if (stack.length === 0) {
        logAction("Stack is already empty.", "info");
        return;
    }

    currentSteps = [
        async () => {
            logAction("Initiating System Reset...", "error");
            updateCode([
                `console.log("Emptying Stack...");`,
                `top = -1;`
            ]);
            
            // Target all visuals for wipe fade
            const visualBlocks = stackContainer.querySelectorAll('.stack-item');
            visualBlocks.forEach(b => b.classList.add('fade-out-anim'));
            
            for (let i = 0; i < MAX_CAPACITY; i++) {
                const memBlock = document.getElementById(`mem-${i}`);
                if (memBlock) {
                    const valBox = memBlock.querySelector('.mem-value');
                    if (valBox && !valBox.classList.contains('null')) {
                         valBox.classList.add('fade-out-anim');
                    }
                }
            }
            
            await sleep(600); // Exceeds 0.5s animation timing safely
        },
        async () => {
            stack = [];
            
            // Hard wipe explanation logs to zero-state
            statusLog.innerHTML = '';
            
            logAction(`System memory formally reset.`, "success");
            updateCode([
                `top = -1;`, 
                `memory = new Array(MAX_CAPACITY);`
            ]);
            
            renderStack(); // This completely rebuilds DOM slots rendering them empty and resetting pointers
        }
    ];

    runEngine();
}

// Event Bindings
btnPush.addEventListener('click', () => pushElement(inputEl.value.trim()));
btnPop.addEventListener('click', popElement);
btnPeek.addEventListener('click', peekElement);
btnTraverse.addEventListener('click', traverseStack);
btnReset.addEventListener('click', resetStack);

inputEl.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        pushElement(inputEl.value.trim());
    }
});

// Initialization
updateCode([
    `let MAX_CAPACITY = ${MAX_CAPACITY};`,
    `let memory = new Array(MAX_CAPACITY);`,
    `let top = -1;`
]);
renderStack();
