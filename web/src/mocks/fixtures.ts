import {
  BusinessProfile,
  Lead,
  Fact,
  Draft,
  TrustReport,
  PolicyResult,
  TraceEvent,
  ReplyAnalysis,
  CampaignReport,
  AgentDefinition,
} from '../api/types';

export const SAMPLE_BUSINESSES: BusinessProfile[] = [
  {
    id: 'saas',
    name: 'CloudPulse Systems',
    industry: 'B2B Enterprise SaaS',
    offerings: ['Cloud Cost Optimization', 'Automated FinOps Telemetry', 'Multi-Cloud Governance Platform'],
    ideal_customer: 'VP of Infrastructure and CTOs at high-growth engineering firms spending $50k+/mo on AWS/GCP.',
    tone: 'Authoritative, consultative, metrics-oriented, calm and precise',
    channels: ['email', 'linkedin'],
    anti_spam: {
      max_contacts_per_week: 3,
      quiet_hours: '20:00 - 08:00',
      opt_out_list: ['unsub-ops@acme.corp', 'security-gate@enterprise.net'],
    },
    enabled_agents: ['atlas', 'scout', 'cadence', 'quill', 'veritas', 'warden', 'courier', 'echo', 'sage'],
    documents: [
      { id: 'doc-1', title: 'CloudPulse Master Pricing & Tier Matrix 2026.pdf', type: 'PDF', size: '2.4 MB' },
      { id: 'doc-2', title: 'SOC 2 Type II & ISO 27001 Compliance Brief.pdf', type: 'PDF', size: '1.8 MB' },
      { id: 'doc-3', title: 'SLA Warranties & Production Integration Standards.md', type: 'MD', size: '420 KB' },
    ],
  },
  {
    id: 'ecommerce',
    name: 'Aura Living',
    industry: 'Sustainable Consumer Goods & Retail',
    offerings: ['Zero-Waste Home Essentials', 'Regenerative Cotton Linens', 'Closed-Loop Circular Packaging'],
    ideal_customer: 'Boutique hospitality buyers and eco-conscious lifestyle retailers seeking bulk procurement.',
    tone: 'Warm, refined, transparent, quiet luxury without hyperbole',
    channels: ['email'],
    anti_spam: {
      max_contacts_per_week: 2,
      quiet_hours: '19:00 - 09:00',
      opt_out_list: ['procurement-donotcontact@resorts.io'],
    },
    enabled_agents: ['atlas', 'scout', 'cadence', 'quill', 'veritas', 'warden', 'courier'],
    documents: [
      { id: 'doc-4', title: 'Global Organic Textile Standard (GOTS) Cert.pdf', type: 'PDF', size: '3.1 MB' },
      { id: 'doc-5', title: 'Wholesale Unit Margins & Minimum Order Qty.xlsx', type: 'XLSX', size: '890 KB' },
    ],
  },
  {
    id: 'local_services',
    name: 'Apex Commercial HVAC',
    industry: 'Commercial Facility Engineering',
    offerings: ['Chiller Plant Retrofits', 'ASHRAE 90.1 Compliance Audits', 'Predictive Air Filtration Systems'],
    ideal_customer: 'Property Asset Managers and Chief Engineers of Class-A commercial towers in metro areas.',
    tone: 'Technical, dependable, safety-first, rigorously compliant',
    channels: ['email', 'phone'],
    anti_spam: {
      max_contacts_per_week: 2,
      quiet_hours: '18:00 - 07:30',
      opt_out_list: ['facilities@blockreit.com'],
    },
    enabled_agents: ['atlas', 'scout', 'cadence', 'quill', 'veritas', 'warden', 'courier', 'echo', 'sage'],
    documents: [
      { id: 'doc-6', title: 'Master Mechanical Contractor License & Union Bond.pdf', type: 'PDF', size: '1.2 MB' },
      { id: 'doc-7', title: 'Emergency Dispatch & Response Guarantee Guidelines.pdf', type: 'PDF', size: '640 KB' },
    ],
  },
];

