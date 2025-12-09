'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function PanelistGuidePage() {
  const params = useParams()
  const router = useRouter()
  const studyId = params.studyId as string

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Panelist Guide</h1>
              <p className="text-muted-foreground">
                Understanding the GBV Indicators Framework
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/study/${studyId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Study
          </Button>
        </div>

        {/* Guide Content */}
        <div className="space-y-6">
          {/* What We're Asking */}
          <Card>
            <CardHeader>
              <CardTitle>What We're Asking You To Do</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We've developed a framework of indicators to measure GBV service capacity
                across Yukon communities. Your role is to help us:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>Prioritize</strong> which indicators matter most</li>
                <li><strong>Validate</strong> whether our measurement approaches make sense</li>
                <li><strong>Assess</strong> how feasible data collection will be</li>
              </ol>
              <p>
                Your expertise—whether from research, service delivery, policy work, or lived
                experience—is essential for creating a framework that actually works in northern,
                rural, and remote contexts.
              </p>
            </CardContent>
          </Card>

          {/* Framework Organization */}
          <Card>
            <CardHeader>
              <CardTitle>How The Framework Is Organized</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Two Tiers */}
              <div>
                <h3 className="font-semibold mb-3">Two Tiers of Indicators</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We've organized the 50 indicators into two tiers to make your task manageable:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        Tier 1: Core
                      </span>
                      <span className="text-sm font-semibold">27 indicators</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Your Task:</strong> Full assessment (priority, validity, feasibility)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      These indicators have strong data sources and are ready to implement
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        Tier 2: Extended
                      </span>
                      <span className="text-sm font-semibold">23 indicators</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Your Task:</strong> Optional comments only
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Important but face data challenges; preserved for future development
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  You'll only rate Tier 1 indicators. Tier 2 indicators are shown for context.
                </p>
              </div>

              {/* Eight Domains */}
              <div>
                <h3 className="font-semibold mb-3">Eight Domains</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We've consolidated the indicators into 8 domains with plain-language names:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">A</span>
                    <div>
                      <strong>Safe Places to Stay</strong>
                      <p className="text-muted-foreground">Can survivors access emergency and transitional housing?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">B</span>
                    <div>
                      <strong>Getting Where You Need to Go</strong>
                      <p className="text-muted-foreground">Can survivors travel to services safely?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">C</span>
                    <div>
                      <strong>Health Care That Understands</strong>
                      <p className="text-muted-foreground">Do healthcare providers recognize and respond to GBV?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">D</span>
                    <div>
                      <strong>Protection and Justice</strong>
                      <p className="text-muted-foreground">Can survivors access legal protection and support?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">E</span>
                    <div>
                      <strong>Help When You Need It</strong>
                      <p className="text-muted-foreground">Are crisis and counselling services available?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">F</span>
                    <div>
                      <strong>Money and Independence</strong>
                      <p className="text-muted-foreground">Can survivors access money and resources to leave?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">G</span>
                    <div>
                      <strong>How Systems Work Together</strong>
                      <p className="text-muted-foreground">Do organizations have policies that protect survivors?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <span className="font-mono font-bold text-primary">H</span>
                    <div>
                      <strong>Community Conditions</strong>
                      <p className="text-muted-foreground">How does the broader context affect survivor safety?</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Scales */}
          <Card>
            <CardHeader>
              <CardTitle>The Rating Scales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                For each Tier 1 indicator, you'll provide three ratings:
              </p>

              <div>
                <h3 className="font-semibold mb-2">1. Priority (1-5)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  How important is this indicator for measuring GBV service capacity in Yukon?
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex gap-2"><span className="font-mono">1</span> Not important — could be dropped</div>
                  <div className="flex gap-2"><span className="font-mono">2</span> Slightly important — nice to have</div>
                  <div className="flex gap-2"><span className="font-mono">3</span> Moderately important — useful but not essential</div>
                  <div className="flex gap-2"><span className="font-mono">4</span> Very important — should definitely include</div>
                  <div className="flex gap-2"><span className="font-mono">5</span> Essential — framework would be incomplete without it</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Validity (1-5)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Does the operationalization actually measure what we're trying to measure?
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex gap-2"><span className="font-mono">1</span> Not valid — measures the wrong thing</div>
                  <div className="flex gap-2"><span className="font-mono">2</span> Somewhat valid — captures part of the concept</div>
                  <div className="flex gap-2"><span className="font-mono">3</span> Moderately valid — reasonable approximation</div>
                  <div className="flex gap-2"><span className="font-mono">4</span> Very valid — captures the concept well</div>
                  <div className="flex gap-2"><span className="font-mono">5</span> Highly valid — excellent measurement approach</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Feasibility (1-5)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  How realistic is data collection for this indicator in Yukon communities?
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex gap-2"><span className="font-mono">1</span> Not feasible — data doesn't exist and can't be created</div>
                  <div className="flex gap-2"><span className="font-mono">2</span> Difficult — major barriers to collection</div>
                  <div className="flex gap-2"><span className="font-mono">3</span> Moderately feasible — some challenges but doable</div>
                  <div className="flex gap-2"><span className="font-mono">4</span> Feasible — straightforward to collect</div>
                  <div className="flex gap-2"><span className="font-mono">5</span> Easily feasible — data already exists and is accessible</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How Rounds Work */}
          <Card>
            <CardHeader>
              <CardTitle>How Rounds Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Round 1</h3>
                <p className="text-sm text-muted-foreground">
                  Rate each Tier 1 indicator based on your own judgment. Don't worry about what others think.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rounds 2-3</h3>
                <p className="text-sm text-muted-foreground mb-2">You'll see:</p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                  <li>Your previous ratings</li>
                  <li>The group's median and spread (IQR)</li>
                  <li>Anonymized themes from other panelists' reasoning</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  You can revise your ratings if you're persuaded, or keep them and flag dissent if you're not.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Consensus</h3>
                <p className="text-sm text-muted-foreground">
                  We'll consider consensus reached when the interquartile range (IQR) is ≤ 1.0 on the
                  5-point scale. This means 50% of panelists are within 1 point of each other.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips for Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-6 space-y-2 text-sm">
                <li><strong>Consider the northern context</strong> — What works in urban centres may not work here</li>
                <li><strong>Think about data burden</strong> — More indicators isn't better if they can't be sustained</li>
                <li><strong>Imagine using the results</strong> — Would this indicator help a community advocate for resources?</li>
                <li><strong>Draw on your expertise</strong> — Your specific knowledge is why you were invited</li>
                <li><strong>Be honest about uncertainty</strong> — "I don't know" is valuable information</li>
              </ol>
            </CardContent>
          </Card>

          {/* Time Commitment */}
          <Card>
            <CardHeader>
              <CardTitle>Time Commitment</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li><strong>Per round:</strong> 45-60 minutes for 27 indicators</li>
                <li><strong>Total:</strong> 3 rounds over approximately 4-6 weeks</li>
                <li><strong>Format:</strong> Complete at your own pace before each deadline</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            This framework was developed by the Yukon Women's Coalition with support from Boreal Logic Inc.
            The Delphi validation process follows measurement justice principles that center community agency
            and preserve diverse perspectives.
          </p>
        </div>
      </div>
    </main>
  )
}
