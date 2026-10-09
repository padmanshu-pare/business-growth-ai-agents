import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api/client';

describe('Verity Core Data Layer & Consensus Verification', () => {
  beforeEach(() => {
    api.resetState();
  });

  it('adheres to mock API contract matching core/service.py endpoints', async () => {
    const businesses = await api.listBusinesses();
    expect(businesses).toHaveLength(3);
    expect(businesses.map((b) => b.id)).toEqual(['saas', 'ecommerce', 'local_services']);

    const run = await api.getRun('run_flawed_demo');
    expect(run).toBeDefined();
    expect(run.run_id).toBe('run_flawed_demo');
    expect(run.status).toBe('waiting_for_human');

    const trace = await api.getTrace('run_flawed_demo');
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0].agent).toBe('Atlas');

    const reviewPayload = await api.getReviewPayload('run_flawed_demo');
    expect(reviewPayload.draft).toBeDefined();
    expect(reviewPayload.trust_report).toBeDefined();
    expect(reviewPayload.policy_result).toBeDefined();
  });

  it('updates trust score and verdict dynamically when flags are accepted or dismissed', async () => {
    // 1. Initial State has 3 open flags
    const initialPayload = await api.getReviewPayload('run_flawed_demo');
    expect(initialPayload.trust_report?.flags).toHaveLength(3);
    expect(initialPayload.trust_report?.overall_score).toBeLessThan(60);
    expect(initialPayload.trust_report?.verdict).toBe('FAIL');

    const initialScore = initialPayload.trust_report!.overall_score;

    // 2. Accept first flag (high severity penalty 30 removed)
    const report1 = await api.updateFlag('run_flawed_demo', 'flag-001', 'accepted');
    expect(report1.flags.find((f) => f.id === 'flag-001')?.status).toBe('accepted');
    expect(report1.overall_score).toBeGreaterThan(initialScore);

    // 3. Dismiss second flag (medium severity penalty 15 removed)
    const report2 = await api.updateFlag('run_flawed_demo', 'flag-002', 'dismissed');
    expect(report2.flags.find((f) => f.id === 'flag-002')?.status).toBe('dismissed');
    expect(report2.overall_score).toBeGreaterThan(report1.overall_score);

    // 4. Accept third flag (resolves all open flags)
    const report3 = await api.updateFlag('run_flawed_demo', 'flag-003', 'accepted');
    expect(report3.overall_score).toBe(100);
    expect(report3.verdict).toBe('PASS');

    // Policy gate also clears automatically once flags are resolved
    const finalPayload = await api.getReviewPayload('run_flawed_demo');
    expect(finalPayload.policy_result?.passed).toBe(true);
  });

  it('enforces consensus gate before approving dispatch', async () => {
    // 1. Initially on flawed demo, approval is locked because flags are open and policy failed
    const initialPayload = await api.getReviewPayload('run_flawed_demo');
    const initialOpen = initialPayload.trust_report?.flags.filter((f) => f.status === 'open') || [];
    const initialCanApprove = initialOpen.length === 0 && (initialPayload.policy_result?.passed ?? false);
    expect(initialCanApprove).toBe(false);

    // 2. Resolve all 3 flags
    await api.updateFlag('run_flawed_demo', 'flag-001', 'accepted');
    await api.updateFlag('run_flawed_demo', 'flag-002', 'accepted');
    await api.updateFlag('run_flawed_demo', 'flag-003', 'accepted');

    // 3. Re-check state: now consensus criteria are met
    const resolvedPayload = await api.getReviewPayload('run_flawed_demo');
    const resolvedOpen = resolvedPayload.trust_report?.flags.filter((f) => f.status === 'open') || [];
    const resolvedCanApprove = resolvedOpen.length === 0 && (resolvedPayload.policy_result?.passed ?? false);
    expect(resolvedCanApprove).toBe(true);

    // 4. Submit approval
    const run = await api.submitApproval('run_flawed_demo', { decision: 'approve' });
    expect(run.status).toBe('completed');
    expect(run.state_summary.mock_send_result).toBeDefined();
    expect(run.state_summary.mock_send_result?.status).toContain('Delivered');
  });

  it('reloads business models and documents upon switching', async () => {
    const biz = await api.switchBusiness('ecommerce');
    expect(biz.id).toBe('ecommerce');
    expect(biz.name).toBe('Aura Living');
    expect(biz.industry).toContain('Consumer Goods');
    expect(biz.documents?.length).toBeGreaterThan(0);

    const reverted = await api.switchBusiness('saas');
    expect(reverted.id).toBe('saas');
    expect(reverted.name).toBe('CloudPulse Systems');
  });
});
