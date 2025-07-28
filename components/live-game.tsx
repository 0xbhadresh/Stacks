"use client"

import { useState, useEffect } from "react"
import { GameCard } from "@/components/game-card"
import type { GameData, DrawnCard, Card as CardType } from "@/app/page"

interface LiveGameProps {
  gameData: GameData
  onGameComplete: (winner: "andar" | "bahar", drawnCards: DrawnCard[], matchingCard: CardType) => void
}

const suits: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

const generateCard = (): CardType => {
  const suit = suits[Math.floor(Math.random() * suits.length)]
  const rank = ranks[Math.floor(Math.random() * ranks.length)]
  const color = suit === "♥" || suit === "♦" ? "red" : "black"
  return { suit, rank, color, id: `${rank}${suit}` }
}

export function LiveGame({ gameData, onGameComplete }: LiveGameProps) {
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [currentSide, setCurrentSide] = useState<"andar" | "bahar">("andar")
  const [isDrawing, setIsDrawing] = useState(true)

  useEffect(() => {
    if (!isDrawing) return

    const drawCard = () => {
      const newCard = generateCard()
      const isMatching = newCard.rank === gameData.jokerCard.rank

      const drawnCard: DrawnCard = {
        ...newCard,
        side: currentSide,
        isMatching,
        order: drawnCards.length + 1,
      }

      const updatedCards = [...drawnCards, drawnCard]
      setDrawnCards(updatedCards)

      if (isMatching) {
        setIsDrawing(false)
        setTimeout(() => {
          onGameComplete(currentSide, updatedCards, newCard)
        }, 2000)
      } else {
        setCurrentSide((prev) => (prev === "andar" ? "bahar" : "andar"))
      }
    }

    const timer = setTimeout(drawCard, 1500)
    return () => clearTimeout(timer)
  }, [drawnCards, currentSide, isDrawing, gameData.jokerCard.rank, onGameComplete])

  const andarCards = drawnCards.filter((card) => card.side === "andar")
  const baharCards = drawnCards.filter((card) => card.side === "bahar")
  const matchingCard = drawnCards.find((card) => card.isMatching)

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-black text-white mb-2">LIVE GAME</h1>
        <p className="text-xs text-gray-400">
          YOUR BET:{" "}
          <span className="text-white font-bold">
            {gameData.betAmount} ON {gameData.betSide?.toUpperCase()}
          </span>
        </p>
      </div>

      {/* Deck and Joker */}
      <div className="flex justify-center items-center gap-6 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">DECK</p>
          <GameCard card={{ suit: "♠", rank: "?", color: "black", id: "deck" }} isFlipped={false} size="sm" />
        </div>
        <div className="text-center">
          <p className="text-xs text-white mb-1">JOKER</p>
          <GameCard card={gameData.jokerCard} size="md" />
        </div>
      </div>

      {/* Game Board - Horizontal Card Layout */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* Andar Side */}
        <div className="flex flex-col min-h-0">
          <div
            className={`p-2 text-center border-2 rounded-lg mb-3 transition-all duration-500 ${
              currentSide === "andar" && isDrawing
                ? "bg-white text-black border-black shadow-lg"
                : "bg-gray-900 text-white border-white"
            }`}
          >
            <h3 className="font-black text-sm">ANDAR</h3>
            <p className="text-xs opacity-75">LEFT</p>
            {currentSide === "andar" && isDrawing && (
              <div className="mt-1">
                <div className="w-2 h-2 bg-black rounded-full mx-auto animate-pulse" />
              </div>
            )}
          </div>

          {/* Horizontal card layout with hover magnification */}
          <div className="flex-1 overflow-hidden">
            <div className="flex flex-wrap gap-1 justify-center">
              {andarCards.map((card, index) => (
                <div
                  key={`andar-${card.order}`}
                  className="animate-in slide-in-from-top-4 duration-500"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <GameCard card={card} isMatching={card.isMatching} size="sm" enableHover={true} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bahar Side */}
        <div className="flex flex-col min-h-0">
          <div
            className={`p-2 text-center border-2 rounded-lg mb-3 transition-all duration-500 ${
              currentSide === "bahar" && isDrawing
                ? "bg-white text-black border-black shadow-lg"
                : "bg-gray-900 text-white border-white"
            }`}
          >
            <h3 className="font-black text-sm">BAHAR</h3>
            <p className="text-xs opacity-75">RIGHT</p>
            {currentSide === "bahar" && isDrawing && (
              <div className="mt-1">
                <div className="w-2 h-2 bg-black rounded-full mx-auto animate-pulse" />
              </div>
            )}
          </div>

          {/* Horizontal card layout with hover magnification */}
          <div className="flex-1 overflow-hidden">
            <div className="flex flex-wrap gap-1 justify-center">
              {baharCards.map((card, index) => (
                <div
                  key={`bahar-${card.order}`}
                  className="animate-in slide-in-from-top-4 duration-500"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <GameCard card={card} isMatching={card.isMatching} size="sm" enableHover={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-gray-900 border-2 border-white rounded-lg p-3 text-center">
        {isDrawing ? (
          <>
            <div className="text-white font-black text-sm mb-2">DRAWING ON {currentSide.toUpperCase()}...</div>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        ) : (
          <>
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-white font-black text-sm">{matchingCard?.side.toUpperCase()} WINS!</div>
          </>
        )}
      </div>
    </div>
  )
}
