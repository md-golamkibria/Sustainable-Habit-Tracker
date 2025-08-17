import React, { useState, useEffect } from 'react';
import './CompareResults.css';

const CompareResults = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/compare/users?search=${searchTerm}&limit=10`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const compareWithUser = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/compare/${userId}?timeframe=${timeframe}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setComparison(data.data);
        setSelectedUser(userId);
      }
    } catch (error) {
      console.error('Error comparing users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDifference = (diff, isPositive = true) => {
    const sign = diff > 0 ? '+' : '';
    const color = (isPositive && diff > 0) || (!isPositive && diff < 0) ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{sign}{diff}</span>;
  };

  const getPerformanceIcon = (diff, isPositive = true) => {
    if (diff === 0) return '➖';
    if ((isPositive && diff > 0) || (!isPositive && diff < 0)) return '📈';
    return '📉';
  };

  return (
    <div className="compare-results">
      <div className="compare-header">
        <h2>🏆 Compare Your Results</h2>
        <p>See how you stack up against other sustainability champions</p>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users to compare with..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="timeframe-selector">
          <label>Time Period:</label>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      <div className="users-grid">
        {users.map(user => (
          <div key={user._id} className="user-card">
            <div className="user-info">
              <div className="user-avatar">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h3>{user.profile?.firstName} {user.profile?.lastName}</h3>
                <p>@{user.username}</p>
                <div className="user-stats">
                  <span>🎯 {user.stats.goalsCompleted} goals</span>
                  <span>⚡ {user.stats.actionsCompleted} actions</span>
                  <span>🏆 Rank #{user.stats.rank || 'Unranked'}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => compareWithUser(user._id)}
              className="compare-btn"
              disabled={loading}
            >
              {loading && selectedUser === user._id ? 'Comparing...' : 'Compare'}
            </button>
          </div>
        ))}
      </div>

      {comparison && (
        <div className="comparison-results">
          <div className="comparison-header">
            <h3>📊 Comparison Results</h3>
            <p>You vs {comparison.compareUser.profile?.firstName} {comparison.compareUser.profile?.lastName}</p>
          </div>

          <div className="comparison-grid">
            <div className="comparison-section">
              <h4>🎯 Goals Performance</h4>
              <div className="metrics-grid">
                <div className="metric">
                  <label>Goals Completed</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.goals.completed}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.goals.completed}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.goals.completedDiff)}
                      {formatDifference(comparison.differences.goals.completedDiff)}
                    </span>
                  </div>
                </div>
                
                <div className="metric">
                  <label>Completion Rate</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.goals.completionRate}%</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.goals.completionRate}%</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.goals.completionRateDiff)}
                      {formatDifference(comparison.differences.goals.completionRateDiff.toFixed(1))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="comparison-section">
              <h4>⚡ Actions Performance</h4>
              <div className="metrics-grid">
                <div className="metric">
                  <label>Actions Completed</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.actions.completed}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.actions.completed}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.actions.completedDiff)}
                      {formatDifference(comparison.differences.actions.completedDiff)}
                    </span>
                  </div>
                </div>
                
                <div className="metric">
                  <label>Recent Activity ({timeframe})</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.actions.recent}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.actions.recent}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.actions.recentDiff)}
                      {formatDifference(comparison.differences.actions.recentDiff)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="comparison-section">
              <h4>🌱 Environmental Impact</h4>
              <div className="metrics-grid">
                <div className="metric">
                  <label>CO2 Saved (kg)</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.environmentalImpact.co2Saved}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.environmentalImpact.co2Saved}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.environmentalImpact.co2SavedDiff)}
                      {formatDifference(comparison.differences.environmentalImpact.co2SavedDiff.toFixed(1))}
                    </span>
                  </div>
                </div>
                
                <div className="metric">
                  <label>Water Saved (L)</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.environmentalImpact.waterSaved}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.environmentalImpact.waterSaved}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.environmentalImpact.waterSavedDiff)}
                      {formatDifference(comparison.differences.environmentalImpact.waterSavedDiff.toFixed(1))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="comparison-section">
              <h4>🏆 Rankings</h4>
              <div className="metrics-grid">
                <div className="metric">
                  <label>Sustainability Score</label>
                  <div className="metric-comparison">
                    <span className="your-score">{comparison.currentUser.stats.ranking.score}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">{comparison.compareUser.stats.ranking.score}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.ranking.scoreDiff)}
                      {formatDifference(comparison.differences.ranking.scoreDiff)}
                    </span>
                  </div>
                </div>
                
                <div className="metric">
                  <label>Global Rank</label>
                  <div className="metric-comparison">
                    <span className="your-score">#{comparison.currentUser.stats.ranking.rank || 'Unranked'}</span>
                    <span className="vs">vs</span>
                    <span className="their-score">#{comparison.compareUser.stats.ranking.rank || 'Unranked'}</span>
                    <span className="difference">
                      {getPerformanceIcon(comparison.differences.ranking.rankDiff, false)}
                      {formatDifference(comparison.differences.ranking.rankDiff, false)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-insights">
            <h4>💡 Insights</h4>
            <div className="insights-grid">
              {comparison.differences.goals.completedDiff > 0 && (
                <div className="insight positive">
                  <span className="icon">🎯</span>
                  <span>You've completed {comparison.differences.goals.completedDiff} more goals!</span>
                </div>
              )}
              {comparison.differences.actions.completedDiff > 0 && (
                <div className="insight positive">
                  <span className="icon">⚡</span>
                  <span>You've taken {comparison.differences.actions.completedDiff} more actions!</span>
                </div>
              )}
              {comparison.differences.ranking.scoreDiff > 0 && (
                <div className="insight positive">
                  <span className="icon">🏆</span>
                  <span>Your sustainability score is {comparison.differences.ranking.scoreDiff} points higher!</span>
                </div>
              )}
              {comparison.differences.environmentalImpact.co2SavedDiff > 0 && (
                <div className="insight positive">
                  <span className="icon">🌱</span>
                  <span>You've saved {comparison.differences.environmentalImpact.co2SavedDiff.toFixed(1)}kg more CO2!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareResults;
