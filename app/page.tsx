"use client"

import { useState, useEffect } from "react"
import { GameLobby } from "@/components/game-lobby"
import { LiveGame } from "@/components/live-game"
import { ResultsPage } from "@/components/results-page"
import { Leaderboard } from "@/components/leaderboard"

export type GameState = "lobby" | "live" | "results" | "leaderboard"
export type BetSide = "andar" | "bahar" | null

export interface Card {
  suit: "♠" | "♥" | "♦" | "♣"
  rank: string
  color: "red" | "black"
  id: string
}

export interface DrawnCard extends Card {
  side: "andar" | "bahar"
  isMatching: boolean
  order: number
}

export interface GameData {
  jokerCard: Card
  betSide: BetSide
  betAmount: number
  drawnCards: DrawnCard[]
  winner: BetSide
  matchingCard: Card | null
  playerWon: boolean
  payout: number
  totalBetsAndar: number
  totalBetsBahar: number
  playersJoined: number
}

const suits: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

const generateCard = (): Card => {
  const suit = suits[Math.floor(Math.random() * suits.length)]
  const rank = ranks[Math.floor(Math.random() * ranks.length)]
  const color = suit === "♥" || suit === "♦" ? "red" : "black"
  return {
    suit,
    rank,
    color,
    id: `${rank}${suit}`,
  }
}

export default function AndarBaharGame() {
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [gameData, setGameData] = useState<GameData>(() => {
    // Use a default card for initial state to avoid hydration mismatch
    const defaultCard: Card = {
      suit: "♠",
      rank: "A",
      color: "black",
      id: "A♠",
    }
    
    return {
      jokerCard: defaultCard,
      betSide: null,
      betAmount: 100,
      drawnCards: [],
      winner: null,
      matchingCard: null,
      playerWon: false,
      payout: 0,
      totalBetsAndar: 2450,
      totalBetsBahar: 1890,
      playersJoined: 12,
    }
  })

  // Generate random card after component mounts to avoid hydration mismatch
  useEffect(() => {
    setGameData(prev => ({
      ...prev,
      jokerCard: generateCard(),
      totalBetsAndar: Math.floor(Math.random() * 3000) + 1000,
      totalBetsBahar: Math.floor(Math.random() * 3000) + 1000,
      playersJoined: Math.floor(Math.random() * 20) + 5,
    }))
  }, [])

  const handleBetPlaced = (side: BetSide, amount: number) => {
    setGameData((prev) => ({
      ...prev,
      betSide: side,
      betAmount: amount,
    }))
    setGameState("live")
  }

  const handleGameComplete = (winner: BetSide, drawnCards: DrawnCard[], matchingCard: Card) => {
    const playerWon = gameData.betSide === winner
    const payout = playerWon ? gameData.betAmount * 1.9 : 0

    setGameData((prev) => ({
      ...prev,
      winner,
      drawnCards,
      matchingCard,
      playerWon,
      payout,
    }))
    setGameState("results")
  }

  const handlePlayAgain = () => {
    setGameData((prev) => ({
      ...prev,
      jokerCard: generateCard(),
      betSide: null,
      betAmount: 100,
      drawnCards: [],
      winner: null,
      matchingCard: null,
      playerWon: false,
      payout: 0,
      totalBetsAndar: Math.floor(Math.random() * 3000) + 1000,
      totalBetsBahar: Math.floor(Math.random() * 3000) + 1000,
      playersJoined: Math.floor(Math.random() * 20) + 5,
    }))
    setGameState("lobby")
  }

  return (
    <div className="h-screen bg-black text-white font-mono overflow-hidden">
      <div className="h-full max-w-sm mx-auto flex flex-col">
        {gameState === "lobby" && (
          <GameLobby
            gameData={gameData}
            onBetPlaced={handleBetPlaced}
            onShowLeaderboard={() => setGameState("leaderboard")}
          />
        )}

        {gameState === "live" && <LiveGame gameData={gameData} onGameComplete={handleGameComplete} />}

        {gameState === "results" && (
          <ResultsPage
            gameData={gameData}
            onPlayAgain={handlePlayAgain}
            onShowLeaderboard={() => setGameState("leaderboard")}
          />
        )}

        {gameState === "leaderboard" && <Leaderboard onBackToLobby={() => setGameState("lobby")} />}
      </div>
    </div>
  )
}
