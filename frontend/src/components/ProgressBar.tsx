import React from 'react';

interface ProgressBarProps {
  progress: number;
  isLoading: boolean;
}

export function ProgressBar({ progress, isLoading }: ProgressBarProps) {
  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="progress-text">{Math.round(Math.min(progress, 100))}%</span>
    </div>
  );
}