'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar, RoundStepper, DomainProgress, ConsensusBadge } from '@/components/ui/progress'
import { IndicatorAssessment } from './indicator-assessment'
import { roleDisplayNames } from '@/lib/utils'
import type { Study, Panelist, Indicator, Response, RoundSummary, Round } from '@prisma/client'

interface StudyDashboardProps {
  study: Study & { rounds: Round[] }
  panelist: Panelist
  indicators: Indicator[]
  domains: { id: string; name: string; total: number; completed: number }[]
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
  const [selectedDomain, setSelectedDomain] = useState<string | null>(
    domains[0]?.id || null
  )
  const [responses, setResponses] = useState<Response[]>(initialResponses)
  const [currentIndicatorIndex, setCurrentIndicatorIndex] = useState(0)

  // Get indicators for selected domain
  const domainIndicators = selectedDomain
    ? indicators.filter(ind => ind.domain === selectedDomain)
    : []

  const currentIndicator = domainIndicators[currentIndicatorIndex]

  // Get response for current indicator
  const currentResponse = currentIndicator
    ? responses.find(r => r.indicatorId === currentIndicator.id)
    : null

  // Get previous summary for current indicator (for rounds > 1)
  const previousSummary = currentIndicator
    ? previousSummaries.find(s => s.indicatorId === currentIndicator.id)
    : null

  // Calculate overall progress
  const totalResponses = responses.filter(r => r.priorityRating !== null).length
  const totalIndicators = indicators.length

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

  // Navigation
  const goToNext = () => {
    if (currentIndicatorIndex < domainIndicators.length - 1) {
      setCurrentIndicatorIndex(currentIndicatorIndex + 1)
    } else {
      // Move to next domain
      const currentDomainIndex = domains.findIndex(d => d.id === selectedDomain)
      if (currentDomainIndex < domains.length - 1) {
        setSelectedDomain(domains[currentDomainIndex + 1].id)
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
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{study.name}</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {panelist.name || panelist.email} 
                <span className="mx-2">•</span>
                <span className="capitalize">{roleDisplayNames[panelist.roleType]}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <RoundStepper 
                currentRound={currentRound} 
                totalRounds={study.totalRounds} 
              />
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={totalResponses}
              max={totalIndicators}
              label={`Round ${currentRound} Progress`}
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
                  Complete indicators by domain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainProgress
                  domains={domains}
                  currentDomain={selectedDomain || undefined}
                  onSelectDomain={(id) => {
                    setSelectedDomain(id)
                    setCurrentIndicatorIndex(0)
                  }}
                />
              </CardContent>
            </Card>

            {/* Instructions card */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How to Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Priority:</strong> How important is this indicator for the GBV framework?
                </p>
                <p>
                  <strong>Validity:</strong> Does the operationalization accurately measure what we intend?
                </p>
                <p>
                  <strong>Feasibility:</strong> How realistic is data collection for this indicator?
                </p>
                {currentRound > 1 && (
                  <p className="pt-2 border-t">
                    You can see the group's responses from Round {currentRound - 1} and revise your ratings if you wish.
                  </p>
                )}
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
                  currentIndicatorIndex < domainIndicators.length - 1 ||
                  domains.findIndex(d => d.id === selectedDomain) < domains.length - 1
                }
                position={`${currentIndicatorIndex + 1} of ${domainIndicators.length}`}
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
