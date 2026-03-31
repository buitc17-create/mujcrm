'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const sections = [
  {
    id: 'zacatky',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Začínáme',
    color: '#00BFFF',
    items: [
      {
        q: 'Jak se zaregistrovat do MujCRM?',
        a: 'Klikněte na tlačítko „Zkusit zdarma" na hlavní stránce. Projdete krátkým onboardingem (5 kroků), kde nastavíte profil svého týmu. Poté zadáte e-mail a heslo — a jste připraveni. Registrace nevyžaduje platební kartu.',
      },
      {
        q: 'Jak projít onboardingem?',
        a: 'Onboarding se skládá z 5 kroků: (1) typ vaší firmy, (2) počet zákazníků, (3) cíl použití CRM, (4) počet členů týmu, (5) váš e-mail a heslo. Celý proces trvá méně než 2 minuty. Po dokončení máte okamžitý přístup k dashboardu.',
      },
      {
        q: 'Jak přidat první zákazníky?',
        a: 'Po přihlášení přejděte do sekce Zákazníci v levém menu a klikněte na „+ Přidat zákazníka". Vyplňte jméno, e-mail a další údaje. Nebo použijte hromadný import z CSV souboru (viz sekce Správa zákazníků).',
      },
      {
        q: 'Je MujCRM dostupný v mobilním prohlížeči?',
        a: 'Ano. MujCRM je plně responzivní a funguje v každém moderním mobilním prohlížeči (Chrome, Safari, Firefox). Nativní mobilní aplikace je v plánu pro pozdější verzi.',
      },
      {
        q: 'Jak pozvat kolegy do svého workspace?',
        a: 'Přejděte do Nastavení → Tým a klikněte na „Pozvat člena". Zadejte e-mail kolegy a vyberte jeho roli (Správce, Obchodník, Čtenář). Kolega obdrží pozvánku e-mailem. Na tarifu Free je k dispozici 1 uživatel, na Medium 5 uživatelů.',
      },
    ],
  },
  {
    id: 'zakaznici',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Správa zákazníků',
    color: '#7B2FFF',
    items: [
      {
        q: 'Jak importovat zákazníky z CSV nebo Excelu?',
        a: 'Přejděte do Zákazníci → Import. Stáhněte si šablonu CSV souboru, vyplňte data ve Excelu nebo Google Sheets a soubor nahrajte. Systém vás provede mapováním sloupců. Import podporuje až 10 000 záznamů najednou. Před importem doporučujeme exportovat stávající data jako zálohu.',
      },
      {
        q: 'Jak fungují tagy a filtrování?',
        a: 'Každému zákazníkovi můžete přiřadit libovolné tagy (např. „VIP", „Newsletter", „Velkoobchod"). V seznamu zákazníků pak filtrujte podle tagů, stavu, data vytvoření nebo obchodního zástupce. Filtry lze kombinovat a uložit jako vlastní pohled.',
      },
      {
        q: 'Jak zobrazit historii komunikace se zákazníkem?',
        a: 'Otevřete detail zákazníka a přejděte na záložku „Aktivita". Zde vidíte chronologický přehled všech zaznamenanih interakcí — poznámky, e-maily, hovory, změny obchodů. Záznamy přidáváte tlačítkem „+ Aktivita" v horní části záložky.',
      },
      {
        q: 'Mohu přiřadit zákazníka konkrétnímu obchodníkovi?',
        a: 'Ano. V detailu zákazníka klikněte na pole „Zodpovědný obchodník" a vyberte člena týmu. Správce může filtrovat zákazníky a obchody dle přiřazeného obchodníka a sledovat výkonnost celého týmu.',
      },
    ],
  },
  {
    id: 'pipeline',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    ),
    title: 'Obchody a pipeline',
    color: '#00BFFF',
    items: [
      {
        q: 'Jak funguje Kanban pipeline?',
        a: 'Pipeline zobrazuje vaše obchody jako karty rozdělené do sloupců dle fáze prodejního procesu. Kartu přetáhnete (drag & drop) do jiného sloupce, čímž změníte stav obchodu. Každý sloupec ukazuje celkový počet obchodů a jejich souhrnnou hodnotu.',
      },
      {
        q: 'Jaké jsou výchozí statusy zakázek?',
        a: 'Výchozí fáze pipeline jsou: Nový lead → Kontaktován → Schůzka domluvena → Nabídka odeslána → Vyjednávání → Uzavřeno (Vyhráno / Prohráno). Správce může fáze pipeline upravit nebo přidat vlastní v Nastavení → Pipeline.',
      },
      {
        q: 'Jak přidat nový obchod?',
        a: 'V sekci Pipeline klikněte na „+ Přidat obchod" nebo na „+" ve vybraném sloupci. Vyplňte název obchodu, zákazníka, odhadovanou hodnotu, pravděpodobnost uzavření a termín. Obchod lze také přidat přímo z detailu zákazníka.',
      },
      {
        q: 'Jak sledovat výkonnost a reporty?',
        a: 'Přejděte do sekce Reporty v levém menu. Najdete zde přehled pipeline podle fází, výkonnost jednotlivých obchodníků, míru úspěšnosti a predikci tržeb. Reporty lze exportovat do CSV nebo PDF.',
      },
    ],
  },
  {
    id: 'fakturace',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    title: 'Fakturace a platby',
    color: '#7B2FFF',
    items: [
      {
        q: 'Jak změnit nebo upgradovat tarif?',
        a: 'Přejděte do Nastavení → Předplatné. Zde vidíte svůj aktuální plán a tlačítko „Změnit plán". Upgrade je okamžitý — nový plán se aktivuje ihned a platba se poměrně přepočítá na zbývající dny fakturačního období.',
      },
      {
        q: 'Jak zrušit předplatné?',
        a: 'V Nastavení → Předplatné klikněte na „Zrušit předplatné". Přístup k placenému plánu zůstane aktivní do konce zaplaceného období. Po jeho uplynutí se účet automaticky přepne na Free plán — data zůstanou zachována.',
      },
      {
        q: 'Kde najdu faktury a daňové doklady?',
        a: 'Přejděte do Nastavení → Fakturace. Všechny vydané faktury jsou ke stažení ve formátu PDF. Faktury jsou vystavovány automaticky vždy na začátku nového fakturačního období a zasílány na registrační e-mail.',
      },
      {
        q: 'Přijímáte platby kartou i fakturou?',
        a: 'Standardně platby probíhají kartou přes Stripe (Visa, Mastercard, Amex). Platbu fakturou (bankovním převodem) nabízíme pro roční předplatné na tarifu Platinum. Kontaktujte nás na info@mujcrm.cz.',
      },
      {
        q: 'Mohu získat vrácení peněz?',
        a: 'Poplatky za probíhající fakturační období standardně nevracíme. Výjimkou jsou závažné chyby na naší straně nebo zakoupení ročního plánu — v tom případě nás kontaktujte do 14 dnů. Každý případ posuzujeme individuálně.',
      },
    ],
  },
  {
    id: 'podpora',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: 'Technická podpora',
    color: '#00BFFF',
    items: [
      {
        q: 'Jaké prohlížeče MujCRM podporuje?',
        a: 'MujCRM funguje ve všech moderních prohlížečích: Google Chrome (doporučeno), Mozilla Firefox, Safari 16+, Microsoft Edge. Internet Explorer není podporován. Pro nejlepší výkon doporučujeme používat Chrome nebo Edge v aktuální verzi.',
      },
      {
        q: 'Co dělat, pokud zapomenu heslo?',
        a: 'Na přihlašovací stránce klikněte na „Zapomenuté heslo". Zadejte svůj registrační e-mail a obdržíte odkaz pro reset hesla (platný 1 hodinu). Pokud e-mail nedorazí, zkontrolujte složku Spam nebo nás kontaktujte.',
      },
      {
        q: 'Jak kontaktovat zákaznickou podporu?',
        a: 'Podporu kontaktujete e-mailem na info@mujcrm.cz nebo přes kontaktní formulář níže. Na tarifu Platinum nabízíme prioritní podporu s garantovanou dobou odpovědi do 4 hodin v pracovní dny. Free a Medium tarif: odpověď do 24 hodin.',
      },
      {
        q: 'Jak exportovat svá data?',
        a: 'Přejděte do Nastavení → Export dat. Stáhnout si můžete zákazníky, obchody a aktivity ve formátu CSV nebo JSON. Export je k dispozici na všech tarifech. Doporučujeme zálohy provádět pravidelně.',
      },
      {
        q: 'Jak nahlásit bezpečnostní zranitelnost?',
        a: 'Bezpečnostní zranitelnosti nahlašujte zodpovědně na info@mujcrm.cz s předmětem „[SECURITY]". Zavazujeme se reagovat do 48 hodin a zranitelnost opravit co nejdříve. Za nahlášené závažné zranitelnosti nabízíme poděkování a kredit na účtu.',
      },
    ],
  },
];

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-xs mb-10" style={{ color: 'rgba(237,237,237,0.4)' }}>
      <a href="/"
        style={{ color: 'rgba(237,237,237,0.4)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#00BFFF')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(237,237,237,0.4)')}>
        Domů
      </a>
      <span>/</span>
      <span style={{ color: 'rgba(237,237,237,0.7)' }}>Znalostní báze</span>
    </nav>
  );
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        style={{ background: open ? 'rgba(0,191,255,0.05)' : 'rgba(255,255,255,0.02)' }}
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(237,237,237,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          className="px-5 pb-4 text-sm leading-relaxed"
          style={{ color: 'rgba(237,237,237,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function ZnalostniBAze() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = activeSection
    ? sections.filter((s) => s.id === activeSection)
    : sections;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16">
        <Breadcrumb />

        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Nápověda
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Znalostní báze
          </h1>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.5)' }}>
            Odpovědi na nejčastější otázky. Nenašli jste, co hledáte?{' '}
            <a href="/#kontakt" style={{ color: '#00BFFF' }} className="underline underline-offset-2">
              Napište nám
            </a>.
          </p>
        </div>

        {/* Section filter pills */}
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveSection(null)}
            className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeSection === null ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeSection === null ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: activeSection === null ? '#00BFFF' : 'rgba(237,237,237,0.55)',
            }}
          >
            Vše
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeSection === s.id ? s.color + '18' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeSection === s.id ? s.color + '50' : 'rgba(255,255,255,0.08)'}`,
                color: activeSection === s.id ? s.color : 'rgba(237,237,237,0.55)',
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-14">
          {filtered.map((section) => (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: section.color + '15', color: section.color }}
                >
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: 'rgba(0,191,255,0.04)', border: '1px solid rgba(0,191,255,0.1)' }}
        >
          <h3 className="text-lg font-bold text-white mb-2">Nenašli jste odpověď?</h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.5)' }}>
            Náš tým podpory vám odpoví do 24 hodin v pracovní dny.
          </p>
          <a
            href="/#kontakt"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(0,191,255,0.15)', border: '1px solid rgba(0,191,255,0.3)', color: '#00BFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,191,255,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,191,255,0.15)')}
          >
            Kontaktovat podporu →
          </a>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: 'rgba(237,237,237,0.5)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00BFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(237,237,237,0.5)')}
          >
            ← Zpět na hlavní stránku
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
