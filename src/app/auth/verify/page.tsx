'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('No verification token provided')
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed')
        }

        setStatus('success')
        
        // Redirect to study after brief success message
        setTimeout(() => {
          router.push(`/study/${data.studyId}`)
        }, 1500)

      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verifyToken()
  }, [token, router])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying...</CardTitle>
            <CardDescription>Please wait while we verify your login link</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Verification Failed</CardTitle>
            <CardDescription className="text-base mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              This link may have expired or already been used. 
              Please request a new login link.
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push('/auth/login')}
            >
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Login Successful</CardTitle>
          <CardDescription className="text-base mt-2">
            Redirecting to your study...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </main>
    }>
      <VerifyContent />
    </Suspense>
  )
}
