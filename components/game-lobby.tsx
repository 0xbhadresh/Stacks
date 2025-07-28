"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GameCard } from "@/components/game-card"
import { Trophy, Users } from "lucide-react"
import type { GameData, BetSide } from "@/app/page"

interface GameLobbyProps {
  gameData: GameData
  onBetPlaced: (side: BetSide, amount: number) => void
  onShowLeaderboard: () => void
}

export function GameLobby({ gameData, onBetPlaced, onShowLeaderboard }: GameLobbyProps) {
  const [selectedSide, setSelectedSide] = useState<BetSide>(null)
  const [betAmount, setBetAmount] = useState(100)
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const betAmounts = [50, 100, 250, 500]
  const total = gameData.totalBetsAndar + gameData.totalBetsBahar
  const andarPercentage = (gameData.totalBetsAndar / total) * 100

  const handleJoinGame = () => {
    if (selectedSide) {
      onBetPlaced(selectedSide, betAmount)
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-black text-white tracking-wider mb-2">ANDAR BAHAR</h1>
        <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{gameData.playersJoined} PLAYERS</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowLeaderboard}
            className="text-white hover:bg-white hover:text-black border border-white h-6 px-2 text-xs"
          >
            <Trophy className="w-3 h-3 mr-1" />
            RANKS
          </Button>
        </div>
      </div>

      {/* Joker Card - Now looks like a real playing card */}
      <div className="text-center mb-6">
        <p className="text-xs text-yellow-400 mb-3 font-bold tracking-widest">JOKER CARD</p>
        <GameCard card={gameData.jokerCard} size="lg" isJoker={true} className="mx-auto" />
      </div>

      {/* Betting Interface */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-gray-900 border-2 border-white rounded-lg p-4 mb-4">
          <h3 className="text-center text-sm font-black text-white mb-3">PLACE YOUR BET</h3>

          {/* Bet Amount */}
          <div className="mb-4">
            <p className="text-xs text-center text-white mb-2 font-bold">BET AMOUNT</p>
            <div className="grid grid-cols-4 gap-2">
              {betAmounts.map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  className={`h-8 text-xs font-bold transition-all duration-200 ${
                    betAmount === amount
                      ? "bg-white text-black border-2 border-black scale-105"
                      : "bg-transparent text-white border border-white hover:bg-white hover:text-black hover:scale-105"
                  }`}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Side Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setSelectedSide("andar")}
              className={`h-12 font-black border-2 transition-all duration-300 ${
                selectedSide === "andar"
                  ? "bg-white text-black border-black scale-105 shadow-lg"
                  : "bg-transparent text-white border-white hover:bg-white hover:text-black hover:scale-105"
              }`}
            >
              <div className="text-center">
                <div className="text-sm">ANDAR</div>
                <div className="text-xs opacity-75">LEFT</div>
              </div>
            </Button>

            <Button
              onClick={() => setSelectedSide("bahar")}
              className={`h-12 font-black border-2 transition-all duration-300 ${
                selectedSide === "bahar"
                  ? "bg-white text-black border-black scale-105 shadow-lg"
                  : "bg-transparent text-white border-white hover:bg-white hover:text-black hover:scale-105"
              }`}
            >
              <div className="text-center">
                <div className="text-sm">BAHAR</div>
                <div className="text-xs opacity-75">RIGHT</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-400 mb-3 font-bold">GAME STARTS IN</p>
          <div className="w-20 h-20 mx-auto relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={countdown <= 5 ? "#ffffff" : "#ffffff"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / 15)}`}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${countdown <= 5 ? "animate-pulse" : ""}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-black ${countdown <= 5 ? "text-white animate-pulse" : "text-white"}`}>
                {countdown}
              </span>
            </div>
          </div>
        </div>

        {/* Bet Stats */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white">ANDAR {gameData.totalBetsAndar.toLocaleString()}</span>
            <span className="text-white">BAHAR {gameData.totalBetsBahar.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${andarPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Join Button */}
      <Button
        onClick={handleJoinGame}
        disabled={!selectedSide}
        className={`w-full h-12 font-black border-2 transition-all duration-300 ${
          selectedSide
            ? "bg-white text-black border-black hover:bg-gray-200 hover:scale-105 shadow-lg"
            : "bg-gray-800 text-gray-500 border-gray-600 cursor-not-allowed"
        }`}
      >
        {selectedSide ? `JOIN • ${betAmount} ON ${selectedSide.toUpperCase()}` : "SELECT A SIDE"}
      </Button>
    </div>
  )
}
