import { useState, useEffect, useRef, useCallback } from 'react';
import config from '@/lib/config';

export interface LeaderboardPlayer {
  fid: string;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  chips: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  isFarcaster: boolean;
}

export type LeaderboardType = 'chips' | 'wins' | 'winRate' | 'streak';

export function useLeaderboard(type: LeaderboardType = 'chips', limit: number = 10) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate requests
    if (isFetchingRef.current && !forceRefresh) {
      console.log('🏆 Hook: Skipping duplicate leaderboard request for type:', type);
      return;
    }

    // Check if we already have fresh data
    const cacheKey = `${type}-${limit}`;
    if (!forceRefresh && lastFetchRef.current === cacheKey && players.length > 0) {
      console.log('🏆 Hook: Using cached leaderboard for type:', type);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const baseUrl = config.socketUrl.replace(/^ws/, 'http');
      const url = `${baseUrl}/api/leaderboard?type=${type}&limit=${limit}`;
      console.log('🏆 Hook: Fetching leaderboard from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      console.log('🏆 Hook: Received leaderboard:', type, 'with', data.length, 'players');
      setPlayers(data);
      lastFetchRef.current = cacheKey;
    } catch (err) {
      console.error('❌ Hook: Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [type, limit, players.length]);

  // Fetch leaderboard when type or limit changes
  useEffect(() => {
    const cacheKey = `${type}-${limit}`;
    if (lastFetchRef.current !== cacheKey) {
      fetchLeaderboard();
    }
  }, [type, limit, fetchLeaderboard]);

  // Refresh leaderboard function
  const refreshLeaderboard = useCallback(() => {
    fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  return {
    players,
    loading,
    error,
    refreshLeaderboard
  };
} 