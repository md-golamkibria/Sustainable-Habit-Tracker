import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

const Actions = ({ user }) => {
  const [formData, setFormData] = useState({
    actionType: '',
    description: '',
    quantity: 1,
    unit: 'times',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recentActions, setRecentActions] = useState([]);
  const [showImpact, setShowImpact] = useState(null);

  const actionTypes = [
    { 
      value: 'biking', 
      label: 'Biking', 
      emoji: '🚴',
      units: ['km', 'miles', 'times'],
      description: 'Bike commute or recreational cycling'
    },
    { 
      value: 'recycling', 
      label: 'Recycling', 
      emoji: '♻️',
      units: ['items', 'kg', 'lbs'],
      description: 'Recycled items or materials'
    },
    { 
      value: 'walking', 
      label: 'Walking', 
      emoji: '🚶',
      units: ['km', 'miles', 'steps', 'times'],
      description: 'Walking instead of driving'
    },
    { 
      value: 'public_transport', 
      label: 'Public Transport', 
      emoji: '🚌',
      units: ['trips', 'km', 'miles'],
      description: 'Using bus, train, or metro'
    },
    { 
      value: 'reusable_bag', 
      label: 'Reusable Bags', 
      emoji: '🛍️',
      units: ['times', 'bags'],
      description: 'Used reusable bags for shopping'
    },
    { 
      value: 'energy_saving', 
      label: 'Energy Saving', 
      emoji: '💡',
      units: ['hours', 'times'],
      description: 'Energy conservation activities'
    },
    { 
      value: 'water_conservation', 
      label: 'Water Conservation', 
      emoji: '💧',
      units: ['minutes', 'liters', 'times'],
      description: 'Water saving activities'
    }
  ];

  useEffect(() => {
    fetchRecentActions();
  }, []);

  const fetchRecentActions = async () => {
    try {
      const response = await axios.get('/api/actions/list?limit=5');
      setRecentActions(response.data.actions);
    } catch (error) {
      console.error('Error fetching recent actions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActionTypeChange = (actionValue) => {
    const selectedAction = actionTypes.find(action => action.value === actionValue);
    setFormData(prev => ({
      ...prev,
      actionType: actionValue,
      unit: selectedAction?.units[0] || 'times',
      description: selectedAction?.description || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.actionType || !formData.description) {
      setMessage('Please select an action type and provide a description.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/actions/log', formData);
      
      setMessage('Action logged successfully!');
      setShowImpact(response.data.impact);
      
      // Reset form
      setFormData({
        actionType: '',
        description: '',
        quantity: 1,
        unit: 'times',
        notes: ''
      });

      // Refresh recent actions
      fetchRecentActions();

      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setShowImpact(null);
      }, 5000);
    } catch (error) {
      setMessage('Error logging action: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedAction = actionTypes.find(action => action.value === formData.actionType);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="h-8 w-8 mr-3 text-blue-600" />
            Sustainable Actions
          </h1>
          <p className="mt-2 text-gray-600">
            Track and log your eco-friendly activities
          </p>
        </div>
       
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Record New Action
                </h3>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    message.includes('Error') 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {message}
                    {showImpact && (
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        {showImpact.co2Saved > 0 && (
                          <div className="flex items-center">
                            <span>{showImpact.co2Saved.toFixed(2)} kg CO₂ saved</span>
                          </div>
                        )}
                        {showImpact.waterSaved > 0 && (
                          <div className="flex items-center">
                            <span>{showImpact.waterSaved.toFixed(1)} L water saved</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Action Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Action Type *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {actionTypes.map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          onClick={() => handleActionTypeChange(action.value)}
                          className={`p-3 rounded-lg border text-left transition-colors duration-200 ${
                            formData.actionType === action.value
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{action.emoji}</span>
                            <span className="text-sm font-medium">{action.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={selectedAction?.description || "Describe your sustainable action..."}
                      required
                    />
                  </div>

                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {selectedAction?.units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        )) || <option value="times">times</option>}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional details about your action..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !formData.actionType}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? 'Logging...' : 'Log Action'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Recent Actions Sidebar */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Actions
                </h3>
                
                {recentActions.length > 0 ? (
                  <div className="space-y-3">
                    {recentActions.map((action, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-sm">
                              {actionTypes.find(type => type.value === action.actionType)?.emoji || '🌱'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {action.description}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                {formatDate(action.date)}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                {action.quantity} {action.unit}
                              </p>
                            </div>
                            {(action.impact.co2Saved > 0 || action.impact.waterSaved > 0) && (
                              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                {action.impact.co2Saved > 0 && (
                                  <span>🌱 {action.impact.co2Saved.toFixed(1)}kg CO₂</span>
                                )}
                                {action.impact.waterSaved > 0 && (
                                  <span>💧 {action.impact.waterSaved.toFixed(0)}L</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🗓️</span>
                    </div>
                    <p className="text-gray-500">No actions logged yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your recent actions will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Actions;
