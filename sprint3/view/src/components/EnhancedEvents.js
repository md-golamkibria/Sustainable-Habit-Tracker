import React, { useState, useEffect } from 'react';
import './EnhancedEvents.css';

const EnhancedEvents = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming, regional
  const [registering, setRegistering] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (viewMode === 'upcoming') {
      fetchUpcomingEvents();
    } else {
      fetchRegionalEvents();
    }
  }, [selectedCategory, selectedType, dateRange, location, page, viewMode]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/events/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        dateRange
      });
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);

      const response = await fetch(`/api/events/upcoming?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Add mock registration status and attendee count for testing
        const eventsWithStatus = data.data.events.map(event => ({
          ...event,
          isRegistered: false,
          attendeeCount: event.attendeeCount || Math.floor(Math.random() * 15) + 1,
          availableSpots: event.capacity ? event.capacity - (event.attendeeCount || 0) : null
        }));
        setEvents(eventsWithStatus);
        setPagination(data.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      // Fallback to mock data
      setEvents(getMockUpcomingEvents());
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionalEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      if (location) params.append('location', location);

      const response = await fetch(`/api/events/regional?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Add mock registration status and attendee count for testing
        const eventsWithStatus = data.data.events.map(event => ({
          ...event,
          isRegistered: false,
          attendeeCount: event.attendeeCount || Math.floor(Math.random() * 20) + 1,
          availableSpots: event.capacity ? event.capacity - (event.attendeeCount || 0) : null
        }));
        setEvents(eventsWithStatus);
        setPagination(data.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching regional events:', error);
      // Fallback to mock data
      setEvents(getMockRegionalEvents());
    } finally {
      setLoading(false);
    }
  };

  const getMockUpcomingEvents = () => {
    return [
      {
        _id: 'upcoming1',
        title: 'Sustainable Living Workshop',
        description: 'Learn practical tips for reducing your environmental impact through sustainable living practices.',
        category: 'sustainability-workshop',
        organizerName: 'EcoEducator',
        location: {
          address: '123 Green St, San Francisco, CA'
        },
        dateTime: {
          start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        },
        capacity: 50,
        attendeeCount: 12,
        availableSpots: 38,
        isRegistered: false,
        pricing: { isFree: true, price: 0 },
        tags: ['sustainability', 'workshop', 'education']
      },
      {
        _id: 'upcoming2',
        title: 'Urban Gardening Masterclass',
        description: 'Master the art of urban gardening. Learn to grow your own food in small spaces.',
        category: 'gardening-workshop',
        organizerName: 'UrbanGardener',
        location: {
          address: '456 Garden Ave, Portland, OR'
        },
        dateTime: {
          start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        },
        capacity: 30,
        attendeeCount: 8,
        availableSpots: 22,
        isRegistered: false,
        pricing: { isFree: false, price: 25 },
        tags: ['gardening', 'urban', 'food', 'sustainability']
      }
    ];
  };

  const getMockRegionalEvents = () => {
    return [
      {
        _id: 'regional1',
        title: 'Community Beach Cleanup',
        description: 'Join us for a community beach cleanup to protect marine life and keep our beaches beautiful.',
        category: 'environmental-action',
        organizerName: 'OceanGuardians',
        location: {
          address: 'Ocean Beach, San Francisco, CA'
        },
        dateTime: {
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        capacity: 100,
        attendeeCount: 45,
        availableSpots: 55,
        isRegistered: false,
        pricing: { isFree: true, price: 0 },
        tags: ['cleanup', 'environment', 'community']
      }
    ];
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      alert('Please login to register for events');
      return;
    }

    setRegistering(prev => ({ ...prev, [eventId]: true }));
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Update the event in the local state
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { 
                  ...event, 
                  attendees: [...(event.attendees || []), user._id],
                  attendeeCount: (event.attendeeCount || 0) + 1,
                  isRegistered: true
                }
              : event
          )
        );
        alert('Successfully registered for the event!');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleUnregister = async (eventId) => {
    if (!user) return;

    setRegistering(prev => ({ ...prev, [eventId]: true }));
    try {
      const response = await fetch(`/api/events/${eventId}/unregister`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Update the event in the local state
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { 
                  ...event, 
                  attendees: (event.attendees || []).filter(id => id !== user._id),
                  attendeeCount: Math.max((event.attendeeCount || 0) - 1, 0),
                  isRegistered: false
                }
              : event
          )
        );
        alert('Successfully unregistered from the event');
      } else {
        alert(data.message || 'Unregistration failed');
      }
    } catch (error) {
      console.error('Error unregistering from event:', error);
      alert('Unregistration failed. Please try again.');
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📅';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getEventTypeColor = (type) => {
    return type === 'nature' ? '#10b981' : '#8b5cf6';
  };

  return (
    <div className="enhanced-events">
      <div className="events-header">
        <h2>🌍 Sustainability Events</h2>
        <p>Discover nature and personal development events in your area</p>
      </div>

      <div className="events-controls">
        <div className="view-mode-tabs">
          <button
            className={`view-tab ${viewMode === 'upcoming' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('upcoming');
              setPage(1);
            }}
          >
            📅 Upcoming Events
          </button>
          <button
            className={`view-tab ${viewMode === 'regional' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('regional');
              setPage(1);
            }}
          >
            📍 Regional Events
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="nature">🌿 Nature Events</option>
              <option value="personal-development">🧘 Personal Development</option>
            </select>
          </div>

          {viewMode === 'upcoming' && (
            <>
              <div className="filter-group">
                <label>Time Range:</label>
                <select
                  value={dateRange}
                  onChange={(e) => {
                    setDateRange(e.target.value);
                    setPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="7d">Next 7 Days</option>
                  <option value="30d">Next 30 Days</option>
                  <option value="90d">Next 3 Months</option>
                  <option value="all">All Future Events</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Location:</label>
                <input
                  type="text"
                  placeholder="City or State"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="filter-input"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="category-overview">
        <div className="category-grid">
          {categories.filter(c => selectedType === '' || c.type === selectedType).map(category => (
            <div 
              key={category.id} 
              className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedCategory(selectedCategory === category.id ? '' : category.id);
                setPage(1);
              }}
            >
              <div className="category-icon" style={{ color: getEventTypeColor(category.type) }}>
                {category.icon}
              </div>
              <div className="category-info">
                <h4>{category.name}</h4>
                <p>{category.description}</p>
                <span className="event-count">{category.eventCount} events</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event._id} className="event-card">
              <div className="event-header">
                <div className="event-category">
                  <span className="category-icon">{getCategoryIcon(event.category)}</span>
                  <span className="category-name">{getCategoryName(event.category)}</span>
                </div>
                {event.pricing?.isFree ? (
                  <span className="price-tag free">FREE</span>
                ) : (
                  <span className="price-tag paid">${event.pricing?.price}</span>
                )}
              </div>

              <div className="event-content">
                <h3>{event.title}</h3>
                <p className="event-description">{event.description}</p>

                <div className="event-details">
                  <div className="detail">
                    <span className="icon">📅</span>
                    <span>{formatDate(event.dateTime.start)}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">📍</span>
                    <span>{event.location.city}, {event.location.state}</span>
                  </div>
                  {event.distance && (
                    <div className="detail">
                      <span className="icon">🚗</span>
                      <span>{event.distance} miles away</span>
                    </div>
                  )}
                  <div className="detail">
                    <span className="icon">👥</span>
                    <span>
                      {event.attendeeCount} attending
                      {event.capacity && ` / ${event.capacity} max`}
                    </span>
                  </div>
                </div>

                {event.tags && (
                  <div className="event-tags">
                    {event.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="event-footer">
                <div className="organizer-info">
                  <span>By {event.organizer?.username || event.organizer?.profile?.firstName}</span>
                </div>
                
                <div className="event-actions">
                  {event.isRegistered ? (
                    <button 
                      onClick={() => handleUnregister(event._id)}
                      className="btn btn-secondary"
                    >
                      ✓ Registered
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRegister(event._id)}
                      className="btn btn-primary"
                      disabled={registering[event._id] || event.availableSpots === 0}
                    >
                      {registering[event._id] ? 'Registering...' : event.availableSpots === 0 ? 'Full' : 'Register'}
                    </button>
                  )}
                </div>
              </div>

              {event.daysUntilEvent !== undefined && (
                <div className="days-until">
                  {event.daysUntilEvent === 0 ? 'Today!' : 
                   event.daysUntilEvent === 1 ? 'Tomorrow' : 
                   `${event.daysUntilEvent} days`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && !loading && (
        <div className="no-events">
          <div className="no-events-content">
            <span className="icon">📅</span>
            <h3>No events found</h3>
            <p>Try adjusting your filters or check back later for new events.</p>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrev}
            className="page-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button 
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNext}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedEvents;
