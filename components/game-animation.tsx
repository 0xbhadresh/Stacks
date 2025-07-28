"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import type { GameData, BetSide } from "@/app/page"

interface GameAnimationProps {
  gameData: GameData
  onGameComplete: (winner: BetSide, matchingCard: string) => void
}

interface DrawnCard {
  card: string
  side: "andar" | "bahar"
  isMatching: boolean
}

export function GameAnimation({ gameData, onGameComplete }: GameAnimationProps) {
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [currentSide, setCurrentSide] = useState<"andar" | "bahar">("andar")
  const [isDrawing, setIsDrawing] = useState(true)
  const [winner, setWinner] = useState<BetSide>(null)

  useEffect(() => {
    const suits = ["♠", "♥", "♦", "♣"]
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

    const generateRandomCard = () => {
      const rank = ranks[Math.floor(Math.random() * ranks.length)]
      const suit = suits[Math.floor(Math.random() * suits.length)]
      return rank + suit
    }

    const jokerRank = gameData.jokerCard.rank

    const drawCard = () => {
      const newCard = generateRandomCard()
      const newCardRank = newCard.slice(0, -1)
      const isMatching = newCardRank === jokerRank

      const cardData: DrawnCard = {
        card: newCard,
        side: currentSide,
        isMatching,
      }

      setDrawnCards((prev) => [...prev, cardData])

      if (isMatching) {
        setWinner(currentSide)
        setIsDrawing(false)
        setTimeout(() => {
          onGameComplete(currentSide, newCard)
        }, 2000)
      } else {
        setCurrentSide((prev) => (prev === "andar" ? "bahar" : "andar"))
      }
    }

    if (isDrawing) {
      const timer = setTimeout(drawCard, 1500)
      return () => clearTimeout(timer)
    }
  }, [drawnCards, currentSide, isDrawing, gameData.jokerCard, onGameComplete])

  const andarCards = drawnCards.filter((card) => card.side === "andar")
  const baharCards = drawnCards.filter((card) => card.side === "bahar")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Game in Progress
        </h1>
        <p className="text-gray-300 mt-2">
          Your bet: <span className="text-yellow-400 font-semibold">{gameData.betSide?.toUpperCase()}</span>
        </p>
      </div>

      {/* Joker Card */}
      <div className="text-center space-y-2">
        <h2 className="text-sm text-yellow-400">Joker Card</h2>
        <div className="flex justify-center">
          <div className="w-16 h-24 bg-white rounded-lg shadow-lg border-2 border-yellow-400 flex items-center justify-center">
            <span className="text-2xl font-bold text-black">{gameData.jokerCard.rank}{gameData.jokerCard.suit}</span>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-2 gap-4 min-h-[400px]">
        {/* Andar Side */}
        <div className="space-y-3">
          <div
            className={`text-center p-3 rounded-lg ${currentSide === "andar" && isDrawing ? "bg-green-500/30 border-2 border-green-400" : "bg-green-500/10"}`}
          >
            <h3 className="font-bold text-green-400">ANDAR</h3>
            <p className="text-xs text-gray-300">Left Side</p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {andarCards.map((cardData, index) => (
              <div
                key={index}
                className={`w-full h-16 bg-white rounded-lg shadow-lg flex items-center justify-center transform transition-all duration-500 ${
                  cardData.isMatching ? "ring-4 ring-yellow-400 animate-pulse scale-110" : "hover:scale-105"
                }`}
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <span className="text-xl font-bold text-black">{cardData.card}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bahar Side */}
        <div className="space-y-3">
          <div
            className={`text-center p-3 rounded-lg ${currentSide === "bahar" && isDrawing ? "bg-red-500/30 border-2 border-red-400" : "bg-red-500/10"}`}
          >
            <h3 className="font-bold text-red-400">BAHAR</h3>
            <p className="text-xs text-gray-300">Right Side</p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {baharCards.map((cardData, index) => (
              <div
                key={index}
                className={`w-full h-16 bg-white rounded-lg shadow-lg flex items-center justify-center transform transition-all duration-500 ${
                  cardData.isMatching ? "ring-4 ring-yellow-400 animate-pulse scale-110" : "hover:scale-105"
                }`}
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <span className="text-xl font-bold text-black">{cardData.card}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      <Card className="bg-black/50 border-yellow-400 p-4">
        <div className="text-center">
          {isDrawing ? (
            <div className="space-y-2">
              <div className="text-yellow-400 font-semibold">Drawing on {currentSide.toUpperCase()}...</div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-400">🎉 {winner?.toUpperCase()} WINS! 🎉</div>
              <div className="text-sm text-gray-300">Match found! Proceeding to results...</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
