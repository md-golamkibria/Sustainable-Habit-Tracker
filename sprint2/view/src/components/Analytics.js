import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Droplets, 
  Leaf, 
  Award, 
  Calendar,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

const Analytics = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('actions');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const [dashboardRes, impactRes] = await Promise.all([
        fetch('/analytics/dashboard', { credentials: 'include' }),
        fetch('/analytics/impact', { credentials: 'include' })
      ]);

      if (dashboardRes.ok && impactRes.ok) {
        const dashboard = await dashboardRes.json();
        const impact = await impactRes.json();
        setDashboardData(dashboard);
        setImpactData(impact);
      } else {
        console.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChartsData = useCallback(async () => {
    try {
      const response = await fetch(
        `/analytics/charts?period=${selectedPeriod}&metric=${selectedMetric}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setChartsData(data);
      }
    } catch (error) {
      console.error('Error fetching charts data:', error);
    }
  }, [selectedPeriod, selectedMetric]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchChartsData();
  }, [fetchChartsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-green-600' }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && <dd className="text-sm text-gray-500">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const ActionTypeChart = ({ data }) => {
    const chartData = Object.entries(data || {}).map(([type, stats]) => ({
      name: type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: stats.count,
      co2: stats.co2Saved,
      water: stats.waterSaved
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-green-600" />
            Environmental Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Detailed insights into your environmental impact and progress
          </p>
        </div>

        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Today's Actions"
              value={dashboardData.overview.today.totalActions}
              subtitle={`${dashboardData.overview.today.totalCO2Saved.toFixed(1)} kg CO₂ saved`}
              icon={Target}
            />
            <StatCard
              title="This Week"
              value={dashboardData.overview.week.totalActions}
              subtitle={`${dashboardData.overview.week.totalCO2Saved.toFixed(1)} kg CO₂ saved`}
              icon={Calendar}
            />
            <StatCard
              title="Current Streak"
              value={`${dashboardData.achievements.currentStreak} days`}
              subtitle={`Level ${dashboardData.achievements.level}`}
              icon={Award}
              color="text-yellow-600"
            />
            <StatCard
              title="Total Actions"
              value={dashboardData.overview.allTime.totalActions}
              subtitle={`${dashboardData.overview.allTime.totalCO2Saved.toFixed(1)} kg CO₂ total`}
              icon={Leaf}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Activity Trends</h3>
              <div className="flex space-x-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="actions">Actions</option>
                  <option value="co2">CO₂ Saved</option>
                  <option value="water">Water Saved</option>
                </select>
              </div>
            </div>
            {chartsData && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartsData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric === 'actions' ? 'actions' : selectedMetric === 'co2' ? 'co2Saved' : 'waterSaved'}
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Action Types This Month</h3>
            {dashboardData && (
              <ActionTypeChart data={dashboardData.trends.actionTypeBreakdown} />
            )}
          </div>
        </div>

        {impactData && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Environmental Impact Equivalents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <Leaf className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">CO₂ Impact</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>🌳 {impactData.equivalents.co2.treesPlanted} trees planted</p>
                  <p>🚗 {impactData.equivalents.co2.carMilesAvoided} car miles avoided</p>
                  <p>📱 {impactData.equivalents.co2.phoneCharges} phone charges</p>
                </div>
              </div>

              <div className="text-center">
                <Droplets className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Water Impact</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>🚿 {impactData.equivalents.water.showers} showers saved</p>
                  <p>🍽️ {impactData.equivalents.water.dishwasherLoads} dishwasher loads</p>
                  <p>☕ {impactData.equivalents.water.teaCups} cups of tea</p>
                </div>
              </div>

              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Impact</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{impactData.totals.co2Saved.toFixed(1)} kg CO₂ saved</p>
                  <p>{impactData.totals.waterSaved.toFixed(1)} L water saved</p>
                  <p>{impactData.totals.actions} total actions</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {dashboardData && dashboardData.comparisons && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Week-over-Week Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardData.comparisons.weekOverWeek.improvement.actions > 0 ? '+' : ''}
                  {dashboardData.comparisons.weekOverWeek.improvement.actions}
                </div>
                <div className="text-sm text-gray-500">Actions vs last week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.comparisons.weekOverWeek.improvement.co2 > 0 ? '+' : ''}
                  {dashboardData.comparisons.weekOverWeek.improvement.co2.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">kg CO₂ vs last week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.comparisons.weekOverWeek.improvement.water > 0 ? '+' : ''}
                  {dashboardData.comparisons.weekOverWeek.improvement.water.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">L water vs last week</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
