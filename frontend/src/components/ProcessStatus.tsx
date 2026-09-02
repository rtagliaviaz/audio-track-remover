import React from 'react';

interface ProcessStatusProps {
    processed: boolean;
    message?: string;
}

export const ProcessStatus: React.FC<ProcessStatusProps> = ({ processed, message }) => {
    if (!processed) return null;

    const defaultMessage = '✅ Video processed successfully. File saved in backend/outputs/';

    return (
        <p style={{ color: '#4CAF50', marginTop: '1rem' }}>
            {message || defaultMessage}
        </p>
    );
};