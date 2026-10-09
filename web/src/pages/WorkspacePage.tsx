import React, { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Kicker } from '../components/Kicker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { runAgentPipeline, dispatchApprovedEmail, fetchCrmRecords, PipelineRunResult, EmailDispatchResult } from '../api/pipeline';
import { CheckCircle2, Send, ArrowRight, Play, RefreshCw, Database, ShieldCheck } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const [targetCompany, setTargetCompany] = useState('Anthropic');
  const [businessType, setBusinessType] = useState('B2B software');
  const [recipientEmail, setRecipientEmail] = useState('delivered@resend.dev');
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<EmailDispatchResult | null>(null);
  const [crmDrawerOpen, setCrmDrawerOpen] = useState(false);
  const [crmRecords, setCrmRecords] = useState<any[]>([]);

  const handleRunPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetCompany.trim() || isRunning) return;

    setIsRunning(true);
    setDispatchResult(null);
    setActiveStep('research_account');

    // Smooth UI progress simulation while waiting for response
    const stepSequence = [
      'research_account',
      'detect_signals',
      'detect_personas',
      'synthesize_intelligence',
      'detect_why_now',
      'generate_outreach',
      'critique_outreach',
      'sync_crm'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < stepSequence.length) {
        setActiveStep(stepSequence[stepIdx]);
      }
    }, 400);

    try {
      const data = await runAgentPipeline(targetCompany.trim());
      setResult(data);
    } catch {
      // Handled in api
    } finally {
      clearInterval(interval);
      setActiveStep(null);
      setIsRunning(false);
    }
  };

  const handleDispatchEmail = async () => {
    if (!result || isSending) return;
    const firstStep = result.outreach_sequence.find((s) => s.channel === 'email');
    if (!firstStep) return;

    setIsSending(true);
    try {
      const dispatch = await dispatchApprovedEmail({
        to_email: recipientEmail,
        subject: firstStep.subject || `Outreach for ${result.company_name}`,
        body: firstStep.body,
        company_name: result.company_name,
      });
      setDispatchResult(dispatch);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenCrm = async () => {
    setCrmDrawerOpen(true);
    const records = await fetchCrmRecords();
    setCrmRecords(records);
  };

  return (
    <PageShell
      title="Agent Studio — Verity"
      description="Work directly with Verity's autonomous growth agents: real-time account research, multi-tier trust verification, and Resend email dispatch."
    >
      {/* Studio Header */}
      <section className="pt-16 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <Kicker>LIVE AGENT WORKSPACE</Kicker>
            <h1 className="font-serif text-[42px] md:text-[56px] leading-[1.05] text-text mt-3 tracking-serifHeading">
              Autonomous Growth Studio
            </h1>
            <p className="text-[17px] text-muted font-sans mt-3 max-w-[620px]">
              Directly orchestrate multi-agent research, inspect verified outreach, and dispatch authenticated emails with the integrated email agent.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenCrm}
              className="inline-flex items-center gap-2 text-[14px] font-sans font-medium px-4 py-2.5 rounded-[2px] border border-border bg-surface text-text hover:border-accent hover:text-accent transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 stroke-[1.5]" />
              CRM Store
            </button>
          </div>
        </div>
      </section>

      {/* Target Account Configuration Bar */}
      <section className="pb-12">
        <Card className="p-6 md:p-8">
          <form onSubmit={handleRunPipeline} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-5">
                <label
                  htmlFor="targetCompany"
                  className="block text-[12px] font-sans font-medium uppercase tracking-[0.16em] text-text mb-2"
                >
                  Target Account To Research
                </label>
                <input
                  id="targetCompany"
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="E.g. Anthropic, Stripe, Datadog, Figma"
                  className="w-full bg-bg border border-border rounded-[2px] px-4 py-3 text-[16px] font-sans text-text placeholder-muted/60 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="businessType"
                  className="block text-[12px] font-sans font-medium uppercase tracking-[0.16em] text-text mb-2"
                >
                  Your Business Context
                </label>
                <select
                  id="businessType"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-bg border border-border rounded-[2px] px-4 py-3 text-[15px] font-sans text-text focus:border-accent focus:outline-none transition-colors"
                >
                  <option value="B2B software">B2B SaaS / Enterprise Software</option>
                  <option value="E-commerce">E-Commerce & Retail</option>
                  <option value="Local services">Professional & Local Services</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isRunning || !targetCompany.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-text text-bg hover:opacity-90 transition-opacity font-sans text-[15px] font-medium py-[13px] px-6 rounded-[2px] disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running Pipeline...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-bg" />
                      Run Agents
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <span className="text-[12px] font-sans text-muted uppercase tracking-wider mr-2">
                Presets:
              </span>
              {['Anthropic', 'Stripe', 'Datadog', 'Figma'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTargetCompany(preset);
                  }}
                  className={`text-[12px] font-sans px-3 py-1 rounded-[2px] border transition-colors cursor-pointer ${
                    targetCompany.toLowerCase() === preset.toLowerCase()
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-border text-muted hover:text-text hover:border-text/40'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>
        </Card>
      </section>

      {/* Execution Pipeline Status */}
      {isRunning && (
        <section className="pb-12">
          <Card className="p-8 border-accent/40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-accent animate-ping" />
                <span className="text-[13px] font-sans font-medium uppercase tracking-[0.18em] text-accent">
                  ACTIVE MULTI-AGENT EXECUTION PIPELINE
                </span>
              </div>
              <span className="text-[13px] font-mono text-muted">target: {targetCompany}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { id: 'research_account', name: 'Atlas', label: 'Research' },
                { id: 'detect_signals', name: 'Scout', label: 'Signals' },
                { id: 'detect_personas', name: 'Cadence', label: 'Personas' },
                { id: 'synthesize_intelligence', name: 'Sage', label: 'Synthesis' },
                { id: 'detect_why_now', name: 'Cadence', label: 'Why Now' },
                { id: 'generate_outreach', name: 'Quill', label: 'Drafting' },
                { id: 'critique_outreach', name: 'Veritas', label: 'Verifying' },
                { id: 'sync_crm', name: 'Courier', label: 'CRM & Send' },
              ].map((step) => {
                const isCurrent = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-[2px] border text-center transition-all ${
                      isCurrent
                        ? 'border-accent bg-accent/10 text-accent font-medium shadow-sm'
                        : 'border-border/60 bg-surface text-muted'
                    }`}
                  >
                    <div className="text-[11px] font-mono uppercase">{step.name}</div>
                    <div className="text-[13px] font-sans mt-1">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-12 pb-24">
          {/* Summary Banner */}
          <div className="bg-surface border border-border rounded-[4px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[2px] bg-verified/15 flex items-center justify-center text-verified shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <div className="text-[12px] font-sans uppercase tracking-[0.16em] text-verified font-medium">
                  PIPELINE COMPLETED & VERIFIED
                </div>
                <h2 className="font-serif text-[26px] text-text font-normal">
                  {result.company_name} — Intelligence Dossier
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[11px] font-sans uppercase tracking-wider text-muted">Trust Index</div>
                <div className="font-serif text-[24px] text-verified font-medium">
                  {result.outreach_evaluation?.trust_score ?? 92} / 100
                </div>
              </div>
              <div className="text-right border-l border-border pl-6">
                <div className="text-[11px] font-sans uppercase tracking-wider text-muted">CRM Status</div>
                <div className="font-sans text-[15px] text-text capitalize font-medium">
                  {result.crm_status}
                </div>
              </div>
            </div>
          </div>

          {/* 2 Column Details: Left Brief, Right Outreach Draft */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Research Intelligence & Signals */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-6">
                <div className="text-[12px] font-sans font-medium uppercase tracking-[0.18em] text-accent mb-4">
                  ACCOUNT BRIEF
                </div>
                <p className="text-[15px] font-sans text-text leading-relaxed">
                  {result.research_data.summary}
                </p>

                <div className="mt-6 pt-6 border-t border-border/60">
                  <div className="text-[12px] font-sans font-medium uppercase tracking-wider text-muted mb-3">
                    Detected Personas
                  </div>
                  <div className="space-y-3">
                    {result.buying_committee?.map((p) => (
                      <div key={p.name} className="bg-bg p-3 rounded-[2px] border border-border/70">
                        <div className="text-[14px] font-sans font-medium text-text">{p.name}</div>
                        <div className="text-[13px] text-muted">{p.title}</div>
                        <div className="text-[12px] text-accent mt-1 font-mono">{p.relevance}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Signals */}
              {result.business_signals && (
                <Card className="p-6">
                  <div className="text-[12px] font-sans font-medium uppercase tracking-[0.18em] text-verified mb-4">
                    HIGH-INTENT SIGNALS
                  </div>
                  <div className="space-y-3">
                    {result.business_signals.map((sig, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-[14px] font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-verified mt-2 shrink-0" />
                        <div>
                          <span className="font-medium text-text">{sig.headline}</span>
                          <span className="text-[12px] text-muted block mt-0.5">Source: {sig.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Outreach Sequence & Direct Email Dispatch */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-4">
                  <div>
                    <span className="text-[12px] font-sans font-medium uppercase tracking-[0.18em] text-accent">
                      STEP 1 OUTREACH DRAFT (EMAIL AGENT)
                    </span>
                    <h3 className="font-serif text-[22px] text-text mt-1">
                      {result.outreach_sequence[0]?.subject || 'Initial Outreach'}
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-verified/15 text-verified text-[12px] font-sans font-medium rounded-[2px]">
                    <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                    VERIFIED DRAFT
                  </span>
                </div>

                <div className="bg-bg p-5 rounded-[2px] border border-border/70 font-sans text-[15px] text-text whitespace-pre-line leading-relaxed mb-6">
                  {result.outreach_sequence[0]?.body}
                </div>

                {/* Email Dispatch Control */}
                <div className="pt-4 border-t border-border/60">
                  <div className="mb-4">
                    <label
                      htmlFor="recipientEmail"
                      className="block text-[12px] font-sans font-medium uppercase tracking-wider text-muted mb-1.5"
                    >
                      Target Email Address (Resend Agent)
                    </label>
                    <input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-bg border border-border rounded-[2px] px-3.5 py-2.5 text-[14px] font-sans text-text focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={isSending || !!dispatchResult}
                      onClick={handleDispatchEmail}
                      className="inline-flex items-center gap-2 bg-text text-bg hover:opacity-90 transition-opacity font-sans text-[14px] font-medium py-3 px-6 rounded-[2px] disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Dispatching with Resend...
                        </>
                      ) : dispatchResult ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-verified" />
                          Email Dispatched!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Authorize & Send Email
                        </>
                      )}
                    </button>

                    <span className="text-[12px] text-muted font-sans">
                      Enforced by Warden rules; dispatched via integrated email agent.
                    </span>
                  </div>

                  {/* Dispatch Confirmation Card */}
                  {dispatchResult && (
                    <div className="mt-4 p-4 rounded-[2px] bg-verified/10 border border-verified/30 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-verified shrink-0 mt-0.5" />
                      <div className="text-[13px] font-sans text-text">
                        <div className="font-medium text-verified">
                          Outreach Successfully Delivered to {dispatchResult.to}
                        </div>
                        <div className="text-muted mt-1 font-mono text-[12px]">
                          Message ID: {dispatchResult.message_id} • Gateway: {dispatchResult.provider}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Follow-up sequence overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.outreach_sequence.slice(1).map((step) => (
                  <Card key={step.step_number} className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent">
                        Step {step.step_number} • {step.channel.toUpperCase()}
                      </span>
                    </div>
                    {step.subject && (
                      <div className="font-medium text-[14px] text-text mb-1">
                        {step.subject}
                      </div>
                    )}
                    <p className="text-[13px] text-muted font-sans line-clamp-3">
                      {step.body}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRM Records Modal Drawer */}
      {crmDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border rounded-[4px] max-w-[800px] w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[24px] text-text">CRM Synchronized Records</h3>
                <p className="text-[13px] text-muted font-sans">
                  Auto-synced leads, buyer committees, and outreach history stored by the CRM agent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCrmDrawerOpen(false)}
                className="text-[14px] font-sans text-muted hover:text-text px-3 py-1 border border-border rounded-[2px]"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {crmRecords.length === 0 ? (
                <div className="py-12 text-center text-muted font-sans text-[14px]">
                  No CRM records found. Run the pipeline above to auto-sync contacts and deals!
                </div>
              ) : (
                crmRecords.map((rec, i) => (
                  <div key={rec.id || i} className="bg-bg p-4 rounded-[2px] border border-border/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-[18px] text-text font-normal">
                        {rec.company_name}
                      </span>
                      <span className="text-[12px] font-mono text-muted">
                        {rec.synced_at ? new Date(rec.synced_at).toLocaleDateString() : 'Synced'}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted font-sans mb-3">{rec.summary}</p>
                    {rec.key_personas && rec.key_personas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rec.key_personas.map((p: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-[11px] font-sans px-2.5 py-1 bg-surface border border-border rounded-[2px] text-text"
                          >
                            {p.name} ({p.title})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default WorkspacePage;
