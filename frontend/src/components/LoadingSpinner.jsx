import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };
  return (
    <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`} />
  );
}
