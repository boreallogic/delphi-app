'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface RatingScaleProps {
  id: string
  label: string
  description?: string
  value: number | null
  onChange: (value: number | null) => void
  labels?: Record<number, string>
  min?: number
  max?: number
  disabled?: boolean
  required?: boolean
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const defaultLabels: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
}

export function RatingScale({
  id,
  label,
  description,
  value,
  onChange,
  labels = defaultLabels,
  min = 1,
  max = 3,
  disabled = false,
  required = false,
}: RatingScaleProps) {
  const scalePoints = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <label 
          id={`${id}-label`}
          className="text-sm font-medium leading-tight"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground" id={`${id}-description`}>
          {description}
        </p>
      )}

      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="flex flex-col gap-2"
      >
        {/* Rating buttons with labels */}
        <div className="flex gap-2 flex-wrap">
          {scalePoints.map((point) => {
            const labelText = labels[point] || `${point}`
            return (
              <button
                key={point}
                type="button"
                role="radio"
                aria-checked={value === point}
                aria-label={`${labelText} (${point})`}
                disabled={disabled}
                onClick={() => onChange(point)}
                className={cn(
                  "inline-flex flex-col items-center justify-center rounded-md border-2 font-medium transition-all px-5 py-3 min-w-[85px]",
                  value === point
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-accent hover:border-accent-foreground/20",
                  disabled && "opacity-50 cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <span className="text-base font-bold">{labelText}</span>
                <span className={cn(
                  "text-xs mt-0.5",
                  value === point ? "text-primary-foreground/60" : "text-muted-foreground/60"
                )}>
                  ({point})
                </span>
              </button>
            )
          })}

          {/* Don't Know button */}
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            disabled={disabled}
            onClick={() => onChange(null)}
            className={cn(
              "inline-flex flex-col items-center justify-center rounded-md border-2 transition-all px-4 py-2 min-w-[70px]",
              value === null
                ? "bg-muted-foreground text-muted border-muted-foreground"
                : "bg-background border-input hover:bg-accent hover:border-accent-foreground/20",
              disabled && "opacity-50 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <span className="text-sm font-medium">?</span>
            <span className={cn(
              "text-xs",
              value === null ? "text-muted/80" : "text-muted-foreground"
            )}>
              Unsure
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Horizontal variant with inline labels
export function RatingScaleInline({
  id,
  label,
  value,
  onChange,
  labels,
  min = 1,
  max = 3,
  disabled = false,
}: Omit<RatingScaleProps, 'description' | 'showLabels' | 'size'>) {
  const scalePoints = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium min-w-0 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">
          {labels?.[min] || min}
        </span>
        {scalePoints.map((point) => (
          <button
            key={point}
            type="button"
            disabled={disabled}
            onClick={() => onChange(point)}
            className={cn(
              "w-8 h-8 rounded text-sm font-medium transition-colors",
              value === point
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {point}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {labels?.[max] || max}
        </span>
      </div>
    </div>
  )
}
