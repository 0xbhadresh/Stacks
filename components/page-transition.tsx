"use client"

import type { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
  isTransitioning: boolean
}

export function PageTransition({ children, isTransitioning }: PageTransitionProps) {
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isTransitioning ? "opacity-0 transform translate-y-4 scale-95" : "opacity-100 transform translate-y-0 scale-100"
      }`}
    >
      {children}
    </div>
  )
}
