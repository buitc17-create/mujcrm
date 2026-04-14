export interface FeatureFAQ {
  q: string;
  a: string;
}

export interface FeatureSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface FeatureData {
  slug: string;
  title: string;
  metaTitle: string;
  subtitle: string;
  description: string;
  keywords: string[];
  accent: string;
  icon: React.ReactNode;
  sections: FeatureSection[];
  useCases: string[];
  faq: FeatureFAQ[];
}

export const features: FeatureData[] = [
  {
    slug: 'sprava-zakazniku',
    title: 'Správa zákazníků',
    metaTitle: 'Správa zákazníků v CRM | MujCRM',
    subtitle: 'Mějte kompletní přehled o každém zákazníkovi. Kontakty, komunikace, dokumenty a aktivity přehledně na jednom místě.',
    description: 'MujCRM nabízí přehlednou správu zákazníků pro malé firmy a podnikatele. Kontaktní profily, historii komunikace, poznámky, štítky a import z CSV. Vše bez složitého nastavení.',
    keywords: ['správa zákazníků', 'CRM kontakty', 'zákaznické profily', 'history komunikace', 'import kontaktů CSV', 'CRM pro malé firmy'],
    accent: '#00BFFF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    sections: [
      {
        heading: 'Kompletní kontaktní profil',
        body: 'Každý zákazník má v MujCRM vlastní kartu s plnohodnotným profilem. Ukládáte jméno, příjmení, e‑mail, telefon, firmu, web, adresu a libovolné poznámky. Díky tomu máte vždy okamžitý přehled o tom, kdo zákazník je a co od vás potřebuje.',
        bullets: [
          'Kontaktní údaje: e‑mail, telefon, adresa, web',
          'Přiřazení k firmě nebo obchodnímu případu',
          'Vlastní poznámky a štítky pro snadné filtrování',
          'Datum narozenin pro automatické blahopřání',
        ],
      },
      {
        heading: 'Historie komunikace přímo u zákazníka',
        body: 'Veškerá komunikace se zákazníkem je dostupná na jednom místě. Vidíte e‑maily odeslané z integrované schránky, ručně přidané aktivity (hovor, schůzka, úkol) i vlastní poznámky. Nikdy neztrácíte kontext a vždy víte, kde jste se zákazníkem naposledy skončili.',
        bullets: [
          'E‑maily odeslané i přijaté přímo v kartě zákazníka',
          'Záznamy aktivit: hovory, schůzky, demo, follow-up',
          'Vlastní poznámky ke každému zákazníkovi',
          'Časová osa komunikace seřazená chronologicky',
        ],
      },
      {
        heading: 'Import a hromadná správa',
        body: 'Nemáte chuť přepisovat stovky kontaktů ručně? MujCRM umožňuje hromadný import zákazníků z CSV souboru. Stačí připravit soubor z Excelu nebo starého CRM a nahrát ho jedním klikem. Při importu systém automaticky porovná existující záznamy a zamezí duplicitám.',
        bullets: [
          'Import z CSV souboru (Excel, Google Sheets, jiné CRM)',
          'Automatická detekce duplicit při importu',
          'Filtrování a vyhledávání v celé databázi',
          'Export zákazníků zpět do CSV kdykoliv',
        ],
      },
    ],
    useCases: [
      'Freelancer, který chce mít přehled o svých klientech bez složitého softwaru',
      'Firma s více obchodníky, kde každý pracuje se svými přiřazenými zákazníky',
      'Malá firma přecházející ze spreadsheetů na profesionální CRM',
      'Podnikatel, který chce posílat narozeninová přání automaticky',
    ],
    faq: [
      {
        q: 'Kolik zákazníků mohu v MujCRM mít?',
        a: 'Počet zákazníků není nijak omezen ve žádném tarifu. Můžete mít desítky i tisíce kontaktů. Limity se týkají pouze počtu členů týmu a přístupu k pokročilým funkcím.',
      },
      {
        q: 'Jak importovat zákazníky ze starého CRM nebo Excelu?',
        a: 'V sekci Zákazníci klikněte na tlačítko „Import". Nahrajte CSV soubor s kontakty. Systém automaticky namapuje sloupce na odpovídající pole v MujCRM. Import je otázka sekund, ne hodin.',
      },
      {
        q: 'Mohu přiřadit zákazníka nebo zakázku konkrétnímu členovi týmu?',
        a: 'Ano. Zakázky a leady lze přiřadit konkrétnímu členovi týmu. Člen vidí jemu přiřazené položky a může na nich pracovat. Správce má přehled o všech přiřazených zakázkách a dostává automatický měsíční výkaz výkonu každého člena.',
      },
      {
        q: 'Jaký je rozdíl mezi zákazníkem a leadem v MujCRM?',
        a: 'Lead je potenciální zákazník, tedy někdo, o kom nevíte, jestli nakoupí. Zákazník je konvertovaný lead nebo existující klient. MujCRM umožňuje jedním klikem převést lead na zákazníka, přičemž se zachová veškerá historie komunikace.',
      },
      {
        q: 'Lze u zákazníka vidět všechny e‑maily, které jsme si vyměnili?',
        a: 'Ano. Pokud máte nastavenou integrovanou e‑mailovou schránku, všechny e‑maily odeslané a přijaté od daného zákazníka se automaticky zobrazují v jeho kartě. Nepotřebujete přepínat mezi CRM a e‑mailovým klientem.',
      },
    ],
  },
  {
    slug: 'analytika',
    title: 'Přehledná analytika',
    metaTitle: 'Analytika a reporty v CRM | MujCRM',
    subtitle: 'Grafy, metriky a reporty, které vám řeknou, co funguje. Nemusíte být datový analytik.',
    description: 'MujCRM nabízí přehlednou analytiku pro malé firmy: obchodní dashboard, pipeline statistiky, trendové reporty a export dat. Rozhodujte se na základě dat, ne tušení.',
    keywords: ['CRM analytika', 'obchodní reporty', 'sales dashboard', 'pipeline statistiky', 'KPI malá firma', 'export dat CSV'],
    accent: '#7B2FFF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    sections: [
      {
        heading: 'Obchodní dashboard na první pohled',
        body: 'Hned po přihlášení vidíte klíčové metriky svého podnikání. Kolik leadů právě zpracováváte, jaká je celková hodnota otevřených obchodů, kolik aktivit bylo dokončeno tento týden a jak si vedete ve srovnání s předchozím obdobím. Žádné složité nastavení. Dashboard je připravený hned od začátku.',
        bullets: [
          'Počet aktivních leadů a jejich celková hodnota',
          'Úspěšnost konverzí (kolik leadů se proměnilo v zákazníky)',
          'Přehled aktivit a úkolů za aktuální týden',
          'Trend oproti předchozímu měsíci',
        ],
      },
      {
        heading: 'Pipeline a obchodní statistiky',
        body: 'Kanban pipeline vám dává vizuální přehled o tom, kde v procesu se každý obchod nachází. Analytika pipeline jde ještě dál a ukazuje průměrnou dobu trvání obchodu v každé fázi, úzká hrdla, kde obchody uvíznou, a celkovou výkonnost prodejního procesu.',
        bullets: [
          'Hodnota obchodů ve každé fázi pipeline',
          'Průměrná doba uzavření obchodu',
          'Win rate neboli poměr vyhraných a prohraných obchodů',
          'Měsíční výkaz výkonu každého člena týmu zasílaný e‑mailem',
        ],
      },
      {
        heading: 'Export dat a pokročilé reporty',
        body: 'Data, která do MujCRM vložíte, jsou vždy vaše. Kdykoliv si můžete exportovat zákazníky, leady nebo obchodní případy do CSV souboru a dále je zpracovat v Excelu, Google Sheets nebo jiném nástroji. Tarif Business a Enterprise nabízí pokročilý reporting s KPI metrikami a grafy.',
        bullets: [
          'Export zákazníků a leadů do CSV (všechny tarify)',
          'Pokročilé KPI reporty (tarif Business a Enterprise)',
          'Filtrace dat před exportem dle data, stavu nebo obchodníka',
          'Automatické souhrny aktivit za vybrané období',
        ],
      },
    ],
    useCases: [
      'Obchodní ředitel, který potřebuje týdenní report výkonu svého týmu',
      'Freelancer sledující své příjmy a počet aktivních projektů',
      'Majitel firmy rozhodující o rozšíření obchodního týmu na základě dat',
      'Obchodník optimalizující svůj prodejní proces podle pipeline statistik',
    ],
    faq: [
      {
        q: 'Jaké metriky MujCRM sleduje?',
        a: 'MujCRM sleduje počet leadů a zákazníků, hodnotu otevřených obchodů, úspěšnost konverzí, počet aktivit (hovory, schůzky, e‑maily) a výkonnost jednotlivých obchodníků. Tarif Business a Enterprise přidává KPI dashboard s vlastními metrikami.',
      },
      {
        q: 'Lze exportovat data do Excelu?',
        a: 'Ano. Zákazníky, leady i obchody lze kdykoliv exportovat do CSV souboru, který lze otevřít v Excelu, Google Sheets nebo Numbers. Export je dostupný ve všech tarifech.',
      },
      {
        q: 'Mohu sledovat výkon členů svého týmu?',
        a: 'Ano. Admin dostává automatický měsíční výkaz na svůj e‑mail za každého člena týmu. Výkaz obsahuje přehled přiřazených zakázek dle fáze pipeline, uzavřené obchody a celkovou hodnotu. Přímé srovnání více členů v rámci dashboardu je plánováno v dalších verzích.',
      },
      {
        q: 'Jak daleko do minulosti sahají data v reportech?',
        a: 'MujCRM uchovává veškerá historická data od prvního dne bez časového omezení. Reporty lze filtrovat na libovolné časové období.',
      },
    ],
  },
  {
    slug: 'komunikace',
    title: 'Komunikace',
    metaTitle: 'E-mail a komunikace v CRM | MujCRM',
    subtitle: 'Integrovaná e‑mailová schránka, aktivity a poznámky přímo u zákazníka. Veškerá komunikace na jednom místě.',
    description: 'MujCRM propojuje vaši e-mailovou schránku (Gmail, Seznam, Outlook) přímo s CRM. E-maily, hovory, schůzky a poznámky jsou viditelné u každého zákazníka. Bez informačních sil.',
    keywords: ['CRM email integrace', 'IMAP SMTP CRM', 'komunikace se zákazníky', 'sdílená emailová schránka', 'aktivity CRM', 'gmail seznam outlook CRM'],
    accent: '#00BFFF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    sections: [
      {
        heading: 'Integrovaná e‑mailová schránka',
        body: 'Připojte svůj stávající e‑mail (Gmail, Seznam, Outlook nebo jiného poskytovatele s podporou IMAP/SMTP) a komunikujte přímo z MujCRM. Nemusíte přepínat mezi CRM a e‑mailovým klientem. Odeslané i přijaté e‑maily se automaticky zobrazují v kartě příslušného zákazníka nebo leadu.',
        bullets: [
          'Podpora Gmail, Seznam.cz, Outlook, Centrum a dalších IMAP/SMTP poskytovatelů',
          'Odesílání e‑mailů přímo z CRM s vlastním podpisem',
          'Automatické párování e‑mailů k zákazníkům dle e‑mailové adresy',
          'Automatická synchronizace každé 2 minuty',
        ],
      },
      {
        heading: 'Aktivity a záznamy komunikace',
        body: 'Každou interakci se zákazníkem lze zaznamenat jako aktivitu: telefonát, osobní schůzku, demo, nabídku nebo follow-up. Aktivity mají datum, čas, popis a stav (proběhlo nebo naplánováno). Tím vzniká přesná časová osa, ze které je patrné, kdo, kdy a o čem se zákazníkem mluvil.',
        bullets: [
          'Typy aktivit: hovor, schůzka, e‑mail, demo, nabídka, follow-up a další',
          'Plánování budoucích aktivit s připomínkami',
          'Přiřazení aktivity konkrétnímu členovi týmu',
          'Filtrování aktivit dle typu, data nebo zákazníka',
        ],
      },
      {
        heading: 'Přiřazení a předání zakázek',
        body: 'Zakázky a leady lze kdykoli přiřadit konkrétnímu členovi týmu nebo je přeřadit jinému. Člen dostane notifikaci a vidí vše, co k zakázce patří. Správce má přehled o přiřazených zakázkách a dostává měsíční výkaz výkonu každého člena e‑mailem.',
        bullets: [
          'Přiřazení zakázky nebo leadu členovi jedním klikem',
          'Notifikace člena při přijetí nové zakázky',
          'Přeřazení zakázky jinému členovi kdykoliv',
          'Měsíční výkaz výkonu každého člena zasílaný správci',
        ],
      },
    ],
    useCases: [
      'Podnikatel, který chce mít všechny e‑maily i záznamy schůzek přehledně u zákazníka',
      'Freelancer kombinující komunikaci s více klienty z jednoho místa',
      'Firma, kde obchodníci mají přiřazené zakázky a potřebují historii komunikace',
      'Každý, kdo chce přestat přepínat mezi e‑mailovým klientem a CRM systémem',
    ],
    faq: [
      {
        q: 'Jaké e‑mailové schránky MujCRM podporuje?',
        a: 'MujCRM podporuje všechny poskytovatele e‑mailu s protokolem IMAP a SMTP. To zahrnuje Gmail, Seznam.cz, Centrum.cz, Outlook/Microsoft 365, Yahoo Mail a libovolný firemní e‑mail na vlastní doméně.',
      },
      {
        q: 'Jak často se e‑maily synchronizují?',
        a: 'E‑maily se synchronizují automaticky každé 2 minuty, pokud máte otevřenou sekci Email v MujCRM. Synchronizaci lze spustit i ručně tlačítkem v levém menu kdykoliv.',
      },
      {
        q: 'Vidí moje e‑maily i ostatní členové týmu?',
        a: 'Ne. Vaše e‑maily jsou viditelné pouze vám. Každý člen týmu pracuje se svou vlastní e‑mailovou schránkou připojenou v nastavení. Sdílená viditelnost e‑mailů napříč týmem je plánována v dalších verzích MujCRM.',
      },
      {
        q: 'Lze v MujCRM odesílat e‑maily s přílohou?',
        a: 'Ano. Při odesílání e‑mailu z MujCRM lze přiložit soubory stejně jako v běžném e‑mailovém klientu. Tato funkce je dostupná ve všech tarifech.',
      },
      {
        q: 'Co jsou aktivity v MujCRM?',
        a: 'Aktivita je záznam jakékoliv interakce se zákazníkem nebo leadem: telefonát, schůzka, odeslání nabídky, demo produktu nebo follow-up. Aktivity mají datum a typ, lze je plánovat do budoucna a přiřazovat konkrétním obchodníkům.',
      },
    ],
  },
  {
    slug: 'bezpecnost-a-soukromi',
    title: 'Bezpečnost a soukromí',
    metaTitle: 'Bezpečnost dat a GDPR | MujCRM',
    subtitle: 'Vaše data jsou uložena v EU, šifrována a zálohována. Plná shoda s GDPR bez zbytečné byrokracie.',
    description: 'MujCRM ukládá data výhradně na serverech v EU, splňuje požadavky GDPR, šifruje přístupová hesla a provádí automatické zálohy každých 24 hodin. Bezpečnost bez kompromisů pro malé firmy.',
    keywords: ['CRM GDPR', 'bezpečnost dat CRM', 'data v EU', 'šifrování CRM', 'GDPR compliance malá firma', 'zálohy dat'],
    accent: '#7B2FFF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    sections: [
      {
        heading: 'Data výhradně v Evropské unii',
        body: 'Všechna data uložená v MujCRM jsou fyzicky umístěna na serverech v Evropské unii. Nevyužíváme americké ani asijské datové centrum. To je základ pro soulad s nařízením GDPR a klíčová podmínka při práci s osobními údaji zákazníků a klientů.',
        bullets: [
          'Servery výhradně na území EU (Frankfurt, Německo)',
          'Žádný přenos osobních dat mimo EU',
          'Soulad s nařízením GDPR (EU) 2016/679',
        ],
      },
      {
        heading: 'Šifrování a správa přístupů',
        body: 'Přístupová hesla jsou šifrována pomocí bcrypt. Nikdo, ani tým MujCRM, tak nemá přístup k heslu v čitelné podobě. Komunikace mezi prohlížečem a servery probíhá vždy přes HTTPS s TLS šifrováním. SMTP hesla pro e‑mailové schránky jsou ukládána v šifrované podobě.',
        bullets: [
          'Hesla šifrována algoritmem bcrypt (jednosměrné hashování)',
          'Veškerá komunikace přes HTTPS / TLS 1.3',
          'SMTP hesla šifrována před uložením do databáze',
          'Systém rolí: každý člen týmu vidí pouze to, co potřebuje',
        ],
      },
      {
        heading: 'Zálohy a dostupnost',
        body: 'Data v MujCRM jsou automaticky zálohována každých 24 hodin. Zálohy jsou uchovávány na odděleném úložišti a lze z nich data obnovit v případě technického problému. Infrastruktura běží na platformě Vercel a Supabase s garantovanou dostupností 99,9 %.',
        bullets: [
          'Automatické zálohy každých 24 hodin',
          'Zálohy uloženy na odděleném úložišti v EU',
          'Dostupnost infrastruktury 99,9 % (SLA)',
          'Export dat kdykoliv. Nejste uvězněni v systému.',
        ],
      },
    ],
    useCases: [
      'Firma zpracovávající osobní údaje zákazníků povinná dodržovat GDPR',
      'Účetní nebo advokátní kancelář s požadavky na bezpečné uložení dat klientů',
      'E‑shop nebo prodejce zpracovávající kontaktní a platební údaje zákazníků',
      'Podnikatel, který chce mít jistotu, že jeho obchodní data nejsou přístupná třetím stranám',
    ],
    faq: [
      {
        q: 'Je MujCRM v souladu s GDPR?',
        a: 'Ano. MujCRM zpracovává osobní údaje výhradně na serverech v EU, nemá přístup k vašim datům bez vašeho souhlasu a umožňuje export nebo smazání dat na vyžádání.',
      },
      {
        q: 'Kde jsou fyzicky uložena moje data?',
        a: 'Veškerá data jsou uložena v datovém centru ve Frankfurtu, Německo (EU). Využíváme infrastrukturu Supabase s EU regionem. Data nikdy neopustí Evropskou unii.',
      },
      {
        q: 'Může tým MujCRM vidět moje zákaznická data?',
        a: 'Ne. Tým MujCRM nemá přístup k vašim zákaznickým datům v rámci běžného provozu. Přístup k databázi je technicky omezen a vyžaduje explicitní souhlas zákazníka, například při řešení technického problému.',
      },
      {
        q: 'Co se stane s daty, pokud zruším předplatné?',
        a: 'Po zrušení předplatného zůstávají vaše data v systému po dobu 30 dnů, během nichž si je můžete exportovat. Po uplynutí 30 dnů jsou data trvale smazána. Na požádání lze data smazat okamžitě.',
      },
      {
        q: 'Jak je zabezpečeno heslo do MujCRM?',
        a: 'Hesla jsou hashována algoritmem bcrypt před uložením. V databázi není nikdy uloženo heslo v čitelné podobě. Přihlášení probíhá přes šifrované HTTPS spojení. Doporučujeme použít silné unikátní heslo nebo správce hesel.',
      },
    ],
  },
  {
    slug: 'automatizace',
    title: 'Automatizace a úkoly',
    metaTitle: 'Automatizace e-mailů a úkoly v CRM | MujCRM',
    subtitle: 'Nastav jednou, nechej systém pracovat za tebe. E‑mailové sekvence, narozeninová přání a automatické připomínky.',
    description: 'MujCRM automatizuje opakující se úkoly: e-mailové follow-up sekvence, narozeninové e-maily zákazníkům, připomínky a plánování aktivit. Šetřete čas a nezapomeňte na žádného zákazníka.',
    keywords: ['CRM automatizace', 'email sekvence', 'follow-up automatizace', 'narozeninový email', 'CRM připomínky', 'workflow automatizace'],
    accent: '#00BFFF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    sections: [
      {
        heading: 'E‑mailové follow-up sekvence',
        body: 'Vytvořte sérii e‑mailů, která se automaticky odesílá leadům nebo zákazníkům v předem nastavených intervalech. Nemusíte sledovat, kdy napsat komu. Systém to za vás udělá sám. Sekvence lze nastavit pro různé fáze prodejního procesu: uvítací série, po zaslání nabídky, po uzavření obchodu nebo pro reaktivaci starých leadů.',
        bullets: [
          'Libovolný počet kroků v sekvenci s vlastními texty',
          'Nastavení zpoždění mezi kroky v dnech',
          'Automatické zastavení sekvence po konverzi leadu',
          'Přílohy e‑mailů (katalogy, nabídky, dokumenty)',
          'Personalizace e‑mailů jménem zákazníka',
        ],
      },
      {
        heading: 'Narozeninová přání zákazníkům',
        body: 'Přidejte datum narození do profilu zákazníka a MujCRM automaticky odešle narozeninový e‑mail ve správný den. Tato funkce je oblíbená u firem, které chtějí budovat osobní vztah s klienty bez toho, aby musely sledovat kalendář. E‑mail si nastavíte jednou. Systém se pak postará o zbytek každý rok.',
        bullets: [
          'Automatický e‑mail v den narozenin zákazníka',
          'Vlastní předmět a text narozeninového e‑mailu',
          'Záložní odeslání (systém odesílá i den po narozeninách pro případ výpadku)',
          'Dostupné pro zákazníky i kontakty',
        ],
      },
      {
        heading: 'Úkoly, připomínky a plánování',
        body: 'Každý lead nebo zákazník může mít přiřazeny úkoly s termínem a prioritou. Systém vás upozorní na blížící se termíny. Hovory, schůzky i follow-upy lze plánovat dopředu a přiřazovat konkrétním členům týmu. Nikdo nezapomene na nic důležitého.',
        bullets: [
          'Úkoly s termínem, prioritou a přiřazením obchodníkovi',
          'Připomínky blížících se termínů přímo v systému',
          'Plánování aktivit s přehledem v kalendáři',
          'Přehled všech otevřených úkolů na dashboardu',
        ],
      },
    ],
    useCases: [
      'Obchodník, který chce automaticky sledovat leady bez ručního odesílání follow-upů',
      'Firma posílající pravidelné e‑maily zákazníkům (onboarding, péče o zákazníky)',
      'Podnikatel, který chce posílat narozeninová přání klientům a budovat vztah',
      'Tým s více obchodníky potřebující přehled úkolů a termínů',
    ],
    faq: [
      {
        q: 'Jak nastavit automatickou e‑mailovou sekvenci?',
        a: 'V sekci Automatizace vytvořte novou sekvenci, pojmenujte ji a přidejte kroky. Každý krok má předmět, text e‑mailu a zpoždění (počet dní od předchozího kroku). Sekvenci pak přiřadíte leadovi nebo skupině leadů a vše probíhá automaticky.',
      },
      {
        q: 'Zastaví se sekvence, pokud lead nakoupí?',
        a: 'Ano. Pokud označíte lead jako konvertovaný (převod na zákazníka), všechny aktivní automatizace pro tohoto leadu se automaticky zastaví. Zákazník tak nedostane e‑mail určený pro leady.',
      },
      {
        q: 'Kdy se odesílají narozeninové e‑maily?',
        a: 'Narozeninové e‑maily se odesílají automaticky každý den v 7:00 ráno (UTC). Systém zkontroluje, kteří zákazníci mají dnes nebo včera narozeniny (záchranný mechanismus pro případ výpadku), a odešle jim e‑mail.',
      },
      {
        q: 'Lze přiložit soubor k automatizovanému e‑mailu?',
        a: 'Ano. Ke každému kroku sekvence lze přiložit soubor: katalog, nabídku, prezentaci nebo jiný dokument. Příloha se odešle spolu s e‑mailem automaticky.',
      },
      {
        q: 'Z jaké e‑mailové adresy se automatizace odesílají?',
        a: 'Automatizované e‑maily se odesílají z SMTP účtu, který máte nastavený v MujCRM. E‑maily tak přicházejí zákazníkům z vaší firemní adresy, nikoli z obecné adresy MujCRM.',
      },
    ],
  },
  {
    slug: 'integrace-a-api',
    title: 'Integrace a API',
    metaTitle: 'Integrace a API přístup | MujCRM',
    subtitle: 'Propojte MujCRM s nástroji, které už používáte. E‑mail, platby, kalendář i vlastní systémy přes API.',
    description: 'MujCRM se integruje s vaším e-mailem (Gmail, Outlook, Seznam), Stripe platební bránou a kalendářem. Tarif Enterprise nabízí plný API přístup pro propojení s vlastními systémy.',
    keywords: ['CRM integrace', 'CRM API', 'gmail CRM integrace', 'stripe CRM', 'IMAP SMTP integrace', 'API přístup CRM'],
    accent: '#7B2FFF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
        <line x1="19" y1="12" x2="5" y2="12"/>
      </svg>
    ),
    sections: [
      {
        heading: 'E‑mailová integrace (IMAP / SMTP)',
        body: 'Připojte libovolný e‑mailový účet s podporou IMAP a SMTP. MujCRM funguje s Gmailem, Outlookem, Microsoft 365, Seznam.cz, Centrum.cz, Yahoo Mail i firemním e‑mailem na vlastní doméně. Po nastavení se e‑maily automaticky synchronizují a zobrazují přímo v kartách zákazníků a leadů.',
        bullets: [
          'Gmail (včetně Google Workspace)',
          'Outlook a Microsoft 365',
          'Seznam.cz a Centrum.cz',
          'Libovolný firemní e‑mail na vlastní doméně (IMAP/SMTP)',
          'Vlastní SMTP podpis a jméno odesílatele',
        ],
      },
      {
        heading: 'Platební integrace Stripe',
        body: 'MujCRM využívá Stripe jako platební bránu pro správu předplatného. Zákazníci MujCRM mohou platit kartou (Visa, Mastercard, American Express) a spravovat své předplatné přes Stripe Customer Portal (změna platební metody, stažení faktur, zrušení předplatného).',
        bullets: [
          'Platby kartou (Visa, Mastercard, Amex) přes Stripe',
          'Bezpečné uložení platební metody ve Stripe',
          'Automatické vystavování faktur každé fakturační období',
          'Samoobslužný portál pro správu předplatného',
        ],
      },
      {
        heading: 'API přístup pro Enterprise',
        body: 'Tarif Enterprise zahrnuje přístup k REST API MujCRM. Díky tomu lze propojit CRM s vlastními interními systémy: ERP, fakturačním softwarem, e‑shopem nebo vlastním dashboardem. API dokumentace a přístupové tokeny jsou dostupné po aktivaci Enterprise tarifu.',
        bullets: [
          'REST API přístup ke všem datům v CRM',
          'Čtení i zápis dat (zákazníci, leady, aktivity, obchody)',
          'Autentizace přes API tokeny',
          'Webhooky pro real-time notifikace o změnách dat',
          'Dostupné v tarifu Enterprise',
        ],
      },
    ],
    useCases: [
      'Firma chtějící propojit CRM s firemním e‑mailem na vlastní doméně',
      'E‑shop synchronizující zákazníky ze svého systému do CRM přes API',
      'Účetní firma integrující CRM s fakturačním softwarem',
      'Vývojářský tým budující vlastní dashboard nad daty z MujCRM',
    ],
    faq: [
      {
        q: 'Jaké e‑mailové poskytovatele MujCRM podporuje?',
        a: 'MujCRM podporuje libovolného poskytovatele e‑mailu s protokoly IMAP a SMTP. Mezi ověřené patří Gmail, Google Workspace, Outlook, Microsoft 365, Seznam.cz, Centrum.cz, Yahoo Mail a firemní e‑mail na vlastní doméně.',
      },
      {
        q: 'Je API přístup dostupný ve všech tarifech?',
        a: 'Ne. API přístup je dostupný pouze v tarifu Enterprise. Nižší tarify (Start, Tým, Business) nabízejí předdefinované integrace (e‑mail, Stripe) bez přístupu k přímému API.',
      },
      {
        q: 'Jak připojit Gmail k MujCRM?',
        a: 'V Nastavení → E-mail zadejte IMAP a SMTP údaje svého Gmail účtu. U Gmailu doporučujeme vygenerovat „Heslo aplikace" v Google nastavení (Zabezpečení → Přihlašování → Hesla aplikací) namísto hlavního hesla. Celé nastavení trvá méně než 2 minuty.',
      },
      {
        q: 'Podporuje MujCRM webhooky?',
        a: 'Webhooky jsou součástí API přístupu v tarifu Enterprise. Umožňují přijímat real-time notifikace o změnách v CRM (nový zákazník, konverze leadu, uzavřený obchod) do vašeho externího systému.',
      },
      {
        q: 'Plánujete další integrace (Zapier, Make, HubSpot)?',
        a: 'Ano. Na roadmapě MujCRM jsou integrace s platformami Zapier a Make (dříve Integromat), které umožní propojení s tisíci dalšími aplikacemi bez nutnosti psát kód. Sledujte novinky nebo nás kontaktujte na info@mujcrm.cz pro více informací.',
      },
    ],
  },
];

export function getFeatureBySlug(slug: string): FeatureData | undefined {
  return features.find((f) => f.slug === slug);
}
