import React from 'react';

const BFS = () => {
  const testCase = 'Graph with 5 vertices';
  
  const pythonCode = `from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    result = []
    
    while queue:
        vertex = queue.popleft()
        result.append(vertex)
        
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return result

# Test Graph
graph = {
    0: [1, 2],
    1: [0, 3],
    2: [0, 4],
    3: [1],
    4: [2]
}

print(f"BFS from vertex 0: {bfs(graph, 0)}")`;

  return (
    <div className="parenthesis-wrapper-container">
      <div className="visualizer-section">
        <main className="visualizer-page">
          <div className="visualizer-header">
            <h1 className="text-gradient">Breadth-First Search (BFS)</h1>
            <p>Visualize exploring a graph level by level using a queue.</p>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            [Visualizer Component Placeholder]
            <br/>
            Graph: {testCase}
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
            <p>BFS from vertex 0: [0, 1, 2, 3, 4]</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BFS;
