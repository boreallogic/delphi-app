import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            GBV Indicators Delphi Study
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Yukon Women's Coalition Indicator Framework
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            This application facilitates expert consensus on gender-based violence 
            indicators for rural, remote, and northern communities.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full" size="lg">
                Panelist Login
              </Button>
            </Link>
            
            <Link href="/admin" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Facilitator Dashboard
              </Button>
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-4 border-t">
            Powered by Boreal Logic Inc.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
