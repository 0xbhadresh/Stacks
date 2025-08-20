"use client"

import { useState, useEffect } from "react"
import { GameLobby } from "@/components/game-lobby"
import { LiveGame } from "@/components/live-game"
import { ResultsPage } from "@/components/results-page"
import { Leaderboard } from "@/components/leaderboard"
import { useGameSocket } from "@/hooks/use-game-socket"
import { useFarcasterMiniApp } from "@/hooks/use-farcaster"

export type GameState = "lobby" | "live" | "results" | "leaderboard"
export type BetSide = "andar" | "bahar" | null

export interface Card { suit: "♠" | "♥" | "♦" | "♣"; rank: string; color: "red" | "black"; id: string }
export interface DrawnCard extends Card { side: "andar" | "bahar"; isMatching: boolean; order: number }
export interface GameData { 
  jokerCard: Card; 
  betSide: BetSide; 
  betAmount: number; 
  drawnCards: DrawnCard[]; 
  winner: BetSide; 
  matchingCard: Card | null; 
  playerWon: boolean | null; 
  payout: number; 
  totalBetsAndar: number; 
  totalBetsBahar: number; 
  playersJoined: number 
}

const suits: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

const generateCard = (): Card => { const suit = suits[Math.floor(Math.random() * suits.length)]; const rank = ranks[Math.floor(Math.random() * ranks.length)]; const color = suit === "♥" || suit === "♦" ? "red" : "black"; return { suit, rank, color, id: `${rank}${suit}` } }

