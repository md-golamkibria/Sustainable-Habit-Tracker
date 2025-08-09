import React, { useState } from 'react';
import axios from 'axios';

const Challenges = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'weekly',
    category: 'general',
    targetValue: 7,
    targetUnit: 'days',
    difficulty: 'medium',
    rewardPoints: 100,
    rewardBadge: '',
    rewardTitle: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        category: form.category,
        target: {
          value: form.targetValue,
          unit: form.targetUnit,
        },
        reward: {
          points: form.rewardPoints,
          badge: form.rewardBadge ? { name: form.rewardBadge } : undefined,
          title: form.rewardTitle,
        },
        difficulty: form.difficulty,
      };
      const res = await axios.post('/challenges', payload);
      setMessage(res.data.message || 'Challenge created!');
      setForm({
        title: '',
        description: '',
        type: 'weekly',
        category: 'general',
        targetValue: 7,
        targetUnit: 'days',
        difficulty: 'medium',
        rewardPoints: 100,
        rewardBadge: '',
        rewardTitle: '',
      });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating challenge');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Challenges</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 mb-6">
        <div className="mb-2">
          <label className="block font-semibold">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Description</label>
          <input name="description" value={form.description} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="border rounded px-2 py-1 w-full">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="milestone">Milestone</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="border rounded px-2 py-1 w-full">
            <option value="general">General</option>
            <option value="biking">Biking</option>
            <option value="recycling">Recycling</option>
            <option value="walking">Walking</option>
            <option value="public_transport">Public Transport</option>
            <option value="reusable_bag">Reusable Bag</option>
            <option value="energy_saving">Energy Saving</option>
            <option value="water_conservation">Water Conservation</option>
          </select>
        </div>
        <div className="mb-2 flex gap-2">
          <div className="flex-1">
            <label className="block font-semibold">Target Value</label>
            <input name="targetValue" type="number" value={form.targetValue} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div className="flex-1">
            <label className="block font-semibold">Target Unit</label>
            <input name="targetUnit" value={form.targetUnit} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
          </div>
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Difficulty</label>
          <select name="difficulty" value={form.difficulty} onChange={handleChange} className="border rounded px-2 py-1 w-full">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
        <div className="mb-2 flex gap-2">
          <div className="flex-1">
            <label className="block font-semibold">Reward Points</label>
            <input name="rewardPoints" type="number" value={form.rewardPoints} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="flex-1">
            <label className="block font-semibold">Reward Badge Name</label>
            <input name="rewardBadge" value={form.rewardBadge} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
          </div>
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Reward Title</label>
          <input name="rewardTitle" value={form.rewardTitle} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Challenge'}</button>
      </form>
      {message && <div className="mb-4 text-center text-green-700 font-semibold">{message}</div>}
      <p>This is the Challenges feature page. Challenge creation and management will be implemented here.</p>
    </div>
  );
};

export default Challenges;
