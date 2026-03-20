'use client';

import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('./Globe'), { ssr: false });

const trustBadges = [
  {
    title: 'Nastavení do 5 minut',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07" />
      </svg>
    ),
  },
  {
    title: '7 dní Medium zdarma',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
        <path d="M12 13v3" />
        <circle cx="12" cy="12" r="1" fill="#00BFFF" />
      </svg>
    ),
  },
  {
    title: 'Podpora v češtině',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Váš vlastní CRM systém',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-110px)] flex items-center overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Top-left purple */}
        <div
          className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(123,47,255,0.18) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Center purple mid */}
        <div
          className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(123,47,255,0.09) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Right cyan */}
        <div
          className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,191,255,0.14) 0%, transparent 65%)',
            filter: 'blur(90px)',
          }}
        />
        {/* Bottom-right cyan */}
        <div
          className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,191,255,0.1) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Globe – positioned absolutely, right-aligned and partially clipped */}
      <div
        className="absolute top-1/2 right-[-80px] lg:right-[-120px] -translate-y-[45%] pointer-events-none"
        aria-hidden="true"
        style={{ width: '560px', height: '560px', position: 'absolute' }}
      >
        <Globe />

      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full py-20 lg:py-28">
        {/* Left copy — constrained width so globe shows on right */}
        <div className="flex flex-col items-start max-w-xl lg:max-w-2xl">

          {/* Pre-badge — transparent bg, cyan border */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 animate-fade-in-up"
            style={{
              background: 'transparent',
              border: '1px solid #00BFFF',
              color: '#00BFFF',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#00BFFF' }}
            />
            CRM pro moderní české firmy
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-5 animate-fade-in-up-d1"
            style={{ color: '#ffffff' }}
          >
            Tvůj byznys si zaslouží{' '}
            <span className="gradient-text">systém.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg sm:text-xl leading-relaxed mb-8 max-w-lg animate-fade-in-up-d2"
            style={{ color: 'rgba(237,237,237,0.6)' }}
          >
            Zákazníci, obchody i tým přehledně na jednom místě.{' '}
            <span style={{ color: 'rgba(237,237,237,0.85)' }}>
              Konečně bez chaosu.
            </span>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 mb-10 animate-fade-in-up-d3">
            <a
              href="/onboarding"
              className="btn-cyan inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold"
            >
              Začít zdarma
              <span>→</span>
            </a>
            <a
              href="#funkce"
              className="btn-outline inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold"
            >
              Zobrazit funkce
            </a>
          </div>

          {/* Trust badges — horizontal row */}
          <div className="flex flex-wrap gap-3 animate-fade-in-up-d3">
            {trustBadges.map((badge) => (
              <div
                key={badge.title}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="flex-shrink-0 flex items-center justify-center">{badge.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'rgba(237,237,237,0.75)' }}>
                  {badge.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
