import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { IndicatorForm } from './form'

export const dynamic = 'force-dynamic'

export default async function IndicatorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) {
    redirect('/')
  }

  const { panelist, study } = session
  const { id } = await params

  // Get indicator
  const indicator = await prisma.indicator.findUnique({
    where: { id },
  })

  if (!indicator || indicator.studyId !== study.id) {
    notFound()
  }

  // Get existing response for this round
  const existingResponse = await prisma.response.findUnique({
    where: {
      panelistId_indicatorId_roundNumber: {
        panelistId: panelist.id,
        indicatorId: indicator.id,
        roundNumber: study.currentRound,
      }
    }
  })

  // Get previous round's summary for context (if not round 1)
  let previousSummary = null
  if (study.currentRound > 1) {
    previousSummary = await prisma.roundSummary.findUnique({
      where: {
        indicatorId_roundNumber: {
          indicatorId: indicator.id,
          roundNumber: study.currentRound - 1,
        }
      }
    })
  }

  // Get adjacent indicators for navigation
  const allIndicators = await prisma.indicator.findMany({
    where: { studyId: study.id },
    orderBy: [{ domainCode: 'asc' }, { externalId: 'asc' }],
    select: { id: true, externalId: true, name: true }
  })

  const currentIndex = allIndicators.findIndex(i => i.id === indicator.id)
  const prevIndicator = currentIndex > 0 ? allIndicators[currentIndex - 1] : null
  const nextIndicator = currentIndex < allIndicators.length - 1 ? allIndicators[currentIndex + 1] : null

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/study" className="text-blue-600 hover:underline flex items-center gap-1">
          ← Back to overview
        </Link>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {allIndicators.length}
        </span>
      </div>

      {/* Indicator header */}
      <div className="mb-6 p-6 bg-white border rounded-lg shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
            {indicator.domainCode}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-500">{indicator.externalId}</span>
              {indicator.tier === 1 ? (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                  Tier 1 (Pathway-Critical)
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  Tier 2 (Pathway-Quality)
                </span>
              )}
              {indicator.mvp && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                  MVP
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold mb-3">{indicator.name}</h1>

            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Definition</h3>
                <p className="text-gray-700">{indicator.definition}</p>
              </div>

              {indicator.definitionSimple && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-1">Plain language</h3>
                  <p className="text-blue-800">{indicator.definitionSimple}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Unit of measure</h3>
                  <p className="text-gray-700">{indicator.unitOfMeasure}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Collection frequency</h3>
                  <p className="text-gray-700">{indicator.collectionFrequency}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-1">How it's measured</h3>
                <p className="text-gray-700">{indicator.operationalization}</p>
              </div>

              {indicator.evidenceSummary && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Evidence base</h3>
                  <p className="text-sm text-gray-600">{indicator.evidenceSummary}</p>
                </div>
              )}

              {indicator.tierRationale && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Tier rationale</h3>
                  <p className="text-sm text-gray-600">{indicator.tierRationale}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Previous round context */}
      {previousSummary && (
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
          <h2 className="font-semibold mb-3">Round {study.currentRound - 1} Results</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {previousSummary.priorityMedian?.toFixed(1) || '—'}
              </div>
              <div className="text-sm text-gray-600">Priority (median)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {previousSummary.validityMedian?.toFixed(1) || '—'}
              </div>
              <div className="text-sm text-gray-600">Validity (median)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {previousSummary.feasibilityMedian?.toFixed(1) || '—'}
              </div>
              <div className="text-sm text-gray-600">Feasibility (median)</div>
            </div>
          </div>
          {previousSummary.consensusReached && (
            <div className="mt-3 text-center text-green-600 font-medium">
              ✓ Consensus reached
            </div>
          )}
        </div>
      )}

      {/* Assessment form */}
      <IndicatorForm
        indicatorId={indicator.id}
        roundNumber={study.currentRound}
        existingResponse={existingResponse}
      />

      {/* Navigation footer */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        {prevIndicator ? (
          <Link
            href={`/study/indicator/${prevIndicator.id}`}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
          >
            ← {prevIndicator.externalId}
          </Link>
        ) : (
          <div />
        )}
        {nextIndicator ? (
          <Link
            href={`/study/indicator/${nextIndicator.id}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            {nextIndicator.externalId} →
          </Link>
        ) : (
          <Link href="/study" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium">
            Finish Review →
          </Link>
        )}
      </div>
    </div>
  )
}
