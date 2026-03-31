'use client';

import { useState } from 'react';

const navLinks = [
  { label: 'Funkce', href: '/#funkce' },
  { label: 'Ceník', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Podpora', href: '/#podpora' },
  { label: 'Kontakt', href: '/#kontakt' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav-glass sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}
          >
            M
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Muj<span style={{ color: '#00BFFF' }}>CRM</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(237,237,237,0.65)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(237,237,237,0.65)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/auth/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ color: 'rgba(237,237,237,0.7)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(237,237,237,0.7)')}
          >
            Přihlásit se
          </a>
          <a
            href="/onboarding"
            className="btn-cyan text-sm px-5 py-2 rounded-lg"
          >
            Zkusit zdarma
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ background: '#ededed', transform: menuOpen ? 'rotate(45deg) translate(3px, 3px)' : '' }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ background: '#ededed', opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ background: '#ededed', transform: menuOpen ? 'rotate(-45deg) translate(3px, -3px)' : '' }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium py-1"
              style={{ color: 'rgba(237,237,237,0.7)' }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <a href="/auth/login" className="text-sm font-medium" style={{ color: 'rgba(237,237,237,0.7)' }}>
              Přihlásit se
            </a>
            <a href="/onboarding" className="btn-cyan text-sm px-5 py-2.5 rounded-lg text-center">
              Zkusit zdarma
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
