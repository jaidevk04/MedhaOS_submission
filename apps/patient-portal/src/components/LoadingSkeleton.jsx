import React from 'react';

export const SkeletonLine = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

export const SkeletonMessage = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
    <div className={`max-w-[85%] rounded-lg p-3 ${
      isUser ? 'bg-gray-300' : 'bg-gray-200'
    }`}>
      <div className="h-4 bg-gray-400 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-400 rounded w-32"></div>
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-48"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonPatientQueue = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="card animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonCard;
