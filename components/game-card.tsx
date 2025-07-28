"use client"

import { useState } from "react"
import type { Card } from "@/app/page"

interface GameCardProps {
  card: Card
  isFlipped?: boolean
  isMatching?: boolean
  isJoker?: boolean
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
  enableHover?: boolean
}

export function GameCard({
  card,
  isFlipped = true,
  isMatching = false,
  isJoker = false,
  size = "md",
  className = "",
  enableHover = false,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    xs: "w-8 h-11 text-xs",
    sm: "w-10 h-14 text-sm",
    md: "w-12 h-16 text-base",
    lg: "w-20 h-28 text-xl",
  }

  const cardContent = (
    <div
      className={`${sizeClasses[size]} relative transition-all duration-300 ${className} ${
        enableHover && isHovered ? "scale-150 z-50" : ""
      } ${isJoker ? "transform hover:scale-110" : ""}`}
      onMouseEnter={() => enableHover && setIsHovered(true)}
      onMouseLeave={() => enableHover && setIsHovered(false)}
    >
      {/* Matching card effects */}
      {isMatching && (
        <>
          <div className="absolute inset-0 bg-white rounded-lg blur-sm animate-pulse -z-10" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
          <div
            className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full animate-ping"
            style={{ animationDelay: "0.3s" }}
          />
        </>
      )}

      {/* Joker card special effects */}
      {isJoker && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-lg blur-md -z-10 animate-pulse" />
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
          <div
            className="absolute -bottom-2 -left-2 w-2 h-2 bg-orange-400 rounded-full animate-ping"
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}

      <div
        className={`w-full h-full bg-white rounded-lg border-2 flex flex-col justify-between p-1 shadow-lg transition-all duration-300 relative ${
          isJoker
            ? "border-yellow-400 shadow-yellow-400/50"
            : isMatching
              ? "border-white ring-2 ring-white animate-pulse shadow-white/50"
              : "border-gray-800"
        } ${enableHover && isHovered ? "shadow-2xl" : ""}`}
      >
        {isFlipped ? (
          <>
            {/* Top left corner */}
            <div className="flex flex-col items-start">
              <span className={`font-bold leading-none ${card.color === "red" ? "text-red-600" : "text-black"}`}>
                {card.rank}
              </span>
              <span className={`text-xs leading-none ${card.color === "red" ? "text-red-600" : "text-black"}`}>
                {card.suit}
              </span>
            </div>

            {/* Center suit symbol */}
            <div className="flex-1 flex items-center justify-center">
              <span
                className={`font-bold ${card.color === "red" ? "text-red-600" : "text-black"} ${
                  size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-lg"
                }`}
              >
                {card.suit}
              </span>
            </div>

            {/* Bottom right corner (rotated) - Only show for joker cards */}
            {isJoker && (
              <div className="flex flex-col items-end transform rotate-180">
                <span className={`font-bold leading-none ${card.color === "red" ? "text-red-600" : "text-black"}`}>
                  {card.rank}
                </span>
                <span className={`text-xs leading-none ${card.color === "red" ? "text-red-600" : "text-black"}`}>
                  {card.suit}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-800 rounded-md flex items-center justify-center">
            <div className="w-3 h-3 border border-gray-400 rounded-full" />
          </div>
        )}
      </div>
    </div>
  )

  return isJoker ? (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl blur-lg scale-110" />
      {cardContent}
    </div>
  ) : (
    cardContent
  )
}
