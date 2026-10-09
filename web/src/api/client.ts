import {
  BusinessProfile,
  RunSummary,
  TraceEvent,
  ReviewPayload,
  TrustReport,
  ApprovalDecisionPayload,
  Outcome,
  CampaignReport,
  Flag,
} from './types';
import {
  SAMPLE_BUSINESSES,
  SAMPLE_LEADS,
  SAMPLE_FACTS,
  FLAWED_DRAFT,
  FLAWED_TRUST_REPORT,
  FLAWED_POLICY_RESULT,
  CLEAN_DRAFT,
  CLEAN_TRUST_REPORT,
  CLEAN_POLICY_RESULT,
  INITIAL_TRACE_EVENTS,
  MOCK_CAMPAIGN_REPORT,
  MOCK_REPLY_ANALYSIS,
} from '../mocks/fixtures';

const API_MODE = import.meta.env.VITE_API_MODE || 'mock';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// In-memory mock state store
class MockBackendState {
  private businesses = [...SAMPLE_BUSINESSES];
  private activeBusinessId = 'saas';
  private runs: Map<string, RunSummary> = new Map();
  private reviews: Map<string, ReviewPayload> = new Map();
  private traces: Map<string, TraceEvent[]> = new Map();

  constructor() {
    this.seedDefaultRuns();
  }

  private seedDefaultRuns() {
    // 1. Planted Flaw Demo Run
    const flawedRunId = 'run_flawed_demo';
    const flawedReportCopy: TrustReport = JSON.parse(JSON.stringify(FLAWED_TRUST_REPORT));
    const flawedPolicyCopy = JSON.parse(JSON.stringify(FLAWED_POLICY_RESULT));
    const flawedDraftCopy = JSON.parse(JSON.stringify(FLAWED_DRAFT));

    this.runs.set(flawedRunId, {
      run_id: flawedRunId,
      business_id: 'saas',
      lead_id: 'lead-0824',
      status: 'waiting_for_human',
      state_summary: {
        draft: flawedDraftCopy,
        score: {
          score: 88,
          breakdown: { fit: 0.94, intent: 0.86, freshness: 0.90, source_quality: 0.92 },
          decision: 'ACT',
          reason: 'High propensity account: Series C infrastructure expansion detected.',
        },
        trust_report: flawedReportCopy,
        policy_result: flawedPolicyCopy,
        lead: SAMPLE_LEADS.lead_flawed,
        facts: SAMPLE_FACTS,
        failed_trust_banner: true,
      },
    });

    this.reviews.set(flawedRunId, {
      run_id: flawedRunId,
      draft: flawedDraftCopy,
      trust_report: flawedReportCopy,
      policy_result: flawedPolicyCopy,
      failed_trust_banner: true,
    });

    this.traces.set(flawedRunId, JSON.parse(JSON.stringify(INITIAL_TRACE_EVENTS)));

    // 2. Clean Verified Run
    const cleanRunId = 'run_clean_demo';
    const cleanReportCopy: TrustReport = JSON.parse(JSON.stringify(CLEAN_TRUST_REPORT));
    const cleanPolicyCopy = JSON.parse(JSON.stringify(CLEAN_POLICY_RESULT));
    const cleanDraftCopy = JSON.parse(JSON.stringify(CLEAN_DRAFT));

    this.runs.set(cleanRunId, {
      run_id: cleanRunId,
      business_id: 'saas',
      lead_id: 'lead-0911',
      status: 'waiting_for_human',
      state_summary: {
        draft: cleanDraftCopy,
        score: {
          score: 94,
          breakdown: { fit: 0.96, intent: 0.92, freshness: 0.95, source_quality: 0.98 },
          decision: 'ACT',
          reason: 'Optimal timing window for CTO outreach.',
        },
        trust_report: cleanReportCopy,
        policy_result: cleanPolicyCopy,
        lead: SAMPLE_LEADS.lead_clean,
        facts: SAMPLE_FACTS,
        failed_trust_banner: false,
      },
    });

    this.reviews.set(cleanRunId, {
      run_id: cleanRunId,
      draft: cleanDraftCopy,
      trust_report: cleanReportCopy,
      policy_result: cleanPolicyCopy,
      failed_trust_banner: false,
    });

    this.traces.set(cleanRunId, [
      ...INITIAL_TRACE_EVENTS.slice(0, 4),
      {
        agent: 'Veritas',
        step: 'Multi-Tier Trust Audit',
        input_summary: 'Verified against knowledge base documents',
        output_summary: 'Trust Audit Passed. Score 98/100. All claims verified.',
        reason: 'Zero unsupported claims detected.',
        duration: '420ms',
        timestamp: '2026-10-09T01:31:00Z',
      },
      {
        agent: 'Warden',
        step: 'Deterministic Policy Gate',
        input_summary: 'Anti-spam & compliance check',
        output_summary: 'Policy check PASSED. Gate clear for human review.',
        reason: 'Within quiet hours, valid domain, no unauthorized warranty commitments.',
        duration: '14ms',
        timestamp: '2026-10-09T01:31:01Z',
      },
    ]);
  }

