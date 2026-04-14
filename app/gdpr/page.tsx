import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'GDPR – Ochrana osobních údajů',
  description: 'Informace o zpracování osobních údajů v souladu s nařízením GDPR (EU 2016/679) a zákonem č. 110/2019 Sb. pro uživatele CRM systému MujCRM.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.mujcrm.cz/gdpr' },
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

export default function GdprPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <Breadcrumb current="GDPR" />

        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Právní dokumenty
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Ochrana osobních údajů
          </h1>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            Datum účinnosti: 1. dubna 2026 &nbsp;·&nbsp; Nařízení EU 2016/679 (GDPR) + zákon č. 110/2019 Sb.
          </p>
        </div>

        <div className="flex flex-col gap-10" style={{ color: 'rgba(237,237,237,0.65)' }}>

          <Section title="1. Správce osobních údajů">
            <p>Správcem osobních údajů ve smyslu čl. 4 odst. 7 GDPR je:</p>
            <InfoBox>
              <strong className="text-white">Tomáš Vydra</strong><br />
              IČO: 87149222<br />
              Místo podnikání: K Vinařické hoře 1668, 273 09 Kladno<br />
              E-mail: <Link href="mailto:info@mujcrm.cz">info@mujcrm.cz</Link><br />
              Kontakt pro GDPR: <Link href="mailto:info@mujcrm.cz">info@mujcrm.cz</Link>
            </InfoBox>
            <p>
              Správce nejmenoval pověřence pro ochranu osobních údajů, neboť mu tato povinnost nevzniká.
              Veškeré dotazy týkající se zpracování osobních údajů zasílejte na výše uvedený e-mail.
            </p>
          </Section>

          <Section title="2. Jaké osobní údaje zpracováváme">
            <p>V závislosti na způsobu využívání naší služby zpracováváme následující kategorie osobních údajů:</p>
            <Table rows={[
              ['Identifikační údaje', 'Jméno, příjmení, název společnosti, IČO, DIČ'],
              ['Kontaktní údaje', 'E-mailová adresa, telefonní číslo, korespondenční adresa'],
              ['Přihlašovací údaje', 'E-mailová adresa, hashované heslo (nikdy v čitelné podobě)'],
              ['Provozní data CRM', 'Zákazníci, obchody, poznámky, tagy a další data zadaná do systému'],
              ['Technické a síťové údaje', 'IP adresa, typ prohlížeče, operační systém, časové razítko přístupu'],
              ['Platební údaje', 'Číslo karty a citlivé platební informace neukládáme – zpracovává je výhradně Stripe, Inc.'],
              ['Cookies', 'Viz sekce 8 – Cookies a analytika'],
            ]} />
          </Section>

          <Section title="3. Účel a právní základ zpracování">
            <p>Vaše osobní údaje zpracováváme výhradně pro níže uvedené účely a na základě odpovídajícího právního titulu dle čl. 6 GDPR:</p>
            <Table rows={[
              ['Plnění smlouvy (čl. 6 odst. 1 písm. b)', 'Poskytování služby MujCRM, správa účtu, fakturace, zákaznická podpora'],
              ['Oprávněný zájem (čl. 6 odst. 1 písm. f)', 'Bezpečnost systému, prevence podvodů, zlepšování produktu, interní statistiky'],
              ['Plnění právní povinnosti (čl. 6 odst. 1 písm. c)', 'Uchovávání daňových dokladů dle zákona o účetnictví (10 let)'],
              ['Souhlas (čl. 6 odst. 1 písm. a)', 'Zasílání marketingových e-mailů a newsletterů – pouze s vaším výslovným souhlasem'],
            ]} />
          </Section>

          <Section title="4. Doba uchování osobních údajů">
            <ul>
              <li><strong className="text-white">Údaje aktivního účtu</strong> – po celou dobu trvání smluvního vztahu.</li>
              <li><strong className="text-white">Po zrušení účtu</strong> – data jsou anonymizována nebo trvale smazána do 30 dnů, pokud zákon nevyžaduje delší uchování.</li>
              <li><strong className="text-white">Daňové doklady a fakturační záznamy</strong> – 10 let dle zákona č. 563/1991 Sb. o účetnictví.</li>
              <li><strong className="text-white">Záznamy přihlášení a bezpečnostní logy</strong> – 12 měsíců.</li>
              <li><strong className="text-white">Marketingový souhlas</strong> – do odvolání souhlasu, nejdéle 3 roky od udělení.</li>
            </ul>
          </Section>

          <Section title="5. Práva subjektu údajů">
            <p>V souladu s GDPR máte tato práva:</p>
            <ul>
              <li><strong className="text-white">Právo na přístup (čl. 15)</strong> – máte právo získat potvrzení, zda zpracováváme vaše osobní údaje, a pokud ano, přístup k nim.</li>
              <li><strong className="text-white">Právo na opravu (čl. 16)</strong> – máte právo požadovat opravu nepřesných nebo neúplných osobních údajů.</li>
              <li><strong className="text-white">Právo na výmaz / „být zapomenut" (čl. 17)</strong> – za určitých podmínek můžete požadovat smazání vašich osobních údajů.</li>
              <li><strong className="text-white">Právo na omezení zpracování (čl. 18)</strong> – máte právo požadovat, abychom dočasně omezili zpracování vašich dat.</li>
              <li><strong className="text-white">Právo na přenositelnost (čl. 20)</strong> – máte právo obdržet vaše osobní údaje ve strukturovaném, strojově čitelném formátu (CSV/JSON).</li>
              <li><strong className="text-white">Právo vznést námitku (čl. 21)</strong> – máte právo vznést námitku proti zpracování na základě oprávněného zájmu.</li>
              <li><strong className="text-white">Právo odvolat souhlas</strong> – pokud je zpracování založeno na souhlasu, můžete jej kdykoliv odvolat, aniž by tím byla dotčena zákonnost předchozího zpracování.</li>
            </ul>
            <p>
              Pro uplatnění jakéhokoli práva kontaktujte nás na{' '}
              <Link href="mailto:info@mujcrm.cz">info@mujcrm.cz</Link>.
              Na vaši žádost odpovíme bez zbytečného odkladu, nejpozději do 30 dnů.
            </p>
          </Section>

          <Section title="6. Předávání dat třetím stranám">
            <p>Vaše data neprodáváme. Se třetími stranami sdílíme pouze minimum údajů nezbytných pro provoz služby:</p>
            <Table rows={[
              ['Supabase / AWS (Frankfurt, EU)', 'Databázová infrastruktura a autentizace. Data jsou uložena výhradně v EU.'],
              ['Vercel, Inc. (USA)', 'Hostování webové aplikace. Předávání probíhá na základě standardních smluvních doložek EU–USA.'],
              ['Stripe, Inc. (USA)', 'Zpracování plateb. Stripe je držitelem certifikace PCI DSS Level 1. Citlivé platební údaje k nám nikdy nedorazí.'],
            ]} />
            <p>
              Všichni zpracovatelé jsou smluvně zavázáni k ochraně osobních údajů a plnění požadavků GDPR.
              Přehled zpracovatelů je dostupný na vyžádání.
            </p>
          </Section>

          <Section title="7. Zabezpečení osobních údajů">
            <ul>
              <li>Šifrování při přenosu: TLS 1.3</li>
              <li>Šifrování dat v klidu: AES-256</li>
              <li>Hesla jsou hashována algoritmem bcrypt – nikdy nejsou uložena v čitelné podobě</li>
              <li>Přístup k datům je řízen rolemi (RBAC) a logován</li>
              <li>Pravidelné bezpečnostní audity a zálohy</li>
              <li>Serverová infrastruktura je umístěna v EU (Frankfurt)</li>
            </ul>
          </Section>

          <Section title="8. Cookies a analytika">
            <p>Naše aplikace využívá tyto kategorie cookies:</p>
            <Table rows={[
              ['Nezbytné', 'Session cookies, autentizační tokeny. Bez nich aplikace nefunguje. Nelze odmítnout.'],
              ['Analytické', 'Anonymizovaná data o používání stránky pro zlepšení produktu. Aktivní pouze se souhlasem.'],
              ['Marketingové', 'Retargeting a konverzní sledování. Aktivní pouze s výslovným souhlasem.'],
            ]} />
            <p>
              Souhlas s nepovinným cookies můžete kdykoliv odvolat přes nastavení v zápatí stránky,
              nebo přímo v nastavení vašeho prohlížeče.
            </p>
          </Section>

          <Section title="9. Stížnost u dozorového úřadu">
            <p>
              Pokud se domníváte, že zpracováváme vaše osobní údaje v rozporu s GDPR nebo českou legislativou,
              máte právo podat stížnost u dozorového úřadu:
            </p>
            <InfoBox>
              <strong className="text-white">Úřad pro ochranu osobních údajů (ÚOOÚ)</strong><br />
              Pplk. Sochora 27, 170 00 Praha 7<br />
              Web: <Link href="https://www.uoou.cz">www.uoou.cz</Link><br />
              E-mail: <Link href="mailto:posta@uoou.cz">posta@uoou.cz</Link>
            </InfoBox>
            <p>
              Preferujeme, abyste nás nejprve kontaktovali přímo – rádi veškeré pochybnosti nebo problémy
              vyřešíme bez nutnosti formálního řízení.
            </p>
          </Section>

          <Section title="10. Změny tohoto dokumentu">
            <p>
              Toto oznámení o ochraně osobních údajů můžeme kdykoli aktualizovat, zejména při změnách
              v naší službě nebo legislativě. O podstatných změnách vás budeme informovat e-mailem
              nebo oznámením v aplikaci. Datum aktuální verze je uvedeno v záhlaví tohoto dokumentu.
            </p>
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-5 py-4 text-sm leading-relaxed"
      style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.12)', color: 'rgba(237,237,237,0.65)' }}
    >
      {children}
    </div>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ color: '#00BFFF' }} className="underline underline-offset-2">
      {children}
    </a>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      {rows.map(([label, value], i) => (
        <div
          key={i}
          className="grid sm:grid-cols-[200px_1fr] gap-3 px-5 py-3.5 text-sm"
          style={{
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
            background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
          }}
        >
          <span className="font-semibold" style={{ color: 'rgba(237,237,237,0.85)' }}>{label}</span>
          <span style={{ color: 'rgba(237,237,237,0.55)' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
