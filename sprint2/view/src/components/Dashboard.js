import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { Calendar, Target, TrendingUp, Leaf } from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    todayActions: 0,
    weeklyActions: 0,
    totalActions: 0,
    currentStreak: 0
  });
  const [recentActions, setRecentActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/analytics/dashboard');
      const analytics = res.data;
      setStats({
        todayActions: analytics.overview.today.totalActions,
        weeklyActions: analytics.overview.week.totalActions,
        totalActions: analytics.overview.allTime.totalActions,
        currentStreak: analytics.achievements.currentStreak
      });
      // Get the most recent actions from dailyActivity (last 3 days with actions)
      const recent = analytics.trends.dailyActivity
        .filter(day => day.actions > 0)
        .slice(-3)
        .reverse();
      setRecentActions(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50">
        <Navigation user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center py-12">
          <div className="text-xl text-green-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Navigation user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.username}!
                </h1>
                <p className="text-gray-600">
                  Ready to make a positive impact today?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Actions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.todayActions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Weekly Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.weeklyActions}/{user.goals?.weeklyTarget || 21}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Current Streak
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.currentStreak} days
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Actions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalActions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      🚴
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Log Biking</h4>
                      <p className="text-sm text-gray-500">Record your bike commute</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      ♻️
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Log Recycling</h4>
                      <p className="text-sm text-gray-500">Track recycled items</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                      🚶
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Log Walking</h4>
                      <p className="text-sm text-gray-500">Record walking distance</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              {recentActions.length > 0 ? (
                <div className="space-y-3">
                  {recentActions.map((action, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        🌱
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{action.description}</h4>
                        <p className="text-sm text-gray-500">{formatDate(action.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Leaf className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No actions logged yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start by logging your first sustainable action!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
