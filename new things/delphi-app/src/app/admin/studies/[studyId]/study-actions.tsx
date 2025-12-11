'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Play, Pause, CheckCircle, BarChart } from 'lucide-react'
import type { Study, Round } from '@prisma/client'

interface StudyActionsProps {
  study: Study & { rounds: Round[] }
}

export function StudyActions({ study }: StudyActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const currentRound = study.rounds.find(r => r.roundNumber === study.currentRound)
  const nextRound = study.rounds.find(r => r.roundNumber === study.currentRound + 1)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/study/${study.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Action failed')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Setup state - can start round 1 */}
        {study.status === 'SETUP' && study.currentRound === 0 && (
          <Button
            onClick={() => handleAction('START_ROUND_1')}
            disabled={isLoading}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Round 1
          </Button>
        )}

        {/* Active state with open round - can close it */}
        {study.status === 'ACTIVE' && currentRound?.status === 'OPEN' && (
          <Button
            onClick={() => handleAction('CLOSE_ROUND')}
            disabled={isLoading}
            variant="outline"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Close Round {study.currentRound}
          </Button>
        )}

        {/* Round closed but not analyzed - can analyze */}
        {currentRound?.status === 'CLOSED' && (
          <Button
            onClick={() => handleAction('ANALYZE_ROUND')}
            disabled={isLoading}
          >
            <BarChart className="w-4 h-4 mr-2" />
            Compute Consensus
          </Button>
        )}

        {/* Round analyzed, more rounds available - can start next */}
        {currentRound?.status === 'ANALYZED' && nextRound && (
          <Button
            onClick={() => handleAction('START_NEXT_ROUND')}
            disabled={isLoading}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Round {study.currentRound + 1}
          </Button>
        )}

        {/* Final round analyzed - can complete study */}
        {currentRound?.status === 'ANALYZED' && !nextRound && study.status !== 'COMPLETE' && (
          <Button
            onClick={() => handleAction('COMPLETE_STUDY')}
            disabled={isLoading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Study
          </Button>
        )}

        {/* Can pause active study */}
        {study.status === 'ACTIVE' && (
          <Button
            onClick={() => handleAction('PAUSE_STUDY')}
            disabled={isLoading}
            variant="outline"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause Study
          </Button>
        )}

        {/* Can resume paused study */}
        {study.status === 'PAUSED' && (
          <Button
            onClick={() => handleAction('RESUME_STUDY')}
            disabled={isLoading}
          >
            <Play className="w-4 h-4 mr-2" />
            Resume Study
          </Button>
        )}
      </div>
    </div>
  )
}
