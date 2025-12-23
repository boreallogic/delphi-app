'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/form-elements'
import { AlertCircle, Check } from 'lucide-react'
import { roleDisplayNames } from '@/lib/utils'

interface AddPanelistFormProps {
  studyId: string
}

export function AddPanelistForm({ studyId }: AddPanelistFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [roleType, setRoleType] = useState('EXPERT_GBV')
  const [secondaryRole, setSecondaryRole] = useState<string>('')
  const [expertiseArea, setExpertiseArea] = useState('')
  const [jurisdictionContext, setJurisdictionContext] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/study/${studyId}/panelists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          primaryRole: roleType,
          secondaryRole: secondaryRole || null,
          expertiseArea: expertiseArea || null,
          jurisdictionContext: jurisdictionContext || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add panelist')
      }

      setSuccess(true)
      setEmail('')
      setName('')
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="panelist@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Primary Role *</Label>
        <select
          id="role"
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {Object.entries(roleDisplayNames).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Primary role is used for role-stratified analysis
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="secondary-role">Secondary Role (Optional)</Label>
        <select
          id="secondary-role"
          value={secondaryRole}
          onChange={(e) => setSecondaryRole(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">None</option>
          {Object.entries(roleDisplayNames).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Shown in profile but not used in statistics
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expertise">Area of Expertise (Optional)</Label>
        <Input
          id="expertise"
          type="text"
          value={expertiseArea}
          onChange={(e) => setExpertiseArea(e.target.value)}
          placeholder="e.g., Psychometrics, Rural Health Systems"
        />
        <p className="text-xs text-muted-foreground">
          Specific area of expertise relevant to this study
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jurisdiction">Jurisdictional Context (Optional)</Label>
        <select
          id="jurisdiction"
          value={jurisdictionContext}
          onChange={(e) => setJurisdictionContext(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Not specified</option>
          <option value="LARGE">Large jurisdiction (urban centers, large municipalities)</option>
          <option value="SMALL">Small jurisdiction (remote, rural, small communities)</option>
          <option value="BOTH">Experience in both contexts</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Helps understand if expertise is specific to large or small community contexts
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="w-4 h-4" />
          Panelist added successfully
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting || !email}
      >
        {isSubmitting ? 'Adding...' : 'Add Panelist'}
      </Button>

      <p className="text-xs text-muted-foreground">
        The panelist will receive a login link via email when the study begins or when you send an invite.
      </p>
    </form>
  )
}
