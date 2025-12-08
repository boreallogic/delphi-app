'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  studyId: string
}

export function ExportButton({ studyId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    setShowMenu(false)

    try {
      const response = await fetch(`/api/study/${studyId}/export?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `delphi-results-${studyId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err) {
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-20">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
            >
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
            >
              Export as JSON
            </button>
          </div>
        </>
      )}
    </div>
  )
}
