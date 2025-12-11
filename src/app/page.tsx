import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db'

export default async function HomePage() {
  // Get the single study (should always exist after seed)
  const study = await prisma.study.findFirst({
    include: {
      _count: {
        select: {
          indicators: true,
          panelists: true,
        },
      },
    },
  })

  // If no study exists, redirect to admin to run seed
  if (!study) {
    redirect('/admin')
  }

  const statusColor = {
    ACTIVE: 'bg-green-100 text-green-800',
    SETUP: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-amber-100 text-amber-800',
    COMPLETE: 'bg-gray-100 text-gray-800',
  }[study.status]

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Yukon Women's Coalition</CardTitle>
            <CardDescription className="text-base mt-2">
              GBV Indicators Framework Validation Study
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{study.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                  {study.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {study._count.indicators} indicators • {study._count.panelists} panelists • Round {study.currentRound} of {study.totalRounds}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/study/${study.id}`}>
                <Button className="w-full" size="lg">
                  Enter Assessment Panel
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="w-full" size="lg" variant="outline">
                  Facilitator Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Yukon Women's Coalition • Boreal Logic Inc.</p>
          <p className="text-xs mt-1">Delphi Method Application</p>
        </div>
      </div>
    </main>
  )
}
