import { useState, useEffect, useRef, useCallback } from 'react';
import config from '@/lib/config';

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  chips: number;
  totalEarned: number;
  totalLost: number;
}

export function useUserStats(fid: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!fid) return;
    
    // Prevent duplicate requests
    if (isFetchingRef.current && !forceRefresh) {
      console.log('📊 Hook: Skipping duplicate request for FID:', fid);
      return;
    }

    // Check if we already have fresh data
    if (!forceRefresh && lastFetchRef.current === fid && stats) {
      console.log('📊 Hook: Using cached stats for FID:', fid);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const baseUrl = config.socketUrl.replace(/^ws/, 'http');
      const url = `${baseUrl}/api/user-stats?fid=${fid}`;
      console.log('📊 Hook: Fetching stats from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Hook: Received stats:', data);
      setStats(data);
      lastFetchRef.current = fid;
    } catch (err) {
      console.error('❌ Hook: Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [fid, stats]);

  // Fetch stats when FID changes (only once)
  useEffect(() => {
    if (fid && lastFetchRef.current !== fid) {
      fetchStats();
    }
  }, [fid, fetchStats]);

  // Refresh stats function
  const refreshStats = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  // Update stats when game completes
  const updateStats = useCallback(async (gameResult: { won: boolean; amount: number; payout?: number }) => {
    if (!fid) return;

    try {
      const baseUrl = config.socketUrl.replace(/^ws/, 'http');
      const url = `${baseUrl}/api/user-stats`;
      const payload = { fid, gameResult };
      
      console.log('📊 Hook: Updating stats:', url, payload);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update stats: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 Hook: Stats update result:', result);
      
      // Refresh stats after update (force refresh to get latest data)
      fetchStats(true);
    } catch (err) {
      console.error('❌ Hook: Error updating user stats:', err);
    }
  }, [fid, fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    updateStats
  };
} 