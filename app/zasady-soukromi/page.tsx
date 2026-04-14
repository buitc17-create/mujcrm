import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Zásady soukromí a cookies',
  description: 'Jak MujCRM používá cookies a sledovací technologie. Nezbytné, analytické a marketingové cookies – správa souhlasu a kontaktní informace.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.mujcrm.cz/zasady-soukromi' },
};

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav className="flex items-center gap-2 text-xs mb-10" style={{ color: 'rgba(237,237,237,0.4)' }}>
      <a href="/" className="link-muted">Domů</a>
      <span>/</span>
      <span style={{ color: 'rgba(237,237,237,0.7)' }}>{current}</span>
    </nav>
  );
}

export default function ZasadySoukromiPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <Breadcrumb current="Zásady soukromí" />

        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Právní dokumenty
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Zásady soukromí a cookies
          </h1>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            Datum účinnosti: 1. dubna 2026
          </p>
        </div>

        <div className="flex flex-col gap-10" style={{ color: 'rgba(237,237,237,0.65)' }}>

          <Section title="1. Úvod">
            <p>
              Tato stránka vysvětluje, jak Tomáš Vydra (provozovatel služby MujCRM) používá cookies a podobné sledovací technologie,
              jaké informace shromažďujeme a jak s nimi nakládáme. Podrobné informace o zpracování
              osobních údajů najdete v našem{' '}
              <Link href="/gdpr">dokumentu GDPR</Link>.
            </p>
          </Section>

          <Section title="2. Co jsou cookies">
            <p>
              Cookies jsou malé textové soubory ukládané do vašeho prohlížeče při návštěvě webové stránky.
              Pomáhají nám zapamatovat si vaše preference, udržovat přihlášení a analyzovat provoz.
              Cookies samy o sobě nemohou spustit žádný kód ani přenášet viry.
            </p>
          </Section>

          <Section title="3. Jaké cookies používáme">
            <div className="flex flex-col gap-4">
              <CookieCard
                type="Nezbytné cookies"
                color="#22c55e"
                badge="Vždy aktivní"
                examples={[
                  { name: 'sb-auth-token', purpose: 'Udržuje přihlášení do aplikace (Supabase)' },
                  { name: 'csrf-token', purpose: 'Ochrana před CSRF útoky' },
                  { name: '__stripe_mid', purpose: 'Bezpečnostní token pro platební bránu Stripe' },
                ]}
                note="Bez těchto cookies nelze aplikaci používat. Nelze je vypnout."
              />
              <CookieCard
                type="Analytické cookies"
                color="#00BFFF"
                badge="Volitelné"
                examples={[
                  { name: '_ga, _gid', purpose: 'Google Analytics – anonymizovaná statistika návštěvnosti' },
                  { name: 'mujcrm_session', purpose: 'Interní měření průchodu onboardingem a aktivace funkcí' },
                ]}
                note="Pomáhají nám zlepšovat produkt. Aktivujeme je pouze s vaším souhlasem."
              />
              <CookieCard
                type="Marketingové cookies"
                color="#7B2FFF"
                badge="Volitelné"
                examples={[
                  { name: '_fbp', purpose: 'Facebook Pixel – sledování konverzí z reklam' },
                  { name: '_gcl_au', purpose: 'Google Ads – měření efektivity reklamních kampaní' },
                ]}
                note="Používáme je pouze s vaším výslovným souhlasem přes cookie banner."
              />
            </div>
          </Section>

          <Section title="4. Jak cookies spravovat a vypnout">
            <p>Souhlas s nepovinným cookies lze spravovat několika způsoby:</p>
            <ul>
              <li><strong className="text-white">Cookie banner</strong> – při první návštěvě zobrazujeme lištu s možností výběru.</li>
              <li><strong className="text-white">Nastavení prohlížeče</strong> – většina prohlížečů umožňuje blokování nebo mazání cookies v nastavení soukromí.</li>
              <li><strong className="text-white">Opt-out nástroje:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  <li>Google Analytics: <Link href="https://tools.google.com/dlpage/gaoptout">tools.google.com/dlpage/gaoptout</Link></li>
                  <li>Facebook: Nastavení reklam ve vašem Facebook účtu</li>
                </ul>
              </li>
            </ul>
            <p>
              Upozorňujeme, že vypnutí analytických nebo marketingových cookies neovlivní funkčnost
              samotné aplikace MujCRM.
            </p>
          </Section>

          <Section title="5. Třetí strany a jejich cookies">
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                ['Supabase', 'Autentizace a databáze', 'Nezbytné', 'supabase.com/privacy'],
                ['Stripe', 'Platební brána', 'Nezbytné', 'stripe.com/privacy'],
                ['Google Analytics', 'Analytika návštěvnosti', 'Analytické', 'policies.google.com/privacy'],
                ['Vercel', 'Hosting a CDN', 'Nezbytné', 'vercel.com/legal/privacy-policy'],
              ].map(([vendor, purpose, type, privacy], i, arr) => (
                <div
                  key={vendor}
                  className="grid grid-cols-[1fr_1fr_90px] gap-3 px-5 py-3.5 text-sm"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  }}
                >
                  <span>
                    <span className="font-semibold" style={{ color: 'rgba(237,237,237,0.85)' }}>{vendor}</span>
                    <br />
                    <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>{purpose}</span>
                  </span>
                  <span style={{ color: 'rgba(237,237,237,0.5)' }}>
                    <Link href={`https://${privacy}`}>{privacy}</Link>
                  </span>
                  <span className="text-xs" style={{ color: type === 'Nezbytné' ? '#22c55e' : '#00BFFF' }}>{type}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="6. Kontakt">
            <p>
              Máte-li dotazy k cookies nebo zpracování osobních údajů, kontaktujte nás:
            </p>
            <div
              className="rounded-xl px-5 py-4 text-sm leading-relaxed"
              style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.12)' }}
            >
              <strong className="text-white">Tomáš Vydra</strong><br />
              IČO: 87149222<br />
              Místo podnikání: K Vinařické hoře 1668, 273 09 Kladno<br />
              E-mail: <Link href="mailto:info@mujcrm.cz">info@mujcrm.cz</Link><br />
              Více o ochraně osobních údajů: <Link href="/gdpr">GDPR dokument</Link>
            </div>
          </Section>

        </div>

        <div className="mt-14 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <a href="/" className="link-back inline-flex items-center gap-2 text-sm font-medium">
            ← Zpět na hlavní stránku
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ color: '#00BFFF' }} className="underline underline-offset-2">
      {children}
    </a>
  );
}

function CookieCard({
  type, color, badge, examples, note
}: {
  type: string;
  color: string;
  badge: string;
  examples: { name: string; purpose: string }[];
  note: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-white">{type}</span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: color + '15', color }}
        >
          {badge}
        </span>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {examples.map((ex) => (
          <div key={ex.name} className="grid grid-cols-[140px_1fr] gap-2 text-xs">
            <code
              className="px-2 py-0.5 rounded font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', color: color }}
            >
              {ex.name}
            </code>
            <span style={{ color: 'rgba(237,237,237,0.5)' }}>{ex.purpose}</span>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>{note}</p>
    </div>
  );
}
