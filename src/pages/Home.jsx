import { Link } from 'react-router-dom';

export default function Home() {
  const scrollToFeatures = () => {
    document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero" id="home">
        <div className="hero-content">
          <h1>Visualize. Learn. <br/><span className="text-gradient">Master Data Structures.</span></h1>
          <p>An interactive platform to understand data structures step-by-step with stunning visuals and animations.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large glow-btn" onClick={scrollToFeatures}>
              Explore Visualizer
            </button>
            <button className="btn btn-secondary glass btn-large" style={{ background: 'var(--glass-bg)' }}>
              View Documentation
            </button>
          </div>
        </div>
        <div className="hero-graphic">
          <img src="/assets/hero_illustration.png" alt="3D Technology abstract" className="hero-img floating"/>
        </div>
      </section>

      <section className="features" id="visualizer">
        <div className="section-header">
          <h2>Supported Data Structures</h2>
          <p>Master these core concepts with interactive 3D step-by-step visualizations.</p>
        </div>
        <div className="card-grid">
          {/* Card 1 */}
          <Link to="/stack" className="card glass interactive">
            <div className="card-icon blue-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20h16v2H4v-2zM4 14h16v4H4v-4zM4 8h16v4H4V8zM4 2h16v4H4V2z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Stack</h3>
            <p>LIFO (Last In, First Out) structure. Understand push, pop, and peek operations visually.</p>
          </Link>
          
          {/* Card 2 */}
          <Link to="/queue" className="card glass interactive">
            <div className="card-icon purple-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 6H2V8h20V6zM22 10H2v2h20v-2zM22 14H2v2h20v-2zM22 18H2v2h20v-2z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Queue</h3>
            <p>FIFO (First In, First Out) structure. Learn enqueue, dequeue, and circular queues effectively.</p>
          </Link>

          {/* Card 3 */}
          <Link to="/linkedlist" className="card glass interactive">
            <div className="card-icon cyan-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="12" r="3" fill="currentColor"/>
                <circle cx="19" cy="12" r="3" fill="currentColor"/>
                <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Linked List</h3>
            <p>Sequential collection of nodes. Master single, double, and circular linked lists with animations.</p>
          </Link>

          {/* Card 4 */}
          <Link to="/tree" className="card glass interactive">
            <div className="card-icon pink-glow">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="3" fill="currentColor"/>
                <circle cx="6" cy="17" r="3" fill="currentColor"/>
                <circle cx="18" cy="17" r="3" fill="currentColor"/>
                <path d="M10.5 7.5l-3 7M13.5 7.5l3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               </svg>
            </div>
            <h3>Tree</h3>
            <p>Hierarchical structures. Understand BST, AVL, and complex traversals like Inorder, Preorder, Postorder.</p>
          </Link>

          {/* Card 5 */}
          <Link to="/graph" className="card glass interactive">
            <div className="card-icon orange-glow">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="4" r="2" fill="currentColor"/>
                <circle cx="19" cy="10" r="2" fill="currentColor"/>
                <circle cx="19" cy="18" r="2" fill="currentColor"/>
                <circle cx="5" cy="18" r="2" fill="currentColor"/>
                <circle cx="5" cy="10" r="2" fill="currentColor"/>
                <path d="M12 6l6 3M19 12l0 4M17 19l-11 0M5 16l0-4M6 9l5-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               </svg>
            </div>
            <h3>Graph</h3>
            <p>Network models. Dive deep into BFS, DFS, Dijkstra's algorithm and shortest paths strategies.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
