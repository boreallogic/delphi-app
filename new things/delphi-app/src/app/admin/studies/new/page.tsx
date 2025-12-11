'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea, Label } from '@/components/ui/form-elements'
import { Upload, FileText, AlertCircle, Check } from 'lucide-react'

interface ParsedIndicator {
  externalId: string
  category: string
  name: string
  definition: string
  unitOfMeasure: string
  operationalization: string
  collectionFrequency: string
  originalPriority: string
  notes: string
  domain: string
}

export default function NewStudyPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalRounds, setTotalRounds] = useState(3)
  const [consensusThreshold, setConsensusThreshold] = useState(1.0)
  
  const [indicators, setIndicators] = useState<ParsedIndicator[]>([])
  const [csvError, setCsvError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvError('')
    
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

      // Map expected columns
      const columnMap: Record<string, number> = {}
      const expectedColumns = [
        'id', 'category', 'indicator name', 'definition', 'unit of measure',
        'operationalization', 'collection frequency', 'priority', 'notes/edge cases', 'domain'
      ]

      expectedColumns.forEach(col => {
        const index = headers.findIndex(h => 
          h.includes(col.toLowerCase()) || col.toLowerCase().includes(h)
        )
        if (index !== -1) {
          columnMap[col] = index
        }
      })

      // Parse rows
      const parsed: ParsedIndicator[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Handle CSV with quotes
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        const getValue = (col: string) => {
          const idx = columnMap[col]
          return idx !== undefined ? values[idx] || '' : ''
        }

        const indicator: ParsedIndicator = {
          externalId: getValue('id'),
          category: getValue('category'),
          name: getValue('indicator name'),
          definition: getValue('definition'),
          unitOfMeasure: getValue('unit of measure'),
          operationalization: getValue('operationalization'),
          collectionFrequency: getValue('collection frequency'),
          originalPriority: getValue('priority'),
          notes: getValue('notes/edge cases'),
          domain: getValue('domain'),
        }

        if (indicator.externalId && indicator.name) {
          parsed.push(indicator)
        }
      }

      if (parsed.length === 0) {
        setCsvError('No valid indicators found in CSV. Please check the format.')
        return
      }

      setIndicators(parsed)
    } catch (err) {
      setCsvError('Failed to parse CSV file. Please check the format.')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          totalRounds,
          consensusThreshold,
          indicators,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create study')
      }

      const study = await response.json()
      router.push(`/admin/studies/${study.id}`)

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const domains = [...new Set(indicators.map(i => i.domain))].filter(Boolean)

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Create New Study</h1>
        <p className="text-muted-foreground mb-8">
          Set up a new Delphi study for indicator validation
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Study Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., YWC GBV Indicators Validation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the study purpose and scope"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rounds">Number of Rounds</Label>
                  <Input
                    id="rounds"
                    type="number"
                    min={2}
                    max={5}
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Typically 2-3 rounds
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Consensus Threshold (IQR)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    step={0.1}
                    min={0.5}
                    max={2}
                    value={consensusThreshold}
                    onChange={(e) => setConsensusThreshold(parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    IQR ≤ this value = consensus reached
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicator import */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Indicators</CardTitle>
              <CardDescription>
                Upload a CSV file with your indicator definitions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="font-medium">Upload CSV file</span>
                  <span className="text-sm text-muted-foreground">
                    Click to browse or drag and drop
                  </span>
                </label>
              </div>

              {csvError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {csvError}
                </div>
              )}

              {indicators.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">
                      {indicators.length} indicators loaded
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <strong>Domains found:</strong>
                    <ul className="mt-1 space-y-1">
                      {domains.map(domain => (
                        <li key={domain} className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {domain} ({indicators.filter(i => i.domain === domain).length} indicators)
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preview first few indicators */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="max-h-48 overflow-y-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left">ID</th>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicators.slice(0, 10).map((ind) => (
                            <tr key={ind.externalId} className="border-t">
                              <td className="px-2 py-1 font-mono text-xs">{ind.externalId}</td>
                              <td className="px-2 py-1">{ind.name}</td>
                              <td className="px-2 py-1">{ind.originalPriority}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {indicators.length > 10 && (
                        <p className="text-xs text-muted-foreground p-2 bg-muted">
                          ...and {indicators.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <strong>Expected CSV columns:</strong> ID, Category, Indicator Name, Definition, 
                Unit of Measure, Operationalization, Collection Frequency, Priority, Notes/Edge Cases, Domain
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name || indicators.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Study'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
