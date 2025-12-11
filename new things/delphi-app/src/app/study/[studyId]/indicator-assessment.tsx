'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea, Label } from '@/components/ui/form-elements'
import { RatingScale } from '@/components/ui/rating-scale'
import { ConsensusBadge } from '@/components/ui/progress'
import { TierBadge } from '@/components/panelist-preferences'
import { ChevronLeft, ChevronRight, Save, AlertCircle, MessageSquare } from 'lucide-react'
import type { Indicator, Response, RoundSummary } from '@prisma/client'

// Import label configs
const priorityLabels: Record<number, string> = {
  1: 'Not important',
  2: 'Slightly important',
  3: 'Moderately important',
  4: 'Very important',
  5: 'Essential',
}

const validityLabels: Record<number, string> = {
  1: 'Not valid',
  2: 'Somewhat valid',
  3: 'Moderately valid',
  4: 'Very valid',
  5: 'Highly valid',
}

const feasibilityLabels: Record<number, string> = {
  1: 'Not feasible',
  2: 'Difficult',
  3: 'Moderately feasible',
  4: 'Feasible',
  5: 'Easily feasible',
}

// Extended indicator type
interface ExtendedIndicator extends Indicator {
  domainCode?: string
  domainName?: string
  domainQuestion?: string
  tier?: number
  tierRationale?: string
  dataReliability?: string
}

interface IndicatorAssessmentProps {
  indicator: ExtendedIndicator
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
      dissentFlag !== (response?.dissentFlag || false) ||
      dissentReason !== (response?.dissentReason || '')
    setHasChanges(changed)
  }, [priorityRating, validityRating, feasibilityRating, reasoning, thresholdSuggestion, dissentFlag, dissentReason, response])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    const success = await onSave(indicator.id, {
      priorityRating: isTier2 ? null : priorityRating,
      operationalizationValidity: isTier2 ? null : validityRating,
      feasibilityRating: isTier2 ? null : feasibilityRating,
      qualitativeReasoning: reasoning || null,
      thresholdSuggestion: thresholdSuggestion || null,
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
    if (hasNext) onNext()
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
      {/* Indicator header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {indicator.externalId} • {indicator.category}
                </p>
                <TierBadge tier={isTier2 ? 2 : 1} />
                {indicator.dataReliability && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    indicator.dataReliability === 'HIGH' ? 'bg-green-100 text-green-700' :
                    indicator.dataReliability === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {indicator.dataReliability} reliability
                  </span>
                )}
              </div>
              <CardTitle className="text-xl">{indicator.name}</CardTitle>
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
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium">Definition</h4>
              {plainLanguage && indicator.definitionSimple && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  Plain language
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{displayDefinition}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Unit of Measure</h4>
              <p className="text-sm text-muted-foreground">{indicator.unitOfMeasure}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Collection Frequency</h4>
              <p className="text-sm text-muted-foreground">{indicator.collectionFrequency}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Operationalization</h4>
            <p className="text-sm text-muted-foreground">{indicator.operationalization}</p>
          </div>

          {indicator.notes && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
              <h4 className="text-sm font-medium mb-1">Notes / Edge Cases</h4>
              <p className="text-sm">{indicator.notes}</p>
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
                description="How important is this indicator for measuring GBV service capacity in Yukon?"
                value={priorityRating}
                onChange={setPriorityRating}
                labels={priorityLabels}
                required
              />

              <RatingScale
                id="validity"
                label="Operationalization Validity"
                description="Does the operationalization accurately measure what we intend?"
                value={validityRating}
                onChange={setValidityRating}
                labels={validityLabels}
                required
              />

              <RatingScale
                id="feasibility"
                label="Data Collection Feasibility"
                description="How realistic is data collection for this indicator in Yukon communities?"
                value={feasibilityRating}
                onChange={setFeasibilityRating}
                labels={feasibilityLabels}
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
            <Textarea
              id="reasoning"
              placeholder={isTier2 
                ? "Share any thoughts on this indicator - why it matters, challenges you see, or suggestions for improvement."
                : "Why did you rate this indicator this way? Your reasoning will be anonymized and shared with the group in the next round."
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
              <Textarea
                id="threshold"
                placeholder="What value would indicate 'adequate' vs 'inadequate' service/capacity?"
                value={thresholdSuggestion}
                onChange={(e) => setThresholdSuggestion(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Dissent flag - only for Tier 1 */}
          {!isTier2 && (
            <div className="p-4 border rounded-lg space-y-3">
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
                    Check this if you want your disagreement with the emerging consensus to be 
                    preserved in the final report, even if you don't change your rating.
                  </p>
                </div>
              </div>

              {dissentFlag && (
                <div className="pl-7">
                  <Label htmlFor="dissent-reason" className="text-sm">
                    Reason for dissent
                  </Label>
                  <Textarea
                    id="dissent-reason"
                    placeholder="Why do you believe this disagreement should be recorded?"
                    value={dissentReason}
                    onChange={(e) => setDissentReason(e.target.value)}
                    rows={2}
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
            <span className="text-sm text-green-600">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Error saving
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
