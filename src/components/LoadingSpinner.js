import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
        <h2 className="text-white text-xl font-semibold">Loading...</h2>
        <p className="text-white/80 mt-2">Sprint 3 - Social & Gamification</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
