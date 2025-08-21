"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { GameCard } from "@/components/game-card"
import { Share2, RotateCcw, Trophy } from "lucide-react"
import type { GameData } from "@/app/page"
import { useUserStats } from "@/hooks/use-user-stats"

interface ResultsPageProps {
  gameData: GameData
  onPlayAgain: () => void
  onShowLeaderboard: () => void
  currentFid?: string | null
}

export function ResultsPage({ gameData, onPlayAgain, onShowLeaderboard, currentFid }: ResultsPageProps) {
  const { stats, loading, updateStats } = useUserStats(currentFid || null);
  const hasUpdatedStatsRef = useRef(false);

  // Update stats when game completes (only once per game)
  useEffect(() => {
    if (gameData.playerWon !== null && gameData.betSide && gameData.betAmount && !hasUpdatedStatsRef.current) {
      hasUpdatedStatsRef.current = true;
      updateStats({
        won: gameData.playerWon,
        amount: gameData.betAmount,
        payout: gameData.payout
      });
    }
  }, [gameData.playerWon, gameData.betSide, gameData.betAmount, gameData.payout, updateStats]);

  // Reset the flag when game data changes (new game)
  useEffect(() => {
    hasUpdatedStatsRef.current = false;
  }, [gameData.jokerCard?.id]); // Reset when joker card changes (new game)

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
        {gameData.playerWon === null ? (
          // No bet placed
          <>
            <div className="text-4xl mb-2">🎲</div>
            <h1 className="text-2xl font-black mb-2 text-gray-400">
              GAME FINISHED
            </h1>
            <div className="text-sm text-gray-500">
              You didn&apos;t place a bet this round
            </div>
          </>
        ) : gameData.playerWon ? (
          // Player won
          <>
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-2xl font-black mb-2 text-white">
              WINNER
            </h1>
            <div className="text-xl font-black text-white border-2 border-white px-3 py-1 inline-block">
              +{gameData.payout} CHIPS
            </div>
          </>
        ) : (
          // Player lost
          <>
            <div className="text-4xl mb-2">💀</div>
            <h1 className="text-2xl font-black mb-2 text-gray-400">
              LOSS
            </h1>
            <div className="text-sm text-gray-500">
              Better luck next time!
            </div>
          </>
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
      <div className="bg-gray-900 border-2 border-white rounded-lg p-3 mb-3">
        <h3 className="text-xs font-black text-white mb-3 text-center">CARDS DRAWN</h3>

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
              <div className="text-sm font-black text-white">
                {loading ? "..." : (stats?.gamesPlayed || 0)}
              </div>
              <div className="text-xs text-gray-400">GAMES</div>
            </div>
            <div>
              <div className="text-sm font-black text-white">
                {loading ? "..." : (stats?.wins || 0)}
              </div>
              <div className="text-xs text-gray-400">WINS</div>
            </div>
            <div>
              <div className="text-sm font-black text-white">
                {loading ? "..." : (stats?.chips || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">CHIPS</div>
            </div>
            <div>
              <div className="text-sm font-black text-white">
                {loading ? "..." : (stats?.currentStreak || 0)}
              </div>
              <div className="text-xs text-gray-400">STREAK</div>
            </div>
          </div>
          
          {/* Additional stats row */}
          <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-2 border-t border-gray-700">
            <div>
              <div className="text-xs font-black text-white">
                {loading ? "..." : `${stats?.winRate || 0}%`}
              </div>
              <div className="text-xs text-gray-400">WIN RATE</div>
            </div>
            <div>
              <div className="text-xs font-black text-green-400">
                {loading ? "..." : `+${(stats?.totalEarned || 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-gray-400">EARNED</div>
            </div>
            <div>
              <div className="text-xs font-black text-red-400">
                {loading ? "..." : `-${(stats?.totalLost || 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-gray-400">LOST</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
