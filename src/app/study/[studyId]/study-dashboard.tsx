'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar, RoundStepper, DomainProgress, ConsensusBadge } from '@/components/ui/progress'
import { IndicatorAssessment } from './indicator-assessment'
import { PanelistPreferences, TierBadge } from '@/components/panelist-preferences'
import { roleDisplayNames } from '@/lib/utils'
import { DOMAINS, FRAMEWORK_SUMMARY } from '@/lib/domains'
import { Info, BookOpen } from 'lucide-react'
import type { Study, Panelist, Indicator, Response, RoundSummary, Round } from '@prisma/client'

// Helper for jurisdiction context display
const jurisdictionLabels: Record<string, string> = {
  LARGE: 'Large Jurisdiction',
  SMALL: 'Small Jurisdiction',
  BOTH: 'Multi-Context',
}

interface StudyDashboardProps {
  study: Study & { rounds: Round[] }
  panelist: Panelist
  indicators: Indicator[]
  domains: { id: string; name: string; total: number; completed: number; tier1Count?: number }[]
  responses: Response[]
  previousSummaries: (RoundSummary & { indicator: Indicator })[]
  currentRound: number
}

export function StudyDashboard({
  study,
  panelist,
  indicators,
  domains,
  responses: initialResponses,
  previousSummaries,
  currentRound,
}: StudyDashboardProps) {
  // Panelist preferences from stored preferences or defaults
  const storedPrefs = (panelist.preferences as Record<string, boolean>) || {}
  const [preferences, setPreferences] = useState({
    showTier2: storedPrefs.showTier2 || false,
  })

  const [selectedDomain, setSelectedDomain] = useState<string | null>(
    domains[0]?.id || null
  )
  const [responses, setResponses] = useState<Response[]>(initialResponses)
  const [currentIndicatorIndex, setCurrentIndicatorIndex] = useState(0)

  // Filter indicators based on tier preference
  const filteredIndicators = useMemo(() => {
    if (preferences.showTier2) {
      return indicators
    }
    return indicators.filter(ind => (ind.tier || 1) === 1)
  }, [indicators, preferences.showTier2])

  // Get indicators for selected domain (using consolidated domainCode if available)
  const domainIndicators = useMemo(() => {
    if (!selectedDomain) return []
    
    return filteredIndicators.filter(ind => {
      // Try consolidated domain code first, fall back to original domain
      const indDomainCode = ind.domainCode || ind.domain
      return indDomainCode === selectedDomain || ind.domain === selectedDomain
    })
  }, [selectedDomain, filteredIndicators])

  // Separate Tier 1 and Tier 2 indicators in current domain
  const tier1Indicators = domainIndicators.filter(ind => (ind.tier || 1) === 1)
  const tier2Indicators = domainIndicators.filter(ind => ind.tier === 2)

  const currentIndicator = tier1Indicators[currentIndicatorIndex] || tier2Indicators[currentIndicatorIndex - tier1Indicators.length]

  // Get response for current indicator
  const currentResponse = currentIndicator
    ? responses.find(r => r.indicatorId === currentIndicator.id) ?? null
    : null

  // Get previous summary for current indicator (for rounds > 1)
  const previousSummary = currentIndicator
    ? previousSummaries.find(s => s.indicatorId === currentIndicator.id) ?? null
    : null

  // Calculate progress - only count Tier 1 for required progress
  const tier1Total = indicators.filter(ind => (ind.tier || 1) === 1).length
  const tier1Completed = responses.filter(r => {
    const ind = indicators.find(i => i.id === r.indicatorId)
    return (ind?.tier || 1) === 1 && r.priorityRating !== null
  }).length

  // Domain progress with tier awareness
  const enhancedDomains = useMemo(() => {
    // Group by consolidated domain code if available
    const domainMap = new Map<string, {
      id: string
      name: string
      question: string
      total: number
      completed: number
      tier1Total: number
      tier1Completed: number
    }>()

    filteredIndicators.forEach(ind => {
      const code = ind.domainCode || ind.domain
      const config = DOMAINS[code as keyof typeof DOMAINS]
      
      if (!domainMap.has(code)) {
        domainMap.set(code, {
          id: code,
          name: config?.name || ind.domainName || code,
          question: config?.question || ind.domainQuestion || '',
          total: 0,
          completed: 0,
          tier1Total: 0,
          tier1Completed: 0,
        })
      }

      const domain = domainMap.get(code)!
      domain.total++
      
      if ((ind.tier || 1) === 1) {
        domain.tier1Total++
        const hasResponse = responses.some(r => r.indicatorId === ind.id && r.priorityRating !== null)
        if (hasResponse) {
          domain.tier1Completed++
          domain.completed++
        }
      } else {
        // For tier 2, count comments as completion
        const hasComment = responses.some(r => r.indicatorId === ind.id && r.qualitativeReasoning)
        if (hasComment) domain.completed++
      }
    })

    return Array.from(domainMap.values()).sort((a, b) => a.id.localeCompare(b.id))
  }, [filteredIndicators, responses])

  // Handle response save
  const handleSaveResponse = useCallback(async (indicatorId: string, data: Partial<Response>) => {
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicatorId,
          roundNumber: currentRound,
          ...data,
        }),
      })

      if (!res.ok) throw new Error('Failed to save response')

      const saved = await res.json()

      setResponses(prev => {
        const existing = prev.findIndex(r => r.indicatorId === indicatorId)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = saved
          return updated
        }
        return [...prev, saved]
      })

      return true
    } catch (error) {
      console.error('Save error:', error)
      return false
    }
  }, [currentRound])

  // Handle preference update
  const handlePreferencesUpdate = async (newPrefs: Record<string, boolean>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }))
    
    // Persist to server
    try {
      await fetch('/api/panelist/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })
    } catch (e) {
      console.error('Failed to save preferences:', e)
    }
  }

  // Navigation
  const totalInDomain = tier1Indicators.length + (preferences.showTier2 ? tier2Indicators.length : 0)

  // Build position string with core/extended context
  const getPositionString = () => {
    const currentPos = currentIndicatorIndex + 1
    const isInTier2 = currentIndicatorIndex >= tier1Indicators.length

    if (!preferences.showTier2) {
      // Only showing core indicators
      return `${currentPos} of ${tier1Indicators.length} core`
    }

    if (isInTier2) {
      // Currently in extended indicators section
      const tier2Pos = currentIndicatorIndex - tier1Indicators.length + 1
      return `Extended ${tier2Pos} of ${tier2Indicators.length}`
    }

    // In core indicators, with extended available
    return `Core ${currentPos} of ${tier1Indicators.length}`
  }
  
  const goToNext = () => {
    if (currentIndicatorIndex < totalInDomain - 1) {
      setCurrentIndicatorIndex(currentIndicatorIndex + 1)
    } else {
      // Move to next domain
      const currentDomainIndex = enhancedDomains.findIndex(d => d.id === selectedDomain)
      if (currentDomainIndex < enhancedDomains.length - 1) {
        setSelectedDomain(enhancedDomains[currentDomainIndex + 1].id)
        setCurrentIndicatorIndex(0)
      }
    }
  }

  const goToPrevious = () => {
    if (currentIndicatorIndex > 0) {
      setCurrentIndicatorIndex(currentIndicatorIndex - 1)
    }
  }

  // Study not active state
  if (study.status !== 'ACTIVE') {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{study.name}</CardTitle>
            <CardDescription>
              {study.status === 'SETUP' && 'This study has not yet started. You will receive an email when the first round opens.'}
              {study.status === 'PAUSED' && 'This study is currently paused. Please check back later.'}
              {study.status === 'COMPLETE' && 'This study has been completed. Thank you for your participation!'}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{study.name}</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {panelist.name || panelist.email}
                <span className="mx-2">•</span>
                <span className="capitalize">
                  {roleDisplayNames[panelist.primaryRole]}
                  {panelist.secondaryRole && ` & ${roleDisplayNames[panelist.secondaryRole]}`}
                </span>
                {panelist.expertiseArea && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="italic">{panelist.expertiseArea}</span>
                  </>
                )}
                {panelist.jurisdictionContext && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {jurisdictionLabels[panelist.jurisdictionContext]}
                    </span>
                  </>
                )}
              </p>
              <Link
                href={`/study/${study.id}/intro`}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <BookOpen className="w-3 h-3" />
                View Project Overview
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <RoundStepper 
                currentRound={currentRound} 
                totalRounds={study.totalRounds} 
              />
              <div className="relative">
                <PanelistPreferences
                  preferences={preferences}
                  onUpdate={handlePreferencesUpdate}
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={tier1Completed}
              max={tier1Total}
              label={`Round ${currentRound} Progress (${tier1Completed}/${tier1Total} core indicators)`}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Domain navigation */}
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Indicator Domains</CardTitle>
                <CardDescription>
                  {preferences.showTier2 
                    ? `${FRAMEWORK_SUMMARY.totalIndicators} total indicators`
                    : `${FRAMEWORK_SUMMARY.tier1Count} core indicators to rate`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {enhancedDomains.map((domain) => {
                    const isComplete = domain.tier1Completed === domain.tier1Total && domain.tier1Total > 0
                    const isCurrent = domain.id === selectedDomain
                    const percentage = domain.tier1Total > 0
                      ? Math.round((domain.tier1Completed / domain.tier1Total) * 100)
                      : 0
                    const hasOnlyExtended = domain.tier1Total === 0 && domain.total > 0

                    // Skip domains with no indicators at all (shouldn't happen, but safety)
                    if (domain.total === 0) return null

                    // If not showing Tier 2 and domain has only extended indicators, show differently
                    if (hasOnlyExtended && !preferences.showTier2) {
                      return (
                        <div
                          key={domain.id}
                          className="w-full text-left p-3 rounded-lg border border-dashed border-muted-foreground/30 opacity-60"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-muted-foreground">
                              {domain.name}
                            </span>
                            <span className="text-xs text-muted-foreground italic">
                              Extended only
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enable "Show Extended" in settings to view
                          </p>
                        </div>
                      )
                    }

                    return (
                      <button
                        key={domain.id}
                        onClick={() => {
                          setSelectedDomain(domain.id)
                          setCurrentIndicatorIndex(0)
                        }}
                        className={`
                          w-full text-left p-3 rounded-lg border transition-colors
                          ${isCurrent ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent'}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isComplete ? 'text-green-600' : ''}`}>
                            {domain.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {domain.tier1Completed}/{domain.tier1Total}
                            {preferences.showTier2 && domain.total > domain.tier1Total && (
                              <span className="text-muted-foreground/60"> +{domain.total - domain.tier1Total}</span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {domain.question && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {domain.question}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Instructions card */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How to Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Priority:</strong> How important is this indicator for the GBV framework?
                </p>
                <p>
                  <strong>Validity:</strong> Does the operationalization accurately measure what we intend?
                </p>
                <p>
                  <strong>Feasibility:</strong> How realistic is data collection in Yukon?
                </p>
                {currentRound > 1 && (
                  <p className="pt-2 border-t">
                    You can see group responses from Round {currentRound - 1} and revise your ratings.
                  </p>
                )}
                <div className="pt-2 border-t">
                  <p className="flex items-center gap-2">
                    <TierBadge tier={1} /> Rate these (required)
                  </p>
                  <p className="flex items-center gap-2 mt-1">
                    <TierBadge tier={2} /> Comment only (optional)
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main content - Indicator assessment */}
          <div className="lg:col-span-3">
            {currentIndicator ? (
              <IndicatorAssessment
                indicator={currentIndicator}
                response={currentResponse}
                previousSummary={previousSummary}
                currentRound={currentRound}
                onSave={handleSaveResponse}
                onNext={goToNext}
                onPrevious={goToPrevious}
                hasPrevious={currentIndicatorIndex > 0}
                hasNext={
                  currentIndicatorIndex < totalInDomain - 1 ||
                  enhancedDomains.findIndex(d => d.id === selectedDomain) < enhancedDomains.length - 1
                }
                position={getPositionString()}
                isTier2={currentIndicator.tier === 2}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a domain from the sidebar to begin rating indicators.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
