import React from 'react';

const MaxDepth = () => {
  const testCase = 'Binary Tree with 4 levels';
  
  const pythonCode = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def maxDepth(root):
    if not root:
        return 0
    left_depth = maxDepth(root.left)
    right_depth = maxDepth(root.right)
    return max(left_depth, right_depth) + 1

# Test
#       1
#      / \\
#     2   3
#    / \\
#   4   5

root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)
root.left.right = TreeNode(5)

print(f"Maximum Depth: {maxDepth(root)}")`;

  return (
    <div className="parenthesis-wrapper-container">
      <div className="visualizer-section">
        <main className="visualizer-page">
          <div className="visualizer-header">
            <h1 className="text-gradient">Maximum Depth of Binary Tree</h1>
            <p>Visualize finding the maximum depth using recursion.</p>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            [Visualizer Component Placeholder]
            <br/>
            Tree: {testCase}
          </div>
        </main>
      </div>

      <div className="python-panel glass">
        <div className="python-header">
          <h3>Python Implementation</h3>
          <span className="badge glass">Algorithm</span>
        </div>
        <div className="python-code-block">
          <pre>
            <code>{pythonCode}</code>
          </pre>
        </div>
        <div className="python-output-box glass">
          <h4>Output</h4>
          <div className="output-content">
            <p>Maximum Depth: 3</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaxDepth;
