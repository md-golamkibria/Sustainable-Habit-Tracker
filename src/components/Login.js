import React, { useState } from 'react';
import axios from 'axios';
import { Leaf, User, Mail } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    // Registration
    if (isRegister) {
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('All fields are required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await axios.post('/api/auth/register', { username: username.trim(), email: email.trim(), password: password.trim() });
        console.log('Registration successful:', response.data);
        setSuccess('Registration successful! Logging you in...');
        
        // Clear form fields on successful registration
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Small delay to show success message before redirect
        setTimeout(() => {
          onLogin(response.data.user);
        }, 1500);
      } catch (error) {
        console.error('Registration error:', error.response?.data);
        setError(error.response?.data?.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      if (!username.trim() || !password.trim()) {
        setError('Username and password are required');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await axios.post('/api/auth/login', { username: username.trim(), password: password.trim() });
        console.log('Login successful:', response.data);
        setSuccess('Login successful!');
        
        // Clear form fields on successful login
        setUsername('');
        setPassword('');
        
        // Use the user data from login response directly
        setTimeout(() => {
          onLogin(response.data.user);
        }, 500);
      } catch (error) {
        console.error('Login error:', error.response?.data);
        setError(error.response?.data?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center">
            <Leaf className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Sprint 3 - Social & Gamification Features
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-white px-4 py-3 rounded">
                {success}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="off"
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/20 placeholder-white/60 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:z-10 sm:text-sm"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/60" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required={isRegister}
                    autoComplete="off"
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/20 placeholder-white/60 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:z-10 sm:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/20 placeholder-white/60 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-white/60" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required={isRegister}
                    autoComplete="off"
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/20 placeholder-white/60 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-green-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                    {isRegister ? 'Registering...' : 'Signing in...'}
                  </div>
                ) : (
                  isRegister ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-white/70">
                Enter your username and password to access your sustainable habit tracking dashboard!
              </p>
            </div>
            <div className="text-center">
              <button
                type="button"
                className="text-white hover:underline"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                  setSuccess('');
                }}
                disabled={loading}
              >
                {isRegister ? 'Already have an account? Sign in' : 'New user? Sign up here'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
