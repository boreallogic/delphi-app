'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface IndicatorFormProps {
  indicatorId: string
  roundNumber: number
  existingResponse: any
}

export function IndicatorForm({ indicatorId, roundNumber, existingResponse }: IndicatorFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    priorityRating: existingResponse?.priorityRating || null,
    operationalizationValidity: existingResponse?.operationalizationValidity || null,
    feasibilityRating: existingResponse?.feasibilityRating || null,
    qualitativeReasoning: existingResponse?.qualitativeReasoning || '',
    thresholdSuggestion: existingResponse?.thresholdSuggestion || '',
    generalComments: existingResponse?.generalComments || '',
    dissentFlag: existingResponse?.dissentFlag || false,
    dissentReason: existingResponse?.dissentReason || '',
  })

  // Auto-save effect
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      handleSave()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [formData, hasChanges])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    setSaveStatus('idle')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicatorId,
          roundNumber,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Save failed')
      }

      setSaveStatus('saved')
      setHasChanges(false)

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Save status indicator */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
        <div className="text-sm">
          {saveStatus === 'saving' && <span className="text-blue-600">💾 Saving...</span>}
          {saveStatus === 'saved' && <span className="text-green-600">✓ Saved</span>}
          {saveStatus === 'error' && <span className="text-red-600">⚠ Save failed</span>}
          {saveStatus === 'idle' && hasChanges && <span className="text-gray-500">Changes pending...</span>}
          {saveStatus === 'idle' && !hasChanges && <span className="text-gray-500">No unsaved changes</span>}
        </div>
        <span className="text-xs text-gray-500">Auto-saves after 2 seconds</span>
      </div>

      {/* Rating dimensions */}
      <div className="space-y-6 p-6 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Assessment Ratings</h2>

        {/* Priority Rating */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Priority Rating
            <span className="block text-sm font-normal text-gray-600 mt-1">
              How critical is this indicator for measuring GBV risk?
            </span>
          </label>
          <div className="flex gap-3">
            {[1, 2, 3].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('priorityRating', value)}
                className={`flex-1 py-3 px-4 rounded border-2 transition-all ${
                  formData.priorityRating === value
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {value} - {value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>

        {/* Operationalization Validity */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Operationalization Validity
            <span className="block text-sm font-normal text-gray-600 mt-1">
              Does this measure what it claims to measure? Is the operationalization appropriate?
            </span>
          </label>
          <div className="flex gap-3">
            {[1, 2, 3].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('operationalizationValidity', value)}
                className={`flex-1 py-3 px-4 rounded border-2 transition-all ${
                  formData.operationalizationValidity === value
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {value} - {value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>

        {/* Feasibility Rating */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Feasibility Rating
            <span className="block text-sm font-normal text-gray-600 mt-1">
              Can this data be reliably collected in Yukon communities?
            </span>
          </label>
          <div className="flex gap-3">
            {[1, 2, 3].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('feasibilityRating', value)}
                className={`flex-1 py-3 px-4 rounded border-2 transition-all ${
                  formData.feasibilityRating === value
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {value} - {value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Qualitative feedback */}
      <div className="space-y-4 p-6 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Qualitative Feedback (Optional)</h2>

        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Reasoning
            <span className="block text-sm font-normal text-gray-600 mt-1">
              Explain your ratings or suggest improvements
            </span>
          </label>
          <textarea
            value={formData.qualitativeReasoning}
            onChange={(e) => handleChange('qualitativeReasoning', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Optional: Share your reasoning for the ratings above..."
          />
        </div>

        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Threshold Suggestions
            <span className="block text-sm font-normal text-gray-600 mt-1">
              What would constitute adequate vs. inadequate levels for this indicator?
            </span>
          </label>
          <textarea
            value={formData.thresholdSuggestion}
            onChange={(e) => handleChange('thresholdSuggestion', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Optional: Suggest thresholds (e.g., 'Adequate = 1 shelter within 50km, Critical = no shelter within 200km')..."
          />
        </div>

        <div>
          <label className="block font-medium text-gray-900 mb-2">
            General Comments
          </label>
          <textarea
            value={formData.generalComments}
            onChange={(e) => handleChange('generalComments', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Optional: Any other comments about this indicator..."
          />
        </div>
      </div>

      {/* Dissent section */}
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.dissentFlag}
            onChange={(e) => handleChange('dissentFlag', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <span className="font-medium text-gray-900">Register Dissent</span>
            <p className="text-sm text-gray-600 mt-1">
              Check this if you strongly disagree with including this indicator or believe there are fundamental problems
            </p>
          </div>
        </label>

        {formData.dissentFlag && (
          <div className="mt-4">
            <label className="block font-medium text-gray-900 mb-2">
              Reason for Dissent
            </label>
            <textarea
              value={formData.dissentReason}
              onChange={(e) => handleChange('dissentReason', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows={3}
              placeholder="Explain why you dissent on this indicator..."
              required={formData.dissentFlag}
            />
          </div>
        )}
      </div>

      {/* Manual save button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className={`px-6 py-2 rounded font-medium ${
            saving || !hasChanges
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save Now'}
        </button>
      </div>
    </form>
  )
}
