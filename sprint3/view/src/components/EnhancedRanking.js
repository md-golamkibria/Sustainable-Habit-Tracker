import React, { useState, useEffect } from 'react';
import './EnhancedRanking.css';

const EnhancedRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [timeframe, setTimeframe] = useState('all');
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchAchievements();
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [selectedCategory, timeframe, page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/ranking/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ranking/leaderboard?category=${selectedCategory}&timeframe=${timeframe}&page=${page}&limit=20`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data.success) {
        setRankings(data.data.rankings);
        setCurrentUser(data.data.currentUser);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/ranking/achievements', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAchievements(data.data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const updateRankings = async () => {
    try {
      const response = await fetch('/api/ranking/update', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        fetchRankings();
      }
    } catch (error) {
      console.error('Error updating rankings:', error);
    }
  };

  const getRankChangeIcon = (rankChange) => {
    switch (rankChange) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'same': return '➖';
      case 'new': return '🆕';
      default: return '';
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    if (rank <= 50) return '🎖️';
    return '🏅';
  };

  const getAchievementRarity = (rarity) => {
    const rarityColors = {
      common: '#6b7280',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return rarityColors[rarity] || rarityColors.common;
  };

  return (
    <div className="enhanced-ranking">
      <div className="ranking-header">
        <h2>🏆 Global Rankings</h2>
        <p>See where you stand among sustainability champions worldwide</p>
      </div>

      <div className="ranking-controls">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category.id);
                setPage(1);
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-count">({category.userCount})</span>
            </button>
          ))}
        </div>

        <div className="timeframe-selector">
          <select 
            value={timeframe} 
            onChange={(e) => {
              setTimeframe(e.target.value);
              setPage(1);
            }}
            className="timeframe-select"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>

        <button onClick={updateRankings} className="update-btn">
          🔄 Update Rankings
        </button>
      </div>

      {currentUser && (
        <div className="current-user-rank">
          <div className="rank-card your-rank">
            <div className="rank-badge">{getRankBadge(currentUser.rank)}</div>
            <div className="rank-info">
              <h3>Your Current Rank</h3>
              <div className="rank-details">
                <span className="rank-number">#{currentUser.rank || 'Unranked'}</span>
                <span className="rank-change">
                  {getRankChangeIcon(currentUser.rankChange)}
                  {currentUser.rankChange}
                </span>
              </div>
              <div className="score-info">
                <span>Score: {currentUser.sustainabilityScore}</span>
                <span>Goals: {currentUser.totalGoalsCompleted}</span>
                <span>Actions: {currentUser.totalActionsCompleted}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rankings-section">
        <div className="section-header">
          <h3>
            {categories.find(c => c.id === selectedCategory)?.name || 'Overall'} Leaderboard
          </h3>
          <p>{categories.find(c => c.id === selectedCategory)?.description}</p>
        </div>

        {loading ? (
          <div className="loading">Loading rankings...</div>
        ) : (
          <div className="rankings-list">
            {rankings.map((ranking, index) => (
              <div key={ranking._id} className="ranking-item">
                <div className="rank-position">
                  <span className="rank-badge">{getRankBadge(ranking.position)}</span>
                  <span className="rank-number">#{ranking.position}</span>
                </div>
                
                <div className="user-info">
                  <div className="user-avatar">
                    {ranking.user.profile?.avatar ? (
                      <img src={ranking.user.profile.avatar} alt={ranking.user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {ranking.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <h4>{ranking.user.profile?.firstName} {ranking.user.profile?.lastName}</h4>
                    <p>@{ranking.user.username}</p>
                  </div>
                </div>

                <div className="ranking-stats">
                  <div className="stat">
                    <label>Score</label>
                    <span>{ranking.sustainabilityScore}</span>
                  </div>
                  <div className="stat">
                    <label>Goals</label>
                    <span>{ranking.totalGoalsCompleted}</span>
                  </div>
                  <div className="stat">
                    <label>Actions</label>
                    <span>{ranking.totalActionsCompleted}</span>
                  </div>
                </div>

                <div className="rank-change">
                  {getRankChangeIcon(ranking.rankChange)}
                  <span className={`change-text ${ranking.rankChange}`}>
                    {ranking.rankChange}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button 
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {achievements.length > 0 && (
        <div className="achievements-section">
          <h3>🏅 Your Ranking Achievements</h3>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className="achievement-card"
                style={{ borderColor: getAchievementRarity(achievement.rarity) }}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  <span className={`rarity ${achievement.rarity}`}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRanking;
