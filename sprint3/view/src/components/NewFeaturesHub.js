import React, { useState } from 'react';
import CompareResults from './CompareResults';
import EnhancedRanking from './EnhancedRanking';
import EnhancedEvents from './EnhancedEvents';
import './NewFeaturesHub.css';

const NewFeaturesHub = ({ user }) => {
  const [activeFeature, setActiveFeature] = useState('compare');

  const features = [
    {
      id: 'compare',
      name: 'Compare Results',
      icon: '🏆',
      description: 'Compare your sustainability performance with other users',
      component: CompareResults
    },
    {
      id: 'ranking',
      name: 'Global Rankings',
      icon: '🏅',
      description: 'See where you stand among sustainability champions',
      component: EnhancedRanking
    },
    {
      id: 'events',
      name: 'Sustainability Events',
      icon: '🌍',
      description: 'Discover nature and personal development events near you',
      component: EnhancedEvents
    }
  ];

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component;

  return (
    <div className="new-features-hub">
      <div className="hub-header">
        <h1>🌟 More</h1>
        <p>Discover powerful new tools to enhance your sustainability journey</p>
      </div>

      <div className="feature-navigation">
        {features.map(feature => (
          <button
            key={feature.id}
            className={`feature-nav-btn ${activeFeature === feature.id ? 'active' : ''}`}
            onClick={() => setActiveFeature(feature.id)}
          >
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-info">
              <h3>{feature.name}</h3>
              <p>{feature.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="feature-content">
        {ActiveComponent && <ActiveComponent user={user} />}
      </div>
    </div>
  );
};

export default NewFeaturesHub;
