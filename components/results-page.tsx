"use client"

import { Button } from "@/components/ui/button"
import { GameCard } from "@/components/game-card"
import { Share2, RotateCcw, Trophy } from "lucide-react"
import type { GameData } from "@/app/page"

interface ResultsPageProps {
  gameData: GameData
  onPlayAgain: () => void
  onShowLeaderboard: () => void
}

export function ResultsPage({ gameData, onPlayAgain, onShowLeaderboard }: ResultsPageProps) {
  const handleShare = () => {
    const message = gameData.playerWon
      ? `🎉 Won ${gameData.payout} chips in Andar Bahar! Join the game!`
      : `Just played Andar Bahar! Next round! 🎲`

    if (navigator.share) {
      navigator.share({
        title: "Andar Bahar Result",
        text: message,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(message)
    }
  }

  // Group cards by side for better display and sort in reverse order (anticlockwise countdown)
  const andarCards = gameData.drawnCards.filter((card) => card.side === "andar").sort((a, b) => b.order - a.order)
  const baharCards = gameData.drawnCards.filter((card) => card.side === "bahar").sort((a, b) => b.order - a.order)

  return (
    <div className="h-full flex flex-col p-4">
      {/* Result Header */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{gameData.playerWon ? "🎉" : "💀"}</div>
        <h1 className={`text-2xl font-black mb-2 ${gameData.playerWon ? "text-white" : "text-gray-400"}`}>
          {gameData.playerWon ? "YOU WON!" : "GAME OVER!"}
        </h1>
        {gameData.playerWon && (
          <div className="text-xl font-black text-white border-2 border-white px-3 py-1 inline-block">
            +{gameData.payout} CHIPS
          </div>
        )}
      </div>

      {/* Game Summary */}
      <div className="bg-gray-900 border-2 border-white rounded-lg p-4 mb-3">
        <h2 className="text-sm font-black text-white text-center mb-3">GAME SUMMARY</h2>

        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">JOKER</p>
            <GameCard card={gameData.jokerCard} size="sm" className="mx-auto" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">WINNER</p>
            <div className="text-lg font-black text-white">{gameData.winner?.toUpperCase()}</div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">MATCH</p>
            {gameData.matchingCard && (
              <GameCard card={gameData.matchingCard} size="sm" isMatching className="mx-auto" />
            )}
          </div>
        </div>

        <div className="text-center border-t border-gray-700 pt-2">
          <p className="text-xs text-gray-400 mb-1">YOUR BET</p>
          <div className="text-sm font-black text-white">
            {gameData.betAmount} CHIPS ON {gameData.betSide?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Cards Drawn - Redesigned like screenshot */}
      <div className="bg-gray-900 border-2 border-white rounded-lg p-3 mb-3 flex-1 min-h-0 flex flex-col">
        <h3 className="text-xs font-black text-white mb-3 text-center flex-shrink-0">CARDS DRAWN</h3>

        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          <div className="grid grid-cols-2 gap-3">
            {/* Andar Column */}
            <div className="space-y-2">
              <div className="text-xs font-black text-white text-center">ANDAR</div>
              <div className="space-y-1">
                {andarCards.map((card) => (
                  <div key={`andar-${card.order}`} className="flex items-center gap-2 bg-gray-800 rounded p-1">
                    <span className="text-xs text-gray-400 w-6">#{card.order}</span>
                    <GameCard card={card} size="xs" isMatching={card.isMatching} />
                    <span className="text-xs text-white font-bold flex-1">
                      {card.rank}
                      {card.suit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bahar Column */}
            <div className="space-y-2">
              <div className="text-xs font-black text-white text-center">BAHAR</div>
              <div className="space-y-1">
                {baharCards.map((card) => (
                  <div key={`bahar-${card.order}`} className="flex items-center gap-2 bg-gray-800 rounded p-1">
                    <span className="text-xs text-gray-400 w-6">#{card.order}</span>
                    <GameCard card={card} size="xs" isMatching={card.isMatching} />
                    <span className="text-xs text-white font-bold flex-1">
                      {card.rank}
                      {card.suit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleShare}
          className="w-full h-10 text-sm font-black bg-white text-black border-2 border-black hover:bg-gray-200"
        >
          <Share2 className="w-4 h-4 mr-2" />
          SHARE ON FARCASTER
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onPlayAgain}
            className="h-10 text-sm font-black bg-transparent text-white border-2 border-white hover:bg-white hover:text-black"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            PLAY AGAIN
          </Button>

          <Button
            onClick={onShowLeaderboard}
            className="h-10 text-sm font-black bg-transparent text-white border-2 border-white hover:bg-white hover:text-black"
          >
            <Trophy className="w-4 h-4 mr-1" />
            RANKS
          </Button>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-sm font-black text-white">18</div>
              <div className="text-xs text-gray-400">GAMES</div>
            </div>
            <div>
              <div className="text-sm font-black text-white">12</div>
              <div className="text-xs text-gray-400">WINS</div>
            </div>
            <div>
              <div className="text-sm font-black text-white">1,850</div>
              <div className="text-xs text-gray-400">CHIPS</div>
            </div>
            <div>
              <div className="text-sm font-black text-white">4</div>
              <div className="text-xs text-gray-400">STREAK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
