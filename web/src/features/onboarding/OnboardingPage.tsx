import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { BusinessProfileForm } from './BusinessProfileForm';
import { KnowledgeBaseUploader } from './KnowledgeBaseUploader';
import { SampleBusinessSelector } from './SampleBusinessSelector';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { BusinessProfile } from '../../api/types';
import { Sparkles, AlertTriangle, Play, ArrowRight, ShieldCheck } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeBusinessId, setActiveBusinessId, setActiveRunId, addToast } = useAppStore();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses(),
  });

  const activeBusiness =
    businesses.find((b) => b.id === activeBusinessId) || businesses[0];

  const startCleanRunMutation = useMutation({
    mutationFn: () => api.startRun(activeBusinessId, null, false),
    onSuccess: (newRunId) => {
      setActiveRunId(newRunId);
      queryClient.invalidateQueries();
      navigate(`/run/${newRunId}`);
      addToast({
        type: 'success',
        title: 'Clean Verified Run Started',
        message: '100% verified against approved documents.',
      });
    },
  });

  const startFlawedRunMutation = useMutation({
    mutationFn: () => api.startRun(activeBusinessId, null, true),
    onSuccess: (newRunId) => {
      setActiveRunId(newRunId);
      queryClient.invalidateQueries();
      navigate(`/run/${newRunId}/review`);
      addToast({
        type: 'warning',
        title: 'Planted-Flaw Demo Initiated',
        message: '3 factual discrepancies flagged for Veritas and Warden review.',
      });
    },
  });

  const switchMutation = useMutation({
    mutationFn: (id: string) => api.switchBusiness(id),
    onSuccess: (biz) => {
      setActiveBusinessId(biz.id);
      queryClient.invalidateQueries();
      addToast({
        type: 'info',
        title: `Switched to ${biz.name}`,
        message: `Loaded ${biz.industry} governance model.`,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (updated: BusinessProfile) => api.updateBusinessProfile(updated),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  if (isLoading || !activeBusiness) {
    return (
      <div className="p-8 max-w-[1280px] mx-auto space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="h-[600px] lg:col-span-6" />
          <Skeleton className="h-[600px] lg:col-span-6" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={activeBusiness.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-8 max-w-[1280px] mx-auto space-y-8"
    >
      {/* Clean Minimalist Hero */}
      <div className="glass-panel border border-accent/25 rounded-2xl p-7 sm:p-9 relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-40 bg-accent/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-accent bg-accent-soft px-3 py-1 rounded-full border border-accent/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Zero-Hallucination AI Outreach
            </span>
            <span className="text-xs text-text-muted">
              Database: <strong className="text-text">Supabase Cloud</strong>
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-text font-light tracking-tight">
            AI Sales Outreach, 100% Fact-Checked
          </h1>

          <p className="text-sm text-text-muted leading-relaxed">
            Most AI sales agents hallucinate fake certifications, wrong prices, and false delivery promises.
            Verity audits every outbound sentence against your uploaded company documents before anything leaves the building.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto flex-shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/run/run_flawed_demo/review')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shadow-[0_0_24px_rgba(212,175,55,0.35)] justify-center font-medium"
          >
            Try Fact-Check Demo (Fix 3 Mistakes)
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/run/run_flawed_demo')}
            className="justify-center"
            leftIcon={<Play className="w-4 h-4 text-accent" />}
          >
            View 10-Agent Pipeline
          </Button>
        </div>
      </div>

      {/* Model Selector Cards (B2B SaaS, E-Commerce, Local Services) */}
      <SampleBusinessSelector
        businesses={businesses}
        activeBusinessId={activeBusiness.id}
        onSelect={(id) => switchMutation.mutate(id)}
      />

      {/* Split Layout: Business Profile Form (Left 6 Cols) & Knowledge Base (Right 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <BusinessProfileForm
            initialProfile={activeBusiness}
            onSave={(updated) => saveMutation.mutate(updated)}
            isSaving={saveMutation.isPending}
          />
        </div>

        <div className="lg:col-span-6">
          <KnowledgeBaseUploader documents={activeBusiness.documents} />
        </div>
      </div>
    </motion.div>
  );
};
