import React from 'react';
import { ArrowRight, ArrowUpRight, Bot, Check, CircleDot, Compass, Layers3, ShieldCheck, Sparkles, Target, Workflow, Zap, Command } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { Reveal } from '../components/Reveal';

const capabilities = [
  { n: '01', title: 'Discover', label: 'Research & intelligence', text: 'Find useful signals, research opportunities, and turn scattered information into a clearer next move.', icon: Compass, tone: 'blue' },
  { n: '02', title: 'Plan', label: 'Strategy & prioritization', text: 'Connect business goals to focused actions so your team knows what deserves attention first.', icon: Target, tone: 'cyan' },
  { n: '03', title: 'Execute', label: 'Content & workflows', text: 'Move from recommendations to reviewable drafts and coordinated workflows, with you in control.', icon: Workflow, tone: 'violet' },
];

export const HomePage: React.FC = () => (
  <PageShell theme="growthx" title="GrowthX — Turn intelligence into growth" description="A coordinated AI growth team to help businesses research, plan, and execute their next move—with people in control.">
    <div className="growthx-home">
      <section className="growthx-hero relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-4">
        <div className="relative z-10 max-w-[650px]">
          <Reveal>
            <div className="growthx-eyebrow inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <span className="growthx-live-dot" /> Your AI growth team
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-7 text-[clamp(3.25rem,7vw,6.4rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-white">
              Make your next <span className="growthx-gradient-text block">move count.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-7 max-w-[550px] text-base leading-8 text-slate-300 md:text-lg">
              GrowthX brings AI agents together to help you understand your business, find opportunities, and turn strategy into action.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/workspace" className="growthx-cta group">Explore GrowthX <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>
              <Button variant="ghost" to="/how" className="growthx-secondary-cta">See how it works <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> Human-guided workflows</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> One connected workspace</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="growthx-visual relative mx-auto aspect-square w-full max-w-[570px]" aria-label="Abstract visualization of connected AI agents" role="img">
            <div className="growthx-visual-grid" />
            <div className="growthx-orbit growthx-orbit-one" />
            <div className="growthx-orbit growthx-orbit-two" />
            <div className="growthx-orbit growthx-orbit-three" />
            <div className="growthx-orbit growthx-orbit-four" />
            <div className="growthx-orbit-node node-top"><Sparkles size={17} /></div>
            <div className="growthx-orbit-node node-right"><Compass size={17} /></div>
            <div className="growthx-orbit-node node-bottom"><Workflow size={17} /></div>
            <div className="growthx-orbit-node node-left"><Target size={17} /></div>
            <div className="growthx-orbit-node node-upper-left"><Layers3 size={15} /></div>
            <div className="growthx-orbit-node node-lower-right"><ShieldCheck size={15} /></div>
            <div className="growthx-core-halo" />
            <div className="growthx-core">
              <div className="growthx-core-icon"><Command size={27} strokeWidth={1.6} /></div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">GrowthX</span>
              <span className="mt-1 text-xs text-slate-300">Intelligence hub</span>
            </div>
            <div className="growthx-float-label growthx-label-left"><span className="growthx-mini-dot" /> Research</div>
            <div className="growthx-float-label growthx-label-right"><span className="growthx-mini-dot cyan" /> Strategy</div>
            <div className="growthx-float-label growthx-label-bottom"><span className="growthx-mini-dot blue" /> Execution</div>
            <div className="growthx-visual-caption">
              <span className="flex items-center gap-2"><CircleDot className="h-3.5 w-3.5 text-cyan-300" /> AGENTS, CONNECTED</span>
              <span className="text-slate-500">A coordinated system, not another silo</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="growthx-value-strip grid grid-cols-1 gap-5 border-y py-7 sm:grid-cols-3 sm:gap-8">
        {[
          { icon: Bot, title: 'A team of agents', copy: 'Specialized roles working toward shared goals.' },
          { icon: Layers3, title: 'One connected flow', copy: 'Research, planning, and execution in one place.' },
          { icon: ShieldCheck, title: 'You stay in control', copy: 'Review important actions before they move forward.' },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.title} className="flex items-start gap-3"><div className="growthx-strip-icon"><Icon size={18} /></div><div><h2 className="text-sm font-semibold text-white">{item.title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{item.copy}</p></div></div>;
        })}
      </section>

      <section className="py-20 md:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <p className="growthx-section-kicker">LESS FRAGMENTATION. MORE MOMENTUM.</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] text-white md:text-5xl">Stop stitching tools together.<span className="growthx-gradient-text block">Start moving as one.</span></h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">Growth work often gets scattered across research tabs, documents, and disconnected tasks. GrowthX gives that work a shared starting point and a clearer path forward.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return <Reveal key={item.n} delay={index * 0.1}><article className="growthx-agent-card group h-full rounded-2xl border p-6 md:p-7"><div className="flex items-start justify-between"><div className={`growthx-agent-icon ${item.tone}`}><Icon size={21} strokeWidth={1.7} /></div><span className="text-xs font-medium tracking-[0.16em] text-slate-600">{item.n}</span></div><p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{item.label}</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{item.text}</p><div className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors group-hover:text-cyan-200">Built to work together <ArrowUpRight size={15} /></div></article></Reveal>;
          })}
        </div>
      </section>

      <section className="growthx-process rounded-3xl border p-7 md:p-12">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><p className="growthx-section-kicker">A CLEARER WAY FORWARD</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-4xl">From question to next step.</h2><p className="mt-4 max-w-md text-sm leading-7 text-slate-400">Start with a goal. Let the right tools and agents help shape the work. Review the output and decide what happens next.</p><Button to="/how" variant="ghost" className="growthx-secondary-cta mt-7">Explore the workflow <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { n: '01', title: 'Set direction', text: 'Define the business goal.', icon: Target },
                { n: '02', title: 'Coordinate', text: 'Bring research and planning together.', icon: Workflow },
                { n: '03', title: 'Move forward', text: 'Review output and choose the next action.', icon: Zap },
              ].map((step) => { const Icon = step.icon; return <div key={step.n} className="growthx-step rounded-xl border p-5"><span className="text-xs font-semibold tracking-[0.18em] text-slate-600">{step.n}</span><Icon className="my-7 h-6 w-6 text-cyan-300" strokeWidth={1.6} /><h3 className="text-sm font-semibold text-white">{step.title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{step.text}</p></div>; })}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="py-20 text-center md:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl"><div className="growthx-cta-orb mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl"><Sparkles size={24} /></div><p className="growthx-section-kicker">YOUR NEXT CHAPTER STARTS HERE</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Give your growth work a command center.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">Explore the GrowthX workspace and see how a connected AI growth team can fit into your process.</p><Button to="/workspace" className="growthx-cta group mt-8">Explore GrowthX <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></div>
        </Reveal>
      </section>
    </div>
  </PageShell>
);