export const SAMPLE_LEADS: Record<string, Lead> = {
  lead_flawed: {
    id: 'lead-0824',
    name: 'Elena Rostova',
    company: 'Starlight Financial Group',
    role: 'Chief Technology Officer',
    email: 'elena.rostova@starlightfg.com',
    source: 'inbound_enrichment',
    status: 'new',
    last_contacted: null,
  },
  lead_clean: {
    id: 'lead-0911',
    name: 'Marcus Vance',
    company: 'HyperScale Logistics',
    role: 'VP Infrastructure Engineering',
    email: 'm.vance@hyperscalelog.io',
    source: 'crm_tier1',
    status: 'new',
    last_contacted: null,
  },
};

export const SAMPLE_FACTS: Fact[] = [
  {
    id: 'fact-1',
    statement: 'CloudPulse standard enterprise tier pricing begins strictly at $2,800/month billed annually.',
    source: 'CloudPulse Master Pricing & Tier Matrix 2026.pdf (Section 3.2)',
    source_date: '2026-01-15',
    confidence: 0.99,
    kind: 'kb',
  },
  {
    id: 'fact-2',
    statement: 'SOC 2 Type II certified; CloudPulse holds no agricultural food safety or FSSAI certifications.',
    source: 'SOC 2 Type II & ISO 27001 Compliance Brief.pdf (Cert Table)',
    source_date: '2026-02-01',
    confidence: 1.0,
    kind: 'kb',
  },
  {
    id: 'fact-3',
    statement: 'Standard enterprise onboarding and telemetry integration SLA is 10 to 14 business days.',
    source: 'SLA Warranties & Production Integration Standards.md (Section 5)',
    source_date: '2025-11-20',
    confidence: 0.98,
    kind: 'kb',
  },
  {
    id: 'fact-4',
    statement: 'Starlight Financial expanded AWS infrastructure footprint by 140% in Q3 2025 following their Series C.',
    source: 'SEC 10-Q & Public Cloud Spend Disclosures',
    source_date: '2025-10-12',
    confidence: 0.94,
    kind: 'market',
  },
];

/* Planted Flaw Demo Draft & Trust Report */
export const FLAWED_DRAFT: Draft = {
  lead_id: 'lead-0824',
  channel: 'email',
  subject: 'Starlight infrastructure efficiency & audit assurance',
  body: `Dear Elena,

I noticed Starlight Financial's recent multi-cloud expansion across Kubernetes clusters. As you scale workloads, reconciling FinOps telemetry without compromising audit posture is critical.

At CloudPulse, our platform maintains an FSSAI certified organic facility standard across infrastructure pipelines, assuring strict sovereign provenance. We are pleased to offer Starlight our tier at only $1,200/mo flat rate. Furthermore, our deployment team provides guaranteed delivery and full integration in 2 days from signature.

Would you have 15 minutes this Thursday at 2 PM EDT to inspect the live telemetry benchmarks?

Sincerely,
David Sterling
Head of Solutions, CloudPulse Systems`,
  claims_used: ['fact-4'],
};

