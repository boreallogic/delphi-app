import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db'

export default async function HomePage() {
  // Get existing studies for quick access
  const studies = await prisma.study.findMany({
    include: {
      _count: {
        select: {
          indicators: true,
          panelists: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Delphi Method Application</CardTitle>
            <CardDescription>
              GBV Indicators Framework Validation Study
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin">
              <Button className="w-full" size="lg">
                Facilitator Dashboard
              </Button>
            </Link>
            <Link href="/admin/studies/new">
              <Button className="w-full" size="lg" variant="outline">
                Create New Study
              </Button>
            </Link>
          </CardContent>
        </Card>

        {studies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Studies</CardTitle>
              <CardDescription>
                Click to view any study (authentication disabled for testing)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {studies.map((study) => (
                <Link key={study.id} href={`/study/${study.id}`}>
                  <div className="p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{study.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {study._count.indicators} indicators • {study._count.panelists} panelists
                        </p>
                      </div>
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${study.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                        ${study.status === 'SETUP' ? 'bg-blue-100 text-blue-800' : ''}
                        ${study.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : ''}
                        ${study.status === 'COMPLETE' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {study.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Yukon Women's Coalition • Boreal Logic Inc.</p>
        </div>
      </div>
    </main>
  )
}
