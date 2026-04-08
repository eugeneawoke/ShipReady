"use client"

import React from "react"

import { cn } from "@/lib/utils"

interface MeteorsProps {
  number?: number
  minDelay?: number
  maxDelay?: number
  minDuration?: number
  maxDuration?: number
  angle?: number
  className?: string
}

export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) => {
  const meteorStyles = [...new Array(number)].map((_, index) => {
    const position = ((index * 37) % 100) + ((index % 3) * 0.17)
    const delay = minDelay + ((index * 17) % 100) / 100 * (maxDelay - minDelay)
    const duration = minDuration + ((index * 29) % 100) / 100 * (maxDuration - minDuration)

    return {
      "--angle": -angle + "deg",
      top: "-5%",
      left: `${position}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    } as React.CSSProperties
  })

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        // Meteor Head
        <span
          key={idx}
          style={{ ...style }}
          className={cn(
            "animate-meteor pointer-events-none absolute size-0.5 rotate-(--angle) rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]",
            className
          )}
        >
          {/* Meteor Tail */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-12.5 -translate-y-1/2 bg-linear-to-r from-zinc-500 to-transparent" />
        </span>
      ))}
    </>
  )
}
