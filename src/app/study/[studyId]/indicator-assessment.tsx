'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error' | 'auto-saved'>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [draftRecovered, setDraftRecovered] = useState(false)

  // localStorage key for drafts
  const getDraftKey = (indicatorId: string) => `delphi_draft_${currentRound}_${indicatorId}`

  // Save draft to localStorage
  const saveDraft = useCallback((indicatorId: string, data: any) => {
    try {
      const draftData = {
        ...data,
        timestamp: new Date().toISOString(),
        indicatorId,
        roundNumber: currentRound,
      }
      localStorage.setItem(getDraftKey(indicatorId), JSON.stringify(draftData))
      console.log('💾 Draft saved to localStorage:', indicatorId)
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [currentRound])

  // Load draft from localStorage
  const loadDraft = useCallback((indicatorId: string) => {
    try {
      const draftStr = localStorage.getItem(getDraftKey(indicatorId))
      if (draftStr) {
        const draft = JSON.parse(draftStr)
        console.log('📂 Draft loaded from localStorage:', indicatorId)
        return draft
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return null
  }, [currentRound])

  // Clear draft from localStorage
  const clearDraft = useCallback((indicatorId: string) => {
    try {
      localStorage.removeItem(getDraftKey(indicatorId))
      console.log('🗑️ Draft cleared from localStorage:', indicatorId)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [currentRound])

  // Reset form when indicator changes
  useEffect(() => {
    setDraftRecovered(false) // Reset recovery flag

    // First try to load from response (saved in DB)
    if (response) {
      setPriorityRating(response.priorityRating || null)
      setValidityRating(response.operationalizationValidity || null)
      setFeasibilityRating(response.feasibilityRating || null)
      setReasoning(response.qualitativeReasoning || '')
      setThresholdSuggestion(response.thresholdSuggestion || '')
      setGeneralComments(response.generalComments || '')
      setDissentFlag(response.dissentFlag || false)
      setDissentReason(response.dissentReason || '')
      setHasChanges(false)
      setSaveStatus('idle')
    } else {
      // Try to load draft from localStorage
      const draft = loadDraft(indicator.id)
      if (draft) {
        setPriorityRating(draft.priorityRating || null)
        setValidityRating(draft.operationalizationValidity || null)
        setFeasibilityRating(draft.feasibilityRating || null)
        setReasoning(draft.qualitativeReasoning || '')
        setThresholdSuggestion(draft.thresholdSuggestion || '')
        setGeneralComments(draft.generalComments || '')
        setDissentFlag(draft.dissentFlag || false)
        setDissentReason(draft.dissentReason || '')
        setHasChanges(true)
        setSaveStatus('idle')
        setDraftRecovered(true)
        console.log('✨ Restored unsaved draft from', new Date(draft.timestamp).toLocaleString())
      } else {
        // No response and no draft - start fresh
        setPriorityRating(null)
        setValidityRating(null)
        setFeasibilityRating(null)
        setReasoning('')
        setThresholdSuggestion('')
        setGeneralComments('')
        setDissentFlag(false)
        setDissentReason('')
        setHasChanges(false)
        setSaveStatus('idle')
      }
    }
  }, [indicator.id, response, loadDraft])

  // Track changes and save drafts
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

    // Auto-save draft to localStorage whenever form changes
    if (changed) {
      saveDraft(indicator.id, {
        priorityRating: isTier2 ? null : priorityRating,
        operationalizationValidity: isTier2 ? null : validityRating,
        feasibilityRating: isTier2 ? null : feasibilityRating,
        qualitativeReasoning: reasoning || null,
        thresholdSuggestion: thresholdSuggestion || null,
        generalComments: generalComments || null,
        dissentFlag,
        dissentReason: dissentFlag ? dissentReason : null,
      })
    }
  }, [priorityRating, validityRating, feasibilityRating, reasoning, thresholdSuggestion, generalComments, dissentFlag, dissentReason, response, indicator.id, isTier2, saveDraft])

  const handleSave = async (isAutoSave = false, retryCount = 0) => {
    setIsSaving(true)
    if (!isAutoSave) setSaveStatus('idle')

    const data = {
      priorityRating: isTier2 ? null : priorityRating,
      operationalizationValidity: isTier2 ? null : validityRating,
      feasibilityRating: isTier2 ? null : feasibilityRating,
      qualitativeReasoning: reasoning || null,
      thresholdSuggestion: thresholdSuggestion || null,
      generalComments: generalComments || null,
      dissentFlag,
      dissentReason: dissentFlag ? dissentReason : null,
      revisedFromPrevious: currentRound > 1,
    }

    const success = await onSave(indicator.id, data)

    setIsSaving(false)

    if (success) {
      setSaveStatus(isAutoSave ? 'auto-saved' : 'saved')
      setHasChanges(false)
      setLastSaveTime(new Date())
      // Clear draft from localStorage after successful save
      clearDraft(indicator.id)
      console.log('✅ Response saved to database', isAutoSave ? '(auto-save)' : '')
    } else {
      setSaveStatus('error')
      // Retry logic: retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`⚠️ Save failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`)
        setTimeout(() => {
          handleSave(isAutoSave, retryCount + 1)
        }, delay)
      } else {
        console.error('❌ Save failed after 3 retries. Draft saved in localStorage.')
      }
    }

    return success
  }

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasChanges || isSaving) return

    const autoSaveInterval = setInterval(() => {
      if (hasChanges && !isSaving) {
        console.log('⏰ Auto-saving...')
        handleSave(true)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [hasChanges, isSaving])

  // Warn before closing/refreshing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Your draft is saved locally, but it\'s recommended to save to the database first.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleSaveAndNext = async () => {
    const success = await handleSave(false)
    if (success && hasNext) {
      onNext()
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // For Tier 1, require all ratings; for Tier 2, just need some content
  const isComplete = isTier2 
    ? reasoning.length > 0  // Tier 2 just needs a comment
    : priorityRating !== null && validityRating !== null && feasibilityRating !== null

  // Always use plain language definition if available
  const displayDefinition = indicator.definitionSimple || indicator.definition

  return (
    <div className="space-y-4">
      {/* Draft recovered notification */}
      {draftRecovered && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Draft Restored
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                We recovered your previous unsaved work on this indicator. Click "Save" to store it in the database, or continue editing.
              </p>
            </div>
            <button
              onClick={() => setDraftRecovered(false)}
              className="flex-shrink-0 text-blue-600 hover:text-blue-800"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
              <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">Definition</h4>
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
          {isTier2 ? (
            <CardDescription>
              This is an extended indicator. Rating is not required, but your comments are valuable.
            </CardDescription>
          ) : (
            <CardDescription className="flex items-center gap-2">
              <span className="inline-flex items-center text-red-600">
                <span className="text-red-500 mr-1">*</span>
                Required:
              </span>
              Rate all three dimensions to proceed. Select "Unsure" if you're uncertain.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating scales - only for Tier 1 */}
          {!isTier2 && (
            <>
              <RatingScale
                id="priority"
                label="Priority Level"
                description="What priority level should this indicator have for measuring GBV service capacity?"
                value={priorityRating}
                onChange={setPriorityRating}
                labels={priorityLabels}
                min={1}
                max={3}
                required
              />

              <RatingScale
                id="validity"
                label="Validity Level"
                description="How well does this indicator actually measure what it's supposed to measure?"
                value={validityRating}
                onChange={setValidityRating}
                labels={validityLabels}
                min={1}
                max={3}
                required
              />

              <RatingScale
                id="feasibility"
                label="Feasibility Level"
                description="How feasible is it to collect this data in Yukon communities?"
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
              {isTier2 ? 'Your Comments' : 'Share Your Thinking'}
              <span className="text-muted-foreground font-normal">
                {isTier2 ? '' : ' (optional)'}
              </span>
            </Label>
            {!isTier2 && (
              <p className="text-sm text-muted-foreground mb-2">
                Share your thinking behind your ratings.
                <span className="inline-flex items-center gap-1 ml-1 text-blue-600 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Shared anonymously with other panelists in the next round
                </span>
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
                placeholder="At least 75% of survivors should be able to access services within 24 hours"
                value={thresholdSuggestion}
                onChange={(e) => setThresholdSuggestion(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* General comments field */}
          <div className="space-y-2">
            <Label htmlFor="general-comments">
              Private Notes for Research Team <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Anything else you want us to know—concerns, suggestions, context from your experience.
              <span className="inline-flex items-center gap-1 ml-1 text-amber-600 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Not shared with other panelists
              </span>
            </p>
            <Textarea
              id="general-comments"
              placeholder="In remote communities, this data might be sensitive because..."
              value={generalComments}
              onChange={(e) => setGeneralComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Dissent flag - only for Tier 1 and only from Round 2 onwards */}
          {!isTier2 && currentRound > 1 && (
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
                    If you see that most panelists disagree with your rating but you still believe your perspective is important, check this box. Your reasoning will be included in the final report (anonymously) so your viewpoint isn't lost. This is especially important for lived experience perspectives that might differ from expert consensus.
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
                    placeholder="Based on my experience working in small communities, this indicator overlooks..."
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
            <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1.5 animate-in fade-in duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved securely
            </span>
          )}
          {saveStatus === 'auto-saved' && (
            <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Auto-saved
              {lastSaveTime && (
                <span className="text-xs text-blue-600">
                  at {lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm font-medium text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Error - retrying...
            </span>
          )}
          {hasChanges && (saveStatus === 'idle' || saveStatus === 'auto-saved') && (
            <span className="text-sm text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Draft backed up
            </span>
          )}

          <Button
            variant="outline"
            onClick={() => handleSave(false)}
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
