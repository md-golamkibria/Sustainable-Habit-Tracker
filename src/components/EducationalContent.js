import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Lightbulb, 
  FileText, 
  Video, 
  Image, 
  Heart,
  Bookmark,
  Share2,
  Clock,
  User,
  Eye,
  Star,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const EducationalContent = ({ user }) => {
  const [content, setContent] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);

  const categories = [
    { id: 'all', label: 'All Content', icon: BookOpen },
    { id: 'energy_saving', label: 'Energy Saving', icon: Lightbulb },
    { id: 'water_conservation', label: 'Water Conservation', icon: '💧' },
    { id: 'waste_reduction', label: 'Waste Reduction', icon: '♻️' },
    { id: 'transportation', label: 'Transportation', icon: '🚲' },
    { id: 'food_sustainability', label: 'Food & Agriculture', icon: '🌱' },
    { id: 'renewable_energy', label: 'Renewable Energy', icon: '⚡' },
    { id: 'sustainable_lifestyle', label: 'Lifestyle', icon: '🌍' }
  ];

  const contentTypes = {
    tip: { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    article: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    guide: { icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100' },
    video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
    infographic: { icon: Image, color: 'text-pink-600', bg: 'bg-pink-100' }
  };

  useEffect(() => {
    fetchContent();
    fetchFeaturedContent();
  }, []);

  useEffect(() => {
    if (activeCategory !== 'all') {
      fetchContentByCategory(activeCategory);
    } else {
      fetchContent();
    }
  }, [activeCategory]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/educational/popular');
      setContent(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch educational content:', error);
      setError('Failed to fetch educational content');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedContent = async () => {
    try {
      const response = await axios.get('/api/educational/featured');
      setFeaturedContent(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch featured content:', error);
    }
  };

  const fetchContentByCategory = async (category) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/educational/category/${category}`);
      setContent(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch content by category:', error);
      setError('Failed to fetch content by category');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (contentId) => {
    try {
      const response = await axios.post(`/api/educational/${contentId}/like`);
      setSuccess('Content liked successfully!');
      
      // Update the content in state to show updated like count
      setContent(prevContent => {
        return prevContent.map(item => {
          if (item._id === contentId) {
            // If the response includes a new like count, use it
            // Otherwise increment by 1 (for mock data)
            const newLikes = response.data.likes || item.interactions.likes.length + 1;
            return {
              ...item,
              interactions: {
                ...item.interactions,
                likes: Array.isArray(item.interactions.likes) 
                  ? [...item.interactions.likes, 'current-user'] 
                  : { length: newLikes }
              }
            };
          }
          return item;
        });
      });
    } catch (error) {
      console.error('Failed to like content:', error);
      setError('Failed to like content');
    }
  };

  const handleBookmark = async (contentId) => {
    try {
      await axios.post(`/api/educational/${contentId}/bookmark`);
      setSuccess('Content bookmarked successfully!');
    } catch (error) {
      setError('Failed to bookmark content');
    }
  };

  const handleShare = (content) => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: content.summary,
        url: window.location.href
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      setSuccess('Link copied to clipboard!');
    }
  };

  const openContentModal = async (contentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/educational/${contentId}`);
      if (response.data && response.data.data) {
        setSelectedContent(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      setError('Failed to load content details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ContentCard = ({ item }) => {
    const typeInfo = contentTypes[item.type] || contentTypes.article;
    const TypeIcon = typeInfo.icon;

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
            <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{item.estimatedReadTime || item.readTime || 5} min read</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {item.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {item.summary}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{item.author.name}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
            item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {item.difficulty}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{item.interactions.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{item.interactions.likes.length}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleLike(item._id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleBookmark(item._id)}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleShare(item)}
              className="p-2 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => openContentModal(item._id)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Read More
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ContentModal = ({ content, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{content.author.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{content.readTime} min read</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>{content.interactions.views} views</span>
            </div>
          </div>

          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />

          {content.sources && content.sources.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Sources & References:</h4>
              <ul className="space-y-1">
                {content.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {source.title}
                    </a>
                    {source.description && (
                      <span className="text-gray-600 ml-2">- {source.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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

      {/* Featured Content */}
      {featuredContent.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-2" />
            Featured Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.map(item => (
              <ContentCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {typeof Icon === 'string' ? (
                  <span className="text-lg">{Icon}</span>
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="text-sm">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map(item => (
            <ContentCard key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* No Content Message */}
      {!loading && filteredContent.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? `No content matches "${searchTerm}"`
              : 'No content available in this category'
            }
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

export default EducationalContent;
