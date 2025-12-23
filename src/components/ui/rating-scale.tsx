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
  showLabels = true,
  size = 'md',
}: RatingScaleProps) {
  const scalePoints = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

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
        className="flex flex-col gap-3"
      >
        {/* Rating buttons */}
        <div className="flex gap-2 flex-wrap">
          {scalePoints.map((point) => (
            <button
              key={point}
              type="button"
              role="radio"
              aria-checked={value === point}
              disabled={disabled}
              onClick={() => onChange(point)}
              className={cn(
                "inline-flex items-center justify-center rounded-md border-2 font-medium transition-all",
                sizeClasses[size],
                value === point
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input hover:bg-accent hover:border-accent-foreground/20",
                disabled && "opacity-50 cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {point}
            </button>
          ))}

          {/* Don't Know button */}
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            disabled={disabled}
            onClick={() => onChange(null)}
            className={cn(
              "inline-flex items-center justify-center rounded-md border-2 transition-all px-3 py-2 text-sm font-normal",
              value === null
                ? "bg-muted-foreground text-muted border-muted-foreground"
                : "bg-background border-input hover:bg-accent hover:border-accent-foreground/20",
              disabled && "opacity-50 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            Don't Know
          </button>
        </div>

        {/* Scale labels */}
        {showLabels && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{labels[min] || `${min}`}</span>
            <span>{labels[max] || `${max}`}</span>
          </div>
        )}
      </div>

      {/* Selected value label */}
      {value !== null && labels[value] && labels[value] !== String(value) && (
        <p className="text-sm font-medium text-primary">
          Selected: {labels[value]}
        </p>
      )}
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
