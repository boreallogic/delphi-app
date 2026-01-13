'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Eye, Languages } from 'lucide-react'

interface PanelistPreferencesProps {
  preferences: {
    plainLanguage?: boolean
    showTier2?: boolean
    highContrast?: boolean
  }
  onUpdate: (prefs: Record<string, boolean>) => void
}

export function PanelistPreferences({ preferences, onUpdate }: PanelistPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localPrefs, setLocalPrefs] = useState(preferences)

  const handleToggle = (key: string) => {
    const updated = { ...localPrefs, [key]: !localPrefs[key as keyof typeof localPrefs] }
    setLocalPrefs(updated)
    onUpdate(updated)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Settings className="w-4 h-4" />
        Display Settings
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop to close dropdown when clicking outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
      />

      <Card className="absolute right-0 top-full mt-2 z-50 w-72 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Display Settings</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Plain Language Toggle */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={localPrefs.plainLanguage || false}
            onChange={() => handleToggle('plainLanguage')}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <Languages className="w-4 h-4" />
              Plain Language Mode
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Show simplified definitions that are easier to understand
            </p>
          </div>
        </label>

        {/* Show Tier 2 Toggle */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={localPrefs.showTier2 || false}
            onChange={() => handleToggle('showTier2')}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <Eye className="w-4 h-4" />
              Show Extended Indicators
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              View extended indicators (comment only, no rating required)
            </p>
          </div>
        </label>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p><strong>Core:</strong> 27 indicators you'll rate</p>
          <p><strong>Extended:</strong> 23 indicators for optional comments</p>
        </div>
      </CardContent>
    </Card>
    </>
  )
}

// Tier badge component
export function TierBadge({ tier }: { tier: 1 | 2 }) {
  if (tier === 1) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
        Core
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
      Extended
    </span>
  )
}

// Domain badge with color
export function DomainBadge({ 
  code, 
  name, 
  color 
}: { 
  code: string
  name: string
  color?: string 
}) {
  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ 
        backgroundColor: color ? `${color}20` : undefined,
        color: color || undefined,
      }}
    >
      {code}: {name}
    </span>
  )
}
