'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen, BarChart3, Users, Target, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { DOMAINS } from '@/lib/domains'

// Collapsible card component
function CollapsibleCard({
  title,
  icon,
  children,
  defaultOpen = false,
  className = '',
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className={className}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  )
}

export default function StudyIntroPage() {
  const params = useParams()
  const router = useRouter()
  const studyId = params.studyId as string

  // Domain indicator counts (from your framework)
  const domainData = [
    { code: 'A', name: 'Safe Places to Stay', tier1: 5, tier2: 1, total: 6 },
    { code: 'B', name: 'Getting Where You Need to Go', tier1: 4, tier2: 1, total: 5 },
    { code: 'C', name: 'Health Care That Understands', tier1: 3, tier2: 2, total: 5 },
    { code: 'D', name: 'Protection and Justice', tier1: 3, tier2: 1, total: 4 },
    { code: 'E', name: 'Help When You Need It', tier1: 3, tier2: 1, total: 4 },
    { code: 'F', name: 'Money and Independence', tier1: 2, tier2: 1, total: 3 },
    { code: 'G', name: 'How Systems Work Together', tier1: 4, tier2: 7, total: 11 },
    { code: 'H', name: 'Community Conditions', tier1: 3, tier2: 9, total: 12 },
  ]

  const totalTier1 = domainData.reduce((sum, d) => sum + d.tier1, 0)
  const totalTier2 = domainData.reduce((sum, d) => sum + d.tier2, 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Measuring What Matters
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            A Community-Driven Approach to Understanding GBV Service Capacity in Yukon
          </p>

          {/* Prominent time commitment */}
          <div className="mt-6 inline-flex items-center gap-6 bg-primary/10 px-6 py-4 rounded-lg border-2 border-primary/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45-60</div>
              <div className="text-sm text-muted-foreground">minutes/round</div>
            </div>
            <div className="h-12 w-px bg-primary/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground">rounds total</div>
            </div>
            <div className="h-12 w-px bg-primary/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4-6</div>
              <div className="text-sm text-muted-foreground">weeks duration</div>
            </div>
          </div>
        </div>

        {/* Why This Project Exists - MOVED UP */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why This Project Exists</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Gender-based violence affects people in every community. But measuring whether communities have
              what they need to respond effectively—shelters, transportation, healthcare, justice options,
              economic supports—is harder than it sounds. Standard measurement tools were built for cities.
              They miss what matters in rural, remote, and northern contexts.
            </p>
            <p>
              In the Yukon, a survivor's safety might depend on whether the shelter takes pets, whether there's
              a way to get there without a car, whether services exist in their language, or whether they can
              access help without everyone in town knowing.
            </p>
            <p className="font-medium text-primary">
              This project exists because Yukon communities deserve measurement tools designed for their context,
              not adapted from somewhere else.
            </p>
          </CardContent>
        </Card>

        {/* Why Your Input Matters - MOVED UP */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why Your Input Matters</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>Having a list of indicators is not enough. We need to know:</p>
            <ul>
              <li><strong>Are we measuring the right things?</strong> Some indicators might be theoretically important but practically irrelevant in Yukon.</li>
              <li><strong>Are we measuring them the right way?</strong> An indicator might capture the right concept but be operationalized in a way that doesn't work here.</li>
              <li><strong>Can we actually collect this data?</strong> Some information is easy to gather; some is locked behind privacy barriers or simply doesn't exist.</li>
            </ul>
            <p>
              You're here because you have knowledge we need—whether from research, service delivery, policy work,
              or lived experience navigating these systems. No single perspective is sufficient. The framework will
              be stronger because it reflects multiple ways of knowing.
            </p>
          </CardContent>
        </Card>

        {/* Your Participation & Data Protection - NEW SECTION */}
        <Card className="mb-8 border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-700" />
              Your Participation & Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Where is my data stored?</h4>
                  <p className="text-sm text-muted-foreground">
                    Your responses are stored securely on encrypted servers. Only the research team has access.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Who sees my responses?</h4>
                  <p className="text-sm text-muted-foreground">
                    The research team sees your individual responses. Other panelists only see anonymized, aggregated summaries (medians, themes) with no identifying information.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">How long is data kept?</h4>
                  <p className="text-sm text-muted-foreground">
                    Data will be retained for the duration of the project and archived according to SSHRC requirements. Personal identifiers will be removed from any published findings.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">What if I want to withdraw?</h4>
                  <p className="text-sm text-muted-foreground">
                    You can stop participating at any time. Contact the research team and your data will be removed from analysis unless already included in anonymized summaries.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground border-t pt-3">
              This study has received ethics approval from Yukon University. For questions, contact the research team at the email provided in your invitation.
            </p>
          </CardContent>
        </Card>

        {/* Key Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{totalTier1 + totalTier2}</div>
              <div className="text-sm text-muted-foreground">Total Indicators</div>
              <div className="text-xs mt-1">
                <span className="text-primary font-medium">{totalTier1} Core</span> •
                <span className="text-muted-foreground"> {totalTier2} Extended</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-10 h-10 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">8</div>
              <div className="text-sm text-muted-foreground">Domains</div>
              <div className="text-xs text-muted-foreground mt-1">
                Organized by service area
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Delphi Rounds</div>
              <div className="text-xs text-muted-foreground mt-1">
                To build consensus
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Overview - Collapsible, default open */}
        <CollapsibleCard
          title="Framework Overview: 8 Domains"
          icon={<BookOpen className="w-5 h-5" />}
          defaultOpen={true}
          className="mb-8"
        >
          <div>
            <p className="text-base text-foreground mb-6">
              Each domain addresses a critical aspect of GBV service capacity. You'll assess
              <strong className="text-primary"> {totalTier1} core indicators</strong> (full ratings required) and have the option to
              comment on <strong>{totalTier2} extended indicators</strong>.
            </p>
            <div className="space-y-3">
              {domainData.map((domain) => (
                <div key={domain.code} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{domain.code}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{domain.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {DOMAINS[domain.code as keyof typeof DOMAINS]?.question}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold">{domain.total}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-primary font-medium">{domain.tier1}</span> + {domain.tier2}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong className="text-blue-900">Core Indicators:</strong> <span className="text-blue-700">You'll rate these on priority, validity, and feasibility</span>
                <br />
                <strong className="text-blue-900">Extended Indicators:</strong> <span className="text-blue-700">Optional comments only—important but face data challenges</span>
              </p>
            </div>
          </div>
        </CollapsibleCard>

        {/* How the Delphi Method Works - Collapsible */}
        <CollapsibleCard title="How the Delphi Method Works" className="mb-8">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The Delphi method is a structured approach for building consensus among experts while preserving the value of disagreement.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="font-semibold mb-2 text-primary">Round 1</div>
                <p className="text-sm text-muted-foreground">
                  Independent Assessment—Rate based on your own judgment without seeing others' responses.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-semibold mb-2 text-primary">Rounds 2-3</div>
                <p className="text-sm text-muted-foreground">
                  Informed Revision—See group results, then decide whether to revise or maintain your ratings.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-semibold mb-2 text-primary">Consensus</div>
                <p className="text-sm text-muted-foreground">
                  We look for general agreement (IQR ≤ 1.0), not unanimity. Disagreement is information too.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold mb-2">Preserving Dissent</h4>
              <p className="text-sm">
                If you disagree with emerging consensus, you can <strong>flag principled dissent</strong>.
                Your reasoning will be preserved (anonymized) in the final report. This ensures important
                perspectives—especially from lived experience—aren't smoothed away.
              </p>
            </div>
          </div>
        </CollapsibleCard>

        {/* What You're Rating - Collapsible */}
        <CollapsibleCard title="What You're Rating" className="mb-8">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For each core indicator, you'll assess three dimensions on a 3-point scale:
            </p>

            <div className="space-y-4">
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50/50">
                <h4 className="font-semibold mb-1">Priority (Low/Medium/High)</h4>
                <p className="text-sm text-muted-foreground">
                  How important is this indicator for measuring GBV service capacity?
                </p>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50/50">
                <h4 className="font-semibold mb-1">Validity (Low/Medium/High)</h4>
                <p className="text-sm text-muted-foreground">
                  Does the operationalization actually measure what we intend?
                </p>
              </div>

              <div className="p-4 border-l-4 border-purple-500 bg-purple-50/50">
                <h4 className="font-semibold mb-1">Feasibility (Low/Medium/High)</h4>
                <p className="text-sm text-muted-foreground">
                  How realistic is data collection in Yukon communities?
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>"Unsure" Option:</strong> Available for each dimension if you lack
                  sufficient information to assess. These responses are excluded from group statistics.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* Measurement Justice Note - Collapsible */}
        <CollapsibleCard title="A Note on Measurement Justice" className="mb-8 border-primary/20 bg-primary/5">
          <div className="prose prose-sm max-w-none">
            <p>
              Measurement is not neutral. What we choose to count shapes what gets attention and resources.
              Who decides what to count shapes whose priorities are centered.
            </p>
            <p>
              This project is grounded in principles of <strong>measurement justice</strong>:
            </p>
            <ul className="text-sm">
              <li><strong>Community agency</strong>: Framework serves Yukon communities</li>
              <li><strong>Diverse ways of knowing</strong>: Lived experience is expertise</li>
              <li><strong>Transparency</strong>: Development and validation are visible</li>
              <li><strong>Dissent preservation</strong>: Minority perspectives have value</li>
            </ul>
          </div>
        </CollapsibleCard>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => router.push(`/study/${studyId}`)}
          >
            Begin Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Your progress saves automatically • You can return anytime
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
          <p>
            <strong>Yukon University + Yukon Status of Women Council</strong>
          </p>
          <p className="mt-1">
            SSHRC funded • In partnership with Boreal Logic Inc.
          </p>
          <p className="mt-2 text-xs">
            Framework developed through systematic literature review incorporating 60+ sources
            focused on rural, remote, and northern contexts.
          </p>
        </div>
      </div>
    </main>
  )
}
