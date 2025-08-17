import React, { useState } from 'react';
import CreateCustomChallenge from './CreateCustomChallenge';
import './CustomChallengesHub.css';

const CustomChallengesHub = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleChallengeCreated = (challenge) => {
    // Switch to my-created tab and refresh the list
    setActiveTab('my-created');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChallengeJoined = (challenge) => {
    // Could show a success notification or update UI
    console.log('Joined challenge:', challenge.title);
  };

  const tabs = [
    {
      id: 'create',
      label: 'Create Challenge',
      icon: '➕',
      description: 'Create your own custom challenge for the community'
    },
    {
      id: 'my-created',
      label: 'My Challenges',
      icon: '👤',
      description: 'View and manage challenges you\'ve created and joined'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <CreateCustomChallenge 
            onChallengeCreated={handleChallengeCreated}
          />
        );
      case 'my-created':
        return <MyCreatedChallenges />;
      default:
        return (
          <CreateCustomChallenge 
            onChallengeCreated={handleChallengeCreated}
          />
        );
    }
  };

  return (
    <div className="custom-challenges-hub">
      <div className="hub-header">
        <h1>Custom Challenges</h1>
        <p>Create, discover, and join community challenges to boost your sustainability journey</p>
      </div>

      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <div className="tab-content">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="tab-content-container">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Component for displaying user's created challenges AND joined challenges
const MyCreatedChallenges = () => {
  const [challengeData, setChallengeData] = useState({
    created: [],
    joined: [],
    all: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  React.useEffect(() => {
    fetchMyChallenges();
  }, []);

  const fetchMyChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/custom-challenges/my-created', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setChallengeData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch your challenges');
      }
    } catch (error) {
      console.error('Fetch my challenges error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      case 'extreme': return '#9c27b0';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      biking: '🚴',
      recycling: '♻️',
      walking: '🚶',
      public_transport: '🚌',
      reusable_bag: '🛍️',
      energy_saving: '💡',
      water_conservation: '💧',
      waste_reduction: '🗑️',
      general: '🌱'
    };
    return icons[category] || '🌱';
  };

  const getFilteredChallenges = () => {
    switch (activeFilter) {
      case 'created':
        return challengeData.created;
      case 'joined':
        return challengeData.joined;
      default:
        return challengeData.all;
    }
  };

  if (loading) {
    return (
      <div className="my-challenges-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-challenges-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const filteredChallenges = getFilteredChallenges();

  if (challengeData.all.length === 0) {
    return (
      <div className="my-challenges-container">
        <div className="no-challenges">
          <div className="no-challenges-icon">🎯</div>
          <h3>No challenges yet</h3>
          <p>You haven't created or joined any challenges yet. Start by creating your first challenge or browse available community challenges!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-challenges-container">
      <div className="challenges-header">
        <h2>My Challenges</h2>
        <p>Manage challenges you've created and track your progress in joined challenges</p>
      </div>

      <div className="challenge-filters">
        <button 
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({challengeData.all.length})
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'created' ? 'active' : ''}`}
          onClick={() => setActiveFilter('created')}
        >
          Created ({challengeData.created.length})
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveFilter('joined')}
        >
          Joined ({challengeData.joined.length})
        </button>
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="no-challenges">
          <div className="no-challenges-icon">🎯</div>
          <h3>No {activeFilter} challenges</h3>
          <p>
            {activeFilter === 'created' && "You haven't created any challenges yet."}
            {activeFilter === 'joined' && "You haven't joined any challenges yet."}
          </p>
        </div>
      ) : (
        <div className="challenges-grid">
          {filteredChallenges.map(challenge => (
            <div key={challenge._id} className={`my-challenge-card ${challenge.challengeType}`}>
              <div className="challenge-header">
                <div className="challenge-icon">
                  {getCategoryIcon(challenge.category)}
                </div>
                <div className="challenge-meta">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
                  >
                    {challenge.difficulty}
                  </span>
                  <span className={`challenge-type-badge ${challenge.challengeType}`}>
                    {challenge.challengeType === 'created' ? '👤 Created' : '🤝 Joined'}
                  </span>
                  {challenge.challengeType === 'created' && (
                    <span className={`visibility-badge ${challenge.visibility}`}>
                      {challenge.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                    </span>
                  )}
                  <span className={`status-badge ${challenge.isActive ? 'active' : 'inactive'}`}>
                    {challenge.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="challenge-content">
                <h3 className="challenge-title">{challenge.title}</h3>
                <p className="challenge-description">{challenge.description}</p>
                
                {challenge.challengeType === 'joined' && (
                  <div className="creator-info">
                    <span className="creator-label">Created by:</span>
                    <span className="creator-name">{challenge.creatorName}</span>
                  </div>
                )}
                
                <div className="challenge-details">
                  <div className="detail-item">
                    <span className="label">Target:</span>
                    <span className="value">{challenge.target.value} {challenge.target.unit}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Reward:</span>
                    <span className="value">{challenge.reward.points} points</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Type:</span>
                    <span className="value">{challenge.type}</span>
                  </div>
                  {challenge.challengeType === 'joined' && (
                    <div className="detail-item">
                      <span className="label">Progress:</span>
                      <span className="value">{challenge.userProgress}/{challenge.target.value}</span>
                    </div>
                  )}
                </div>

                <div className="challenge-stats">
                  <div className="stat">
                    <span className="stat-number">{challenge.participantCount}</span>
                    <span className="stat-label">Participants</span>
                  </div>
                  {challenge.challengeType === 'created' && (
                    <div className="stat">
                      <span className="stat-number">{challenge.completionRate}%</span>
                      <span className="stat-label">Completion</span>
                    </div>
                  )}
                  {challenge.challengeType === 'joined' && (
                    <div className="stat">
                      <span className="stat-number">{Math.round(challenge.progressPercentage)}%</span>
                      <span className="stat-label">Progress</span>
                    </div>
                  )}
                  {challenge.daysRemaining !== null && (
                    <div className="stat">
                      <span className="stat-number">{challenge.daysRemaining}</span>
                      <span className="stat-label">Days Left</span>
                    </div>
                  )}
                </div>

                {challenge.challengeType === 'created' && challenge.participantNames && challenge.participantNames.length > 0 && (
                  <div className="participants-preview">
                    <span className="participants-label">Recent participants:</span>
                    <span className="participants-list">
                      {challenge.participantNames.join(', ')}
                      {challenge.participantCount > challenge.participantNames.length && 
                        ` and ${challenge.participantCount - challenge.participantNames.length} more`
                      }
                    </span>
                  </div>
                )}

                {challenge.challengeType === 'joined' && challenge.userCompleted && (
                  <div className="completion-badge">
                    ✅ Completed!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomChallengesHub;
