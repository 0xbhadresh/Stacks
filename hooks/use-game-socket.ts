import { useState, useEffect, useCallback } from 'react';
import socketService, { GameState, BetSide, BetUpdate, CardDrawn, GameComplete } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';

const initialGameState: GameState = {
  phase: 'lobby',
  sessionId: '',
  playersCount: 0,
  totalBetsAndar: 0,
  totalBetsBahar: 0,
  jokerCard: null,
  drawnCards: [],
  winner: null,
  currentSide: 'andar',
  lobbyTimeLeft: 30,
  gameNumber: 1,
  lastGameWinner: null,
  lastGameJoker: null,
};

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerBet, setPlayerBet] = useState<{ side: BetSide; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<GameComplete | null>(null);
  const [lobbyDuration, setLobbyDuration] = useState<number>(30);
  const [fid, setFid] = useState<string | null>(null);
  const [serverChips, setServerChips] = useState<number | null>(null);
  const { toast } = useToast();

  const handleConnected = useCallback(() => { 
    setIsConnected(true); 
    setConnectionError(null); 
  }, []);
  
  const handleDisconnected = useCallback((reason: string) => { 
    setIsConnected(false); 
    toast({ title: "Disconnected", description: `Connection lost: ${reason}`, variant: "destructive" }); 
  }, [toast]);
  
  const handleConnectionError = useCallback((error: any) => { 
    setConnectionError(error.message || 'Connection failed'); 
    toast({ title: "Connection Error", description: "Failed to connect to game server", variant: "destructive" }); 
  }, [toast]);
  
  const handleMaxReconnectAttempts = useCallback(() => { 
    setConnectionError('Unable to connect to server. Please refresh the page.'); 
    toast({ title: "Connection Failed", description: "Unable to connect to server. Please refresh the page.", variant: "destructive" }); 
  }, [toast]);

  const handleUserInfo = useCallback((data: { fid: string; chips: number }) => { 
    setFid(data.fid); 
    setServerChips(data.chips);
  }, []);
  
  const handleChipsUpdate = useCallback((data: { chips: number }) => { 
    setServerChips(data.chips);
    
    // Notify the Farcaster hook about the chip update
    const event = new CustomEvent('serverChipsUpdate', { detail: { chips: data.chips } });
    window.dispatchEvent(event);
  }, []);

  const handleGameState = useCallback((state: GameState) => { 
    setGameState(state); 
    if (state.phase === 'lobby' && typeof state.lobbyTimeLeft === 'number' && state.lobbyTimeLeft > 0) { 
      setLobbyDuration(state.lobbyTimeLeft); 
    } 
  }, []);
  
  const handleBetUpdate = useCallback((_update: BetUpdate) => {}, []);
  
  const handleBetAccepted = useCallback((data: { playerId: string; side: BetSide; amount: number; totalBetsAndar: number; totalBetsBahar: number; }) => {
    const myId = socketService.getSocketId(); 
    if (data.playerId !== myId) return; 
    setPlayerBet({ side: data.side, amount: data.amount }); 
    setGameState(prev => ({ ...prev, totalBetsAndar: data.totalBetsAndar, totalBetsBahar: data.totalBetsBahar }));
  }, []);
  
  const handleCardDrawn = useCallback((data: CardDrawn) => { 
    setGameState(prev => ({ ...prev, drawnCards: [...prev.drawnCards, data.card], currentSide: data.currentSide })); 
  }, []);
  
  const handleGameComplete = useCallback((data: GameComplete) => {
    const socketId = socketService.getSocketId(); 
    const payout = socketId ? (data.payouts[socketId] || 0) : 0;
    const playerWon = payout > 0;
    
    console.log('🎮 Game Complete:', { 
      socketId, 
      payout, 
      playerWon, 
      winner: data.winner, 
      payouts: data.payouts 
    });
    
    setGameState(prev => ({ 
      ...prev, 
      winner: data.winner, 
      phase: 'results',
      playerWon: playerWon,
      payout: payout
    })); 
    setLastResult(data);
    
    if (playerWon && payout > 0) { 
      toast({ title: "🎉 You Won!", description: `Congratulations! You won ${payout} chips!` }); 
    } else if (playerBet) { 
      toast({ title: "Better luck next time", description: `The ${data.winner} side won this round.`, variant: "destructive" }); 
    }
  }, [playerBet, toast]);
  
  const handleLobbyTimer = useCallback((timeLeft: number) => { 
    setGameState(prev => ({ ...prev, lobbyTimeLeft: timeLeft })); 
  }, []);
  
  const handleGameError = useCallback((error: string) => { 
    toast({ title: "Game Error", description: error, variant: "destructive" }); 
  }, [toast]);

  useEffect(() => {
    socketService.on('connected', handleConnected);
    socketService.on('disconnected', handleDisconnected);
    socketService.on('error', handleConnectionError);
    socketService.on('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
    socketService.on('userInfo', handleUserInfo);
    socketService.on('chipsUpdate', handleChipsUpdate);
    socketService.on('gameState', handleGameState);
    socketService.on('betUpdate', handleBetUpdate);
    socketService.on('betAccepted', handleBetAccepted);
    socketService.on('cardDrawn', handleCardDrawn);
    socketService.on('gameComplete', handleGameComplete);
    socketService.on('lobbyTimer', handleLobbyTimer);
    socketService.on('gameError', handleGameError);

    // Only join session if we have a FID set
    const currentFid = socketService.getCurrentFid()
    if (currentFid) {
      socketService.joinSession();
    }

    return () => {
      socketService.off('connected', handleConnected);
      socketService.off('disconnected', handleDisconnected);
      socketService.off('error', handleConnectionError);
      socketService.off('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
      socketService.off('userInfo', handleUserInfo);
      socketService.off('chipsUpdate', handleChipsUpdate);
      socketService.off('gameState', handleGameState);
      socketService.off('betUpdate', handleBetUpdate);
      socketService.off('betAccepted', handleBetAccepted);
      socketService.off('cardDrawn', handleCardDrawn);
      socketService.off('gameComplete', handleGameComplete);
      socketService.off('lobbyTimer', handleLobbyTimer);
      socketService.off('gameError', handleGameError);
    };
  }, [handleConnected, handleDisconnected, handleConnectionError, handleMaxReconnectAttempts, handleUserInfo, handleChipsUpdate, handleGameState, handleBetUpdate, handleBetAccepted, handleCardDrawn, handleGameComplete, handleLobbyTimer, handleGameError]);

  // Fetch chips on page reload/reconnect
  useEffect(() => {
    const fetchChipsOnReload = () => {
      if (isConnected && fid) {
        socketService.requestUserInfo();
      }
    };

    // Fetch chips when component mounts or reconnects
    fetchChipsOnReload();

    // Also fetch chips when window regains focus (user comes back to tab)
    const handleFocus = () => {
      if (isConnected) {
        fetchChipsOnReload();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isConnected, fid]);

  // Automatic chip refresh every 10 seconds
  useEffect(() => {
    if (!isConnected || !fid) return;

    const interval = setInterval(() => {
      socketService.requestUserInfo();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, fid]);

  // Refresh chips when game state changes (new game, results, etc.)
  useEffect(() => {
    if (isConnected && fid && gameState.phase) {
      socketService.requestUserInfo();
    }
  }, [gameState.phase, isConnected, fid]);

  // Refresh chips specifically when entering lobby phase
  useEffect(() => {
    if (isConnected && fid && gameState.phase === 'lobby') {
      socketService.requestUserInfo();
    }
  }, [gameState.phase, isConnected, fid]);

  // Fallback: Fetch chips via REST API if WebSocket fails
  const fetchChipsViaApi = useCallback(async () => {
    if (!fid) return;
    
    try {
      const config = await import('@/lib/config');
      const baseUrl = config.default.socketUrl.replace(/^ws/, 'http');
      const response = await fetch(`${baseUrl}/api/user?fid=${fid}`);
      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.chips !== undefined) {
          setServerChips(userData.chips);
        }
      }
    } catch (error) {
      console.log('❌ Failed to fetch chips via REST API:', error);
    }
  }, [fid]);

  // Try REST API fallback if WebSocket chips are not loaded after 5 seconds
  useEffect(() => {
    if (isConnected && fid && serverChips === null) {
      const timer = setTimeout(() => {
        fetchChipsViaApi();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, fid, serverChips, fetchChipsViaApi]);

  const placeBet = useCallback((side: BetSide, amount: number) => {
    if (gameState.phase !== 'lobby') { 
      toast({ title: "Betting Closed", description: "You can only bet during lobby", variant: "destructive" }); 
      return; 
    }
    
    if (!isConnected) {
      toast({ title: "Not Connected", description: "Please wait for connection to place bet", variant: "destructive" }); 
      return;
    }
    
    socketService.placeBet(side, amount);
  }, [gameState.phase, isConnected, toast]);

  const joinSession = useCallback(() => { 
    socketService.joinSession(); 
  }, []);
  
  const leaveSession = useCallback(() => { 
    socketService.leaveSession(); 
  }, []);

  // Manual refresh function to fetch latest chip balance
  const refreshChips = useCallback(() => {
    if (isConnected && fid) {
      socketService.requestUserInfo();
    }
  }, [isConnected, fid]);

  return {
    gameState,
    isConnected,
    connectionError,
    playerBet,
    lastResult,
    lobbyDuration,
    fid,
    serverChips,
    placeBet,
    joinSession,
    leaveSession,
    refreshChips,
  };
} 