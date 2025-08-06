import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Activity, 
  BarChart3, 
  Trophy, 
  Target, 
  Leaf, 
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalActions: 0,
    weeklyActions: 0,
    completedChallenges: 0,
    activeGoals: 0,
    co2Saved: 0,
    energySaved: 0
  });
  const [recentActions, setRecentActions] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [activeGoalsData, setActiveGoalsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch real user data from APIs
      const [actionsRes, challengesRes, goalsRes] = await Promise.all([
        axios.get('/api/actions/list?limit=5'),
        axios.get('/api/challenges/my-challenges'),
        axios.get('/api/goals/')
      ]);

      // Calculate stats from actual data
      const actions = actionsRes.data.actions || [];
      const userChallenges = challengesRes.data || { active: [], completed: [] };
      const goals = Array.isArray(goalsRes.data) ? goalsRes.data : [];

      console.log('Dashboard data fetched:', {
        actions: actions.length,
        goals: goals.length,
        challenges: userChallenges
      });

      // Calculate week start
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const weeklyActions = actions.filter(action => 
        new Date(action.date || action.createdAt) >= weekStart
      );

      const completedChallenges = userChallenges.completed ? userChallenges.completed.length : 0;
      const activeChallengesData = userChallenges.active || [];

      // Filter active goals - goals can have different status values
      const activeGoals = goals.filter(goal => 
        goal.status === 'active' || (!goal.status && !goal.completedDate)
      ).length;
      
      console.log('Active goals found:', activeGoals, 'Total goals:', goals.length);
      
      // Get active goals with progress data
      const activeGoalsWithProgress = goals.filter(goal => 
        goal.status === 'active' || (!goal.status && !goal.completedDate)
      ).map(goal => ({
        id: goal._id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        target: goal.target,
        progress: goal.progress || { current: 0, percentage: 0 },
        timeframe: goal.timeframe,
        priority: goal.priority || 'medium'
      }));
      
      setActiveGoalsData(activeGoalsWithProgress);

      const totalCO2Saved = actions.reduce((sum, action) => 
        sum + (action.impact?.co2Saved || action.co2Saved || 0), 0
      );

      setStats({
        totalActions: actions.length,
        weeklyActions: weeklyActions.length,
        completedChallenges,
        activeGoals,
        co2Saved: Math.round(totalCO2Saved * 100) / 100, // Round to 2 decimal places
        energySaved: 0 // Will be calculated when we have energy data
      });
      
      // Format recent actions for display
      const formattedActions = actions.slice(0, 3).map(action => ({
        id: action._id,
        action: `${(action.actionType || 'Action').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${action.description || 'No description'}`,
        date: new Date(action.date || action.createdAt).toLocaleDateString(),
        impact: action.impact?.co2Saved || action.co2Saved || 0
      }));
      
      setRecentActions(formattedActions);
      setActiveChallenges(activeChallengesData.map(challenge => ({
        id: challenge._id,
        title: challenge.title,
        progress: challenge.userProgress || 0,
        type: challenge.type
      })));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Try to provide fallback data for better UX
      try {
        // Try individual API calls if the combined call fails
        const actionsRes = await axios.get('/api/actions/list?limit=5').catch(() => ({ data: { actions: [] } }));
        const actions = actionsRes.data.actions || [];
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weeklyActions = actions.filter(action => new Date(action.date || action.createdAt) >= weekStart);
        const totalCO2Saved = actions.reduce((sum, action) => sum + (action.impact?.co2Saved || action.co2Saved || 0), 0);
        
        setStats({
          totalActions: actions.length,
          weeklyActions: weeklyActions.length,
          completedChallenges: 0,
          activeGoals: 0,
          co2Saved: totalCO2Saved,
          energySaved: 0
        });
        
        const formattedActions = actions.slice(0, 3).map(action => ({
          id: action._id,
          action: `${(action.actionType || 'Action').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${action.description || 'No description'}`,
          date: new Date(action.date || action.createdAt).toLocaleDateString(),
          impact: action.impact?.co2Saved || action.co2Saved || 0
        }));
        
        setRecentActions(formattedActions);
        setActiveChallenges([]);
        setActiveGoalsData([]);
        
      } catch (fallbackError) {
        console.error('Fallback data fetch also failed:', fallbackError);
        // Set empty states for new users or on complete failure
        setStats({
          totalActions: 0,
          weeklyActions: 0,
          completedChallenges: 0,
          activeGoals: 0,
          co2Saved: 0,
          energySaved: 0
        });
        setRecentActions([]);
        setActiveChallenges([]);
        setActiveGoalsData([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh data when page becomes visible (when user navigates back to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      fetchDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardData]);

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
            Welcome back, {user?.name}! 🌱
          </h1>
          <p className="mt-2 text-gray-600">
            Here's your sustainability dashboard for Sprint 3 - Complete with Social Features & Gamification
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-blue-600" />
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
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">+{stats.weeklyActions}</span>
                <span className="text-gray-500"> this week</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Challenges Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completedChallenges}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-yellow-600 font-medium">{activeChallenges.length}</span>
                <span className="text-gray-500"> active</span>
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
                      CO₂ Saved (kg)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.co2Saved.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                {stats.co2Saved > 0 ? (
                  <React.Fragment>
                    <TrendingUp className="inline h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">Great start!</span>
                    <span className="text-gray-500">Keep it up!</span>
                  </React.Fragment>
                ) : (
                  <span className="text-gray-500">Start logging actions to see impact</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Goals
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeGoals}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                {stats.activeGoals > 0 ? (
                  <React.Fragment>
                    <span className="text-purple-600 font-medium">In progress</span>
                <span className="text-gray-500"> working towards goals</span>
                  </React.Fragment>
                ) : (
                  <span className="text-gray-500">Set goals to track progress</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Goals Section */}
        {activeGoalsData.length > 0 && (
          <div className="mb-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Active Goals ({activeGoalsData.length})
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoalsData.slice(0, 6).map((goal) => {
                  const progressPercentage = goal.progress?.percentage || 0;
                  const daysLeft = goal.timeframe?.endDate ? 
                    Math.max(0, Math.ceil((new Date(goal.timeframe.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
                  const priorityColors = {
                    low: 'bg-blue-100 text-blue-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    high: 'bg-orange-100 text-orange-800',
                    critical: 'bg-red-100 text-red-800'
                  };
                  
                  return (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{goal.description}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[goal.priority] || priorityColors.medium}`}>
                          {goal.priority || 'medium'}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-xs font-medium text-gray-900">
                            {goal.progress?.current || 0} / {goal.target?.value || 0} {goal.target?.unit || ''}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {progressPercentage.toFixed(0)}% complete
                          </span>
                          {daysLeft > 0 && (
                            <span className={`text-xs ${
                              daysLeft <= 3 ? 'text-red-600 font-medium' : 
                              daysLeft <= 7 ? 'text-orange-600' : 'text-gray-500'
                            }`}>
                              {daysLeft} days left
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          goal.category === 'actions' ? 'bg-blue-100 text-blue-700' :
                          goal.category === 'co2_reduction' ? 'bg-green-100 text-green-700' :
                          goal.category === 'water_saving' ? 'bg-cyan-100 text-cyan-700' :
                          goal.category === 'streak' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {goal.category?.replace('_', ' ') || 'general'}
                        </span>
                        <a 
                          href="/goals" 
                          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              {activeGoalsData.length > 6 && (
                <div className="mt-4 text-center">
                  <a href="/goals" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    View all {activeGoalsData.length} active goals →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Recent Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActions.length > 0 ? (
                  recentActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{action.action}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {action.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-green-600">
                          {action.impact > 0 ? `-${action.impact.toFixed(2)} kg CO₂` : 'No impact data'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No actions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start logging your eco-friendly activities to see them here.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/actions"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Activity className="-ml-1 mr-2 h-5 w-5" />
                        Log your first action
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <a href="/actions" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all actions →
                </a>
              </div>
            </div>
          </div>

          {/* Active Challenges */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                Active Challenges
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activeChallenges.length > 0 ? (
                  activeChallenges.map((challenge) => (
                    <div key={challenge.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{challenge.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          challenge.type === 'daily' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {challenge.type}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{challenge.progress}% complete</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No active challenges</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Join challenges to compete with others and track your progress.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/challenges"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <Trophy className="-ml-1 mr-2 h-5 w-5" />
                        Browse challenges
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <a href="/challenges" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all challenges →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/actions" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Activity className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Log Action</p>
                  <p className="text-xs text-gray-500">Record eco-friendly activity</p>
                </div>
              </a>
              
              <a 
                href="/analytics" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">View Analytics</p>
                  <p className="text-xs text-gray-500">Detailed impact insights</p>
                </div>
              </a>
              
              <a 
                href="/challenges" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Award className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Join Challenge</p>
                  <p className="text-xs text-gray-500">Participate in eco challenges</p>
                </div>
              </a>
              
              <a 
                href="/goals" 
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Set Goal</p>
                  <p className="text-xs text-gray-500">Create sustainability targets</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