export const FLAWED_TRUST_REPORT: TrustReport = {
  overall_score: 52,
  category_scores: {
    claims: 0.45,
    numbers: 0.5,
    dates: 0.95,
    names: 1.0,
    pii: 1.0,
    commitments: 0.3,
  },
  claim_verdicts: [
    {
      claim: 'CloudPulse platform maintains an FSSAI certified organic facility standard.',
      verdict: 'CONTRADICTED',
      evidence: 'KB Record doc-2 explicitly confirms CloudPulse holds SOC 2 Type II and ISO 27001. FSSAI is a food safety certification inapplicable to cloud software.',
    },
    {
      claim: 'CloudPulse tier available at only $1,200/mo flat rate.',
      verdict: 'CONTRADICTED',
      evidence: 'KB Record doc-1 establishes minimum enterprise contract rate is $2,800/month. The $1,200 quote causes negative contract margin.',
    },
    {
      claim: 'Guaranteed delivery and full integration in 2 days.',
      verdict: 'NOT_FOUND',
      evidence: 'Production Integration Standards specify 10-14 business days. No 2-day integration SLA is authorized by engineering.',
    },
  ],
  flags: [
    {
      id: 'flag-001',
      category: 'unsupported_claim',
      sentence_text: 'At CloudPulse, our platform maintains an FSSAI certified organic facility standard across infrastructure pipelines, assuring strict sovereign provenance.',
      start: 226,
      end: 379,
      reason: 'Hallucinated compliance certification. FSSAI is a food safety accreditation; verified records show SOC 2 Type II.',
      severity: 'high',
      status: 'open',
    },
    {
      id: 'flag-002',
      category: 'number_mismatch',
      sentence_text: 'We are pleased to offer Starlight our tier at only $1,200/mo flat rate.',
      start: 380,
      end: 451,
      reason: 'Pricing discrepancy. Verified price sheet establishes standard enterprise fee at $2,800/mo billed annually.',
      severity: 'medium',
      status: 'open',
    },
    {
      id: 'flag-003',
      category: 'risky_commitment',
      sentence_text: 'Furthermore, our deployment team provides guaranteed delivery and full integration in 2 days from signature.',
      start: 452,
      end: 562,
      reason: 'Unauthorized binding SLA warranty. Official standard delivery is 10-14 business days.',
      severity: 'medium',
      status: 'open',
    },
  ],
  verdict: 'FAIL',
};

export const FLAWED_POLICY_RESULT: PolicyResult = {
  passed: false,
  violations: [
    {
      rule: 'POL-204 (Commercial Warranties)',
      detail: 'Binding deployment timeline commitments under 5 business days violate engineering SLA safety gates.',
    },
    {
      rule: 'POL-108 (Pricing Integrity)',
      detail: 'Quoted pricing $1,200/mo falls beneath minimum contract threshold ($2,800/mo) without VP Sales override signature.',
    },
  ],
  required_edits: [
    'Remove unverified FSSAI certification claim.',
    'Align pricing with authorized contract minimum ($2,800/mo) or omit pricing quote until discovery.',
    'Replace 2-day integration promise with standard 10-14 day production rollout schedule.',
  ],
};

/* Clean Demo Draft & Trust Report */
export const CLEAN_DRAFT: Draft = {
  lead_id: 'lead-0911',
  channel: 'email',
  subject: 'Cloud telemetry & infrastructure audit for HyperScale Logistics',
  body: `Dear Marcus,

I reviewed HyperScale Logistics' recent multi-region expansion across AWS and GCP infrastructure. As your engineering team scales container clusters, maintaining cost governance without compromising SOC 2 audit readiness becomes paramount.

CloudPulse provides automated FinOps telemetry directly verified against SOC 2 Type II and ISO 27001 benchmarks. Our enterprise platform begins at $2,800/month, with typical deployment and telemetry ingestion completed within 10 to 14 business days.

Would you be open to a 15-minute briefing next Tuesday to review comparative workload efficiency metrics?

Warm regards,
David Sterling
Head of Solutions, CloudPulse Systems`,
  claims_used: ['fact-1', 'fact-2', 'fact-3'],
};

export const CLEAN_TRUST_REPORT: TrustReport = {
  overall_score: 98,
  category_scores: {
    claims: 0.98,
    numbers: 1.0,
    dates: 0.96,
    names: 1.0,
    pii: 1.0,
    commitments: 0.95,
  },
  claim_verdicts: [
    {
      claim: 'Automated FinOps telemetry verified against SOC 2 Type II and ISO 27001.',
      verdict: 'SUPPORTED',
      evidence: 'Matched with doc-2: SOC 2 Type II & ISO 27001 compliance audit records dated 2026-02-01.',
    },
    {
      claim: 'Enterprise platform begins at $2,800/month.',
      verdict: 'SUPPORTED',
      evidence: 'Matched with doc-1: Master Pricing Matrix section 3.2.',
    },
    {
      claim: 'Deployment and telemetry ingestion completed within 10 to 14 business days.',
      verdict: 'SUPPORTED',
      evidence: 'Matched with doc-3: Production rollout standard section 5.',
    },
  ],
  flags: [],
  verdict: 'PASS',
};

