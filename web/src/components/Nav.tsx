import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Button } from './Button';
import { Menu, X, Sparkles } from 'lucide-react';

interface NavProps { theme?: 'default' | 'growthx'; }

export const Nav: React.FC<NavProps> = ({ theme = 'default' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isGrowthX = theme === 'growthx';
  const navLinks = [
    { to: '/how', label: 'How it works' },
    { to: '/agents', label: 'AI Agents' },
    { to: '/trust', label: 'Trust' },
    { to: '/industries', label: 'Industries' },
  ];

  return (
    <header className={`w-full border-b border-border bg-bg/90 backdrop-blur-sm sticky top-0 z-40 ${isGrowthX ? 'growthx-nav' : ''}`}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
        <Link to="/" className={`inline-flex items-center gap-2 font-sans text-[22px] font-semibold tracking-[-0.055em] select-none hover:opacity-90 transition-opacity ${isGrowthX ? 'text-white' : 'font-serif text-accent'}`} aria-label={isGrowthX ? 'GrowthX Home' : 'Verity Home'}>
          {isGrowthX && <span className="growthx-brand-mark"><Sparkles size={16} /></span>}
          {isGrowthX ? 'GrowthX' : 'Verity'}
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `text-[14px] font-sans transition-colors ${isActive ? 'text-accent font-medium' : 'text-text hover:text-accent'}`}>{link.label}</NavLink>)}
        </nav>
        <div className="hidden md:flex items-center"><Button variant="primary" size="sm" to="/workspace" className={isGrowthX ? 'growthx-cta' : ''}>{isGrowthX ? 'Get started' : 'Work with Agents'}</Button></div>
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text hover:text-accent focus-visible:outline-2 focus-visible:outline-accent" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
        </button>
      </div>
      {mobileOpen && <div className="md:hidden border-b border-border bg-bg px-6 py-6 space-y-4"><nav className="flex flex-col space-y-4">{navLinks.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-[17px] font-sans py-1 transition-colors ${isActive ? 'text-accent font-medium' : 'text-text'}`}>{link.label}</NavLink>)}</nav><div className="pt-2"><Button variant="primary" size="sm" to="/workspace" className={`w-full ${isGrowthX ? 'growthx-cta' : ''}`} onClick={() => setMobileOpen(false)}>{isGrowthX ? 'Get started' : 'Work with Agents'}</Button></div></div>}
    </header>
  );
};
