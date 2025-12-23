'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea, Label } from '@/components/ui/form-elements'
import { RatingScale } from '@/components/ui/rating-scale'
import { ConsensusBadge } from '@/components/ui/progress'
import { TierBadge } from '@/components/panelist-preferences'
import { EvidenceTooltip } from '@/components/evidence-tooltip'
import { ChevronLeft, ChevronRight, Save, AlertCircle, MessageSquare } from 'lucide-react'
import { priorityLabels, validityLabels, feasibilityLabels } from '@/lib/utils'
import type { Indicator, Response, RoundSummary } from '@prisma/client'

interface IndicatorAssessmentProps {
  indicator: Indicator
  response: Response | null
  previousSummary: (RoundSummary & { indicator: Indicator }) | null
  currentRound: number
  onSave: (indicatorId: string, data: Partial<Response>) => Promise<boolean>
  onNext: () => void
  onPrevious: () => void
  hasPrevious: boolean
  hasNext: boolean
  position: string
  plainLanguage?: boolean
  isTier2?: boolean
}

export function IndicatorAssessment({
  indicator,
  response,
  previousSummary,
  currentRound,
  onSave,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
  position,
  plainLanguage = false,
  isTier2 = false,
}: IndicatorAssessmentProps) {
  // Form state
  const [priorityRating, setPriorityRating] = useState<number | null>(response?.priorityRating || null)
  const [validityRating, setValidityRating] = useState<number | null>(response?.operationalizationValidity || null)
  const [feasibilityRating, setFeasibilityRating] = useState<number | null>(response?.feasibilityRating || null)
  const [reasoning, setReasoning] = useState(response?.qualitativeReasoning || '')
  const [thresholdSuggestion, setThresholdSuggestion] = useState(response?.thresholdSuggestion || '')
  const [generalComments, setGeneralComments] = useState(response?.generalComments || '')
  const [dissentFlag, setDissentFlag] = useState(response?.dissentFlag || false)
  const [dissentReason, setDissentReason] = useState(response?.dissentReason || '')
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)

  // Reset form when indicator changes
  useEffect(() => {
    setPriorityRating(response?.priorityRating || null)
    setValidityRating(response?.operationalizationValidity || null)
    setFeasibilityRating(response?.feasibilityRating || null)
    setReasoning(response?.qualitativeReasoning || '')
    setThresholdSuggestion(response?.thresholdSuggestion || '')
    setGeneralComments(response?.generalComments || '')
    setDissentFlag(response?.dissentFlag || false)
    setDissentReason(response?.dissentReason || '')
    setHasChanges(false)
    setSaveStatus('idle')
  }, [indicator.id, response])

  // Track changes
  useEffect(() => {
    const changed =
      priorityRating !== (response?.priorityRating || null) ||
      validityRating !== (response?.operationalizationValidity || null) ||
      feasibilityRating !== (response?.feasibilityRating || null) ||
      reasoning !== (response?.qualitativeReasoning || '') ||
      thresholdSuggestion !== (response?.thresholdSuggestion || '') ||
      generalComments !== (response?.generalComments || '') ||
      dissentFlag !== (response?.dissentFlag || false) ||
      dissentReason !== (response?.dissentReason || '')
    setHasChanges(changed)
  }, [priorityRating, validityRating, feasibilityRating, reasoning, thresholdSuggestion, generalComments, dissentFlag, dissentReason, response])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    const success = await onSave(indicator.id, {
      priorityRating: isTier2 ? null : priorityRating,
      operationalizationValidity: isTier2 ? null : validityRating,
      feasibilityRating: isTier2 ? null : feasibilityRating,
      qualitativeReasoning: reasoning || null,
      thresholdSuggestion: thresholdSuggestion || null,
      generalComments: generalComments || null,
      dissentFlag,
      dissentReason: dissentFlag ? dissentReason : null,
      revisedFromPrevious: currentRound > 1,
    })

    setIsSaving(false)
    setSaveStatus(success ? 'saved' : 'error')
    if (success) setHasChanges(false)
  }

  const handleSaveAndNext = async () => {
    await handleSave()
    if (hasNext) {
      onNext()
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // For Tier 1, require all ratings; for Tier 2, just need some content
  const isComplete = isTier2 
    ? reasoning.length > 0  // Tier 2 just needs a comment
    : priorityRating !== null && validityRating !== null && feasibilityRating !== null

  // Determine which definition to show
  const displayDefinition = plainLanguage && indicator.definitionSimple
    ? indicator.definitionSimple
    : indicator.definition

  return (
    <div className="space-y-4">
      {/* Sticky indicator header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 mb-4">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  {indicator.name}
                  {indicator.evidenceSummary && (
                    <EvidenceTooltip
                      summary={indicator.evidenceSummary}
                      riskFactors={indicator.riskFactors as string[] | undefined}
                      protectiveFactors={indicator.protectiveFactors as string[] | undefined}
                      citations={indicator.keyCitations as string[] | undefined}
                      dataQualityNotes={indicator.dataQualityNotes || undefined}
                      rrnRelevance={indicator.rrnRelevance || undefined}
                      prominent
                    />
                  )}
                </CardTitle>
                {indicator.domainName && (
                  <p className="text-sm text-primary font-medium">
                    {indicator.domainCode}: {indicator.domainName}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {position}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">Definition</h4>
                {plainLanguage && indicator.definitionSimple && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                    Plain Language
                  </span>
                )}
              </div>
              <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed font-medium">{displayDefinition}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable content */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          {indicator.notes && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Important Notes
              </h4>
              <p className="text-sm leading-relaxed">{indicator.notes}</p>
            </div>
          )}

          {/* Tier rationale for Tier 2 indicators */}
          {isTier2 && indicator.tierRationale && (
            <div className="p-3 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-1">Why This Is Tier 2</h4>
              <p className="text-sm text-muted-foreground">{indicator.tierRationale}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous round summary (for rounds > 1) - only for Tier 1 */}
      {previousSummary && currentRound > 1 && !isTier2 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Round {currentRound - 1} Group Summary</CardTitle>
            <CardDescription>
              See how the group rated this indicator in the previous round
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className="text-lg font-semibold">
                  {previousSummary.priorityMedian?.toFixed(1)} median
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (IQR: {previousSummary.priorityIQR?.toFixed(1)})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validity</p>
                <p className="text-lg font-semibold">
                  {previousSummary.validityMedian?.toFixed(1)} median
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Feasibility</p>
                <p className="text-lg font-semibold">
                  {previousSummary.feasibilityMedian?.toFixed(1)} median
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ConsensusBadge iqr={previousSummary.priorityIQR || 0} />
              {previousSummary.dissentCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {previousSummary.dissentCount} dissent flag(s)
                </span>
              )}
            </div>

            {previousSummary.reasoningSummary && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-1">Key Themes from Reasoning</p>
                <p className="text-sm text-muted-foreground">{previousSummary.reasoningSummary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rating form - Different for Tier 1 vs Tier 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {isTier2 ? (
              <>
                <MessageSquare className="w-4 h-4" />
                Your Comments (Optional)
              </>
            ) : (
              'Your Assessment'
            )}
          </CardTitle>
          {isTier2 && (
            <CardDescription>
              This is an extended indicator. Rating is not required, but your comments are valuable.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating scales - only for Tier 1 */}
          {!isTier2 && (
            <>
              <RatingScale
                id="priority"
                label="Priority"
                description="How important is this indicator for measuring GBV service capacity?"
                value={priorityRating}
                onChange={setPriorityRating}
                labels={priorityLabels}
                min={1}
                max={3}
                required
              />

              <RatingScale
                id="validity"
                label="Validity"
                description="Does this actually measure what it's supposed to measure?"
                value={validityRating}
                onChange={setValidityRating}
                labels={validityLabels}
                min={1}
                max={3}
                required
              />

              <RatingScale
                id="feasibility"
                label="Feasibility"
                description="How realistic is it to collect this data in Yukon communities?"
                value={feasibilityRating}
                onChange={setFeasibilityRating}
                labels={feasibilityLabels}
                min={1}
                max={3}
                required
              />
            </>
          )}

          {/* Qualitative inputs - for both tiers */}
          <div className="space-y-2">
            <Label htmlFor="reasoning">
              {isTier2 ? 'Your Comments' : 'Reasoning'}
              <span className="text-muted-foreground font-normal">
                {isTier2 ? '' : ' (optional)'}
              </span>
            </Label>
            {!isTier2 && (
              <p className="text-sm text-muted-foreground mb-2">
                Share your thinking behind your ratings. This helps other panelists understand different perspectives. Your comments will be shared anonymously with the group in the next round.
              </p>
            )}
            <Textarea
              id="reasoning"
              placeholder={isTier2
                ? "Share any thoughts on this indicator - why it matters, challenges you see, or suggestions for improvement."
                : "Example: 'I rated priority high because...' or 'From my experience, the challenge with feasibility is...'"
              }
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={isTier2 ? 5 : 3}
            />
          </div>

          {!isTier2 && (
            <div className="space-y-2">
              <Label htmlFor="threshold">
                Threshold Suggestion <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                If this indicator were being used to assess a community, what number or benchmark would tell us "this is good enough" versus "this needs improvement"? For example: "At least 2 shelters per 10,000 people" or "Services available within 1 hour travel time."
              </p>
              <Textarea
                id="threshold"
                placeholder="Example: 'At least 75% of survivors should be able to access services within 24 hours'"
                value={thresholdSuggestion}
                onChange={(e) => setThresholdSuggestion(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* General comments field */}
          <div className="space-y-2">
            <Label htmlFor="general-comments">
              General Comments <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Use this space for any other thoughts—concerns about how this might be misused, suggestions for improvement, context from your experience, or anything else that doesn't fit the structured questions above.
            </p>
            <Textarea
              id="general-comments"
              placeholder="Example: 'In remote communities, this data might be sensitive because...' or 'This could be improved by also tracking...'"
              value={generalComments}
              onChange={(e) => setGeneralComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Dissent flag - only for Tier 1 */}
          {!isTier2 && (
            <div className="p-4 border rounded-lg bg-amber-50/50 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="dissent"
                  checked={dissentFlag}
                  onChange={(e) => setDissentFlag(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <Label htmlFor="dissent" className="font-medium">
                    Flag Principled Dissent
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    In later rounds, if you see that most panelists disagree with your rating but you still believe your perspective is important, check this box. Your reasoning will be included in the final report (anonymously) so your viewpoint isn't lost. This is especially important for lived experience perspectives that might differ from expert consensus.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    You don't need to use this in Round 1—it's for when you see the group results and want to maintain your position.
                  </p>
                </div>
              </div>

              {dissentFlag && (
                <div className="pl-7">
                  <Label htmlFor="dissent-reason" className="text-sm">
                    Why this disagreement matters
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Help us understand your perspective. What are we missing if we only follow the majority view?
                  </p>
                  <Textarea
                    id="dissent-reason"
                    placeholder="Example: 'Based on my experience working in small communities, this indicator overlooks...'"
                    value={dissentReason}
                    onChange={(e) => setDissentReason(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation and save */}
      <div className="flex items-center justify-between gap-4 sticky bottom-4 bg-background p-4 rounded-lg border shadow-lg">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              ✓ Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm font-medium text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Error saving
            </span>
          )}
          {hasChanges && saveStatus === 'idle' && (
            <span className="text-sm text-amber-600">
              Unsaved changes
            </span>
          )}

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            onClick={handleSaveAndNext}
            disabled={isSaving || (!isTier2 && !isComplete)}
          >
            {hasNext ? (
              <>
                {isTier2 ? 'Save & Next' : 'Save & Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              'Save & Complete Domain'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