export default function AndarBaharGame() {
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [gameData, setGameData] = useState<GameData>(() => { 
    const defaultCard: Card = { suit: "♠", rank: "A", color: "black", id: "A♠" }; 
    return { 
      jokerCard: defaultCard, 
      betSide: null, 
      betAmount: 100, 
      drawnCards: [], 
      winner: null, 
      matchingCard: null, 
      playerWon: null, 
      payout: 0, 
      totalBetsAndar: 2450, 
      totalBetsBahar: 1890, 
      playersJoined: 12 
    } 
  })

  const { gameState: serverGameState, placeBet, isConnected, lobbyDuration, fid, serverChips } = useGameSocket()
  const { isMiniApp, user, currentFid, chips, isFarcasterUser } = useFarcasterMiniApp()

  // Set socket FID when Farcaster hook is ready
  useEffect(() => {
    if (currentFid) {
      import('@/services/socket').then(m => { 
        try { 
          m.socketService.setFid(currentFid)
        } catch (e) {
          console.log('❌ Main: Failed to set socket FID:', e)
        } 
      })
    }
  }, [currentFid])

  // Send Farcaster user data to server when detected
  useEffect(() => {
    if (isFarcasterUser && user) {
      import('@/services/socket').then(m => { 
        try { 
          m.socketService.sendFarcasterUser(user as any)
        } catch (e) {
          console.log('❌ Main: Failed to send user to server:', e)
        } 
      })
    }
  }, [isFarcasterUser, user])

  const phase = serverGameState.phase
  useEffect(() => {
    if (!phase) return
    if (phase === 'playing') setGameState('live')
    if (phase === 'results') setGameState('results')
    if (phase === 'lobby') { setGameState('lobby'); setGameData(prev => ({ ...prev, betSide: null })) }
  }, [phase])

  useEffect(() => { setGameData(prev => ({ ...prev, jokerCard: generateCard(), totalBetsAndar: Math.floor(Math.random() * 3000) + 1000, totalBetsBahar: Math.floor(Math.random() * 3000) + 1000, playersJoined: Math.floor(Math.random() * 20) + 5 })) }, [])

  const handleBetPlaced = (side: BetSide, amount: number) => { 
    if (!side) return; 
    placeBet(side, amount); 
    console.log('🎯 Bet Placed:', { side, amount });
    setGameData((prev) => ({ 
      ...prev, 
      betSide: side, 
      betAmount: amount,
      playerWon: null, // Reset win status when new bet is placed
      payout: 0
    })); 
  }
  const handleGameComplete = (winner: BetSide, drawnCards: DrawnCard[], matchingCard: Card) => { const playerWon = gameData.betSide === winner; const payout = playerWon ? gameData.betAmount * 1.9 : 0; setGameData((prev) => ({ ...prev, winner, drawnCards, matchingCard, playerWon, payout })) }
  const handlePlayAgain = () => { 
    setGameData((prev) => ({ 
      ...prev, 
      jokerCard: generateCard(), 
      betSide: null, 
      betAmount: 100, 
      drawnCards: [], 
      winner: null, 
      matchingCard: null, 
      playerWon: null, 
      payout: 0, 
      totalBetsAndar: Math.floor(Math.random() * 3000) + 1000, 
      totalBetsBahar: Math.floor(Math.random() * 3000) + 1000, 
      playersJoined: Math.floor(Math.random() * 20) + 5 
    })) 
  }

  const serverDrawnCards = (serverGameState.drawnCards && serverGameState.drawnCards.length > 0) ? (serverGameState.drawnCards as unknown as DrawnCard[]) : undefined

  // Calculate playerWon based on user's bet and game winner
  const calculatePlayerWon = () => {
    // If no bet was placed, return null to indicate "no bet"
    if (!gameData.betSide) return null;
    // If no winner yet, return false
    if (!serverGameState.winner) return false;
    // Compare bet side with winner
    return gameData.betSide === serverGameState.winner;
  };

  const calculatedPlayerWon = calculatePlayerWon();
  const calculatedPayout = calculatedPlayerWon === true ? gameData.betAmount * 1.9 : 0;
  const hasPlacedBet = !!gameData.betSide;

  // Debug: Log win/loss calculation when in results phase
  useEffect(() => {
    if (gameState === 'results' && serverGameState.winner) {
      console.log('🎯 Frontend Win/Loss Calculation:', {
        hasPlacedBet,
        userBet: gameData.betSide,
        gameWinner: serverGameState.winner,
        playerWon: calculatedPlayerWon,
        payout: calculatedPayout,
        betAmount: gameData.betAmount
      });
    }
  }, [gameState, serverGameState.winner, calculatedPlayerWon, calculatedPayout, gameData.betSide, gameData.betAmount, hasPlacedBet]);

  const mergedGameData: GameData = { 
    ...gameData, 
    jokerCard: serverGameState.jokerCard || gameData.jokerCard, 
    totalBetsAndar: serverGameState.totalBetsAndar ?? gameData.totalBetsAndar, 
    totalBetsBahar: serverGameState.totalBetsBahar ?? gameData.totalBetsBahar, 
    playersJoined: serverGameState.playersCount ?? gameData.playersJoined, 
    drawnCards: serverDrawnCards ?? gameData.drawnCards, 
    winner: serverGameState.winner ?? gameData.winner,
    playerWon: calculatedPlayerWon,
    payout: calculatedPayout
  }

  const externalDrawnCards = serverDrawnCards
  const externalCurrentSide = serverGameState.currentSide
  const externalIsDrawing = serverGameState.phase === 'playing'

  // Display FID with priority: Farcaster user > Socket FID > Current FID
  const displayFid = user?.fid ? String(user.fid) : (fid ?? currentFid ?? '')
  const pfp = user?.pfpUrl || "/vercel.svg"
  const userType = isFarcasterUser ? "Farcaster" : "Browser"
  
  // Use server chips as primary source of truth, fallback to Farcaster hook chips
  const displayChips = serverChips !== null ? serverChips : chips

  return (
    <div className="h-screen bg-black text-white font-mono overflow-hidden">
      <div className="h-full max-w-sm mx-auto flex flex-col">
     

        {gameState === "lobby" && (
          <GameLobby gameData={mergedGameData} onBetPlaced={handleBetPlaced} onShowLeaderboard={() => setGameState("leaderboard")} countdownSeconds={serverGameState.lobbyTimeLeft || lobbyDuration} isConnected={isConnected} isLobbyPhase={serverGameState.phase === 'lobby'} />
        )}
        {gameState === "live" && (<LiveGame gameData={mergedGameData} onGameComplete={handleGameComplete} externalDrawnCards={externalDrawnCards} externalCurrentSide={externalCurrentSide} externalIsDrawing={externalIsDrawing} />)}
        {gameState === "results" && (
          <ResultsPage 
            gameData={mergedGameData} 
            onPlayAgain={handlePlayAgain} 
            onShowLeaderboard={() => setGameState("leaderboard")} 
            currentFid={displayFid}
          />
        )}
        {gameState === "leaderboard" && (
          <Leaderboard 
            onBackToLobby={() => setGameState("lobby")} 
            currentFid={displayFid}
          />
        )}
      </div>
    </div>
  )
}
