"use client"

import { useState, useEffect } from "react"

interface CountdownTimerProps {
  initialTime: number
  onComplete: () => void
  size?: "sm" | "lg"
}

export function CountdownTimer({ initialTime, onComplete, size = "lg" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  const progress = (timeLeft / initialTime) * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const sizeClasses = size === "lg" ? "w-20 h-20" : "w-16 h-16"
  const textSize = size === "lg" ? "text-2xl" : "text-lg"

  return (
    <div className={`${sizeClasses} relative flex items-center justify-center`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={timeLeft <= 5 ? "#ffffff" : "#ffffff"}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ${timeLeft <= 5 ? "animate-pulse" : ""}`}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold ${timeLeft <= 5 ? "text-white animate-pulse" : "text-white"}`}
      >
        {timeLeft}
      </div>
    </div>
  )
}