  public getBusinesses(): BusinessProfile[] {
    return this.businesses;
  }

  public getActiveBusinessId(): string {
    return this.activeBusinessId;
  }

  public setActiveBusiness(id: string): BusinessProfile {
    const biz = this.businesses.find((b) => b.id === id);
    if (!biz) throw new Error(`Business ${id} not found`);
    this.activeBusinessId = id;
    return biz;
  }

  public updateBusiness(profile: BusinessProfile): BusinessProfile {
    const index = this.businesses.findIndex((b) => b.id === profile.id);
    if (index >= 0) {
      this.businesses[index] = profile;
    } else {
      this.businesses.push(profile);
    }
    return profile;
  }

  public createRun(businessId: string, leadId?: string | null, isFlawed = false): string {
    const runId = `run_${Date.now().toString(36)}`;
    const lead = leadId && SAMPLE_LEADS[leadId] ? SAMPLE_LEADS[leadId] : SAMPLE_LEADS.lead_flawed;

    const baseDraft = isFlawed ? FLAWED_DRAFT : CLEAN_DRAFT;
    const baseReport = isFlawed ? FLAWED_TRUST_REPORT : CLEAN_TRUST_REPORT;
    const basePolicy = isFlawed ? FLAWED_POLICY_RESULT : CLEAN_POLICY_RESULT;

    const runSummary: RunSummary = {
      run_id: runId,
      business_id: businessId,
      lead_id: lead.id,
      status: 'waiting_for_human',
      state_summary: {
        draft: JSON.parse(JSON.stringify(baseDraft)),
        score: {
          score: 89,
          breakdown: { fit: 0.92, intent: 0.88, freshness: 0.90, source_quality: 0.95 },
          decision: 'ACT',
          reason: 'Autonomous scoring cleared for outreach.',
        },
        trust_report: JSON.parse(JSON.stringify(baseReport)),
        policy_result: JSON.parse(JSON.stringify(basePolicy)),
        lead,
        facts: SAMPLE_FACTS,
        failed_trust_banner: isFlawed,
      },
    };

    this.runs.set(runId, runSummary);
    this.reviews.set(runId, {
      run_id: runId,
      draft: runSummary.state_summary.draft || null,
      trust_report: runSummary.state_summary.trust_report || null,
      policy_result: runSummary.state_summary.policy_result || null,
      failed_trust_banner: isFlawed,
    });

    this.traces.set(runId, JSON.parse(JSON.stringify(INITIAL_TRACE_EVENTS)));
    return runId;
  }

  public resetState(): void {
    this.runs.clear();
    this.reviews.clear();
    this.traces.clear();
    this.seedDefaultRuns();
  }

  public getRun(runId: string): RunSummary {
    const run = this.runs.get(runId);
    if (!run) {
      // Fallback to flawed demo if unknown ID
      return JSON.parse(JSON.stringify(this.runs.get('run_flawed_demo')!));
    }
    return JSON.parse(JSON.stringify(run));
  }

  public getTrace(runId: string): TraceEvent[] {
    const trace = this.traces.get(runId) || INITIAL_TRACE_EVENTS;
    return JSON.parse(JSON.stringify(trace));
  }

  public getReviewPayload(runId: string): ReviewPayload {
    const rev = this.reviews.get(runId);
    if (!rev) {
      return JSON.parse(JSON.stringify(this.reviews.get('run_flawed_demo')!));
    }
    return JSON.parse(JSON.stringify(rev));
  }

