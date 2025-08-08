import React, { useState } from 'react';
import Navigation from './Navigation';
import { User, Mail, MapPin, Target, Save, Calendar } from 'lucide-react';
import axios from 'axios';

const Profile = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: user.email || '',
    bio: user.profile?.bio || '',
    location: user.profile?.location || '',
    dailyActions: user.goals?.dailyActions || 3,
    weeklyTarget: user.goals?.weeklyTarget || 21,
    preferredActions: user.goals?.preferredActions || []
  });

  const actionTypes = [
    { value: 'biking', label: 'Biking', emoji: '🚴' },
    { value: 'recycling', label: 'Recycling', emoji: '♻️' },
    { value: 'walking', label: 'Walking', emoji: '🚶' },
    { value: 'public_transport', label: 'Public Transport', emoji: '🚌' },
    { value: 'reusable_bag', label: 'Reusable Bags', emoji: '🛍️' },
    { value: 'energy_saving', label: 'Energy Saving', emoji: '💡' },
    { value: 'water_conservation', label: 'Water Conservation', emoji: '💧' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferredActionToggle = (actionValue) => {
    setFormData(prev => ({
      ...prev,
      preferredActions: prev.preferredActions.includes(actionValue)
        ? prev.preferredActions.filter(action => action !== actionValue)
        : [...prev.preferredActions, actionValue]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.put('/user/profile', {
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        goals: {
          dailyActions: parseInt(formData.dailyActions),
          weeklyTarget: parseInt(formData.weeklyTarget),
          preferredActions: formData.preferredActions
        }
      });

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // You might want to update the user context here
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navigation user={user} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">Joined {formatDate(user.profile?.joinDate)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Information
                </h3>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    message.includes('Error') 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Tell us about your sustainability journey..."
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Goals Section */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      <Target className="w-4 h-4 inline mr-2" />
                      Goals & Preferences
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Daily Actions Goal
                        </label>
                        <input
                          type="number"
                          name="dailyActions"
                          value={formData.dailyActions}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          min="1"
                          max="10"
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weekly Target
                        </label>
                        <input
                          type="number"
                          name="weeklyTarget"
                          value={formData.weeklyTarget}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          min="1"
                          max="50"
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Preferred Actions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Preferred Actions
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {actionTypes.map((action) => (
                          <button
                            key={action.value}
                            type="button"
                            onClick={() => isEditing && handlePreferredActionToggle(action.value)}
                            disabled={!isEditing}
                            className={`p-3 rounded-lg border text-left transition-colors duration-200 ${
                              formData.preferredActions.includes(action.value)
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{action.emoji}</span>
                              <span className="text-sm font-medium">{action.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Actions</span>
                    <span className="font-medium">{user.stats?.totalActions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Streak</span>
                    <span className="font-medium">{user.stats?.currentStreak || 0} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longest Streak</span>
                    <span className="font-medium">{user.stats?.longestStreak || 0} days</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Info</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <strong>User ID:</strong><br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{user.userId}</code>
                  </div>
                  <div>
                    <strong>Member Since:</strong><br />
                    {formatDate(user.profile?.joinDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
