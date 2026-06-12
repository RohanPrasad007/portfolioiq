import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api-client';
import { JobProgressData } from '@portfolioiq/shared';

export const useJobProgress = (insightId: string | null) => {
  const [data, setData] = useState<JobProgressData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!insightId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const poll = async () => {
      try {
        const res = await apiClient.get(`/api/analysis/${insightId}/status`);
        if (res.data && res.data.success) {
          const jobData = res.data.data;
          setData(jobData);
          
          if (jobData.status === 'completed' || jobData.status === 'failed') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsLoading(false);
          }
        } else {
          setError(res.data.error || 'Failed to poll progress status');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        setError(err.response?.data?.error || err.message || 'Error checking progress');
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [insightId]);

  return {
    status: data?.status || null,
    progress: data?.progress ?? 0,
    currentStage: data?.currentStage || 'Queued',
    logs: data?.logs || [],
    isLoading,
    error: error || data?.error || null,
  };
};

export default useJobProgress;
