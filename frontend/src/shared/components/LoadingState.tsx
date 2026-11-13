import React from 'react';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading VirtuPass data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
};