  public updateFlag(runId: string, flagId: string, status: 'accepted' | 'dismissed'): TrustReport {
    const rev = this.reviews.get(runId) || this.reviews.get('run_flawed_demo');
    if (!rev || !rev.trust_report) {
      throw new Error(`No trust report for run ${runId}`);
    }

    const report = rev.trust_report;
    const flag = report.flags.find((f: Flag) => f.id === flagId);
    if (flag) {
      flag.status = status;
    }

    // Recalculate score
    const penalties: Record<string, number> = { high: 30, medium: 15, low: 5 };
    const openFlags = report.flags.filter((f) => f.status === 'open');
    const totalPenalty = openFlags.reduce((sum, f) => sum + (penalties[f.severity] || 10), 0);

    report.overall_score = Math.max(0, Math.min(100, 100 - totalPenalty));

    // Update category scores
    const categoryCounts: Record<string, number> = {};
    for (const f of report.flags) {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + (f.status === 'open' ? 1 : 0);
    }
    for (const [cat, count] of Object.entries(categoryCounts)) {
      report.category_scores[cat] = Math.max(0, 1.0 - count * 0.25);
    }

    const hasHighOpen = openFlags.some((f) => f.severity === 'high');
    const hasMedOpen = openFlags.some((f) => f.severity === 'medium');

    if (hasHighOpen || report.overall_score < 60) {
      report.verdict = 'FAIL';
    } else if (hasMedOpen || report.overall_score < 80) {
      report.verdict = 'REVIEW';
    } else {
      report.verdict = 'PASS';
    }

    // If all flags are resolved, policy also updates to passed
    if (openFlags.length === 0 && rev.policy_result) {
      rev.policy_result.passed = true;
      rev.policy_result.violations = [];
      rev.policy_result.required_edits = [];
      rev.failed_trust_banner = false;
    }

    // Synchronize to run summary state
    const run = this.runs.get(runId);
    if (run) {
      run.state_summary.trust_report = report;
      if (rev.policy_result) run.state_summary.policy_result = rev.policy_result;
      run.state_summary.failed_trust_banner = rev.failed_trust_banner;
    }

    return JSON.parse(JSON.stringify(report));
  }

  public submitApproval(runId: string, payload: ApprovalDecisionPayload): RunSummary {
    const run = this.runs.get(runId) || this.runs.get('run_flawed_demo')!;
    const trace = this.traces.get(runId) || [];

    if (payload.decision === 'approve') {
      run.status = 'completed';
      run.state_summary.mock_send_result = {
        delivered_at: new Date().toISOString(),
        channel: run.state_summary.draft?.channel || 'email',
        recipient: run.state_summary.lead?.email || 'target@enterprise.com',
        message_id: `msg_${Math.random().toString(36).substring(2, 10)}`,
        status: 'Delivered (Verified 250 OK)',
      };
      run.state_summary.reply_analysis = MOCK_REPLY_ANALYSIS;

      // Add Courier & Echo traces
      trace.push({
        agent: 'Courier',
        step: 'Mock Send Execution',
        input_summary: `Recipient: ${run.state_summary.lead?.email}, Channel: ${run.state_summary.draft?.channel}`,
        output_summary: 'Message transmitted successfully via verified SMTP gateway. Delivery receipt signed.',
        reason: 'Authorized by human review decision (Decision: APPROVE).',
        duration: '115ms',
        timestamp: new Date().toISOString(),
      });

      trace.push({
        agent: 'Echo',
        step: 'Simulated Inbound Reply Ingestion',
        input_summary: 'Response received from target contact after 4 hours.',
        output_summary: 'Intent classified: "interested". Escalation to human: false. Drafted calendar follow-up.',
        reason: 'Positive reply sentiment matched against booking playbook.',
        duration: '380ms',
        timestamp: new Date().toISOString(),
      });

      trace.push({
        agent: 'Sage',
        step: 'Continuous Learning Optimization',
        input_summary: 'Campaign outcome recorded: replied=true, meeting_booked=pending.',
        output_summary: 'Correlated positive response with audited SOC 2 claims. Synthesized pattern insight.',
        reason: 'Closed feedback loop for business profile knowledge refinement.',
        duration: '520ms',
        timestamp: new Date().toISOString(),
      });
    } else if (payload.decision === 'reject') {
      run.status = 'rejected';
      trace.push({
        agent: 'Atlas',
        step: 'Execution Terminated by Human Review',
        input_summary: `Reviewer notes: ${payload.notes || 'Draft rejected by user.'}`,
        output_summary: 'Pipeline halted. No communications dispatched. State marked as rejected.',
        reason: 'Human rejection received.',
        duration: '20ms',
        timestamp: new Date().toISOString(),
      });
    } else if (payload.decision === 'edit') {
      if (payload.editedBody && run.state_summary.draft) {
        run.state_summary.draft.body = payload.editedBody;
      }
      // Re-running audit cleans up flags
      const rev = this.getReviewPayload(runId);
      if (rev.draft && payload.editedBody) {
        rev.draft.body = payload.editedBody;
      }
      if (rev.trust_report) {
        rev.trust_report.flags = [];
        rev.trust_report.overall_score = 96;
        rev.trust_report.verdict = 'PASS';
      }
      if (rev.policy_result) {
        rev.policy_result.passed = true;
        rev.policy_result.violations = [];
        rev.policy_result.required_edits = [];
      }
      rev.failed_trust_banner = false;

      trace.push({
        agent: 'Veritas',
        step: 'Incremental Re-Audit',
        input_summary: 'User-edited draft body submitted.',
        output_summary: 'Re-audit passed. Clean posture verified. Score: 96/100.',
        reason: 'Manual edits resolved previous discrepancies.',
        duration: '340ms',
        timestamp: new Date().toISOString(),
      });
    }

    return run;
  }
}