export const CLEAN_POLICY_RESULT: PolicyResult = {
  passed: true,
  violations: [],
  required_edits: [],
};

export const INITIAL_TRACE_EVENTS: TraceEvent[] = [
  {
    agent: 'Atlas',
    step: 'Pipeline Initialization',
    input_summary: 'Target Account: Starlight Financial Group (Lead ID: lead-0824), Business: CloudPulse Systems',
    output_summary: 'Graph execution graph compiled. Dispatched Scout for deep intelligence gathering.',
    reason: 'Autonomous run scheduled via growth pipeline orchestrator.',
    duration: '142ms',
    timestamp: '2026-10-09T01:30:00Z',
  },
  {
    agent: 'Scout',
    step: 'Account & Fact Extraction',
    input_summary: 'Domain starlightfg.com, verified internal knowledge base doc-1, doc-2, doc-3',
    output_summary: 'Synthesized 4 verified ground-truth facts. Validated CTO persona and cloud footprint growth.',
    reason: 'Grounded intelligence required before scoring and content generation.',
    duration: '820ms',
    timestamp: '2026-10-09T01:30:01Z',
  },
  {
    agent: 'Cadence',
    step: 'Lead Scoring & Outreach Timing',
    input_summary: 'ICP match parameters, lead title "CTO", cloud spend velocity',
    output_summary: 'Score: 88/100 (Fit: 0.94, Intent: 0.86). Decision: ACT. Recommended channel: Email.',
    reason: 'Target account exceeds scoring threshold (65) and meets anti-spam quiet hours window.',
    duration: '310ms',
    timestamp: '2026-10-09T01:30:02Z',
  },
  {
    agent: 'Quill',
    step: 'Draft Synthesis',
    input_summary: 'Lead profile, verified facts, consultative tone parameters',
    output_summary: 'Generated outreach draft (subject + 4 paragraph body). Referenced 1 target fact.',
    reason: 'Synthesized hyper-personalized proposal for human review desk.',
    duration: '1,240ms',
    timestamp: '2026-10-09T01:30:03Z',
  },
  {
    agent: 'Veritas',
    step: 'Multi-Tier Trust Audit',
    input_summary: 'Draft body (152 words), verified knowledge base vectors',
    output_summary: 'Audit completed: 3 flags generated (1 unsupported claim, 1 number mismatch, 1 risky commitment). Trust score: 52/100. Verdict: FAIL.',
    reason: 'Draft contains unsupported certification and pricing/SLA discrepancies contradicting source documents.',
    duration: '690ms',
    timestamp: '2026-10-09T01:30:04Z',
  },
  {
    agent: 'Warden',
    step: 'Deterministic Policy Gate',
    input_summary: 'Draft content, Anti-spam policy, Commercial warranty rules',
    output_summary: 'Policy check FAILED. Rule POL-204 and POL-108 violated. Human approval gate locked.',
    reason: 'Anti-hallucination policy prevents unverified commitments from reaching dispatch.',
    duration: '18ms',
    timestamp: '2026-10-09T01:30:05Z',
  },
];

