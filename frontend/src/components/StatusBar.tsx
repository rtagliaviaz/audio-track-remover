import React from 'react';

interface StatusBarProps {
    status: string;
    queueStatus: string;
    error: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, queueStatus, error }) => {
  return (
    <>
      {status && (
        <div className="status-bar">
          <span>{status}</span>
        </div>
      )}

      {queueStatus && (
        <div className="status-bar" style={{ borderColor: '#ff9800' }}>
          <span>{queueStatus}</span>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: '#f44336' }}>
          <p style={{ color: '#f44336' }}>❌ {error}</p>
        </div>
      )}
    </>
  );
};