import React, { useState, useEffect } from 'react';
import './AvailableCustomChallenges.css';

const AvailableCustomChallenges = ({ onChallengeJoined }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    type: ''
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'biking', label: 'Biking' },
    { value: 'recycling', label: 'Recycling' },
    { value: 'walking', label: 'Walking' },
    { value: 'public_transport', label: 'Public Transport' },
    { value: 'reusable_bag', label: 'Reusable Bags' },
    { value: 'energy_saving', label: 'Energy Saving' },
    { value: 'water_conservation', label: 'Water Conservation' },
    { value: 'waste_reduction', label: 'Waste Reduction' }
  ];

  const difficulties = [
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'extreme', label: 'Extreme' }
  ];

  const types = [
    { value: '', label: 'All Types' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'milestone', label: 'Milestone' }
  ];

  useEffect(() => {
    fetchAvailableChallenges();
  }, []);

  const fetchAvailableChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/custom-challenges/available', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch challenges');
      }
    } catch (error) {
      console.error('Fetch challenges error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoinLoading(prev => ({ ...prev, [challengeId]: true }));
      
      const response = await fetch(`/api/custom-challenges/join/${challengeId}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Update the challenge in the list to show as joined
        setChallenges(prev => prev.map(challenge => 
          challenge._id === challengeId 
            ? { ...challenge, userParticipating: true, participantCount: challenge.participantCount + 1 }
            : challenge
        ));
        
        if (onChallengeJoined) {
          onChallengeJoined(data.challenge);
        }
      } else {
        setError(data.message || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Join challenge error:', error);
      setError('Network error. Please try again.');
    } finally {
      setJoinLoading(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('query', searchQuery);
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.type) params.append('type', filters.type);

      const response = await fetch(`/api/custom-challenges/search?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ category: '', difficulty: '', type: '' });
    fetchAvailableChallenges();
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

  if (loading) {
    return (
      <div className="available-challenges-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading available challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="available-challenges-container">
      <div className="challenges-header">
        <h2>Available Custom Challenges</h2>
        <p>Join challenges created by other users in the community</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="dismiss-btn">×</button>
        </div>
      )}

      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="search-btn">🔍</button>
        </div>

        <div className="filters">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
          >
            {difficulties.map(diff => (
              <option key={diff.value} value={diff.value}>{diff.label}</option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <button onClick={clearFilters} className="clear-filters-btn">Clear</button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="no-challenges">
          <div className="no-challenges-icon">🎯</div>
          <h3>No community challenges available</h3>
          <p>No other users have created public challenges yet. Be the first to create a challenge for the community!</p>
          <div className="no-challenges-note">
            <small>💡 Only challenges created by other users will appear here. Your own challenges can be found in the "My Challenges" tab.</small>
          </div>
        </div>
      ) : (
        <div className="challenges-grid">
          {challenges.map(challenge => (
            <div key={challenge._id} className="challenge-card">
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
                  <span className="challenge-type">{challenge.type}</span>
                </div>
              </div>

              <div className="challenge-content">
                <h3 className="challenge-title">{challenge.title}</h3>
                <p className="challenge-description">{challenge.description}</p>
                
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
                    <span className="label">Creator:</span>
                    <span className="value">{challenge.creatorName}</span>
                  </div>
                </div>

                <div className="challenge-stats">
                  <div className="stat">
                    <span className="stat-number">{challenge.participantCount}</span>
                    <span className="stat-label">Participants</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{challenge.completionRate}%</span>
                    <span className="stat-label">Completion</span>
                  </div>
                  {challenge.daysRemaining !== null && (
                    <div className="stat">
                      <span className="stat-number">{challenge.daysRemaining}</span>
                      <span className="stat-label">Days Left</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="challenge-actions">
                {challenge.userParticipating ? (
                  <button className="joined-btn" disabled>
                    ✓ Already Joined
                  </button>
                ) : !challenge.meetsRequirements ? (
                  <button className="requirements-btn" disabled>
                    Level {challenge.requirements?.minLevel || 1} Required
                  </button>
                ) : (
                  <button
                    className="join-btn"
                    onClick={() => handleJoinChallenge(challenge._id)}
                    disabled={joinLoading[challenge._id]}
                  >
                    {joinLoading[challenge._id] ? 'Joining...' : 'Join Challenge'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="refresh-section">
        <button onClick={fetchAvailableChallenges} className="refresh-btn">
          🔄 Refresh Challenges
        </button>
      </div>
    </div>
  );
};

export default AvailableCustomChallenges;