export const ALL_AGENTS_ROSTER: AgentDefinition[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Orchestrator & State Coordinator',
    kind: 'ai_agent',
    category: 'orchestration',
    icon: 'Compass',
    can: ['Coordinate multi-agent state transitions', 'Dispatch tasks across pipeline nodes', 'Manage error recoveries and retry budgets'],
    cannot: ['Send outbound messages to external contacts', 'Bypass human review or policy gates', 'Alter verified knowledge base entries'],
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Intelligence Gathering & Fact Extraction',
    kind: 'ai_agent',
    category: 'intelligence',
    icon: 'Search',
    can: ['Extract verified facts from approved documents', 'Parse account signals and team structures', 'Assign factual confidence ratings'],
    cannot: ['Generate ungrounded factual assumptions', 'Contact target leads directly', 'Modify corporate CRM records'],
  },
  {
    id: 'cadence',
    name: 'Cadence',
    role: 'Scoring & Outreach Timing Engine',
    kind: 'ai_agent',
    category: 'intelligence',
    icon: 'Clock',
    can: ['Calculate ICP fit and intent scores', 'Determine optimal contact cadence', 'Issue ACT / WAIT / REJECT / RESEARCH_MORE rulings'],
    cannot: ['Trigger message dispatch directly', 'Override quiet hours anti-spam rules', 'Contact opted-out domains'],
  },
  {
    id: 'quill',
    name: 'Quill',
    role: 'Personalized Outreach Synthesis',
    kind: 'ai_agent',
    category: 'execution',
    icon: 'Feather',
    can: ['Generate personalized email and LinkedIn drafts', 'Ground claims in Scout-verified facts', 'Adapt voice to brand tone parameters'],
    cannot: ['Send communications without human approval', 'Invent unverified certifications or pricing', 'Access customer billing systems'],
  },
  {
    id: 'muse',
    name: 'Muse',
    role: 'Content & Asset Formulation',
    kind: 'ai_agent',
    category: 'execution',
    icon: 'Sparkles',
    can: ['Draft grounded white papers and case studies', 'Synthesize customer testimonials into copy', 'Create multi-channel outreach assets'],
    cannot: ['Publish assets to public channels', 'Alter legal product specifications', 'Bypass trust audit verification'],
  },
  {
    id: 'veritas',
    name: 'Veritas',
    role: 'Multi-Tier Trust & Hallucination Auditor',
    kind: 'ai_agent',
    category: 'trust_policy',
    icon: 'ShieldCheck',
    can: ['Verify sentence-level claims against knowledge base', 'Audit numbers, dates, PII, and commitments', 'Issue PASS / REVIEW / FAIL rulings with penalty scoring'],
    cannot: ['Rewrite or edit copy unilaterally', 'Approve flagged communications without human resolution', 'Send outbound payloads'],
  },
  {
    id: 'warden',
    name: 'Warden',
    role: 'Deterministic Policy & Compliance Gate',
    kind: 'rules_engine',
    category: 'trust_policy',
    icon: 'Scale',
    can: ['Enforce quiet hours and contact frequency rules', 'Detect blacklisted terms and SLA warranties', 'Hard-lock pipeline until human review resolution'],
    cannot: ['Use fuzzy LLM reasoning (100% deterministic code)', 'Be overridden by upstream AI agents', 'Disregard anti-spam opt-outs'],
  },
  {
    id: 'courier',
    name: 'Courier',
    role: 'Mock Send & Dispatch Delivery',
    kind: 'rules_engine',
    category: 'execution',
    icon: 'Send',
    can: ['Generate verified delivery receipts', 'Simulate webhook and SMTP dispatch', 'Record audit timestamps and message IDs'],
    cannot: ['Send unsanctioned or unapproved drafts', 'Modify message content', 'Execute without explicit human confirmation'],
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Follow-up & Response Classification',
    kind: 'ai_agent',
    category: 'learning',
    icon: 'MessageSquare',
    can: ['Classify inbound reply intent (interested, question, unsubscribe)', 'Detect escalation triggers for human reps', 'Formulate contextual reply drafts'],
    cannot: ['Auto-reply to sensitive legal questions', 'Ignore explicit opt-out requests', 'Make binding contract commitments'],
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Analytics & Continuous Learning Engine',
    kind: 'ai_agent',
    category: 'learning',
    icon: 'TrendingUp',
    can: ['Correlate campaign outcomes with draft features', 'Extract statistical patterns and recommendations', 'Update business profile guidelines'],
    cannot: ['Execute automated changes without approval', 'Delete historical audit trace records', 'Expose PII in aggregate reports'],
  },
];

