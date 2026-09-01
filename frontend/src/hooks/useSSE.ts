import { useState, useEffect } from 'react';

export const useSSE = (jobId: string | null) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/api/events?jobId=${jobId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.done) {
          setIsComplete(true);
          setProgress(100);
          eventSource.close();
        }
        if (data.error) {
          setError(data.error);
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setError('SSE connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [jobId]);

  return { progress, isComplete, error };
};