import { io, Socket } from 'socket.io-client';
import config from '@/lib/config';

export type GamePhase = 'lobby' | 'playing' | 'results';
export type BetSide = 'andar' | 'bahar' | null;

export interface Card { suit: '♠' | '♥' | '♦' | '♣'; rank: string; color: 'red' | 'black'; id: string }
export interface DrawnCard extends Card { side: 'andar' | 'bahar'; isMatching: boolean; order: number }
export interface Player { id: string; name: string; chips: number; currentBet?: { side: BetSide; amount: number } }
export interface GameState { 
  phase: GamePhase; 
  sessionId: string; 
  playersCount: number; 
  totalBetsAndar: number; 
  totalBetsBahar: number; 
  jokerCard: Card | null; 
  drawnCards: DrawnCard[]; 
  winner: BetSide; 
  currentSide: 'andar' | 'bahar'; 
  lobbyTimeLeft: number; 
  gameNumber: number; 
  lastGameWinner: BetSide; 
  lastGameJoker: Card | null;
  playerWon?: boolean;
  payout?: number;
}
export interface BetUpdate { playerId: string; side: BetSide; amount: number }
export interface CardDrawn { card: DrawnCard; currentSide: 'andar' | 'bahar' }
export interface GameComplete { winner: BetSide; winningCard: Card; totalCards: number; payouts: Record<string, number> }

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private currentFid: string | null = null;

  constructor() { 
    // Don't auto-connect - wait for FID to be set
  }

  setFid(fid: string) {
    const next = String(fid)
    if (this.currentFid === next) return
    
    console.log('🔌 Socket: Setting FID to', next)
    this.currentFid = next
    
    // Disconnect existing connection
    if (this.socket) {
      try { 
        this.socket.disconnect() 
        console.log('🔌 Socket: Disconnected old connection')
      } catch {}
      this.socket = null
      this.isConnected = false
    }
    
    // Connect with new FID
    this.connect()
  }

  private connect() {
    if (!this.currentFid) {
      console.log('⚠️ Socket: Cannot connect without FID')
      return
    }
    
    if (this.socket && this.socket.connected) return;
    
    const serverUrl = config.socketUrl;
    console.log('🔌 Socket: Connecting with FID', this.currentFid)
    
    this.socket = io(serverUrl, { 
      transports: ['websocket', 'polling'], 
      timeout: 20000, 
      forceNew: false, 
      auth: { fid: this.currentFid } 
    });
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => { 
      this.isConnected = true; 
      this.reconnectAttempts = 0; 
      console.log('🔌 Socket: Connected')
      this.emit('connected'); 
    });
    
    this.socket.on('disconnect', (reason: string) => { 
      this.isConnected = false; 
      console.log('🔌 Socket: Disconnected -', reason)
      this.emit('disconnected', reason); 
      if (reason === 'io server disconnect') { 
        this.handleReconnect(); 
      } 
    });
    
    this.socket.on('connect_error', (error: unknown) => { 
      console.log('🔌 Socket: Connection error', error)
      this.emit('error', error); 
      this.handleReconnect(); 
    });

    this.socket.on('userInfo', (data: { fid: string; chips: number }) => { 
      console.log('🔌 Socket: User info received', data)
      this.emit('userInfo', data); 
    });
    
    this.socket.on('chipsUpdate', (data: { chips: number }) => { 
      console.log('🔌 Socket: Chips update received', data)
      this.emit('chipsUpdate', data); 
    });
    
    this.socket.on('gameState', (state: GameState) => { 
      this.emit('gameState', state); 
    });
    
    this.socket.on('betUpdate', (update: BetUpdate) => { 
      this.emit('betUpdate', update); 
    });
    
    this.socket.on('betAccepted', (data: { playerId: string; side: BetSide; amount: number; totalBetsAndar: number; totalBetsBahar: number; }) => { 
      console.log('🔌 Socket: Bet accepted', data)
      this.emit('betAccepted', data); 
    });
    
    this.socket.on('cardDrawn', (data: CardDrawn) => { 
      this.emit('cardDrawn', data); 
    });
    
    this.socket.on('gameComplete', (data: GameComplete) => { 
      this.emit('gameComplete', data); 
    });
    
    this.socket.on('lobbyTimer', (timeLeft: number) => { 
      this.emit('lobbyTimer', timeLeft); 
    });
    
    this.socket.on('error', (error: string) => { 
      this.emit('gameError', error); 
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) { 
      console.log('🔌 Socket: Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached'); 
      return; 
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    console.log(`🔌 Socket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => { 
      this.reconnectAttempts++; 
      this.connect(); 
    }, delay);
  }

  on(event: string, callback: Function) { 
    if (!this.listeners.has(event)) { 
      this.listeners.set(event, new Set()); 
    } 
    this.listeners.get(event)!.add(callback); 
  }
  
  off(event: string, callback: Function) { 
    const l = this.listeners.get(event); 
    if (l) { 
      l.delete(callback); 
    } 
  }
  
  private emit(event: string, data?: any) { 
    const l = this.listeners.get(event); 
    if (l) { 
      l.forEach(cb => cb(data)); 
    } 
  }

  joinSession(playerName: string = 'Anonymous') { 
    if (!this.isConnected) {
      console.log('⚠️ Socket: Cannot join session - not connected')
      return
    }
    this.socket?.emit('joinSession', { playerName }); 
  }
  
  placeBet(side: BetSide, amount: number) { 
    if (!this.isConnected) {
      console.log('⚠️ Socket: Cannot place bet - not connected')
      return
    }
    this.socket?.emit('placeBet', { side, amount }); 
  }
  
  leaveSession() { 
    this.socket?.emit('leaveSession'); 
  }
  
  addChips(amount: number) { 
    this.socket?.emit('chips:add', amount) 
  }
  
  subtractChips(amount: number) { 
    this.socket?.emit('chips:sub', amount) 
  }
  
  sendFarcasterUser(user: { fid: number; username?: string; displayName?: string; pfpUrl?: string; bio?: string; location?: { placeId: string; description: string } }) { 
    this.socket?.emit('farcasterUser', user) 
  }
  
  requestUserInfo() {
    if (!this.isConnected) {
      console.log('⚠️ Socket: Cannot request user info - not connected')
      return
    }
    console.log('🔌 Socket: Requesting user info from server')
    this.socket?.emit('requestUserInfo')
  }
  
  ping() { 
    if (this.socket && this.isConnected) { 
      this.socket.emit('ping'); 
    } 
  }
  
  disconnect() { 
    if (this.socket) { 
      this.socket.disconnect(); 
      this.socket = null; 
      this.isConnected = false; 
    } 
  }
  
  getConnectionStatus() { 
    return { 
      isConnected: this.isConnected, 
      reconnectAttempts: this.reconnectAttempts,
      currentFid: this.currentFid 
    }; 
  }
  
  getSocketId(): string | null { 
    return this.socket?.id ?? null; 
  }
  
  getCurrentFid(): string | null {
    return this.currentFid
  }
}

declare global { var __socketService__: SocketService | undefined; }
const globalRef = globalThis as unknown as { __socketService__?: SocketService };
export const socketService: SocketService = globalRef.__socketService__ ?? new SocketService();
globalRef.__socketService__ = socketService;
export default socketService; 