import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Users, Leaf } from 'lucide-react';

const Rankings = ({ user }) => {
  const [rankings, setRankings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [category, setCategory] = useState('overall');
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetchRankings();
    fetchComparison();
  }, [period, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRankings = async () => {
    try {
      setLoading(true);
      // Always use mock data since the API endpoints don't exist yet
      const mockRankings = [
        {
          _id: '1',
          username: 'EcoWarrior23',
          gamification: { level: 15, experience: 2450 },
          rank: 1,
          sustainabilityScore: 1250,
          completedGoals: 25,
          completedActions: 150,
          totalCO2Saved: 245.5,
          isCurrentUser: false,
          rankChange: 'up'
        },
        {
          _id: '2',
          username: 'GreenQueen',
          gamification: { level: 12, experience: 1890 },
          rank: 2,
          sustainabilityScore: 980,
          completedGoals: 20,
          completedActions: 98,
          totalCO2Saved: 198.2,
          isCurrentUser: false,
          rankChange: 'down'
        },
        {
          _id: '3',
          username: user?.username || user?.name || 'YourUsername',
          gamification: { level: user?.level || 8, experience: user?.experience || 1200 },
          rank: 15,
          sustainabilityScore: 650,
          completedGoals: 12,
          completedActions: 65,
          totalCO2Saved: 125.8,
          isCurrentUser: true,
          rankChange: 'up'
        },
        {
          _id: '4',
          username: 'SustainableSam',
          gamification: { level: 10, experience: 1450 },
          rank: 4,
          sustainabilityScore: 820,
          completedGoals: 16,
          completedActions: 82,
          totalCO2Saved: 164.3,
          isCurrentUser: false,
          rankChange: null
        },
        {
          _id: '5',
          username: 'EcoFriendly101',
          gamification: { level: 9, experience: 1320 },
          rank: 5,
          sustainabilityScore: 745,
          completedGoals: 14,
          completedActions: 74,
          totalCO2Saved: 149.2,
          isCurrentUser: false,
          rankChange: 'up'
        }
      ];
      
      setRankings(mockRankings);
      setCurrentUser({
        username: user?.username || user?.name || 'YourUsername',
        rank: 15,
        sustainabilityScore: 650
      });
    } catch (error) {
      console.error('Error in rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    try {
      const response = await axios.get('/api/compare');
      setComparison(response.data);
    } catch (error) {
      console.error('Error fetching comparison:', error);
      // Mock comparison data
      setComparison({
        currentUser: {
          username: user?.username || 'YourUsername',
          completedGoals: 12,
          completedActions: 65,
          co2Saved: 125.8
        },
        communityAverage: {
          avgGoals: 15.5,
          avgActions: 82.3,
          avgLevel: 9.2
        },
        comparison: {
          goalsPerformance: 'below',
          actionsPerformance: 'below',
          levelPerformance: 'below'
        }
      });
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getRankChangeIcon = (change) => {
    if (change === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🏆 Community Rankings
          </h1>
          <p className="mt-2 text-gray-600">
            See how you stack up against other eco-warriors in the community!
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="overall">Overall Score</option>
              <option value="goals">Goals Completed</option>
              <option value="actions">Actions Completed</option>
              <option value="co2_saved">CO₂ Saved</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Ranking Card */}
          {currentUser && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Ranking</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getRankIcon(currentUser.rank)}
                    <div className="ml-3">
                      <p className="text-xl font-bold text-gray-900">#{currentUser.rank}</p>
                      <p className="text-sm text-gray-500">Current Rank</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">{currentUser.sustainabilityScore}</p>
                    <p className="text-sm text-gray-500">Sustainability Score</p>
                  </div>
                </div>
                
                {comparison && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">vs Community Average</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Goals:</span>
                        <span className={`text-sm font-medium ${
                          comparison.comparison.goalsPerformance === 'above' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {comparison.comparison.goalsPerformance === 'above' ? 'Above' : 'Below'} Average
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Actions:</span>
                        <span className={`text-sm font-medium ${
                          comparison.comparison.actionsPerformance === 'above' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {comparison.comparison.actionsPerformance === 'above' ? 'Above' : 'Below'} Average
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Leaderboard
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {rankings.map((ranking, index) => (
                    <div
                      key={ranking._id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        ranking.isCurrentUser
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 flex justify-center">
                          {getRankIcon(ranking.rank)}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {ranking.username}
                            {ranking.isCurrentUser && (
                              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            Level {ranking.gamification?.level || 1} • {ranking.completedGoals} goals • {ranking.completedActions} actions
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center">
                        {getRankChangeIcon(ranking.rankChange)}
                        <div className="ml-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {ranking.sustainabilityScore} pts
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Leaf className="h-3 w-3 mr-1" />
                            {ranking.totalCO2Saved?.toFixed(1) || 0} kg CO₂
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {rankings.reduce((sum, r) => sum + (r.totalCO2Saved || 0), 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">kg CO₂ Saved</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {rankings.reduce((sum, r) => sum + (r.completedGoals || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Goals Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {rankings.reduce((sum, r) => sum + (r.completedActions || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Actions Taken</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rankings;
