import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Statistics utilities for Delphi aggregation
export function calculateStats(values: number[]): {
  mean: number
  median: number
  std: number
  iqr: number
  min: number
  max: number
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, std: 0, iqr: 0, min: 0, max: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  // Mean
  const mean = values.reduce((sum, v) => sum + v, 0) / n

  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]

  // Standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  const std = Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / n)

  // IQR (Interquartile Range)
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  return {
    mean: Math.round(mean * 100) / 100,
    median,
    std: Math.round(std * 100) / 100,
    iqr,
    min: sorted[0],
    max: sorted[n - 1],
  }
}

// Check if consensus is reached based on IQR threshold
export function checkConsensus(iqr: number, threshold: number = 0.67): boolean {
  return iqr <= threshold
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Generate magic link token
export function generateMagicToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Role display names
export const roleDisplayNames: Record<string, string> = {
  EXPERT_GBV: 'GBV Expert',
  LIVED_EXPERIENCE: 'Lived Experience',
  SERVICE_PROVIDER: 'Service Provider',
  POLICY_MAKER: 'Policy Maker',
  COMMUNITY_MEMBER: 'Community Member',
  MEDICAL_PROFESSIONAL: 'Medical Professional',
}

// Priority labels for rating scale (3-point scale)
export const priorityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export const validityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export const feasibilityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}
