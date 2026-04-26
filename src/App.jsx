import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import StackVisualizer from './pages/StackVisualizer';
import QueueVisualizer from './pages/QueueVisualizer';
import LinkedListVisualizer from './pages/LinkedListVisualizer';
import TreeVisualizer from './pages/TreeVisualizer';
import GraphVisualizer from './pages/GraphVisualizer';
import BFS from './pages/code-visualizer/Pages/Graph/BFS';
import MiddleNode from './pages/code-visualizer/Pages/LinkedList/MiddleNode';
import ReverseLinkedList from './pages/code-visualizer/Pages/LinkedList/ReverseLinkedList';
import StackUsingQueuesPopCostly from './pages/code-visualizer/Pages/Queue/StackUsingQueuesPopCostly';
import ParenthesisWrapper from './pages/code-visualizer/Pages/Stack/ParenthesisWrapper';
import StringReversalWrapper from './pages/code-visualizer/Pages/Stack/StringReversalWrapper';
import MaxDepth from './pages/code-visualizer/Pages/Tree/MaxDepth';
import DSLearningPath from './pages/DSLearningPath';
import DSQuiz from './pages/DSQuiz';
import DSApplication from './pages/DSApplication';
import './index.css';


export const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ds-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('ds-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            
            {/* Code Visualizer routes should come before dynamic DS routes */}
            <Route path="code-visualizer/graph/bfs" element={<BFS />} />
            <Route path="code-visualizer/linkedlist/middle-node" element={<MiddleNode />} />
            <Route path="code-visualizer/linkedlist/reverse" element={<ReverseLinkedList />} />
            <Route path="code-visualizer/queue/lifo-stack" element={<StackUsingQueuesPopCostly />} />
            <Route path="code-visualizer/queue/stack-using-queues" element={<StackUsingQueuesPopCostly />} />
            <Route path="code-visualizer/stack/parenthesis" element={<ParenthesisWrapper />} />
            <Route path="code-visualizer/stack/parenthesis-checker" element={<ParenthesisWrapper />} />
            <Route path="code-visualizer/stack/reverse-string" element={<StringReversalWrapper />} />
            <Route path="code-visualizer/stack/string-reversal" element={<StringReversalWrapper />} />
            <Route path="code-visualizer/tree/max-depth" element={<MaxDepth />} />

            {/* Dynamic DS Learning Path */}
            <Route path=":ds" element={<DSLearningPath />} />
            
            {/* Specific Theory Routes */}
            <Route path="stack/theory" element={<StackVisualizer />} />
            <Route path="queue/theory" element={<QueueVisualizer />} />
            <Route path="linkedlist/theory" element={<LinkedListVisualizer />} />
            <Route path="tree/theory" element={<TreeVisualizer />} />
            <Route path="graph/theory" element={<GraphVisualizer />} />
            
            {/* Dynamic Quiz & Application Routes */}
            <Route path=":ds/quiz" element={<DSQuiz />} />
            <Route path=":ds/application" element={<DSApplication />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;