export const EXTENDED_48_CATALOG = [
  // Orchestration & Planning (6)
  { name: 'Atlas', function: 'Orchestration', desc: 'Core pipeline conductor', enabled: true },
  { name: 'Janus', function: 'Orchestration', desc: 'Multi-threaded campaign router', enabled: false },
  { name: 'Chronos', function: 'Orchestration', desc: 'Cross-timezone scheduling synchronizer', enabled: false },
  { name: 'Aegis', function: 'Orchestration', desc: 'Failover and resilience recovery agent', enabled: false },
  { name: 'Nexus', function: 'Orchestration', desc: 'Enterprise CRM state reconciler', enabled: false },
  { name: 'Hermes', function: 'Orchestration', desc: 'Event-driven webhook dispatcher', enabled: false },

  // Research & Intelligence (10)
  { name: 'Scout', function: 'Intelligence', desc: 'Account and lead intelligence researcher', enabled: true },
  { name: 'Cadence', function: 'Intelligence', desc: 'Propensity and timing scoring engine', enabled: true },
  { name: 'Argus', function: 'Intelligence', desc: 'Competitor footprint and switch trigger monitor', enabled: false },
  { name: 'Pythia', function: 'Intelligence', desc: 'Buying committee hierarchy cartographer', enabled: false },
  { name: 'Sonar', function: 'Intelligence', desc: 'Job change and hiring velocity tracker', enabled: false },
  { name: 'Talos', function: 'Intelligence', desc: 'Technographic stack analyzer', enabled: false },
  { name: 'Vanguard', function: 'Intelligence', desc: 'Regulatory filing and 10-K disclosure scanner', enabled: false },
  { name: 'Beacon', function: 'Intelligence', desc: 'Intent signal aggregator across B2B networks', enabled: false },
  { name: 'Radar', function: 'Intelligence', desc: 'Community mention and sentiment listener', enabled: false },
  { name: 'Oracle', function: 'Intelligence', desc: 'Deal size and budget estimator', enabled: false },

  // Content & Synthesis (10)
  { name: 'Quill', function: 'Synthesis', desc: 'Precision email and sequence drafter', enabled: true },
  { name: 'Muse', function: 'Synthesis', desc: 'Long-form collateral and proof-point generator', enabled: true },
  { name: 'Calliope', function: 'Synthesis', desc: 'Executive-to-executive hyper-personalized memo author', enabled: false },
  { name: 'Scribe', function: 'Synthesis', desc: 'Technical whitepaper and benchmark compiler', enabled: false },
  { name: 'Lyric', function: 'Synthesis', desc: 'Social engagement and short-form copy crafter', enabled: false },
  { name: 'Crayon', function: 'Synthesis', desc: 'Comparative feature matrix diagram formatter', enabled: false },
  { name: 'Prism', function: 'Synthesis', desc: 'Multi-language localized narrative translator', enabled: false },
  { name: 'Verso', function: 'Synthesis', desc: 'Subject line and hook variation generator', enabled: false },
  { name: 'Thesis', function: 'Synthesis', desc: 'Value hypothesis and ROI calculator synthesizer', enabled: false },
  { name: 'Brief', function: 'Synthesis', desc: 'Pre-meeting briefing memo compiler for sales reps', enabled: false },

  // Trust, Verification & Policy (10)
  { name: 'Veritas', function: 'Trust & Verification', desc: 'Multi-tier claim and hallucination auditor', enabled: true },
  { name: 'Warden', function: 'Trust & Verification', desc: 'Deterministic policy and anti-spam gate', enabled: true },
  { name: 'Censor', function: 'Trust & Verification', desc: 'PII, GDPR, and confidential token redaction guard', enabled: false },
  { name: 'Sentry', function: 'Trust & Verification', desc: 'Tone, brand voice, and brand safety compliance auditor', enabled: false },
  { name: 'Juris', function: 'Trust & Verification', desc: 'Commercial contract warranty and liability validator', enabled: false },
  { name: 'Ledger', function: 'Trust & Verification', desc: 'Cryptographic audit provenance and state recorder', enabled: false },
  { name: 'Anchor', function: 'Trust & Verification', desc: 'Citation hyperlink and primary source validity checker', enabled: false },
  { name: 'Metric', function: 'Trust & Verification', desc: 'Numerical claim and math consistency verifier', enabled: false },
  { name: 'Chronicle', function: 'Trust & Verification', desc: 'Temporal claim and freshness window validator', enabled: false },
  { name: 'Guardian', function: 'Trust & Verification', desc: 'Executive impersonation and spoofing guard', enabled: false },

  // Delivery & Interaction (6)
  { name: 'Courier', function: 'Delivery', desc: 'Simulated and live delivery dispatch receipt engine', enabled: true },
  { name: 'Echo', function: 'Delivery', desc: 'Inbound response classifier and triage director', enabled: true },
  { name: 'Relay', function: 'Delivery', desc: 'LinkedIn InMail API automated connector', enabled: false },
  { name: 'Chime', function: 'Delivery', desc: 'Calendar scheduling and slot negotiation agent', enabled: false },
  { name: 'Breeze', function: 'Delivery', desc: 'Bounce handling and mailbox warm-up stabilizer', enabled: false },
  { name: 'Signal', function: 'Delivery', desc: 'Out-of-office return date parser and reschedule agent', enabled: false },

  // Analytics & Optimization (6)
  { name: 'Sage', function: 'Optimization', desc: 'Cross-campaign pattern and learning strategist', enabled: true },
  { name: 'Optima', function: 'Optimization', desc: 'Multi-armed bandit subject line allocator', enabled: false },
  { name: 'Vector', function: 'Optimization', desc: 'Embedding drift and persona affinity clustering', enabled: false },
  { name: 'Apex', function: 'Optimization', desc: 'Win/loss interview transcript thematic miner', enabled: false },
  { name: 'Retrospect', function: 'Optimization', desc: 'Post-campaign conversion attribution modeler', enabled: false },
  { name: 'Evolve', function: 'Optimization', desc: 'Prompt and policy rule self-refinement recommender', enabled: false },
];