const mockStore = new MockBackendState();

// Public typed API client
export const api = {
  async listBusinesses(): Promise<BusinessProfile[]> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/businesses`);
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.getBusinesses();
  },

  async switchBusiness(id: string): Promise<BusinessProfile> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/businesses/${id}`);
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 100));
    return mockStore.setActiveBusiness(id);
  },

  async updateBusinessProfile(profile: BusinessProfile): Promise<BusinessProfile> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/businesses/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 150));
    return mockStore.updateBusiness(profile);
  },

  async startRun(businessId: string, leadId?: string | null, isFlawed = false): Promise<string> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, lead_id: leadId }),
      });
      const data = await res.json();
      return data.run_id;
    }
    await new Promise((r) => setTimeout(r, 200));
    return mockStore.createRun(businessId, leadId, isFlawed);
  },

  async getRun(runId: string): Promise<RunSummary> {
    if (API_MODE === 'live') {
      try {
        const res = await fetch(`${API_URL}/api/runs/${runId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.state_summary?.draft || data.status !== 'not_found')) {
            return data;
          }
        }
      } catch (err) {
        // Fallback to local store
      }
    }
    await new Promise((r) => setTimeout(r, 100));
    return mockStore.getRun(runId);
  },

  async getTrace(runId: string): Promise<TraceEvent[]> {
    if (API_MODE === 'live') {
      try {
        const res = await fetch(`${API_URL}/api/runs/${runId}/trace`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      } catch (err) {
        // Fallback
      }
    }
    await new Promise((r) => setTimeout(r, 80));
    return mockStore.getTrace(runId);
  },

  async getReviewPayload(runId: string): Promise<ReviewPayload> {
    if (API_MODE === 'live') {
      try {
        const res = await fetch(`${API_URL}/api/runs/${runId}/review`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.draft) {
            return data;
          }
        }
      } catch (err) {
        // Fallback to local store
      }
    }
    await new Promise((r) => setTimeout(r, 100));
    return mockStore.getReviewPayload(runId);
  },

  async updateFlag(runId: string, flagId: string, status: 'accepted' | 'dismissed'): Promise<TrustReport> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/runs/${runId}/flags/${flagId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 150));
    return mockStore.updateFlag(runId, flagId, status);
  },

  async submitApproval(runId: string, decision: ApprovalDecisionPayload): Promise<RunSummary> {
    if (API_MODE === 'live') {
      try {
        const res = await fetch(`${API_URL}/api/runs/${runId}/approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decision),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        // Fallback to local store
      }
    }
    await new Promise((r) => setTimeout(r, 220));
    return mockStore.submitApproval(runId, decision);
  },

  async recordOutcome(runId: string, outcome: Outcome): Promise<any> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/runs/${runId}/outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outcome),
      });
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 150));
    return { status: 'outcome_recorded', runId };
  },

  async getInsights(businessId: string): Promise<CampaignReport> {
    if (API_MODE === 'live') {
      const res = await fetch(`${API_URL}/api/businesses/${businessId}/insights`);
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_CAMPAIGN_REPORT;
  },

  resetState(): void {
    mockStore.resetState();
  },
};
