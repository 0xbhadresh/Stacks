"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react"

interface LeaderboardProps {
  onBackToLobby: () => void
}

const leaderboardData = [
  { rank: 1, name: "CARDKING", wins: 156, chips: 45600, streak: 18 },
  { rank: 2, name: "BETMASTER", wins: 134, chips: 38900, streak: 12 },
  { rank: 3, name: "LUCKYACE", wins: 128, chips: 32200, streak: 8 },
  { rank: 4, name: "GAMEPRO", wins: 98, chips: 24100, streak: 5 },
  { rank: 5, name: "CHIPWIZ", wins: 87, chips: 19800, streak: 11 },
  { rank: 6, name: "YOU", wins: 12, chips: 1850, streak: 4 },
]

export function Leaderboard({ onBackToLobby }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-white" />
      case 2:
        return <Trophy className="w-4 h-4 text-gray-300" />
      case 3:
        return <Medal className="w-4 h-4 text-gray-400" />
      default:
        return (
          <span className="w-4 h-4 flex items-center justify-center text-gray-400 font-black text-xs">#{rank}</span>
        )
    }
  }

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
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center pt-4">
          <div className="w-12 h-12 bg-gray-200 border border-gray-600 rounded-lg mx-auto flex items-center justify-center mb-1">
            <Trophy className="w-6 h-6 text-gray-600" />
          </div>
          <div className="text-xs font-black text-white">{leaderboardData[1].name}</div>
          <div className="text-xs text-gray-400">{leaderboardData[1].chips.toLocaleString()}</div>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-white border-2 border-black rounded-lg mx-auto flex items-center justify-center mb-1">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <div className="text-sm font-black text-white">{leaderboardData[0].name}</div>
          <div className="text-xs text-gray-300">{leaderboardData[0].chips.toLocaleString()}</div>
        </div>

        <div className="text-center pt-4">
          <div className="w-12 h-12 bg-gray-300 border border-gray-700 rounded-lg mx-auto flex items-center justify-center mb-1">
            <Medal className="w-6 h-6 text-gray-700" />
          </div>
          <div className="text-xs font-black text-white">{leaderboardData[2].name}</div>
          <div className="text-xs text-gray-400">{leaderboardData[2].chips.toLocaleString()}</div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="flex-1 space-y-2 min-h-0 overflow-hidden">
        {leaderboardData.map((player) => (
          <div
            key={player.rank}
            className={`p-3 border-2 rounded-lg ${
              player.name === "YOU" ? "bg-white text-black border-black" : "bg-gray-900 text-white border-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRankIcon(player.rank)}
                <div>
                  <div className="font-black text-sm">{player.name}</div>
                  <div className="text-xs opacity-75">
                    {player.wins} WINS • 🔥 {player.streak}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm">{player.chips.toLocaleString()}</div>
                <div className="text-xs opacity-75">CHIPS</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <Button
        onClick={onBackToLobby}
        className="w-full h-10 mt-4 font-black bg-white text-black border-2 border-black hover:bg-gray-200"
      >
        BACK TO GAME
      </Button>
    </div>
  )
}
