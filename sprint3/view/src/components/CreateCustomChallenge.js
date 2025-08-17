import React, { useState } from 'react';
import './CreateCustomChallenge.css';

const CreateCustomChallenge = ({ onChallengeCreated, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'weekly',
    category: 'general',
    target: {
      value: '',
      unit: 'actions'
    },
    difficulty: 'medium',
    reward: {
      points: ''
    },
    duration: {
      endDate: ''
    },
    requirements: {
      minLevel: 1
    },
    isPublic: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'biking', label: 'Biking' },
    { value: 'recycling', label: 'Recycling' },
    { value: 'walking', label: 'Walking' },
    { value: 'public_transport', label: 'Public Transport' },
    { value: 'reusable_bag', label: 'Reusable Bags' },
    { value: 'energy_saving', label: 'Energy Saving' },
    { value: 'water_conservation', label: 'Water Conservation' },
    { value: 'waste_reduction', label: 'Waste Reduction' }
  ];

  const targetUnits = [
    { value: 'actions', label: 'Actions' },
    { value: 'days', label: 'Days' },
    { value: 'times', label: 'Times' },
    { value: 'km', label: 'Kilometers' },
    { value: 'hours', label: 'Hours' },
    { value: 'liters', label: 'Liters' },
    { value: 'kg', label: 'Kilograms' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.target.value || formData.target.value <= 0) {
      setError('Target value must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/custom-challenges/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          target: {
            ...formData.target,
            value: parseInt(formData.target.value)
          },
          reward: {
            ...formData.reward,
            points: formData.reward.points ? parseInt(formData.reward.points) : undefined
          },
          requirements: {
            ...formData.requirements,
            minLevel: parseInt(formData.requirements.minLevel)
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Challenge created successfully! You earned ${data.pointsAwarded} points.`);
        if (onChallengeCreated) {
          onChallengeCreated(data.challenge);
        }
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: 'weekly',
          category: 'general',
          target: { value: '', unit: 'actions' },
          difficulty: 'medium',
          reward: { points: '' },
          duration: { endDate: '' },
          requirements: { minLevel: 1 },
          isPublic: true
        });
      } else {
        setError(data.message || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Create challenge error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultEndDate = () => {
    const now = new Date();
    let days = 7; // default
    
    switch (formData.type) {
      case 'daily': days = 1; break;
      case 'weekly': days = 7; break;
      case 'monthly': days = 30; break;
      default: days = 7;
    }
    
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return endDate.toISOString().split('T')[0];
  };

  return (
    <div className="create-challenge-container">
      <div className="create-challenge-header">
        <h2>Create Custom Challenge</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="create-challenge-form">
        <div className="form-group">
          <label htmlFor="title">Challenge Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter a catchy title for your challenge"
            maxLength="100"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what participants need to do"
            rows="4"
            maxLength="500"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Challenge Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="target.value">Target Value *</label>
            <input
              type="number"
              id="target.value"
              name="target.value"
              value={formData.target.value}
              onChange={handleInputChange}
              placeholder="e.g., 10"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="target.unit">Target Unit</label>
            <select
              id="target.unit"
              name="target.unit"
              value={formData.target.unit}
              onChange={handleInputChange}
            >
              {targetUnits.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
            >
              <option value="easy">Easy (25 pts)</option>
              <option value="medium">Medium (50 pts)</option>
              <option value="hard">Hard (100 pts)</option>
              <option value="extreme">Extreme (200 pts)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reward.points">Custom Points (Optional)</label>
            <input
              type="number"
              id="reward.points"
              name="reward.points"
              value={formData.reward.points}
              onChange={handleInputChange}
              placeholder="Leave empty for auto-calculation"
              min="1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration.endDate">End Date (Optional)</label>
            <input
              type="date"
              id="duration.endDate"
              name="duration.endDate"
              value={formData.duration.endDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              placeholder={getDefaultEndDate()}
            />
            <small>Leave empty for auto-calculation based on type</small>
          </div>

          <div className="form-group">
            <label htmlFor="requirements.minLevel">Minimum Level</label>
            <input
              type="number"
              id="requirements.minLevel"
              name="requirements.minLevel"
              value={formData.requirements.minLevel}
              onChange={handleInputChange}
              min="1"
              max="100"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
            />
            Make this challenge public (others can join)
          </label>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Challenge'}
          </button>
          {onClose && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateCustomChallenge;
