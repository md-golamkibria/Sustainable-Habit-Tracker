import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Plus, Edit, Save, X } from 'lucide-react';

const Goals = ({ user }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: '',
    unit: 'times',
    category: 'general',
    deadline: ''
  });

  const categories = [
    { value: 'general', label: 'General', color: 'blue' },
    { value: 'energy', label: 'Energy Saving', color: 'yellow' },
    { value: 'transport', label: 'Transportation', color: 'green' },
    { value: 'waste', label: 'Waste Reduction', color: 'purple' },
    { value: 'water', label: 'Water Conservation', color: 'cyan' }
  ];

  const units = ['times', 'days', 'kg', 'liters', 'km', 'hours'];

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await axios.get('/goals/');
      setGoals(response.data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetValue) {
      setMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const goalData = {
        title: formData.title,
        description: formData.description,
        type: 'custom',
        category: 'actions',
        target: {
          value: parseInt(formData.targetValue),
          unit: formData.unit
        },
        timeframe: {
          endDate: formData.deadline ? new Date(formData.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      };

      if (editingGoal) {
        await axios.put(`/goals/${editingGoal._id}`, goalData);
        setMessage('Goal updated successfully!');
      } else {
        await axios.post('/goals/', goalData);
        setMessage('Goal created successfully!');
      }
      
      setFormData({
        title: '',
        description: '',
        targetValue: '',
        unit: 'times',
        category: 'general',
        deadline: ''
      });
      setShowCreateForm(false);
      setEditingGoal(null);
      
      fetchGoals();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Goal save error:', error);
      setMessage('Error saving goal: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      unit: goal.unit,
      category: goal.category,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await axios.delete(`/goals/${goalId}`);
      setMessage('Goal deleted successfully!');
      fetchGoals();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting goal: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const calculateProgress = (goal) => {
    return goal.currentValue && goal.targetValue 
      ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
      : 0;
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Target className="h-8 w-8 mr-3 text-purple-600" />
              Sustainability Goals
            </h1>
            <p className="mt-2 text-gray-600">
              Set and track your personal sustainability targets
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingGoal(null);
              setFormData({
                title: '',
                description: '',
                targetValue: '',
                unit: 'times',
                category: 'general',
                deadline: ''
              });
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </button>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingGoal(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="E.g., Bike to work 3 times per week"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Describe your goal and why it's important..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    name="targetValue"
                    value={formData.targetValue}
                    onChange={handleInputChange}
                    min="1"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Create Goal')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length > 0 ? (
            goals.map((goal) => {
              const progress = calculateProgress(goal);
              const colorClass = getCategoryColor(goal.category);
              
              return (
                <div key={goal._id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`w-2 h-2 bg-${colorClass}-500 rounded-full mr-2`}></div>
                        <span className={`text-xs font-medium text-${colorClass}-600 uppercase tracking-wide`}>
                          {categories.find(c => c.value === goal.category)?.label || goal.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${colorClass}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-500">
                        {progress.toFixed(0)}% complete
                      </span>
                    </div>
                  </div>
                  
                  {goal.deadline && (
                    <div className="text-sm text-gray-500">
                      Deadline: {formatDate(goal.deadline)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full">
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
                <p className="text-gray-500 mb-4">
                  Set your first sustainability goal to start tracking your progress!
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center mx-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
