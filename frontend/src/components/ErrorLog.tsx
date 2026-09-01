import React from 'react';

interface ErrorEntry {
    videoName: string;
    error: string;
    timestamp: Date;
}

interface ErrorLogProps {
    errors: ErrorEntry[];
    onClear: () => void;
}

export const ErrorLog: React.FC<ErrorLogProps> = ({ errors, onClear }) => {
    if (errors.length === 0) return null;

    return (
        <div className="card" style={{ borderColor: '#f44336' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#f44336', margin: 0 }}>❌ Errors</h3>
                <button
                    className="btn btn-secondary"
                    onClick={onClear}
                    style={{ padding: '0.2rem 0.75rem', fontSize: '0.75rem' }}
                >
                    Clear
                </button>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
                {errors.map((entry, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '0.5rem 0.75rem',
                            marginBottom: '0.3rem',
                            background: 'rgba(244, 67, 54, 0.05)',
                            borderRadius: '4px',
                            borderLeft: '3px solid #f44336',
                            fontSize: '0.85rem',
                        }}
                    >
                        <strong style={{ fontSize: '0.9rem' }}>{entry.videoName}</strong>
                        <span style={{ color: '#888', marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                            {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <div style={{ marginTop: '0.2rem', color: '#aaa' }}>
                            - {entry.error}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};