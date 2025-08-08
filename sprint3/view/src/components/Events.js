import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, ExternalLink, Filter, Star } from 'lucide-react';

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    region: ''
  });
  const [registeredEvents, setRegisteredEvents] = useState(new Set());

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      // Always use mock data for demo
      const mockEvents = [
        {
          id: 1,
          title: "Community Garden Cleanup",
          description: "Join us for a community-wide garden cleanup and learn about sustainable gardening practices.",
          category: "Environment",
          type: "Volunteer",
          date: "2024-02-15T10:00:00Z",
          endDate: "2024-02-15T15:00:00Z",
          location: {
            name: "Central Community Garden",
            address: "123 Green St, City Center",
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          organizer: "Green City Initiative",
          maxParticipants: 50,
          currentParticipants: 23,
          tags: ["gardening", "community", "cleanup", "volunteer"],
          image: "/api/images/garden-cleanup.jpg",
          registrationUrl: "https://example.com/register/garden-cleanup",
          difficulty: "beginner",
          duration: "5 hours",
          benefits: ["Community service hours", "Gardening tips", "Networking"]
        },
        {
          id: 2,
          title: "Sustainable Living Workshop",
          description: "Learn practical tips for reducing your environmental footprint through sustainable living practices.",
          category: "Education",
          type: "Workshop",
          date: "2024-02-20T18:00:00Z",
          endDate: "2024-02-20T20:00:00Z",
          location: {
            name: "Eco Learning Center",
            address: "456 Sustainability Ave, Green District",
            coordinates: { lat: 40.7589, lng: -73.9851 }
          },
          organizer: "EcoEducate",
          maxParticipants: 30,
          currentParticipants: 18,
          tags: ["education", "sustainability", "workshop", "lifestyle"],
          image: "/api/images/sustainability-workshop.jpg",
          registrationUrl: "https://example.com/register/sustainability-workshop",
          difficulty: "beginner",
          duration: "2 hours",
          benefits: ["Certificate of completion", "Resource materials", "Expert guidance"]
        },
        {
          id: 3,
          title: "Renewable Energy Fair",
          description: "Explore the latest in renewable energy technology and meet local clean energy providers.",
          category: "Technology",
          type: "Fair",
          date: "2024-02-25T09:00:00Z",
          endDate: "2024-02-25T17:00:00Z",
          location: {
            name: "Convention Center",
            address: "789 Expo Blvd, Exhibition District",
            coordinates: { lat: 40.7505, lng: -73.9934 }
          },
          organizer: "Clean Energy Coalition",
          maxParticipants: 500,
          currentParticipants: 234,
          tags: ["renewable energy", "technology", "fair", "networking"],
          image: "/api/images/energy-fair.jpg",
          registrationUrl: "https://example.com/register/energy-fair",
          difficulty: "intermediate",
          duration: "8 hours",
          benefits: ["Industry insights", "Vendor discounts", "Networking opportunities"]
        },
        {
          id: 4,
          title: "Climate Action March",
          description: "Join thousands of climate activists in a peaceful march for environmental justice and policy change.",
          category: "Activism",
          type: "March",
          date: "2024-03-01T12:00:00Z",
          endDate: "2024-03-01T16:00:00Z",
          location: {
            name: "City Hall Plaza",
            address: "City Hall Plaza, Government District",
            coordinates: { lat: 40.7127, lng: -74.0134 }
          },
          organizer: "Climate Justice Now",
          maxParticipants: null,
          currentParticipants: 1247,
          tags: ["climate action", "activism", "march", "policy"],
          image: "/api/images/climate-march.jpg",
          registrationUrl: "https://example.com/register/climate-march",
          difficulty: "beginner",
          duration: "4 hours",
          benefits: ["Community engagement", "Advocacy experience", "Social impact"]
        },
        {
          id: 5,
          title: "Zero Waste Cooking Class",
          description: "Learn to cook delicious meals while minimizing food waste and using sustainable ingredients.",
          category: "Food",
          type: "Class",
          date: "2024-03-05T19:00:00Z",
          endDate: "2024-03-05T21:30:00Z",
          location: {
            name: "Sustainable Kitchen Studio",
            address: "321 Culinary Way, Food District",
            coordinates: { lat: 40.7282, lng: -73.9942 }
          },
          organizer: "Zero Waste Chef Collective",
          maxParticipants: 20,
          currentParticipants: 15,
          tags: ["zero waste", "cooking", "food", "sustainability"],
          image: "/api/images/cooking-class.jpg",
          registrationUrl: "https://example.com/register/cooking-class",
          difficulty: "intermediate",
          duration: "2.5 hours",
          benefits: ["Recipe collection", "Cooking techniques", "Meal planning tips"]
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Mock events data for demo
      setEvents([
        {
          id: 1,
          title: "Community Garden Cleanup",
          description: "Join us for a community-wide garden cleanup and learn about sustainable gardening practices.",
          category: "Environment",
          type: "Volunteer",
          date: "2024-02-15T10:00:00Z",
          endDate: "2024-02-15T15:00:00Z",
          location: {
            name: "Central Community Garden",
            address: "123 Green St, City Center",
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          organizer: "Green City Initiative",
          maxParticipants: 50,
          currentParticipants: 23,
          tags: ["gardening", "community", "cleanup", "volunteer"],
          image: "/api/images/garden-cleanup.jpg",
          registrationUrl: "https://example.com/register/garden-cleanup",
          difficulty: "beginner",
          duration: "5 hours",
          benefits: ["Community service hours", "Gardening tips", "Networking"]
        },
        {
          id: 2,
          title: "Sustainable Living Workshop",
          description: "Learn practical tips for reducing your environmental footprint through sustainable living practices.",
          category: "Education",
          type: "Workshop",
          date: "2024-02-20T18:00:00Z",
          endDate: "2024-02-20T20:00:00Z",
          location: {
            name: "Eco Learning Center",
            address: "456 Sustainability Ave, Green District",
            coordinates: { lat: 40.7589, lng: -73.9851 }
          },
          organizer: "EcoEducate",
          maxParticipants: 30,
          currentParticipants: 18,
          tags: ["education", "sustainability", "workshop", "lifestyle"],
          image: "/api/images/sustainability-workshop.jpg",
          registrationUrl: "https://example.com/register/sustainability-workshop",
          difficulty: "beginner",
          duration: "2 hours",
          benefits: ["Certificate of completion", "Resource materials", "Expert guidance"]
        },
        {
          id: 3,
          title: "Renewable Energy Fair",
          description: "Explore the latest in renewable energy technology and meet local clean energy providers.",
          category: "Technology",
          type: "Fair",
          date: "2024-02-25T09:00:00Z",
          endDate: "2024-02-25T17:00:00Z",
          location: {
            name: "Convention Center",
            address: "789 Expo Blvd, Exhibition District",
            coordinates: { lat: 40.7505, lng: -73.9934 }
          },
          organizer: "Clean Energy Coalition",
          maxParticipants: 500,
          currentParticipants: 234,
          tags: ["renewable energy", "technology", "fair", "networking"],
          image: "/api/images/energy-fair.jpg",
          registrationUrl: "https://example.com/register/energy-fair",
          difficulty: "intermediate",
          duration: "8 hours",
          benefits: ["Industry insights", "Vendor discounts", "Networking opportunities"]
        },
        {
          id: 4,
          title: "Climate Action March",
          description: "Join thousands of climate activists in a peaceful march for environmental justice and policy change.",
          category: "Activism",
          type: "March",
          date: "2024-03-01T12:00:00Z",
          endDate: "2024-03-01T16:00:00Z",
          location: {
            name: "City Hall Plaza",
            address: "City Hall Plaza, Government District",
            coordinates: { lat: 40.7127, lng: -74.0134 }
          },
          organizer: "Climate Justice Now",
          maxParticipants: null,
          currentParticipants: 1247,
          tags: ["climate action", "activism", "march", "policy"],
          image: "/api/images/climate-march.jpg",
          registrationUrl: "https://example.com/register/climate-march",
          difficulty: "beginner",
          duration: "4 hours",
          benefits: ["Community engagement", "Advocacy experience", "Social impact"]
        },
        {
          id: 5,
          title: "Zero Waste Cooking Class",
          description: "Learn to cook delicious meals while minimizing food waste and using sustainable ingredients.",
          category: "Food",
          type: "Class",
          date: "2024-03-05T19:00:00Z",
          endDate: "2024-03-05T21:30:00Z",
          location: {
            name: "Sustainable Kitchen Studio",
            address: "321 Culinary Way, Food District",
            coordinates: { lat: 40.7282, lng: -73.9942 }
          },
          organizer: "Zero Waste Chef Collective",
          maxParticipants: 20,
          currentParticipants: 15,
          tags: ["zero waste", "cooking", "food", "sustainability"],
          image: "/api/images/cooking-class.jpg",
          registrationUrl: "https://example.com/register/cooking-class",
          difficulty: "intermediate",
          duration: "2.5 hours",
          benefits: ["Recipe collection", "Cooking techniques", "Meal planning tips"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      // In a real app, this would make an API call
      setRegisteredEvents(prev => new Set([...prev, eventId]));
      // Show success message or redirect to registration
      alert('Registration successful! You will receive a confirmation email shortly.');
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Environment': return 'bg-green-100 text-green-800';
      case 'Education': return 'bg-blue-100 text-blue-800';
      case 'Technology': return 'bg-purple-100 text-purple-800';
      case 'Activism': return 'bg-red-100 text-red-800';
      case 'Food': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            📅 Sustainability Events
          </h1>
          <p className="mt-2 text-gray-600">
            Discover and participate in environmental events in your area
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filter Events</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                <option value="Environment">Environment</option>
                <option value="Education">Education</option>
                <option value="Technology">Technology</option>
                <option value="Activism">Activism</option>
                <option value="Food">Food</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <input
                type="text"
                placeholder="Enter city or region"
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Event Image */}
              <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 relative">
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-white opacity-80" />
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(event.difficulty)}`}>
                    {event.difficulty}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime(event.date)} - {formatTime(event.endDate)} ({event.duration})
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location.name}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {event.currentParticipants} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''} participants
                  </div>
                </div>

                {/* Organizer */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Organized by <span className="font-medium">{event.organizer}</span>
                  </p>
                </div>

                {/* Benefits */}
                {event.benefits && event.benefits.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">What you'll get:</h4>
                    <ul className="text-sm text-gray-600">
                      {event.benefits.slice(0, 2).map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {event.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {registeredEvents.has(event.id) ? (
                    <button
                      className="flex-1 bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                      disabled
                    >
                      Registered ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Register
                    </button>
                  )}
                  {event.registrationUrl && (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or check back later for new events.
            </p>
            <button
              onClick={() => setFilters({ category: '', date: '', region: '' })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
