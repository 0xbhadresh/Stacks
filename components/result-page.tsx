"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Share2, Trophy, RotateCcw } from "lucide-react"
import type { GameData } from "@/app/page"

interface ResultPageProps {
  gameData: GameData
  onPlayAgain: () => void
  onShowLeaderboard: () => void
}

export function ResultPage({ gameData, onPlayAgain, onShowLeaderboard }: ResultPageProps) {
  const handleShare = () => {
    const message = gameData.playerWon
      ? `🎉 Just won ${gameData.payout} chips in Andar Bahar! The ${gameData.winner} side won with ${gameData.matchingCard?.rank}${gameData.matchingCard?.suit}. Play now!`
      : `Just played Andar Bahar! The ${gameData.winner} side won with ${gameData.matchingCard?.rank}${gameData.matchingCard?.suit}. Better luck next time! 🎲`

    if (navigator.share) {
      navigator.share({
        title: "Andar Bahar Game Result",
        text: message,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(message)
      alert("Result copied to clipboard!")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Result Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl">{gameData.playerWon ? "🎉" : "😔"}</div>
        <h1 className={`text-3xl font-bold ${gameData.playerWon ? "text-green-400" : "text-red-400"}`}>
          {gameData.playerWon ? "You Won!" : "Better Luck Next Time"}
        </h1>
        {gameData.playerWon && <div className="text-2xl font-bold text-yellow-400">+{gameData.payout} chips</div>}
      </div>

      {/* Game Summary */}
      <Card className="bg-black/50 border-yellow-400 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-yellow-400 text-center">Game Summary</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-300">Joker Card</div>
            <div className="w-16 h-24 bg-white rounded-lg shadow-lg mx-auto flex items-center justify-center">
              <span className="text-xl font-bold text-black">{gameData.jokerCard.rank}{gameData.jokerCard.suit}</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-sm text-gray-300">Winning Card</div>
            <div className="w-16 h-24 bg-white rounded-lg shadow-lg mx-auto flex items-center justify-center ring-4 ring-yellow-400">
              <span className="text-xl font-bold text-black">{gameData.matchingCard?.rank}{gameData.matchingCard?.suit}</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-sm text-gray-300">Winner</div>
          <div className={`text-2xl font-bold ${gameData.winner === "andar" ? "text-green-400" : "text-red-400"}`}>
            {gameData.winner?.toUpperCase()}
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-sm text-gray-300">Your Bet</div>
          <div className={`text-lg font-semibold ${gameData.betSide === "andar" ? "text-green-400" : "text-red-400"}`}>
            {gameData.betSide?.toUpperCase()}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          onClick={handleShare}
          className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/30"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Result on Farcaster
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={onPlayAgain}
            className="h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-lg shadow-green-500/30"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>

          <Button
            onClick={onShowLeaderboard}
            variant="outline"
            className="h-14 text-lg font-bold rounded-2xl border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Leaderboard
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-400 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-400">12</div>
            <div className="text-xs text-gray-300">Games Played</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">7</div>
            <div className="text-xs text-gray-300">Wins</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">850</div>
            <div className="text-xs text-gray-300">Total Chips</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
