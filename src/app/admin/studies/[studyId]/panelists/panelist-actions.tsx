'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mail, Trash2, MoreVertical } from 'lucide-react'
import type { Panelist } from '@prisma/client'

interface PanelistActionsProps {
  panelist: Panelist
  studyName: string
}

export function PanelistActions({ panelist, studyName }: PanelistActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const sendInvite = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/study/${panelist.studyId}/panelists/${panelist.id}/invite`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to send invite')
      }

      alert('Invite sent successfully!')
    } catch (err) {
      alert('Failed to send invite')
    } finally {
      setIsLoading(false)
      setShowMenu(false)
    }
  }

  const removePanelist = async () => {
    if (!confirm(`Remove ${panelist.name || panelist.email} from this study? This will also delete their responses.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/study/${panelist.studyId}/panelists/${panelist.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove panelist')
      }

      router.refresh()
    } catch (err) {
      alert('Failed to remove panelist')
    } finally {
      setIsLoading(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-20">
            <button
              onClick={sendInvite}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
            >
              <Mail className="w-4 h-4" />
              Send Login Link
            </button>
            <button
              onClick={removePanelist}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Remove Panelist
            </button>
          </div>
        </>
      )}
    </div>
  )
}
