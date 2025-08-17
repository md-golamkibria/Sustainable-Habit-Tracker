import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Home, Activity, BarChart3, Trophy, Target, Share2, LogOut, Menu, X, BookOpen, Medal, Calendar, Star } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Debug logging
  console.log('Navbar rendering with user:', user);
  console.log('User name:', user?.name || user?.username);
  console.log('onLogout function:', typeof onLogout);
  console.log('User present?', !!user);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Actions', href: '/actions', icon: Activity },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Challenges', href: '/challenges', icon: Trophy },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Rankings', href: '/rankings', icon: Medal },
    { name: 'Education', href: '/education', icon: BookOpen },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'More', href: '/more', icon: Star },
    { name: 'Share', href: '/social-sharing', icon: Share2 },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="navbar-container max-w-full mx-auto">
        {/* Left side - Logo and Brand */}
        <div className="navbar-left">
          <Leaf className="h-8 w-8 text-green-500" />
          <span className="ml-2 text-xl font-bold text-gray-900">
            EcoTracker
          </span>
          <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Sprint 3
          </span>
        </div>

        {/* Center - Navigation Links (hidden on mobile) */}
        <div className="navbar-center hidden md:flex">
          {navigation.filter(item => 
            ['Dashboard', 'Actions', 'Analytics', 'Challenges', 'Goals', 'Share', 'More'].includes(item.name)
          ).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'border-green-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right side - User info and logout */}
        <div className="navbar-right">
          <span className="hidden sm:block text-gray-700 font-medium whitespace-nowrap text-sm">
            Hello, {user?.name || user?.username || 'User'}!
          </span>
          
          {/* Desktop logout button - Always visible on desktop */}
          <button
            onClick={() => {
              console.log('🔴 LOGOUT BUTTON CLICKED - user:', user?.name);
              console.log('onLogout function available:', !!onLogout);
              if (onLogout && typeof onLogout === 'function') {
                onLogout();
              } else {
                console.error('❌ onLogout function not provided or not a function');
                alert('Logout function not available');
              }
            }}
            className="logout-btn hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
            type="button"
            id="desktop-logout-btn"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          >
            {isOpen ? (
              <X className="block h-6 w-6" />
            ) : (
              <Menu className="block h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden bg-white border-t shadow-lg">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name || user?.username || 'User'}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email || 'No email'}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('Mobile logout button clicked');
                  if (onLogout) {
                    onLogout();
                  }
                  setIsOpen(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                type="button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
