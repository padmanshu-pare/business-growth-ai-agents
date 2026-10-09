import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Button } from './Button';
import { Menu, X } from 'lucide-react';

export const Nav: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/how', label: 'How it works' },
    { to: '/agents', label: 'Agents' },
    { to: '/trust', label: 'Trust' },
    { to: '/industries', label: 'Industries' },
    { to: '/workspace', label: 'Studio' },
  ];

  return (
    <header className="w-full border-b border-border bg-bg/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          to="/"
          className="font-serif text-[26px] font-light text-accent tracking-[-0.02em] select-none hover:opacity-90 transition-opacity"
          aria-label="Verity Home"
        >
          Verity
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-[15px] font-sans transition-colors ${
                  isActive ? 'text-accent font-medium' : 'text-text hover:text-accent'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Action */}
        <div className="hidden md:flex items-center">
          <Button variant="primary" size="sm" to="/workspace">
            Work with Agents
          </Button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-text hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-bg px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `text-[17px] font-sans py-1 transition-colors ${
                    isActive ? 'text-accent font-medium' : 'text-text'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="pt-2">
            <Button variant="primary" size="sm" to="/workspace" className="w-full" onClick={() => setMobileOpen(false)}>
              Work with Agents
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
