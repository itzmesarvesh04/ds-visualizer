import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { dsConfig } from '../data/dsConfig';
import StackVisualizer from './StackVisualizer';
import QueueVisualizer from './QueueVisualizer';
import LinkedListVisualizer from './LinkedListVisualizer';
import TreeVisualizer from './TreeVisualizer';
import GraphVisualizer from './GraphVisualizer';
import PlateStack from './applications/PlateStack';
import PeopleQueue from './applications/PeopleQueue';
import TrainList from './applications/TrainList';




const visualizerMap = {
  stack: StackVisualizer,
  queue: QueueVisualizer,
  linkedlist: LinkedListVisualizer,
  tree: TreeVisualizer,
  graph: GraphVisualizer
};

export default function DSApplication() {
  const { ds } = useParams();
  const config = dsConfig[ds.toLowerCase()];
  const VisualizerComponent = visualizerMap[ds.toLowerCase()];

  if (!config) return <div>Not Found</div>;

  return (
    <div className="application-page" style={{ padding: '100px 2% 40px' }}>
      <div className="application-header glass" style={{ 
        margin: '0 auto 2rem', padding: '2rem', borderRadius: '24px', 
        maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div className="badge" style={{ marginBottom: '0.5rem' }}>Application Scenario</div>
          <h2 style={{ margin: 0 }}>{config.application.title} <span className="text-gradient">Using {config.title}</span></h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>{config.application.description}</p>
        </div>
        <Link to={`/${ds}`} className="btn btn-secondary glass">
          Back to Path
        </Link>
      </div>

      <div className="application-layout" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="scenario-card glass" style={{ 
          padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem',
          borderLeft: '4px solid var(--secondary-color)', background: 'rgba(139, 92, 246, 0.05)'
        }}>
          <h4 style={{ color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>The Scenario</h4>
          <p style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{config.application.scenario}</p>
        </div>

        <div className="application-visualizer-container" style={{ position: 'relative' }}>
          <div className="app-ui-overlay" style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '99px',
            fontSize: '0.8rem', color: '#fff', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            Application UI Mode: Active
          </div>
          <div className="wrapped-visualizer">
             {ds.toLowerCase() === 'stack' ? (
               <PlateStack />
             ) : ds.toLowerCase() === 'queue' ? (
               <PeopleQueue />
             ) : ds.toLowerCase() === 'linkedlist' ? (
               <TrainList />
             ) : (
               VisualizerComponent ? <VisualizerComponent isApplicationMode={true} /> : <p>Visualizer coming soon...</p>
             )}

          </div>

        </div>
      </div>

    </div>
  );
}
