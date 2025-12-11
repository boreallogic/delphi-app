'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

// Linear progress bar
interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

// Round stepper
interface RoundStepperProps {
  currentRound: number
  totalRounds: number
  className?: string
}

export function RoundStepper({
  currentRound,
  totalRounds,
  className,
}: RoundStepperProps) {
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1)

  return (
    <div className={cn("flex items-center", className)}>
      {rounds.map((round, index) => (
        <React.Fragment key={round}>
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors",
              round < currentRound && "bg-primary text-primary-foreground border-primary",
              round === currentRound && "border-primary text-primary",
              round > currentRound && "border-muted text-muted-foreground"
            )}
            data-status={
              round < currentRound ? "complete" : 
              round === currentRound ? "current" : 
              "pending"
            }
          >
            {round < currentRound ? (
              <Check className="w-4 h-4" />
            ) : (
              round
            )}
          </div>
          {index < totalRounds - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-1",
                round < currentRound ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Domain progress for indicator batching
interface DomainProgressProps {
  domains: {
    id: string
    name: string
    total: number
    completed: number
  }[]
  currentDomain?: string
  onSelectDomain?: (domainId: string) => void
  className?: string
}

export function DomainProgress({
  domains,
  currentDomain,
  onSelectDomain,
  className,
}: DomainProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {domains.map((domain) => {
        const isComplete = domain.completed === domain.total
        const isCurrent = domain.id === currentDomain
        const percentage = domain.total > 0 
          ? Math.round((domain.completed / domain.total) * 100) 
          : 0

        return (
          <button
            key={domain.id}
            onClick={() => onSelectDomain?.(domain.id)}
            disabled={!onSelectDomain}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-colors",
              isCurrent && "border-primary bg-primary/5",
              !isCurrent && "border-transparent hover:bg-accent",
              !onSelectDomain && "cursor-default"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-sm font-medium",
                isComplete && "text-green-600 dark:text-green-400"
              )}>
                {domain.name}
                {isComplete && <Check className="inline w-4 h-4 ml-1" />}
              </span>
              <span className="text-xs text-muted-foreground">
                {domain.completed}/{domain.total}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isComplete ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Consensus badge
interface ConsensusBadgeProps {
  iqr: number
  threshold?: number
  className?: string
}

export function ConsensusBadge({
  iqr,
  threshold = 1.0,
  className,
}: ConsensusBadgeProps) {
  const status = iqr <= threshold 
    ? 'reached' 
    : iqr <= threshold * 1.5 
    ? 'emerging' 
    : 'divergent'

  const labels = {
    reached: 'Consensus Reached',
    emerging: 'Emerging Consensus',
    divergent: 'Divergent Views',
  }

  return (
    <span
      className={cn("consensus-badge", className)}
      data-status={status}
    >
      {labels[status]}
    </span>
  )
}
