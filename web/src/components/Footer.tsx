import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps { theme?: 'default' | 'growthx'; }

export const Footer: React.FC<FooterProps> = ({ theme = 'default' }) => {
  const isGrowthX = theme === 'growthx';
  return (
    <footer className={`w-full border-t border-border bg-bg mt-auto ${isGrowthX ? 'growthx-footer' : ''}`}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link to="/" className={`font-sans text-[20px] font-semibold tracking-[-0.05em] select-none hover:opacity-90 transition-opacity ${isGrowthX ? 'text-white' : 'font-serif text-accent'}`}>{isGrowthX ? 'GrowthX' : 'Verity'}</Link>
        <p className="text-[13px] font-sans text-muted tracking-normal">{isGrowthX ? 'A connected AI growth team. You stay in control.' : 'Nothing leaves without your approval. Demo site, synthetic data.'}</p>
      </div>
    </footer>
  );
};
