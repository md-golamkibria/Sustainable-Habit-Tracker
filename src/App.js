import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import components (we'll create these next)
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Actions from './components/Actions';
import Analytics from './components/Analytics';
import Challenges from './components/Challenges';
import Goals from './components/Goals';
import LoadingSpinner from './components/LoadingSpinner';
import SocialSharing from './components/SocialSharing';
import EducationalContent from './components/EducationalContent';
import Rankings from './components/Rankings';
import Events from './components/Events';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const response = await axios.get('/api/user/profile');
      console.log('Auth response:', response.data);
      setUser(response.data);
    } catch (error) {
      console.log('User not authenticated:', error.message);
      // User is not authenticated, which is fine - show login page
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('Handling login with user data:', userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await axios.post('/api/auth/logout');
      setUser(null);
      console.log('Logout successful, user set to null');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local user state
      setUser(null);
    }
  };

  console.log('App render - user:', user, 'loading:', loading);
  console.log('User exists for Navbar?', !!user);
  console.log('Navbar will render?', !!user);
  console.log('handleLogout function:', typeof handleLogout);
  
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <div className={user ? 'pt-16' : ''}>
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/actions" 
              element={user ? <Actions user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/analytics" 
              element={user ? <Analytics user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/challenges" 
              element={user ? <Challenges user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/goals" 
              element={user ? <Goals user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/education" 
              element={user ? <EducationalContent user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/rankings" 
              element={user ? <Rankings user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/events" 
              element={user ? <Events user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/social-sharing" 
              element={user ? <SocialSharing user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
