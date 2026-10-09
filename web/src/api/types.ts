export type FlagCategory =
  | 'unsupported_claim'
  | 'contradicted_claim'
  | 'number_mismatch'
  | 'date_mismatch'
  | 'name_mismatch'
  | 'pii'
  | 'risky_commitment';

export type FlagSeverity = 'low' | 'medium' | 'high';
export type FlagStatus = 'open' | 'accepted' | 'dismissed';

export interface Flag {
  id: string;
  category: FlagCategory;
  sentence_text: string;
  start: number;
  end: number;
  reason: string;
  severity: FlagSeverity;
  status: FlagStatus;
}

export type ClaimVerdictType = 'SUPPORTED' | 'CONTRADICTED' | 'NOT_FOUND';

export interface ClaimVerdict {
  claim: string;
  verdict: ClaimVerdictType;
  evidence: string;
}

export type TrustVerdict = 'PASS' | 'REVIEW' | 'FAIL';

export interface TrustReport {
  overall_score: number;
  category_scores: Record<string, number>;
  claim_verdicts: ClaimVerdict[];
  flags: Flag[];
  verdict: TrustVerdict;
}

export interface PolicyViolation {
  rule: string;
  detail: string;
}

export interface PolicyResult {
  passed: boolean;
  violations: PolicyViolation[];
  required_edits: string[];
}

export interface Draft {
  subject: string;
  body: string;
  channel: string;
  claims_used: string[];
  lead_id: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'opted_out';
  last_contacted?: string | null;
}

export type LeadDecision = 'ACT' | 'WAIT' | 'REJECT' | 'RESEARCH_MORE';

export interface LeadScore {
  score: number;
  breakdown: Record<string, number>;
  decision: LeadDecision;
  reason: string;
  recheck_after?: string | null;
}

export interface Fact {
  id: string;
  statement: string;
  source: string;
  source_date: string;
  confidence: number;
  kind: 'company' | 'market' | 'competitor' | 'kb';
}

export interface AntiSpamSettings {
  max_contacts_per_week: number;
  quiet_hours: string;
  opt_out_list: string[];
}

export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  offerings: string[];
  ideal_customer: string;
  tone: string;
  channels: string[];
  anti_spam: AntiSpamSettings;
  enabled_agents: string[];
  documents?: { id: string; title: string; type: string; size: string }[];
}

export interface TraceEvent {
  agent: string;
  step: string;
  input_summary: string;
  output_summary: string;
  reason: string;
  duration?: string;
  timestamp: string;
}

export type RunStatus = 'running' | 'waiting_for_human' | 'completed' | 'failed' | 'rejected';

export interface RunStateSummary {
  draft?: Draft;
  score?: LeadScore;
  trust_report?: TrustReport;
  policy_result?: PolicyResult;
  mock_send_result?: {
    delivered_at: string;
    channel: string;
    recipient: string;
    message_id: string;
    status: string;
  };
  failed_trust_banner?: boolean;
  lead?: Lead;
  facts?: Fact[];
  reply_analysis?: ReplyAnalysis;
}

export interface RunSummary {
  run_id: string;
  business_id: string;
  lead_id?: string | null;
  status: RunStatus;
  state_summary: RunStateSummary;
}

export interface ReviewPayload {
  run_id: string;
  draft: Draft | null;
  trust_report: TrustReport | null;
  policy_result: PolicyResult | null;
  failed_trust_banner?: boolean;
}

export interface ApprovalDecisionPayload {
  decision: 'approve' | 'edit' | 'reject';
  editedBody?: string;
  notes?: string;
  reviewer?: string;
}

export interface ReplyAnalysis {
  intent: 'interested' | 'not_interested' | 'question' | 'unsubscribe' | 'out_of_office' | 'pricing_or_contract' | 'unclear';
  next_action: string;
  escalate_to_human: boolean;
  reason: string;
  draft_reply?: string | null;
}

export interface Outcome {
  lead_id: string;
  draft_id: string;
  replied: boolean;
  meeting_booked: boolean;
  unsubscribed: boolean;
  complaint: boolean;
  notes: string;
}

export interface LearningInsight {
  pattern: string;
  evidence_count: number;
  confidence: number;
  recommendation: string;
}

export interface CampaignReport {
  total_outcomes: number;
  reply_rate: number;
  meeting_rate: number;
  unsubscribe_rate: number;
  insights: LearningInsight[];
  summary: string;
  time_series?: { date: string; replies: number; meetings: number; unsubscribes: number }[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  kind: 'ai_agent' | 'rules_engine';
  can: string[];
  cannot: string[];
  status?: 'idle' | 'active' | 'done' | 'failed' | 'waiting';
  category: 'orchestration' | 'intelligence' | 'execution' | 'trust_policy' | 'learning';
  icon: string;
}
