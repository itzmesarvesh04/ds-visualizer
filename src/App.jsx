import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import StackVisualizer from './pages/StackVisualizer';
import QueueVisualizer from './pages/QueueVisualizer';
import LinkedListVisualizer from './pages/LinkedListVisualizer';
import TreeVisualizer from './pages/TreeVisualizer';
import GraphVisualizer from './pages/GraphVisualizer';
import './index.css';

function App() {
  return (
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
  );
}

export default App;
