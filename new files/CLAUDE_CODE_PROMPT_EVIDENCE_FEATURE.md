# Claude Code Prompt: Evidence Tooltip Feature for Delphi App

## Context

You're working on a Next.js 14 Delphi method application for GBV indicator validation. The app allows panelists to rate indicators on priority, validity, and feasibility. 

We need to add an interactive "Evidence Base" feature that shows panelists the research backing each indicator when they hover over or click an info icon.

## Files to Reference

1. **Evidence data**: `/home/claude/delphi-app/data/indicator_evidence.json`
   - Contains evidence for all 50 indicators
   - Structure: `{ indicators: { [ID]: { evidence_summary, risk_factors[], protective_factors[], key_citations[], data_quality_notes, rrn_relevance } } }`

2. **Current indicator display**: `/home/claude/delphi-app/src/app/study/[studyId]/indicator-assessment.tsx`
   - This is where the evidence tooltip should be integrated

3. **Prisma schema**: `/home/claude/delphi-app/prisma/schema.prisma`
   - Indicator model needs new fields for evidence data

## Requirements

### 1. Schema Update

Add these fields to the Indicator model in `schema.prisma`:

```prisma
model Indicator {
  // ... existing fields ...
  
  // Evidence base
  evidenceSummary    String?  @db.Text  // Brief summary of evidence
  riskFactors        Json?    // Array of risk factors from literature
  protectiveFactors  Json?    // Array of protective factors
  keyCitations       Json?    // Array of key citation strings
  dataQualityNotes   String?  @db.Text  // Notes on data reliability
  rrnRelevance       String?  // HIGH, MEDIUM, LOW, CRITICAL
}
```

### 2. Evidence Tooltip Component

Create `/home/claude/delphi-app/src/components/evidence-tooltip.tsx`:

Requirements:
- Trigger: Info icon (ℹ️) next to indicator name
- Interaction: Click to open popover (better for mobile), hover to preview
- Content sections:
  1. **Evidence Summary** - 1-2 sentence summary (always visible)
  2. **Risk Factors** - Collapsible list with citations
  3. **Protective Factors** - Collapsible list with citations
  4. **Key Citations** - Linked if URLs available
  5. **RRN Relevance** - Badge showing CRITICAL/HIGH/MEDIUM/LOW
  6. **Data Quality Notes** - Collapsible

- Styling:
  - Max width: 400px
  - Max height: 60vh with scroll
  - Dark mode compatible
  - Close button for mobile

Example UI structure:
```tsx
<Popover>
  <PopoverTrigger asChild>
    <button className="text-muted-foreground hover:text-primary">
      <Info className="w-4 h-4" />
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-96 max-h-[60vh] overflow-y-auto">
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-sm">Evidence Base</h4>
        <p className="text-sm text-muted-foreground">{evidenceSummary}</p>
      </div>
      
      <div>
        <Badge variant={rrnRelevanceVariant}>{rrnRelevance} RRN Relevance</Badge>
      </div>
      
      <Collapsible>
        <CollapsibleTrigger>Risk Factors ({riskFactors.length})</CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="text-sm space-y-1">
            {riskFactors.map(factor => <li key={factor}>{factor}</li>)}
          </ul>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Similar for protective factors, citations */}
      
      <Collapsible>
        <CollapsibleTrigger>Data Quality Notes</CollapsibleTrigger>
        <CollapsibleContent>
          <p className="text-sm text-muted-foreground">{dataQualityNotes}</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </PopoverContent>
</Popover>
```

### 3. Integration in Indicator Assessment

In `/home/claude/delphi-app/src/app/study/[studyId]/indicator-assessment.tsx`:

Add the evidence tooltip next to the indicator name:

```tsx
<CardTitle className="text-xl flex items-center gap-2">
  {indicator.name}
  {indicator.evidenceSummary && (
    <EvidenceTooltip
      summary={indicator.evidenceSummary}
      riskFactors={indicator.riskFactors as string[]}
      protectiveFactors={indicator.protectiveFactors as string[]}
      citations={indicator.keyCitations as string[]}
      dataQualityNotes={indicator.dataQualityNotes}
      rrnRelevance={indicator.rrnRelevance}
    />
  )}
</CardTitle>
```

### 4. Import Script

Create `/home/claude/delphi-app/scripts/import-evidence.ts`:

Script to populate evidence fields from the JSON file:

```typescript
import { PrismaClient } from '@prisma/client'
import evidenceData from '../data/indicator_evidence.json'

const prisma = new PrismaClient()

async function importEvidence() {
  const { indicators } = evidenceData
  
  for (const [externalId, evidence] of Object.entries(indicators)) {
    await prisma.indicator.updateMany({
      where: { externalId },
      data: {
        evidenceSummary: evidence.evidence_summary,
        riskFactors: evidence.risk_factors,
        protectiveFactors: evidence.protective_factors,
        keyCitations: evidence.key_citations,
        dataQualityNotes: evidence.data_quality_notes,
        rrnRelevance: evidence.rrn_relevance,
      },
    })
    console.log(`Updated evidence for ${externalId}`)
  }
}

importEvidence()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### 5. Collapsible Components

If not already available, create shadcn-style collapsible:

```tsx
// /home/claude/delphi-app/src/components/ui/collapsible.tsx
'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      "flex items-center justify-between w-full py-2 text-sm font-medium",
      "[&[data-state=open]>svg]:rotate-180",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
  </CollapsiblePrimitive.Trigger>
))
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </CollapsiblePrimitive.Content>
))
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```

### 6. Popover Component

```tsx
// /home/claude/delphi-app/src/components/ui/popover.tsx
'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

## Dependencies to Add

```bash
npm install @radix-ui/react-collapsible @radix-ui/react-popover
```

## Testing Checklist

- [ ] Schema migration runs without errors
- [ ] Evidence import script populates all indicators
- [ ] Tooltip opens on click
- [ ] Tooltip shows preview on hover (desktop)
- [ ] Collapsible sections expand/collapse
- [ ] Scroll works within tooltip for long content
- [ ] Mobile: Close button works
- [ ] Dark mode styling correct
- [ ] RRN relevance badge colors correct (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=gray)

## Optional Enhancements

1. **Citation links**: If citation includes URL, make it clickable
2. **Copy citation**: Button to copy citation list to clipboard
3. **Filter by RRN relevance**: Allow filtering indicators by relevance level in dashboard
4. **Evidence completeness badge**: Show if indicator has full evidence vs. partial

## Notes

- Evidence data is static and loaded at build time via the import script
- No real-time updates needed - evidence doesn't change during study
- Tooltip should be accessible (keyboard navigation, screen reader support)
- Consider lazy loading the popover content for performance