export const MOCK_CAMPAIGN_REPORT: CampaignReport = {
  total_outcomes: 48,
  reply_rate: 0.28,
  meeting_rate: 0.145,
  unsubscribe_rate: 0.021,
  summary: 'Consultative FinOps angles referencing verified SOC 2 posture generated 3.4x higher meeting conversion than generic cost-reduction pitches. Zero spam complaints logged.',
  insights: [
    {
      pattern: 'Audited SOC 2 claims in second paragraph elevate CTO response confidence.',
      evidence_count: 26,
      confidence: 0.94,
      recommendation: 'Position compliance and sovereign telemetry as the lead value pillar for accounts over $100M revenue.',
    },
    {
      pattern: 'Direct pricing quotes in cold outreach without initial discovery reduce reply conversion by 42%.',
      evidence_count: 18,
      confidence: 0.88,
      recommendation: 'Omit explicit monthly dollar quotes until exploratory engineering benchmark is confirmed.',
    },
    {
      pattern: 'Tuesday morning 09:30 EDT dispatch exhibits lowest latency to senior engineering executive replies.',
      evidence_count: 34,
      confidence: 0.91,
      recommendation: 'Target Cadence send windows between 09:00 and 10:30 in recipient local timezone.',
    },
  ],
  time_series: [
    { date: 'Oct 02', replies: 3, meetings: 1, unsubscribes: 0 },
    { date: 'Oct 03', replies: 5, meetings: 2, unsubscribes: 0 },
    { date: 'Oct 04', replies: 4, meetings: 2, unsubscribes: 1 },
    { date: 'Oct 05', replies: 6, meetings: 3, unsubscribes: 0 },
    { date: 'Oct 06', replies: 8, meetings: 4, unsubscribes: 0 },
    { date: 'Oct 07', replies: 7, meetings: 3, unsubscribes: 0 },
    { date: 'Oct 08', replies: 11, meetings: 6, unsubscribes: 1 },
  ],
};

export const MOCK_REPLY_ANALYSIS: ReplyAnalysis = {
  intent: 'interested',
  next_action: 'Prepare technical FinOps benchmarking demo for CTO and Lead Architect',
  escalate_to_human: false,
  reason: 'Prospect expressed positive interest in SOC 2 verified telemetry and requested meeting calendar link.',
  draft_reply: `Hi Elena,

Delighted to connect. Here is our direct calendar reservation for Thursday: https://cloudpulse.io/demo/elena-rostova. I will also have our Principal Infrastructure Architect join to discuss your multi-cluster telemetry setup.

Looking forward to the conversation.
David Sterling`,
};
