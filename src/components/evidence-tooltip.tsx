'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EvidenceTooltipProps {
  summary: string
  riskFactors?: string[]
  protectiveFactors?: string[]
  citations?: string[]
  dataQualityNotes?: string
  rrnRelevance?: string
}

export function EvidenceTooltip({
  summary,
  riskFactors = [],
  protectiveFactors = [],
  citations = [],
  dataQualityNotes,
  rrnRelevance,
}: EvidenceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Determine RRN relevance badge styling
  const getRelevanceBadge = (relevance?: string) => {
    if (!relevance) return null

    const level = relevance.split(' ')[0] // Extract "CRITICAL", "HIGH", etc.

    let badgeClass = 'px-2 py-1 rounded text-xs font-medium'
    switch (level) {
      case 'CRITICAL':
        badgeClass += ' bg-red-100 text-red-800 border border-red-200'
        break
      case 'HIGH':
        badgeClass += ' bg-orange-100 text-orange-800 border border-orange-200'
        break
      case 'MEDIUM':
        badgeClass += ' bg-yellow-100 text-yellow-800 border border-yellow-200'
        break
      case 'LOW':
        badgeClass += ' bg-gray-100 text-gray-800 border border-gray-200'
        break
      default:
        badgeClass += ' bg-blue-100 text-blue-800 border border-blue-200'
    }

    return (
      <div className={badgeClass}>
        {relevance}
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-muted-foreground hover:text-primary transition-colors ml-2"
          aria-label="View evidence base"
        >
          <Info className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[60vh] overflow-y-auto" align="start">
        <div className="space-y-4">
          {/* Header with close button */}
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-sm">Research Evidence</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Evidence Summary */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
          </div>

          {/* RRN Relevance Badge */}
          {rrnRelevance && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">RRN Context:</span>
              {getRelevanceBadge(rrnRelevance)}
            </div>
          )}

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="text-destructive">
                Risk Factors ({riskFactors.length})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  {riskFactors.map((factor, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Protective Factors */}
          {protectiveFactors.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="text-green-700">
                Protective Factors ({protectiveFactors.length})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  {protectiveFactors.map((factor, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-green-700 mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Key Citations */}
          {citations.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger>
                Key Citations ({citations.length})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {citations.map((citation, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-1">•</span>
                      <span>{citation}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Data Quality Notes */}
          {dataQualityNotes && (
            <Collapsible>
              <CollapsibleTrigger>
                Data Quality Notes
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dataQualityNotes}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Source Attribution */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Source: Open North Synthesis of Risk and Protective Factors (Sept 2025)
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
