"use client"

interface BetBarProps {
  andarBets: number
  baharBets: number
  className?: string
}

export function BetBar({ andarBets, baharBets, className = "" }: BetBarProps) {
  const total = andarBets + baharBets
  const andarPercentage = total > 0 ? (andarBets / total) * 100 : 50
  const baharPercentage = total > 0 ? (baharBets / total) * 100 : 50

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full border border-gray-600" />
          <span className="text-white font-bold">ANDAR</span>
          <span className="text-gray-400">{andarBets.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">{baharBets.toLocaleString()}</span>
          <span className="text-white font-bold">BAHAR</span>
          <div className="w-3 h-3 bg-gray-400 rounded-full border border-gray-600" />
        </div>
      </div>

      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
        <div
          className="absolute left-0 top-0 h-full bg-white transition-all duration-1000 ease-out"
          style={{ width: `${andarPercentage}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-gray-400 transition-all duration-1000 ease-out"
          style={{ width: `${baharPercentage}%` }}
        />
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-black transform -translate-x-0.5" />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{andarPercentage.toFixed(1)}%</span>
        <span>{baharPercentage.toFixed(1)}%</span>
      </div>
    </div>
  )
}
