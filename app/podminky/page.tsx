import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Podmínky použití',
  description: 'Obchodní podmínky SaaS služby MujCRM – tarify, platby, zrušení předplatného, odpovědnost a rozhodné právo České republiky.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://mujcrm.vercel.app/podminky' },
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

export default function PodminkyPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <Breadcrumb current="Podmínky použití" />

        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Právní dokumenty
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Podmínky použití
          </h1>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            Datum účinnosti: 1. dubna 2026 &nbsp;·&nbsp; Rozhodné právo: Česká republika
          </p>
        </div>

        <div className="flex flex-col gap-10" style={{ color: 'rgba(237,237,237,0.65)' }}>

          <Section title="1. Smluvní strany a předmět smlouvy">
            <p>
              Tyto obchodní podmínky (dále „Podmínky") upravují smluvní vztah mezi poskytovatelem
              a zákazníkem při využívání cloudové CRM služby MujCRM.
            </p>
            <InfoBox>
              <strong className="text-white">Poskytovatel:</strong> MujCRM s.r.o., Praha, Česká republika<br />
              E-mail: <Link href="mailto:info@mujcrm.cz">info@mujcrm.cz</Link>
            </InfoBox>
            <p>
              <strong className="text-white">Zákazníkem</strong> je fyzická nebo právnická osoba, která se
              zaregistruje ke službě MujCRM a souhlasí s těmito Podmínkami. Zákazník musí být starší 18 let
              nebo jednat v zastoupení právnické osoby s oprávněním uzavírat smlouvy.
            </p>
            <p>
              Přijetím těchto Podmínek (zaškrtnutím políčka při registraci nebo faktickým užíváním služby)
              vzniká mezi poskytovatelem a zákazníkem smlouva o poskytování SaaS služby.
            </p>
          </Section>

          <Section title="2. Registrace a uživatelský účet">
            <ul>
              <li>Registrace je zdarma a nevyžaduje platební kartu pro Trial období.</li>
              <li>Zákazník je povinen uvést pravdivé a aktuální registrační údaje.</li>
              <li>Jeden uživatelský účet odpovídá jedné fyzické nebo právnické osobě. Sdílení přístupu není povoleno nad rámec zakoupené licence.</li>
              <li>Zákazník je zodpovědný za bezpečnost svých přihlašovacích údajů. Jakékoli podezření na kompromitaci účtu je povinen bezodkladně nahlásit na <Link href="mailto:info@mujcrm.cz">info@mujcrm.cz</Link>.</li>
              <li>Poskytovatel si vyhrazuje právo pozastavit nebo zrušit účet při porušení těchto Podmínek.</li>
            </ul>
          </Section>

          <Section title="3. Popis služby a tarify">
            <p>MujCRM je cloudová SaaS platforma pro správu zákazníků, obchodních příležitostí a týmové spolupráce. Dostupné tarify:</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                ['Free', 'Zdarma', 'Až 50 kontaktů, 1 uživatel, základní CRM funkce, bez podpory'],
                ['Medium', '590 Kč / měs. bez DPH', 'Neomezené kontakty, 5 uživatelů, pipeline, reporty, e-mailová podpora'],
                ['Platinum', '1 490 Kč / měs. bez DPH', 'Vše v Medium + neomezení uživatelé, API přístup, prioritní podpora, SLA 99,9 %'],
              ].map(([plan, price, desc], i, arr) => (
                <div
                  key={plan}
                  className="grid sm:grid-cols-[120px_160px_1fr] gap-3 px-5 py-3.5 text-sm"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  }}
                >
                  <span className="font-bold text-white">{plan}</span>
                  <span style={{ color: '#00BFFF' }}>{price}</span>
                  <span style={{ color: 'rgba(237,237,237,0.55)' }}>{desc}</span>
                </div>
              ))}
            </div>
            <p>
              Specifikace jednotlivých tarifů (přesný počet funkcí, limity) je uvedena na stránce{' '}
              <Link href="/#pricing">Ceník</Link>. Poskytovatel si vyhrazuje právo na změnu obsahu tarifů
              s předchozím oznámením zákazníkům.
            </p>
          </Section>

          <Section title="4. Zkušební doba">
            <p>
              Nový zákazník má nárok na <strong className="text-white">7denní zkušební dobu zdarma</strong>{' '}
              s plným přístupem k funkcím tarifu Medium. Zkušební doba začíná dnem dokončení registrace.
              Po jejím uplynutí je účet automaticky převeden na Free plán — žádné poplatky nejsou
              účtovány bez předchozího výslovného souhlasu zákazníka.
            </p>
          </Section>

          <Section title="5. Platby a fakturace">
            <ul>
              <li>Platby jsou zpracovávány prostřednictvím <strong className="text-white">Stripe, Inc.</strong> — certifikovaný PCI DSS poskytovatel platebních služeb.</li>
              <li>Předplatné je účtováno předem na zvolené fakturační období (měsíčně nebo ročně).</li>
              <li>Všechny ceny jsou uvedeny <strong className="text-white">bez DPH</strong>. DPH je připočtena dle sazby platné v zemi zákazníka.</li>
              <li>Faktury jsou vystavovány elektronicky a zasílány na registrační e-mail zákazníka.</li>
              <li>Poskytovatel neúčtuje žádné skryté poplatky za aktivaci, migraci dat ani zrušení účtu.</li>
              <li>V případě neúspěšné platby je zákazník informován e-mailem. Přístup ke službě zůstane aktivní po dobu grace period 7 dnů.</li>
            </ul>
          </Section>

          <Section title="6. Zrušení předplatného a vrácení peněz">
            <ul>
              <li>Předplatné lze zrušit kdykoliv přes nastavení účtu bez sankce a bez nutnosti kontaktovat podporu.</li>
              <li>Po zrušení zůstane přístup k placenému plánu aktivní do konce zaplaceného fakturačního období.</li>
              <li>Poplatky za probíhající fakturační období se nevracejí, s výjimkou případů způsobených závažnou chybou na straně poskytovatele.</li>
              <li>Žádosti o vrácení peněz z jiných důvodů posuzujeme individuálně — kontaktujte nás do 14 dnů od platby.</li>
            </ul>
          </Section>

          <Section title="7. Zakázané chování">
            <p>Zákazník nesmí:</p>
            <ul>
              <li>Používat službu pro nezákonné účely nebo k porušování práv třetích stran.</li>
              <li>Pokusit se o neoprávněný přístup k systémům nebo datům jiných zákazníků.</li>
              <li>Provádět reverse engineering, dekompilaci nebo jiné analytické útoky na software.</li>
              <li>Automatizovaně vytěžovat data bez písemného souhlasu poskytovatele (crawling, scraping).</li>
              <li>Šířit malware, spam nebo jiný škodlivý obsah prostřednictvím platformy.</li>
              <li>Přeprodávat přístup ke službě bez partnerské smlouvy s poskytovatelem.</li>
            </ul>
            <p>
              Porušení těchto pravidel může vést k okamžitému pozastavení účtu bez nároku na vrácení poplatků.
            </p>
          </Section>

          <Section title="8. Dostupnost služby a SLA">
            <p>
              Poskytovatel usiluje o dostupnost služby <strong className="text-white">99,9 % času</strong>{' '}
              (měřeno měsíčně). Plánovaná odstávka pro údržbu je oznamována zákazníkům předem
              e-mailem nebo oznámením v aplikaci. Na tarif Platinum se vztahuje smluvní SLA 99,9 %.
            </p>
            <p>
              Poskytovatel neodpovídá za výpadky způsobené třetími stranami (cloudová infrastruktura,
              telekomunikační operátoři, vyšší moc).
            </p>
          </Section>

          <Section title="9. Odpovědnost a omezení záruky">
            <p>
              Služba je poskytována „tak jak je" (<em>as-is</em>). Poskytovatel neručí za to, že služba
              bude zcela bez chyb nebo bude nepřetržitě dostupná. Odpovědnost poskytovatele za škody
              je v každém případě omezena na výši poplatků uhrazených zákazníkem za posledních 12 měsíců.
            </p>
            <p>
              Poskytovatel nenese odpovědnost za nepřímé škody, ušlý zisk ani ztrátu dat způsobenou
              jednáním zákazníka.
            </p>
          </Section>

          <Section title="10. Duševní vlastnictví">
            <p>
              Veškerý software, design, ochranné známky a jiná duševní vlastnictví MujCRM jsou výlučným
              majetkem poskytovatele. Zákazník získává pouze nevýhradní, nepřenositelnou licenci
              k užívání služby po dobu trvání předplatného.
            </p>
            <p>
              Data vložená zákazníkem do systému zůstávají ve vlastnictví zákazníka. Zákazník může
              svá data kdykoliv exportovat.
            </p>
          </Section>

          <Section title="11. Změny podmínek">
            <p>
              Poskytovatel může tyto Podmínky měnit. O podstatných změnách bude zákazník informován
              e-mailem nebo oznámením v aplikaci nejméně <strong className="text-white">30 dní předem</strong>.
              Pokračující používání služby po nabytí účinnosti změn se považuje za jejich přijetí.
              Nesouhlasí-li zákazník se změnami, má právo účet zrušit před jejich účinností.
            </p>
          </Section>

          <Section title="12. Rozhodné právo a řešení sporů">
            <p>
              Tyto Podmínky se řídí právním řádem <strong className="text-white">České republiky</strong>,
              zejména zákonem č. 89/2012 Sb. (občanský zákoník) a zákonem č. 634/1992 Sb. (zákon
              o ochraně spotřebitele). Případné spory budou řešeny příslušnými soudy v České republice.
            </p>
            <p>
              Spotřebitelé mají rovněž právo na mimosoudní řešení sporu prostřednictvím České obchodní
              inspekce (<Link href="https://www.coi.cz">www.coi.cz</Link>).
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
