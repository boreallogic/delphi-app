/**
 * Domain Configuration for GBV Indicators Framework
 * 
 * Consolidated from 11 original domains to 8 domains with plain language names.
 */

export interface DomainConfig {
  code: string
  name: string
  namePlain: string
  question: string
  color: string
  originalDomains: string[]
}

export const DOMAINS: Record<string, DomainConfig> = {
  A: {
    code: 'A',
    name: 'Safe Places to Stay',
    namePlain: 'Housing & Shelter',
    question: 'Can survivors access emergency and transitional housing?',
    color: 'hsl(262, 83%, 58%)', // Purple
    originalDomains: ['D1: Shelter Infrastructure', 'D2: Housing Access'],
  },
  B: {
    code: 'B',
    name: 'Getting Where You Need to Go',
    namePlain: 'Transportation',
    question: 'Can survivors travel to services safely?',
    color: 'hsl(221, 83%, 53%)', // Blue
    originalDomains: ['D3: Transportation'],
  },
  C: {
    code: 'C',
    name: 'Health Care That Understands',
    namePlain: 'Healthcare',
    question: 'Do healthcare providers recognize and respond to GBV?',
    color: 'hsl(142, 71%, 45%)', // Green
    originalDomains: ['D4: Healthcare Response'],
  },
  D: {
    code: 'D',
    name: 'Protection and Justice',
    namePlain: 'Legal & Justice',
    question: 'Can survivors access legal protection and support?',
    color: 'hsl(25, 95%, 53%)', // Orange
    originalDomains: ['D5: Legal/Justice Access'],
  },
  E: {
    code: 'E',
    name: 'Help When You Need It',
    namePlain: 'Support Services',
    question: 'Are crisis and counselling services available?',
    color: 'hsl(340, 82%, 52%)', // Pink
    originalDomains: ['D6: Support Services'],
  },
  F: {
    code: 'F',
    name: 'Money and Independence',
    namePlain: 'Economic Security',
    question: 'Can survivors access money and resources to leave?',
    color: 'hsl(45, 93%, 47%)', // Amber
    originalDomains: ['D7: Economic Security'],
  },
  G: {
    code: 'G',
    name: 'How Systems Work Together',
    namePlain: 'Policy & Workforce',
    question: 'Do organizations have policies that protect survivors?',
    color: 'hsl(199, 89%, 48%)', // Cyan
    originalDomains: ['D8: Policy Infrastructure', 'D9: Workforce Capacity'],
  },
  H: {
    code: 'H',
    name: 'Community Conditions',
    namePlain: 'Context & Prevention',
    question: 'How does the broader context affect survivor safety?',
    color: 'hsl(271, 81%, 56%)', // Violet
    originalDomains: ['D10: Prevention Systems', 'D11: Geographic Context'],
  },
}

// Map original domain strings to consolidated codes
export const DOMAIN_MAPPING: Record<string, string> = {
  'D1: Shelter Infrastructure': 'A',
  'D2: Housing Access': 'A',
  'D3: Transportation': 'B',
  'D4: Healthcare Response': 'C',
  'D5: Legal/Justice Access': 'D',
  'D6: Support Services': 'E',
  'D7: Economic Security': 'F',
  'D8: Policy Infrastructure': 'G',
  'D9: Workforce Capacity': 'G',
  'D10: Prevention Systems': 'H',
  'D11: Geographic Context': 'H',
}

// Get domain config from original domain string
export function getDomainConfig(originalDomain: string): DomainConfig {
  const code = DOMAIN_MAPPING[originalDomain] || 'A'
  return DOMAINS[code]
}

// Tier 1 indicator IDs (core framework - 27 indicators)
export const TIER_1_INDICATORS = new Set([
  'SH01', 'SH02', 'SH03', 'SH04', 'SH05',  // Safe Places to Stay
  'TR01', 'TR02', 'TR03', 'TR04',           // Getting Where You Need to Go
  'HC01', 'HC03', 'HC04',                   // Health Care That Understands
  'LJ01', 'LJ02', 'LJ03', 'LJ04',           // Protection and Justice
  'SS01', 'SS02', 'SS03', 'SS04', 'SQ02', 'SQ03',  // Help When You Need It
  'EC01', 'EC02',                           // Money and Independence
  'PL01', 'PL07',                           // How Systems Work Together
])

// Determine tier based on indicator ID
export function getIndicatorTier(externalId: string): 1 | 2 {
  return TIER_1_INDICATORS.has(externalId) ? 1 : 2
}

// Rating scale labels
export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Not important — could be dropped',
  2: 'Slightly important — nice to have',
  3: 'Moderately important — useful but not essential',
  4: 'Very important — should definitely include',
  5: 'Essential — framework would be incomplete without it',
}

export const VALIDITY_LABELS: Record<number, string> = {
  1: 'Not valid — measures the wrong thing',
  2: 'Somewhat valid — captures part of the concept',
  3: 'Moderately valid — reasonable approximation',
  4: 'Very valid — captures the concept well',
  5: 'Highly valid — excellent measurement approach',
}

export const FEASIBILITY_LABELS: Record<number, string> = {
  1: 'Not feasible — data doesn\'t exist and can\'t be created',
  2: 'Difficult — major barriers to collection',
  3: 'Moderately feasible — some challenges but doable',
  4: 'Feasible — straightforward to collect',
  5: 'Easily feasible — data already exists and is accessible',
}

// Summary for UI
export const FRAMEWORK_SUMMARY = {
  totalIndicators: 50,
  tier1Count: 27,
  tier2Count: 23,
  domainCount: 8,
  originalDomainCount: 11,
}
