'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './error-boundary'

/**
 * Client-side providers wrapper
 *
 * Wraps the app with client-side providers like ErrorBoundary.
 * This is separated from the root layout to allow server components
 * in the main app while still providing client-side error handling.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
