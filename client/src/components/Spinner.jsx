import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-solid border-indigo-500 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size] || sizeClasses.md} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading Convene...' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <Spinner size="lg" className="mb-4 text-indigo-400" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
}
