"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Medal, Crown, RefreshCw } from "lucide-react"
import { useLeaderboard, type LeaderboardType } from "@/hooks/use-leaderboard"

interface LeaderboardProps {
  onBackToLobby: () => void
  currentFid?: string | null
}

export function Leaderboard({ onBackToLobby, currentFid }: LeaderboardProps) {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('chips')
  const { players, loading, error, refreshLeaderboard } = useLeaderboard(selectedType, 10)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-white" />
      case 2:
        return <Trophy className="w-4 h-4 text-gray-300" />
      case 3:
        return <Medal className="w-6 h-6 text-gray-400" />
      default:
        return (
          <span className="w-4 h-4 flex items-center justify-center text-gray-400 font-black text-xs">#{rank}</span>
        )
    }
  }

  const getTypeLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'chips': return 'CHIPS'
      case 'wins': return 'WINS'
      case 'winRate': return 'WIN RATE'
      case 'streak': return 'STREAK'
    }
  }

  const getPlayerValue = (player: any, type: LeaderboardType) => {
    switch (type) {
      case 'chips': return (player.chips || 0).toLocaleString()
      case 'wins': return (player.wins || 0).toString()
      case 'winRate': return `${player.winRate || 0}%`
      case 'streak': return (player.maxStreak || 0).toString()
    }
  }

  const getPlayerSubValue = (player: any, type: LeaderboardType) => {
    switch (type) {
      case 'chips': return `${player.wins || 0} WINS • 🔥 ${player.maxStreak || 0}`
      case 'wins': return `${player.gamesPlayed || 0} GAMES • ${player.winRate || 0}%`
      case 'winRate': return `${player.wins || 0}/${player.gamesPlayed || 0} GAMES`
      case 'streak': return `${player.wins || 0} WINS • ${(player.chips || 0).toLocaleString()} CHIPS`
    }
  }

  const top3Players = players.slice(0, 3)
  const otherPlayers = players.slice(3)

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={onBackToLobby}
          className="bg-transparent text-white border border-white hover:bg-white hover:text-black h-8 w-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-black text-white">LEADERBOARD</h1>
        <Button
          onClick={refreshLeaderboard}
          disabled={loading}
          className="ml-auto bg-transparent text-white border border-white hover:bg-white hover:text-black h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Ranking Type Selector */}
      <div className="grid grid-cols-4 gap-1 mb-4">
        {(['chips', 'wins', 'winRate', 'streak'] as LeaderboardType[]).map((type) => (
          <Button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`h-8 text-xs font-black ${
              selectedType === type
                ? 'bg-white text-black border-2 border-black'
                : 'bg-transparent text-white border border-white hover:bg-white hover:text-black'
            }`}
          >
            {getTypeLabel(type)}
          </Button>
        ))}
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center mb-4">
          Error: {error}
        </div>
      )}

      {loading && players.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <div>Loading leaderboard...</div>
          </div>
        </div>
      ) : players.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No players found</div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3Players.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center pt-4">
                <div className="w-12 h-12 bg-gray-200 border border-gray-600 rounded-lg mx-auto flex items-center justify-center mb-1">
                  <Trophy className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-xs font-black text-white">{top3Players[1]?.username || 'Player'}</div>
                <div className="text-xs text-gray-400">{getPlayerValue(top3Players[1], selectedType)}</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white border-2 border-black rounded-lg mx-auto flex items-center justify-center mb-1">
                  <Crown className="w-8 h-8 text-black" />
                </div>
                <div className="text-sm font-black text-white">{top3Players[0]?.username || 'Player'}</div>
                <div className="text-xs text-gray-300">{getPlayerValue(top3Players[0], selectedType)}</div>
              </div>

              <div className="text-center pt-4">
                <div className="w-12 h-12 bg-gray-300 border border-gray-700 rounded-lg mx-auto flex items-center justify-center mb-1">
                  <Medal className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-xs font-black text-white">{top3Players[2]?.username || 'Player'}</div>
                <div className="text-xs text-gray-400">{getPlayerValue(top3Players[2], selectedType)}</div>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="space-y-2 mb-4">
            {players.map((player, index) => {
              const rank = index + 1
              const isCurrentUser = player.fid === currentFid
              
              return (
                <div
                  key={player.fid}
                  className={`p-3 border-2 rounded-lg ${
                    isCurrentUser ? "bg-white text-black border-black" : "bg-gray-900 text-white border-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRankIcon(rank)}
                      <div className="flex items-center gap-2">
                        {player.pfpUrl && (
                          <img 
                            src={player.pfpUrl} 
                            alt="avatar" 
                            className="w-6 h-6 rounded-full border border-gray-600"
                          />
                        )}
                        <div>
                          <div className="font-black text-sm">
                            {player.username || player.displayName || `User ${player.fid}`}
                            {isCurrentUser && " (YOU)"}
                          </div>
                          <div className="text-xs opacity-75">
                            {getPlayerSubValue(player, selectedType)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm">{getPlayerValue(player, selectedType)}</div>
                      <div className="text-xs opacity-75">{getTypeLabel(selectedType)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Back Button */}
      <Button
        onClick={onBackToLobby}
        className="w-full h-10 font-black bg-white text-black border-2 border-black hover:bg-gray-200"
      >
        BACK TO GAME
      </Button>
    </div>
  )
}
