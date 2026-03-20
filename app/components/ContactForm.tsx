'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [gdpr, setGdpr] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,191,255,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Kontakt
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Napište nám
          </h2>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.5)' }}>
            Odpovídáme obvykle do 24 hodin v pracovní dny.
          </p>
        </div>

        {sent ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.2)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(0,191,255,0.15)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Zpráva odeslána!</h3>
            <p className="text-sm" style={{ color: 'rgba(237,237,237,0.55)' }}>
              Ozveme se vám brzy. Díky za zájem o MujCRM.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-8 flex flex-col gap-5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>
                  Jméno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jan Novák"
                  className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ededed',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jan@firma.cz"
                  className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ededed',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>
                Firma
              </label>
              <input
                type="text"
                placeholder="Vaše firma s.r.o."
                className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ededed',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>
                Zpráva *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Jak vám můžeme pomoci?"
                className="rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ededed',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                className="relative mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: gdpr ? 'rgba(0,191,255,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${gdpr ? 'rgba(0,191,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  transition: 'all 0.15s',
                }}
              >
                {gdpr && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <input
                  type="checkbox"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  checked={gdpr}
                  onChange={e => setGdpr(e.target.checked)}
                />
              </div>
              <span className="text-xs leading-relaxed" style={{ color: 'rgba(237,237,237,0.5)' }}>
                Souhlasím se zpracováním osobních údajů dle{' '}
                <a href="#" style={{ color: '#00BFFF' }} className="underline underline-offset-2">
                  Zásad ochrany soukromí
                </a>{' '}
                za účelem odpovědi na můj dotaz.
              </span>
            </label>

            <button
              type="submit"
              disabled={!gdpr}
              className="btn-cyan inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Odeslat zprávu
              <span>→</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
