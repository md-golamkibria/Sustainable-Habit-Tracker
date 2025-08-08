import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  Plus, 
  Star, 
  Target, 
  Clock, 
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  Lightbulb,
  Zap,
  Timer,
  CheckCircle
} from 'lucide-react';

const Challenges = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [message, setMessage] = useState('');
  const [userChallenges, setUserChallenges] = useState([]);
  const [createdChallenges, setCreatedChallenges] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form state for creating challenges
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'weekly',
    category: 'general',
    target: { value: 1, unit: 'actions' },
    difficulty: 'medium',
    reward: { points: 50 },
    isPublic: false,
    duration: { endDate: '' }
  });

  useEffect(() => {
    fetchChallenges();
    fetchUserChallenges();
    fetchCreatedChallenges();
    fetchTemplates();
  }, []);

  const fetchChallenges = async () => {
    try {
      // Always use mock data for demo
      const mockChallenges = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Plastic-Free Week',
          description: 'Avoid using single-use plastics for an entire week',
          type: 'weekly',
          target: { value: 7, unit: 'days' },
          reward: { points: 100 },
          participants: [{ _id: 'user1' }, { _id: 'user2' }],
          duration: { isActive: true, endDate: '2024-02-28T23:59:59Z' },
          userParticipating: false
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Daily Bike Commute',
          description: 'Bike to work or school every day this week',
          type: 'daily',
          target: { value: 5, unit: 'days' },
          reward: { points: 75 },
          participants: [{ _id: 'user3' }, { _id: 'user4' }, { _id: 'user5' }],
          duration: { isActive: true, endDate: '2024-02-25T23:59:59Z' },
          userParticipating: false
        },
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Zero Food Waste Month',
          description: 'Complete a month without wasting any food',
          type: 'monthly',
          target: { value: 30, unit: 'days' },
          reward: { points: 250 },
          participants: [{ _id: 'user6' }],
          duration: { isActive: true, endDate: '2024-03-15T23:59:59Z' },
          userParticipating: false
        },
        {
          _id: '507f1f77bcf86cd799439014',
          title: 'Water Conservation Challenge',
          description: 'Reduce water usage by 20% for one week',
          type: 'weekly',
          target: { value: 7, unit: 'days' },
          reward: { points: 80 },
          participants: [{ _id: 'user7' }, { _id: 'user8' }],
          duration: { isActive: true, endDate: '2024-02-29T23:59:59Z' },
          userParticipating: false
        }
      ];
      setChallenges(mockChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setChallenges([]);
    }
  };

  const fetchUserChallenges = async () => {
    try {
      const response = await axios.get('/api/challenges/my-challenges');
      setUserChallenges(response.data.active || []);
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      setUserChallenges([]);
    }
  };

  const fetchCreatedChallenges = async () => {
    try {
      const response = await axios.get('/api/challenges/my-created');
      setCreatedChallenges(response.data || []);
    } catch (error) {
      console.error('Error fetching created challenges:', error);
      setCreatedChallenges([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/challenges/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    }
  };

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'weekly',
      category: 'general',
      target: { value: 1, unit: 'actions' },
      difficulty: 'medium',
      reward: { points: 50 },
      isPublic: false,
      duration: { endDate: '' }
    });
    setSelectedTemplate(null);
  };

  const useTemplate = (template) => {
    setFormData({
      title: template.title,
      description: template.description,
      type: template.type,
      category: template.category,
      target: template.target,
      difficulty: template.difficulty,
      reward: { points: getDifficultyPoints(template.difficulty, template.type) },
      isPublic: false,
      duration: { endDate: getDefaultEndDate(template.type) }
    });
    setSelectedTemplate(template.id);
  };

  const getDifficultyPoints = (difficulty, type) => {
    const basePoints = { easy: 25, medium: 50, hard: 100, extreme: 200 };
    const typeMultiplier = { daily: 1, weekly: 2, monthly: 4, milestone: 3 };
    return (basePoints[difficulty] || 50) * (typeMultiplier[type] || 1);
  };

  const getDefaultEndDate = (type) => {
    const now = new Date();
    const daysToAdd = { daily: 1, weekly: 7, monthly: 30, milestone: 14 };
    now.setDate(now.getDate() + (daysToAdd[type] || 7));
    return now.toISOString().split('T')[0];
  };

  const createChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/challenges/create', formData);
      setMessage(`✅ ${response.data.message} You earned ${response.data.pointsAwarded} points!`);
      resetForm();
      setShowCreateForm(false);
      await fetchCreatedChallenges();
      if (formData.isPublic) {
        await fetchChallenges();
      }
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('❌ Error creating challenge: ' + (error.response?.data?.message || 'Unknown error'));
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const deleteChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
      await axios.delete(`/api/challenges/${challengeId}`);
      setMessage('✅ Challenge deleted successfully!');
      await fetchCreatedChallenges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error deleting challenge: ' + (error.response?.data?.message || 'Unknown error'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      await axios.post(`/api/challenges/join/${challengeId}`);
      setMessage('🎉 Successfully joined the challenge!');
      await fetchChallenges();
      await fetchUserChallenges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error joining challenge: ' + (error.response?.data?.message || 'Unknown error'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getChallengeTypeColor = (type) => {
    switch (type) {
      case 'daily': return 'blue';
      case 'weekly': return 'green';
      case 'monthly': return 'purple';
      default: return 'gray';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isUserParticipating = (challengeId) => {
    return challenges.some(challenge => challenge._id === challengeId && challenge.userParticipating);
  };

  // Create Challenge Form Component
  const CreateChallengeForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Plus className="h-6 w-6 mr-2 text-green-600" />
            Create Custom Challenge
          </h2>
          <button
            onClick={() => { setShowCreateForm(false); resetForm(); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              Get Inspired by Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {templates.slice(0, 4).map(template => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => useTemplate(template)}
                >
                  <h4 className="font-medium text-sm text-gray-900">{template.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full bg-${getChallengeTypeColor(template.type)}-100 text-${getChallengeTypeColor(template.type)}-800`}>
                      {template.type}
                    </span>
                    <span className="text-xs text-gray-500">{template.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={createChallenge} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Plastic-Free Week"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  handleFormChange('type', e.target.value);
                  handleFormChange('duration.endDate', getDefaultEndDate(e.target.value));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
              placeholder="Describe what participants need to do..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="general">General</option>
                <option value="biking">Biking</option>
                <option value="recycling">Recycling</option>
                <option value="walking">Walking</option>
                <option value="public_transport">Public Transport</option>
                <option value="reusable_bag">Reusable Bags</option>
                <option value="energy_saving">Energy Saving</option>
                <option value="water_conservation">Water Conservation</option>
                <option value="waste_reduction">Waste Reduction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => {
                  handleFormChange('difficulty', e.target.value);
                  handleFormChange('reward.points', getDifficultyPoints(e.target.value, formData.type));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.duration.endDate}
                onChange={(e) => handleFormChange('duration.endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Value *
              </label>
              <input
                type="number"
                value={formData.target.value}
                onChange={(e) => handleFormChange('target.value', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Unit *
              </label>
              <select
                value={formData.target.unit}
                onChange={(e) => handleFormChange('target.unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="actions">Actions</option>
                <option value="days">Days</option>
                <option value="times">Times</option>
                <option value="hours">Hours</option>
                <option value="km">Kilometers</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward Points
              </label>
              <input
                type="number"
                value={formData.reward.points}
                onChange={(e) => handleFormChange('reward.points', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                min="1"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => handleFormChange('isPublic', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this challenge public (others can join)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); resetForm(); }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Challenge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with integrated sub-navigation */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Trophy className="h-8 w-8 mr-3 text-yellow-600" />
                Sustainability Challenges
              </h1>
              <p className="mt-2 text-gray-600 mb-6">
                Join challenges or create your own to boost your eco impact
              </p>
              
              {/* Sub-navigation as filter buttons */}
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'available', label: 'Available Challenges', icon: Trophy, count: challenges.length },
                  { id: 'my-challenges', label: 'My Challenges', icon: Award, count: userChallenges.length },
                  { id: 'created', label: 'My Created', icon: Star, count: createdChallenges.length }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          activeTab === tab.id
                            ? 'bg-white text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md ml-4"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Challenge
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') || message.includes('❌')
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <div className="flex items-center">
              {message.includes('Error') || message.includes('❌') ? (
                <X className="h-5 w-5 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {message}
            </div>
          </div>
        )}


        {/* Tab Content */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.length > 0 ? (
              challenges.map(challenge => {
                const colorClass = getChallengeTypeColor(challenge.type);
                const participating = isUserParticipating(challenge._id);
                
                return (
                  <div key={challenge._id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Trophy className={`h-5 w-5 text-${colorClass}-500 mr-2`} />
                          <span className={`px-2 py-1 text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800 rounded-full`}>
                            {challenge.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{challenge.participants?.length || 0} participants</span>
                      </div>
                      
                      {challenge.duration?.endDate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Ends {formatDate(challenge.duration.endDate)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        <span>{challenge.target?.value} {challenge.target?.unit}</span>
                      </div>
                      
                      {challenge.reward?.points && (
                        <div className="flex items-center text-sm text-green-600">
                          <Zap className="h-4 w-4 mr-2" />
                          <span>{challenge.reward.points} points</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => joinChallenge(challenge._id)}
                      disabled={participating || !challenge.duration?.isActive}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        participating 
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : challenge.duration?.isActive
                            ? `bg-${colorClass}-500 text-white hover:bg-${colorClass}-600`
                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {participating ? 'Already Joined' : challenge.duration?.isActive ? 'Join Challenge' : 'Challenge Ended'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges available</h3>
                  <p className="text-gray-500 mb-4">
                    Check back later for new sustainability challenges!
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Your Own Challenge
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-challenges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userChallenges.length > 0 ? (
              userChallenges.map(challenge => {
                const colorClass = getChallengeTypeColor(challenge.type);
                const progress = challenge.target?.value > 0 
                  ? Math.min((challenge.userProgress || 0) / challenge.target.value * 100, 100)
                  : 0;
                
                return (
                  <div key={challenge._id} className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                        <span className={`inline-block px-2 py-1 text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800 rounded-full mt-1`}>
                          {challenge.type}
                        </span>
                      </div>
                      <Award className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{challenge.userProgress || 0} / {challenge.target?.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {Math.round(progress)}% complete
                      </div>
                    </div>
                    
                    {challenge.daysRemaining !== null && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Timer className="h-3 w-3 mr-1" />
                        {challenge.daysRemaining > 0 ? `${challenge.daysRemaining} days left` : 'Ending soon'}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active challenges</h3>
                  <p className="text-gray-500 mb-4">
                    Join some challenges to start your sustainability journey!
                  </p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Browse Challenges
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'created' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdChallenges.length > 0 ? (
              createdChallenges.map(challenge => {
                const colorClass = getChallengeTypeColor(challenge.type);
                
                return (
                  <div key={challenge._id} className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-block px-2 py-1 text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800 rounded-full`}>
                            {challenge.type}
                          </span>
                          {challenge.isGlobal && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => deleteChallenge(challenge._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{challenge.participantCount || 0} participants</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        <span>{challenge.target?.value} {challenge.target?.unit}</span>
                      </div>
                      
                      {challenge.completionRate !== undefined && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>{challenge.completionRate}% completion rate</span>
                        </div>
                      )}
                      
                      {challenge.daysRemaining !== null && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          {challenge.daysRemaining > 0 ? `${challenge.daysRemaining} days left` : 'Ended'}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      challenge.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {challenge.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges created yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first custom challenge and inspire others!
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Your First Challenge
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Challenge Form Modal */}
        {showCreateForm && <CreateChallengeForm />}
      </div>
    </div>
  );
};

export default Challenges;
