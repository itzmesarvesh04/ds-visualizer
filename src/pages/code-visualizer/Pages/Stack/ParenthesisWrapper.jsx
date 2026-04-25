import React from 'react';
import ParenthesisCheckerStack from './Parenthesis-Checker-Stack';

const ParenthesisWrapper = () => {
  const testCase = '{ [ ( ) ] }';

  const pythonCode = `def is_balanced(expression):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for char in expression:
        if char in "({[":
            stack.append(char)
        elif char in ")}]":
            if not stack or stack.pop() != pairs[char]:
                return False
                
    return len(stack) == 0`;

  return (
    <div className="parenthesis-wrapper-container">
      <div className="visualizer-section">
        <ParenthesisCheckerStack testCase={testCase} />
      </div>
      
      <aside className="python-panel">
        <div className="python-header">
          <h3>Python Execution</h3>
          <div className="badge">stack.py</div>
        </div>
        
        <div className="python-code-block">
          <pre><code>{pythonCode}</code></pre>
        </div>
        
        <div className="terminal-output">
          <h4>Terminal</h4>
          <div className="terminal-content">
            <p>Processing: <span style={{ color: 'var(--primary-color)' }}>"{testCase}"</span></p>
            <p>Result: <span className="terminal-true">True</span></p>
          </div>
        </div>
        
        <div className="python-output-box">
          <h4>Explanation</h4>
          <div className="output-content">
            <p className="output-input"># Using a stack to match brackets</p>
            <p className="output-result">
              LIFO behavior ensures the last opened bracket is the first one closed.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ParenthesisWrapper;