// hooks/useSessionCache.ts
import { useState, useEffect } from 'react';

export function useSessionCache<T>(
  key: string,
  fetchData: () => Promise<T>,
  expiryTime: number = 10 * 60 * 1000 // 10 mins default
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(0);

  useEffect(() => {
    const fetchCachedData = async () => {
      if (data && Date.now() - lastFetched < expiryTime) {
        setLoading(false);
        return;
      }

      try {
        const freshData = await fetchData();
        setData(freshData);
        setLastFetched(Date.now());
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchCachedData();
  }, [key, fetchData, expiryTime, data, lastFetched]);

  return { data, loading, setData };
}