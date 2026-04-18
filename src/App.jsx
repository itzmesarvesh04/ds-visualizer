import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import StackVisualizer from './pages/StackVisualizer';
import QueueVisualizer from './pages/QueueVisualizer';
import LinkedListVisualizer from './pages/LinkedListVisualizer';
import TreeVisualizer from './pages/TreeVisualizer';
import GraphVisualizer from './pages/GraphVisualizer';
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
            <Route path="stack" element={<StackVisualizer />} />
            <Route path="queue" element={<QueueVisualizer />} />
            <Route path="linkedlist" element={<LinkedListVisualizer />} />
            <Route path="tree" element={<TreeVisualizer />} />
            <Route path="graph" element={<GraphVisualizer />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;