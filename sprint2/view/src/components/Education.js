import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Lightbulb, FileText, Video, Image, Heart, Clock, User, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const Education = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedContent, setSelectedContent] = useState(null);

  const categories = [
    { id: 'all', label: 'All Content', icon: BookOpen },
    { id: 'environment', label: 'Environment', icon: '🌍' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '🏡' },
    { id: 'energy', label: 'Energy', icon: '⚡' },
    { id: 'water', label: 'Water', icon: '💧' },
    { id: 'waste', label: 'Waste', icon: '♻️' },
  ];

  const contentTypes = {
    article: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    guide: { icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100' },
    video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
    infographic: { icon: Image, color: 'text-pink-600', bg: 'bg-pink-100' }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/educational');
      setContent(response.data);
    } catch (err) {
      console.error('Error fetching educational content:', err);
      setError('Failed to load educational content. Using sample data instead.');
      // Provide sample data as fallback
      setContent([
        {
          id: 1,
          title: 'Sustainable Living Basics',
          description: 'Learn the fundamentals of sustainable living.',
          content: 'This is a placeholder for educational content about sustainable living basics.',
          type: 'article',
          category: 'lifestyle',
          readTime: 5,
          author: 'EcoTeam',
          views: 120,
          likes: 24
        },
        {
          id: 2,
          title: 'Reducing Carbon Footprint',
          description: 'Tips and tricks to reduce your carbon footprint.',
          content: 'This is a placeholder for educational content about reducing your carbon footprint.',
          type: 'guide',
          category: 'environment',
          readTime: 8,
          author: 'Climate Expert',
          views: 95,
          likes: 18
        },
        {
          id: 3,
          title: 'Water Conservation at Home',
          description: 'Simple ways to save water in your daily routine.',
          content: 'This is a placeholder for educational content about water conservation at home.',
          type: 'article',
          category: 'water',
          readTime: 4,
          author: 'WaterWise',
          views: 78,
          likes: 15
        },
        {
          id: 4,
          title: 'Renewable Energy Explained',
          description: 'Understanding different types of renewable energy sources.',
          content: 'This is a placeholder for educational content about renewable energy sources.',
          type: 'guide',
          category: 'energy',
          readTime: 10,
          author: 'Energy Specialist',
          views: 110,
          likes: 22
        },
        {
          id: 5,
          title: 'Zero Waste Living',
          description: 'Steps to reduce waste in your everyday life.',
          content: 'This is a placeholder for educational content about zero waste living.',
          type: 'article',
          category: 'waste',
          readTime: 6,
          author: 'Waste Reduction Expert',
          views: 85,
          likes: 17
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleReadMore = (item) => {
    setSelectedContent(item);
  };

  const handleLike = async (contentId) => {
    try {
      // Call the API endpoint to like the content
      const response = await axios.post(`/educational/${contentId}/like`);
      setSuccess('Content liked successfully!');
      // Update the like count in the UI
      setContent(content.map(item => 
        item.id === contentId ? { ...item, likes: response.data.likes || (item.likes + 1) } : item
      ));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error liking content:', error);
      setError('Failed to like content');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredContent = activeCategory === 'all' 
    ? content 
    : content.filter(item => item.category === activeCategory);

  const ContentCard = ({ item }) => {
    const TypeIcon = contentTypes[item.type]?.icon || FileText;
    const typeColor = contentTypes[item.type]?.color || 'text-gray-600';
    const typeBg = contentTypes[item.type]?.bg || 'bg-gray-100';
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-5">
          <div className="flex items-center mb-3">
            <span className={`${typeBg} ${typeColor} p-2 rounded-md mr-2`}>
              <TypeIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-gray-500 capitalize">{item.type}</span>
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-gray-800">{item.title}</h3>
          <p className="text-gray-600 mb-4">{item.description}</p>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Clock className="h-4 w-4 mr-1" />
            <span className="mr-3">{item.readTime} min read</span>
            <User className="h-4 w-4 mr-1" />
            <span>{item.author}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{item.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{item.likes}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleLike(item.id)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart className="h-4 w-4 text-red-500" />
              </button>
              <button 
                onClick={() => handleReadMore(item)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Read More
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ContentModal = ({ content, onClose }) => {
    if (!content) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <User className="h-4 w-4 mr-1" />
              <span className="mr-3">{content.author}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span className="mr-3">{content.readTime} min read</span>
              <Eye className="h-4 w-4 mr-1" />
              <span>{content.views} views</span>
            </div>
            
            <div className="prose max-w-none mb-6">
              <p>{content.content}</p>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => handleLike(content.id)}
                className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors mr-2"
              >
                <Heart className="h-4 w-4 mr-2" />
                Like
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Educational Content
        </h1>
        <p className="text-gray-600">
          Discover tips, guides, and articles to enhance your sustainable living journey
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          {success}
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap flex items-center ${activeCategory === category.id ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              {typeof category.icon === 'string' ? (
                <span className="mr-2">{category.icon}</span>
              ) : (
                <category.icon className="h-4 w-4 mr-2" />
              )}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* No Content Message */}
      {!loading && filteredContent.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600">
            No content available in this category
          </p>
        </div>
      )}

      {/* Content Modal */}
      {selectedContent && (
        <ContentModal
          content={selectedContent}
          onClose={() => {
            setSelectedContent(null);
            setSuccess('');
            setError('');
          }}
        />
      )}
    </div>
  );
};

export default Education;
