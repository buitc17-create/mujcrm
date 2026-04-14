export type ContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'callout'; text: string; accent?: string };

export interface Post {
  slug: string;
  title: string;
  category: string;
  perex: string;
  date: string;
  dateISO: string;
  readTime: number;
  keywords: string[];
  gradient: string;
  content: ContentBlock[];
}

export const posts: Post[] = [
  {
    slug: 'co-je-crm-system',
    title: 'Co je CRM systém a proč ho potřebuje každý podnikatel v ČR',
    category: 'Průvodce',
    perex:
      'CRM systém je dnes základní nástroj pro každého, kdo chce mít přehled nad zákazníky a neztratit ani jednu obchodní příležitost.',
    date: '15. února 2026',
    dateISO: '2026-02-15',
    readTime: 7,
    keywords: ['CRM systém', 'co je CRM', 'CRM pro podnikatele', 'správa zákazníků česky'],
    gradient: 'linear-gradient(135deg, #00BFFF 0%, #7B2FFF 100%)',
    content: [
      {
        type: 'p',
        text: 'Zkratka CRM pochází z anglického Customer Relationship Management, česky řízení vztahů se zákazníky. V praxi jde o softwarový nástroj, který vám pomáhá evidovat veškeré informace o vašich zákaznících, sledovat komunikaci, spravovat obchodní příležitosti a koordinovat práci celého týmu. Pro mnoho českých podnikatelů je CRM stále záhadnou zkratkou z korporátního světa. Ve skutečnosti jde o věc, která výrazně usnadňuje každodenní práci, ať už jste OSVČ, malá firma, nebo rychle rostoucí startup.',
      },
      {
        type: 'h2',
        text: 'Co přesně CRM systém obsahuje?',
      },
      {
        type: 'p',
        text: 'Moderní CRM systém sdružuje na jednom místě vše, co potřebujete k efektivní práci se zákazníky. Základem je databáze kontaktů, do které zaznamenáváte jméno, firmu, e-mail, telefon a veškerou historii komunikace. Nad kontakty pak stojí obchodní pipeline, tedy vizuální přehled toho, v jaké fázi se každý potenciální obchod nachází. K tomu se přidávají úkoly a připomínky, reporty a statistiky. Prémiové systémy nabízejí také napojení na e-mail, kalendář nebo fakturační software.',
      },
      {
        type: 'h2',
        text: 'Proč tabulky a poznámkový blok nestačí',
      },
      {
        type: 'p',
        text: 'Většina podnikatelů začíná evidenci zákazníků v Excelu nebo Google Sheets. Na začátku to funguje výborně. Problémy přicházejí s růstem. Když máte 50, 100 nebo 200 kontaktů, tabulky přestávají stačit. Duplikáty v datech, neaktuální informace, nulová sdílitelnost s kolegy, žádná notifikace na follow-up. Přesně v tuto chvíli lidé přicházejí o zákazníky, aniž by si to uvědomili. Zapomenutý e-mail, zmeškaná schůzka, neuplatněná nabídka. To jsou reálné ztráty peněz.',
      },
      {
        type: 'callout',
        text: 'Podle průzkumu společnosti Salesforce firmy, které aktivně používají CRM, zvyšují obrat v průměru o 29 % a produktivitu obchodního týmu o 34 %.',
        accent: '#00BFFF',
      },
      {
        type: 'h2',
        text: 'Co konkrétně CRM systém řeší',
      },
      {
        type: 'ul',
        items: [
          'Centrální databáze zákazníků: všechna data na jednom místě, přístupná celému týmu v reálném čase.',
          'Historie komunikace: víte přesně, o čem jste mluvili, co bylo domluveno a co čeká na vyřízení.',
          'Obchodní pipeline: vizuální kanban nebo seznam příležitostí s hodnotou a pravděpodobností uzavření.',
          'Automatické připomínky: systém vás upozorní, kdy navázat kontakt nebo odeslat nabídku.',
          'Reporting: vidíte, kolik obchodů máte v pipeline, jaká je průměrná délka obchodního cyklu a kde ztrácíte zákazníky.',
          'Spolupráce týmu: obchodníci, podpora i management pracují se stejnými daty bez duplicit a zmatků.',
        ],
      },
      {
        type: 'h2',
        text: 'Pro koho je CRM vhodný v České republice',
      },
      {
        type: 'p',
        text: 'CRM systém není jen pro velké korporace. Naopak, pro malé a střední české firmy může přinést největší benefit, protože mají méně zdrojů a nemohou si dovolit ztrácet zákazníky kvůli organizačním chybám. CRM ocení OSVČ, kteří chtějí mít přehled nad svými klienty. Freelanceři v kreativních oborech, kteří jugglují více projektů najednou. Malé obchodní firmy s 2–10 lidmi, kde si každý dělá trochu všeho. Agentury a konzultanti, kteří komunikují s desítkami klientů měsíčně.',
      },
      {
        type: 'h2',
        text: 'Jak začít s CRM v praxi',
      },
      {
        type: 'ol',
        items: [
          'Zmapujte svůj obchodní proces: jak vypadá cesta zákazníka od prvního kontaktu k uzavřenému obchodu?',
          'Vyberte CRM přizpůsobené vaší velikosti: nepotřebujete Salesforce, pokud máte 5 zákazníků denně.',
          'Importujte stávající kontakty: většina CRM systémů podporuje import z CSV nebo Excelu.',
          'Nastavte pipeline podle svého procesu: pojmenujte fáze tak, jak je skutečně máte (Nový lead, Schůzka, Nabídka, Uzavřeno).',
          'Zapojte tým: CRM funguje jen tehdy, když ho používají všichni.',
        ],
      },
      {
        type: 'h2',
        text: 'Na co se zaměřit při výběru CRM pro českou firmu',
      },
      {
        type: 'p',
        text: 'Při výběru CRM pro českou firmu je klíčová několik kritérií. Prvním je česká lokalizace, protože rozhraní v češtině výrazně snižuje bariéru adopce v týmu. Druhým je cena: zatímco globální CRM systémy bývají v amerických dolarech, české nebo lokalizované alternativy nabízejí cenotvorbu odpovídající místnímu trhu. Třetím kritériem je GDPR compliance: jako správce osobních dat zákazníků musíte mít jistotu, že váš CRM systém ukládá data v EU a je v souladu s evropskou legislativou. Čtvrtým je jednoduchost implementace: čím rychleji tým CRM přijme, tím dříve uvidíte výsledky.',
      },
      {
        type: 'h2',
        text: 'Shrnutí: CRM jako základ vašeho byznysu',
      },
      {
        type: 'p',
        text: 'CRM systém není luxus ani zbytečný výdaj. Je to investice, která se vrátí v podobě méně ztracených obchodů, lepšího přehledu a efektivnějšího týmu. V době, kdy zákazníci očekávají rychlou a personalizovanou komunikaci, si nemůžete dovolit spoléhat na paměť nebo roztroušené poznámky. Moderní CRM systémy, jako je MujCRM, jsou navrženy tak, aby je zvládl nastavit i začátečník za méně než hodinu. Zkušební verze je většinou zdarma, takže není důvod otálet.',
      },
    ],
  },

  {
    slug: 'crm-pro-freelancery',
    title: 'CRM pro freelancery: Jak mít přehled nad klienty bez zbytečné složitosti',
    category: 'Tipy & triky',
    perex:
      'Jako freelancer žonglujete s klienty, projekty, deadliny i fakturami. CRM systém vám pomůže přestat zapomínat a začít vydělávat víc.',
    date: '22. února 2026',
    dateISO: '2026-02-22',
    readTime: 6,
    keywords: ['CRM freelancer', 'správa klientů freelancer', 'CRM pro OSVČ', 'CRM zdarma'],
    gradient: 'linear-gradient(135deg, #00BFFF 0%, #00c896 100%)',
    content: [
      {
        type: 'p',
        text: 'Freelancing přináší svobodu, ale také chaos. Desítky e-mailů, zmeškaná poptávka, klient, o kterém jste zapomněli, že čeká na nabídku. Pokud vám to zní povědomě, nejste sami. Podle průzkumu Asociace freelancerů ČR přichází průměrný freelancer o 1–3 klienty ročně pouze kvůli nedostatečné organizaci komunikace. Přitom právě tyto ztracené příležitosti mohou představovat desítky tisíc korun.',
      },
      {
        type: 'h2',
        text: 'Typické problémy freelancerů s evidencí klientů',
      },
      {
        type: 'ul',
        items: [
          'Kontakty rozházené v e-mailu, telefonu, LinkedIn a Excel tabulce zároveň.',
          'Nevíte, kdo čeká na nabídku a kdo je "studenní" lead z minulého roku.',
          'Ztracené e-maily s důležitými briefy nebo podmínkami spolupráce.',
          'Žádný přehled o tom, kolik máte rozjednaných projektů a za jakou hodnotu.',
          'Zapomenuté follow-upy: "Měl jsem napsat Novákovi, ale nevím přesně kdy a co".',
        ],
      },
      {
        type: 'h2',
        text: 'Co CRM systém řeší pro OSVČ a freelancery',
      },
      {
        type: 'p',
        text: 'CRM pro freelancera nemusí být složitý enterprise systém. Potřebujete jednoduchou databázi klientů, přehlednou pipeline poptávek a projektů, a systém upozornění. Nic víc. Moderní CRM systémy jako MujCRM jsou navrženy tak, aby je mohl používat jeden člověk bez IT podpory. Nastavení trvá méně než hodinu, a od té chvíle máte veškeré informace o klientech na jednom místě.',
      },
      {
        type: 'h2',
        text: 'Jak nastavit pipeline pro freelancera',
      },
      {
        type: 'p',
        text: 'Freelancer nepotřebuje složitý obchodní proces. Doporučujeme tuto jednoduchou pipeline o čtyřech fázích:',
      },
      {
        type: 'ol',
        items: [
          'Nová poptávka: přišel e-mail nebo zpráva, je třeba reagovat do 24 hodin.',
          'Zpracovávám nabídku: připravuji cenovou nabídku nebo brief.',
          'Čekám na odpověď: nabídka odeslána, čekám na reakci klienta.',
          'Aktivní projekt: práce probíhá, eviduji milníky a termíny.',
        ],
      },
      {
        type: 'p',
        text: 'Každá karta v pipeline obsahuje jméno klienta, popis projektu, odhadovanou hodnotu a termín. Na první pohled vidíte, kde právě jste a co je třeba řešit.',
      },
      {
        type: 'h2',
        text: '5 praktických tipů pro freelancery',
      },
      {
        type: 'ol',
        items: [
          'Přidejte každou poptávku ihned, i tu, o které si nejste jisti. Lepší mít v pipeline víc, než na něco zapomenout.',
          'Nastavte připomínku na follow-up: pokud klient do 5 dní neodpoví, systém vás upozorní.',
          'Využívejte poznámky ke klientovi: zaznamenávejte osobní preference, způsob komunikace nebo fakturační údaje.',
          'Pravidelný týdenní přehled: každé pondělí si projděte pipeline a nastavte priority týdne.',
          'Po uzavření projektu archivujte, nemazejte. Historická data jsou cenná pro budoucí nabídky.',
        ],
      },
      {
        type: 'h2',
        text: 'CRM a opakovaní klienti: klíč k stabilnímu příjmu',
      },
      {
        type: 'p',
        text: 'Pro freelancera jsou opakovaní klienti zlatem. CRM vám pomůže identifikovat ty, kteří se vracejí, ale i ty, o které jste přišli. Funkce tagování umožňuje označit klienty například jako "VIP", "Potenciál pro rozšíření" nebo "Nevhodný klient". Jedním filtrem pak vidíte, komu byste měli proaktivně napsat s novou nabídkou.',
      },
      {
        type: 'callout',
        text: 'Tip: Nastavte si v CRM připomínku na každého klienta 3 měsíce po skončení projektu. Krátký e-mail "Jak se daří, je třeba něco?" otevírá dveře k dalšímu obchodu.',
        accent: '#00c896',
      },
      {
        type: 'h2',
        text: 'Je CRM pro freelancera zadarmo?',
      },
      {
        type: 'p',
        text: 'Mnoho CRM systémů nabízí free plán pro jednotlivce. MujCRM má free tier s až 50 kontakty, což pokryje naprostou většinu freelancerů v ČR. Pokud váš byznys roste a potřebujete víc, přechod na placený plán je otázkou stovek korun měsíčně. V porovnání s hodnotou jednoho ztráceného projektu jde o zanedbatelnou investici.',
      },
    ],
  },

  {
    slug: 'jak-zvysit-obrat-s-crm',
    title: '5 způsobů jak CRM systém zvýší váš obrat o 30 %',
    category: 'Tipy & triky',
    perex:
      'Čísla mluví jasně: firmy s CRM zavírají o 30 % více obchodů. Tady je 5 konkrétních způsobů, jak toho dosáhnout.',
    date: '1. března 2026',
    dateISO: '2026-03-01',
    readTime: 8,
    keywords: ['zvýšení obratu CRM', 'CRM obchod', 'pipeline management', 'follow-up zákazníci'],
    gradient: 'linear-gradient(135deg, #7B2FFF 0%, #00BFFF 100%)',
    content: [
      {
        type: 'p',
        text: 'Zkratka ROI (return on investment) je pro CRM systém mimořádně příznivá. Studie Nucleus Research zjistila, že průměrná návratnost investice do CRM je 8,71 USD na každý utracený dolar. V českém kontextu to znamená: i levný CRM na 600 Kč měsíčně dokáže přinést tisíce korun navíc, pokud ho používáte správně. Jak? Tady je 5 konkrétních mechanismů.',
      },
      {
        type: 'h2',
        text: '1. Žádný klient nezůstane bez follow-upu',
      },
      {
        type: 'p',
        text: 'Největší příčina ztracených obchodů není cena ani konkurence. Je to ticho. Zákazník projeví zájem, dostane nabídku, a pak se ozve jen tehdy, když obchodník aktivně navazuje kontakt. Výzkumy ukazují, že 80 % obchodů se uzavírá po 5. nebo pozdějším kontaktu, přičemž většina obchodníků vzdává po prvním nebo druhém. CRM systém nastaví automatické připomínky: "Novák čeká na odpověď 3 dny, zavolejte." Nic nezůstane ležet ladem.',
      },
      {
        type: 'h2',
        text: '2. Přehled celé pipeline v reálném čase',
      },
      {
        type: 'p',
        text: 'Bez CRM manažer neví, kolik obchodů tým aktuálně řeší, jaká je jejich souhrnná hodnota a kde vázne proces. S CRM vidíte pipeline okamžitě: 12 obchodů v jednání, celková hodnota 850 000 Kč, průměrná délka cyklu 18 dní. Tato transparentnost umožňuje aktivní řízení místo pasivního čekání. Vidíte, které obchody stagnují, a můžete zasáhnout dřív, než je zákazník ztracen.',
      },
      {
        type: 'callout',
        text: 'Firmy s přehlednou obchodní pipeline dosahují o 28 % vyšší míry úspěšnosti uzavírání obchodů. (Zdroj: Aberdeen Group)',
        accent: '#7B2FFF',
      },
      {
        type: 'h2',
        text: '3. Identifikace nejcennějších zákazníků (Paretovo pravidlo)',
      },
      {
        type: 'p',
        text: 'Paretovo pravidlo říká, že 20 % zákazníků generuje 80 % obratu. CRM vám pomůže tuto skupinu identifikovat a věnovat jim nadstandardní péči. Pomocí tagů a filtrů označíte VIP klienty, nastavíte jim kratší dobu odezvy nebo jiný komunikační protokol. Investujete svůj čas tam, kde se to skutečně vyplatí. Zároveň vidíte, kteří zákazníci mají potenciál pro upsell nebo cross-sell a kdy je správný čas oslovit je.',
      },
      {
        type: 'h2',
        text: '4. Zkrácení obchodního cyklu',
      },
      {
        type: 'p',
        text: 'Čím kratší obchodní cyklus, tím rychleji přicházejí peníze. CRM pomáhá obchodní cyklus zkrátit hned několika způsoby. Šablony nabídek a dokumentů eliminují čas strávený přípravou. Historie komunikace eliminuje opakované dotazy: víte přesně, co zákazník potřebuje, aniž byste se ptali znovu. Připomínky zabrání tomu, aby obchod "uspal" na několik týdnů. Firmy, které aktivně sledují a optimalizují svůj obchodní cyklus pomocí CRM, ho zkracují v průměru o 8–14 dní.',
      },
      {
        type: 'h2',
        text: '5. Reporting a předvídání tržeb',
      },
      {
        type: 'p',
        text: 'CRM umožňuje tvořit predikce tržeb na základě reálných dat z pipeline. Pokud víte, že váš průměrný konverzní poměr je 35 % a v pipeline máte obchody za 1 milion korun, víte, že příští měsíc očekáváte příjem cca 350 000 Kč. Tato předvídatelnost umožňuje lepší plánování kapacity, náboru i investic. Bez CRM tato čísla hádáte. S CRM je máte.',
      },
      {
        type: 'table',
        headers: ['Metrika', 'Bez CRM', 'S CRM'],
        rows: [
          ['Míra uzavírání obchodů', '17 %', '31 %'],
          ['Délka obchodního cyklu', '26 dní', '18 dní'],
          ['Follow-up rate', '41 %', '92 %'],
          ['Přesnost předpovědi tržeb', '±40 %', '±12 %'],
        ],
      },
      {
        type: 'h2',
        text: 'Jak začít a kdy očekávat výsledky',
      },
      {
        type: 'p',
        text: 'Nečekejte okamžité výsledky. CRM je maratonec, ne sprinter. Typický timeline vypadá takto: první měsíc strávíte importem dat a nastavením pipeline. Druhý měsíc se tým naučí systém používat. Třetí měsíc začínáte vidět první dopady: méně ztracených obchodů, rychlejší reakce. Po šesti měsících máte dost dat pro smysluplný reporting a optimalizaci. Po roce měříte skutečný dopad na obrat.',
      },
    ],
  },

  {
    slug: 'crm-vs-excel',
    title: 'CRM vs. Excel: Proč tabulky nestačí pro rostoucí firmu',
    category: 'Srovnání',
    perex:
      'Excel je skvělý nástroj, ale ne pro správu zákazníků. Kdy je čas přejít na CRM a jak na to? Porovnáváme obě možnosti.',
    date: '7. března 2026',
    dateISO: '2026-03-07',
    readTime: 7,
    keywords: ['CRM vs Excel', 'správa zákazníků Excel', 'kdy přejít na CRM', 'Excel CRM'],
    gradient: 'linear-gradient(135deg, #7B2FFF 0%, #ff6b6b 100%)',
    content: [
      {
        type: 'p',
        text: 'Excel byl vynalezen v roce 1985 a od té doby se stal nejrozšířenějším "CRM systémem" na světě. Odhaduje se, že přes 60 % malých firem v ČR stále eviduje zákazníky v tabulkovém procesoru. Je to špatně? Ne nutně, záleží na fázi vašeho byznysu. Ale existuje bod, za kterým Excel způsobuje více škody než užitku. V tomto článku vám pomůžeme ten bod identifikovat.',
      },
      {
        type: 'h2',
        text: 'Kdy Excel pro správu zákazníků ještě stačí',
      },
      {
        type: 'ul',
        items: [
          'Máte méně než 30 aktivních zákazníků.',
          'Pracujete sami nebo ve dvou a sdílení tabulek nepředstavuje problém.',
          'Vaše obchodní komunikace je minimální (1–3 interakce s klientem za projekt).',
          'Nepotřebujete reporty ani přehled obchodní pipeline.',
          'Tempo růstu je pomalé a stabilní.',
        ],
      },
      {
        type: 'h2',
        text: 'Kdy Excel přestává stačit',
      },
      {
        type: 'p',
        text: 'Problémy s Excelem se začínají projevovat v určitých zlomových bodech. Prvním je moment, kdy máte v tabulce více než 50 kontaktů a začínáte mít problém najít konkrétního zákazníka. Druhým je nástup prvního zaměstnance nebo spolupracovníka: najednou pracují dva lidé se stejným souborem a konflikty jsou nevyhnutelné. Třetím je chvíle, kdy vám poprvé unikne obchodní příležitost, protože jste zapomněli follow-up. Čtvrtým je požadavek managementu na přehled výkonnosti.',
      },
      {
        type: 'callout',
        text: 'Průzkum mezi 200 českými malými firmami ukázal, že 73 % z těch, které přešly z Excelu na CRM, uvádí jako hlavní důvod "ztrátu důležitých informací nebo zákazníků".',
        accent: '#ff6b6b',
      },
      {
        type: 'h2',
        text: 'Srovnání CRM systému a Excelu',
      },
      {
        type: 'table',
        headers: ['Funkce', 'Excel', 'CRM systém'],
        rows: [
          ['Sdílení v reálném čase', 'Omezené (verze souborů)', 'Ano, vždy aktuální'],
          ['Vyhledávání a filtry', 'Základní', 'Pokročilé, víceúrovňové'],
          ['Historie komunikace', 'Ne', 'Ano, chronologicky'],
          ['Automatické připomínky', 'Ne', 'Ano'],
          ['Obchodní pipeline', 'Ne (jen tabulka)', 'Vizuální Kanban'],
          ['Reporty a analytika', 'Manuální výpočty', 'Automatické, real-time'],
          ['Mobilní přístup', 'Omezený', 'Plnohodnotný'],
          ['GDPR compliance', 'Obtížné', 'Vestavěné nástroje'],
          ['Přístupová práva', 'Ne', 'Role a oprávnění'],
          ['Integrace s e-mailem', 'Ne', 'Ano'],
          ['Cena', 'Zdarma (Microsoft 365)', 'Od 0 Kč / měsíc'],
        ],
      },
      {
        type: 'h2',
        text: 'Reálné problémy, které slýcháme od zákazníků',
      },
      {
        type: 'p',
        text: '"Kolega přepsal moje data při synchronizaci." "Nevím, kdo naposledy mluvil s panem Novákem a o čem." "Mám tři různé tabulky a nevím, která je aktuální." "Zákazník se zeptál na detail z rozhovoru před rokem, ale nic jsem nenašel." To jsou skutečné citace od majitelů malých firem, kteří k nám přišli s prosbou o pomoc. Všechny tyto problémy CRM řeší ze dne na den.',
      },
      {
        type: 'h2',
        text: 'Jak migrovat z Excelu do CRM',
      },
      {
        type: 'ol',
        items: [
          'Vyčistěte tabulku: odstraňte duplikáty, doplňte chybějící e-maily a telefony.',
          'Exportujte do CSV: většina tabulkových procesorů to zvládne jedním kliknutím.',
          'Naimportujte do CRM: průvodce importem vás provede mapováním sloupců.',
          'Nastavte pipeline: definujte fáze obchodního procesu.',
          'Poznejte nový systém: věnujte týden procvičování před "ostrým startem".',
          'Archivujte Excel: nechte ho jen jako zálohu, nepracujte v něm paralelně.',
        ],
      },
      {
        type: 'h2',
        text: 'Závěr: Excel nebo CRM?',
      },
      {
        type: 'p',
        text: 'Excel je výborný pro čísla, výpočty a analýzy. Není ale primárně navržen pro správu vztahů se zákazníky. Pokud vaše firma roste a zákazníci jsou pro vás klíčoví (a pro koho nejsou?), přechod na CRM je logickým krokem. Dobrá zpráva: moderní CRM systémy jsou intuitivní, cenově dostupné a migraci zvládnete za jeden odpoledne.',
      },
    ],
  },

  {
    slug: 'jak-nastavit-crm-obchodni-tym',
    title: 'Jak správně nastavit CRM pro obchodní tým: Průvodce krok za krokem',
    category: 'Průvodce',
    perex:
      'Špatně nastavené CRM tým nepoužívá. Tady je průvodce, jak CRM nastavit správně od začátku, aby ho obchodníci milovali, ne nenáviděli.',
    date: '12. března 2026',
    dateISO: '2026-03-12',
    readTime: 9,
    keywords: ['nastavení CRM', 'CRM obchodní tým', 'pipeline CRM', 'CRM implementace'],
    gradient: 'linear-gradient(135deg, #00BFFF 0%, #7B2FFF 100%)',
    content: [
      {
        type: 'p',
        text: 'Implementace CRM selže ve 30–70 % případů. Ne kvůli technologii, ta je dnes dostatečně jednoduchá. Selže kvůli špatnému nastavení a nedostatečnému zapojení týmu. Přitom se stačí řídit několika principy, které výrazně zvyšují šanci na úspěch. Tento průvodce vám ukáže, jak CRM nastavit pro obchodní tým krok za krokem.',
      },
      {
        type: 'h2',
        text: 'Krok 1: Definujte vaši obchodní pipeline',
      },
      {
        type: 'p',
        text: 'Pipeline je srdcem každého CRM. Před tím, než cokoli nastavujete v systému, si sednete s týmem a zmapujete skutečný obchodní proces. Jak vypadá cesta zákazníka od prvního kontaktu k podpisu smlouvy? Kolik fází má? Jak dlouho obvykle trvá každá fáze? Odpovědi na tyto otázky jsou základem pro nastavení pipeline v CRM.',
      },
      {
        type: 'h3',
        text: 'Příklad pipeline pro B2B obchodní tým',
      },
      {
        type: 'ul',
        items: [
          'Nový lead (1–2 dny): kontakt přijat, čeká na první oslovení.',
          'Kontaktován (3–5 dní): byl zaslán první e-mail nebo proběhl první hovor.',
          'Schůzka domluvena (5–7 dní): zákazník souhlasil s prezentací nebo online meetingem.',
          'Nabídka odeslána (3–5 dní): čekáme na reakci zákazníka.',
          'Vyjednávání (5–14 dní): zákazník má zájem, ladíme podmínky.',
          'Uzavřeno: Vyhráno nebo Prohráno.',
        ],
      },
      {
        type: 'h2',
        text: 'Krok 2: Nastavte statusy a pole záznamu',
      },
      {
        type: 'p',
        text: 'Každá příležitost v CRM by měla mít definovaný minimální set informací: název a popis obchodu, přiřazený zákazník, odhadovaná hodnota, pravděpodobnost uzavření, zodpovědný obchodník, termín uzavření a aktivity (poznámky, hovory, e-maily). Nepřehánějte to s počtem polí, obchodníci nenávidí zdlouhavé formuláře. Začněte s minimem a doplňujte, co skutečně potřebujete.',
      },
      {
        type: 'callout',
        text: 'Zlaté pravidlo implementace CRM: Méně je více. Každé povinné pole navíc snižuje adopci systému o 8 %. (Forrester Research)',
        accent: '#00BFFF',
      },
      {
        type: 'h2',
        text: 'Krok 3: Přidělte role a oprávnění',
      },
      {
        type: 'p',
        text: 'Různí členové týmu potřebují různá oprávnění. Obchodní zástupce vidí jen své obchody nebo obchody celého týmu. Manažer vidí vše a může zasahovat do jakéhokoli záznamu. Marketingový tým vidí kontakty, ale ne finanční data obchodů. Správné nastavení rolí brání zmatku a také ochraňuje citlivá obchodní data před neoprávněným přístupem.',
      },
      {
        type: 'h2',
        text: 'Krok 4: Nastavte automatické připomínky a workflow',
      },
      {
        type: 'p',
        text: 'Automatizace je to, co odděluje dobré CRM od skvělého. Nastavte pravidla: "Pokud zákazník 3 dny neodpověděl na nabídku, vytvoř připomínku pro obchodníka." "Pokud obchod stagnuje v jedné fázi více než 14 dní, upozorni manažera." "Pokud je uzavřen jako Vyhráno, naplánuj follow-up za 30 dní." Tyto automatizace ušetří váš tým každodenní manuální práce a eliminují "zapomenuté" příležitosti.',
      },
      {
        type: 'h2',
        text: 'Krok 5: Nastavte reporting a KPI',
      },
      {
        type: 'p',
        text: 'Definujte klíčové metriky, které budete sledovat. Pro obchodní tým jsou to typicky: počet nových leadů za měsíc, celková hodnota pipeline, míra konverze v každé fázi, průměrná délka obchodního cyklu, výkonnost jednotlivých obchodníků. Nastavte týdenní nebo měsíční reporty, které se generují automaticky. Manažer by měl mít přehled na jedno kliknutí, ne až po hodině tvoření tabulek.',
      },
      {
        type: 'h2',
        text: 'Krok 6: Onboarding týmu jako klíčová fáze',
      },
      {
        type: 'p',
        text: 'I sebedokonalejší CRM selže, pokud ho tým nepoužívá. Věnujte onboardingu čas a pozornost. Uspořádejte kick-off meeting, kde vysvětlíte, proč CRM zavádíte a co to přinese obchodníkům samotným (méně administrativy, lépe připravené schůzky, jasné priority). Vytvořte krátký průvodce "Jak zadám obchod za 2 minuty". Stanovte jednoduchou procesní normu: každý obchod, každé volání, každý e-mail se zaznamená v CRM. Oceňujte ty, kteří systém používají nejlépe.',
      },
      {
        type: 'h2',
        text: 'Časté chyby při implementaci CRM',
      },
      {
        type: 'ul',
        items: [
          'Příliš mnoho povinných polí: tým systém sabotuje, protože je příliš zdlouhavý.',
          'Paralelní evidence v Excelu: "jen pro jistotu" ničí smysl CRM.',
          'Chybějící manažerský zájem: pokud management CRM nepoužívá, obchodníci to vidí a přestávají také.',
          'Nereálná očekávání: CRM není kouzelná hůlka, výsledky přicházejí za 3–6 měsíců.',
          'Jedna velká implementace místo iterativního přístupu: začněte malým pilotním projektem.',
        ],
      },
    ],
  },

  {
    slug: 'gdpr-crm-ceska-republika',
    title: 'GDPR a CRM systém: Na co si dát pozor při správě zákaznických dat v ČR',
    category: 'Legislativa',
    perex:
      'GDPR není jen byrokratická povinnost, je to příležitost budovat důvěru zákazníků. Jak CRM systém pomáhá s GDPR compliance v České republice?',
    date: '18. března 2026',
    dateISO: '2026-03-18',
    readTime: 8,
    keywords: ['GDPR CRM', 'ochrana osobních údajů CRM', 'GDPR podnikatel ČR', 'zákaznická data GDPR'],
    gradient: 'linear-gradient(135deg, #ff9500 0%, #ff6b6b 100%)',
    content: [
      {
        type: 'p',
        text: 'Od května 2018, kdy vstoupilo GDPR v účinnost, je každý správce osobních údajů v EU povinen dodržovat přísnější pravidla pro zpracování dat. V České republice toto nařízení doplňuje zákon č. 110/2019 Sb. o zpracování osobních údajů. Pro podnikatele, kteří používají CRM systém, to má přímý praktický dopad. Zákaznická databáze v CRM je ze své podstaty sbírkou osobních údajů. Pokud není správně zabezpečena a spravována, hrozí vám nejen pokuta, ale i ztráta důvěry zákazníků.',
      },
      {
        type: 'h2',
        text: 'Co GDPR říká o zákaznických datech v CRM',
      },
      {
        type: 'p',
        text: 'Základní princip GDPR je jednoduchý: osobní údaje (jméno, e-mail, telefon, adresa, IP adresa) smíte zpracovávat pouze tehdy, pokud k tomu máte právní základ. V kontextu CRM existují tři nejčastější právní základy: plnění smlouvy (zákazník od vás kupuje, takže evidujete jeho data proto, abyste mu mohli dodat zboží nebo službu), oprávněný zájem (obchodní komunikace s existujícím zákazníkem, zlepšování produktu) a souhlas (marketingové e-maily, newsletter, remarketing).',
      },
      {
        type: 'h2',
        text: 'Povinnosti správce osobních údajů',
      },
      {
        type: 'ul',
        items: [
          'Informační povinnost: zákazník musí vědět, kdo jeho data zpracovává, za jakým účelem a jak dlouho.',
          'Minimalizace dat: shromažďujte pouze ta data, která skutečně potřebujete. Nepotřebujete datum narození, pokud prodáváte software.',
          'Omezení účelu: data použitá k uzavření smlouvy nesmíte automaticky použít k marketingu.',
          'Přesnost: zastaralá nebo nesprávná data musíte opravit nebo smazat.',
          'Práva subjektů: zákazník může požádat o přístup, opravu, výmaz nebo přenositelnost svých dat.',
          'Zabezpečení: musíte přijmout technická a organizační opatření proti úniku dat.',
        ],
      },
      {
        type: 'callout',
        text: 'Pokuta za porušení GDPR může dosáhnout až 20 milionů EUR nebo 4 % celosvětového ročního obratu. Pro malé firmy jsou typické pokuty v řádu desítek tisíc korun, ale i to bolí.',
        accent: '#ff9500',
      },
      {
        type: 'h2',
        text: 'Jak CRM systém pomáhá s GDPR compliance',
      },
      {
        type: 'p',
        text: 'Kvalitní CRM systém má GDPR compliance zabudovanou do svých funkcí. Nejde tedy o komplikaci, naopak, CRM vám GDPR usnadňuje. Záznamy souhlasů: CRM uchovává informaci o tom, kdo a kdy udělil souhlas k marketingové komunikaci. To je klíčové pro prokázání souladu při případné kontrole. Právo na výmaz: jedním kliknutím anonymizujete nebo vymažete všechna data konkrétního zákazníka, který o to požádá. Přenositelnost dat: export zákaznických dat do CSV nebo JSON pro zákazníka, který chce svá data přenést jinam. Přístupová práva: CRM zajišťuje, že k datům zákazníků mají přístup pouze oprávněné osoby.',
      },
      {
        type: 'h2',
        text: 'GDPR checklist pro uživatele CRM v ČR',
      },
      {
        type: 'ol',
        items: [
          'Zkontrolujte, zda váš CRM poskytovatel ukládá data v EU, ideálně na serverech v ČR nebo Německu.',
          'Zjistěte, zda poskytovatel je GDPR compliant a ukládá data výhradně v EU.',
          'Nastavte v CRM doby uchování dat: po uplynutí doby data automaticky archivujte nebo smažte.',
          'Definujte právní základ pro každou kategorii kontaktů v CRM.',
          'Zaznamenejte souhlasy s marketingovou komunikací a jejich datum.',
          'Aktualizujte zásady ochrany osobních údajů na vašem webu.',
          'Informujte zákazníky o zpracování dat při sběru kontaktů (formulář, registrace).',
          'Proveďte interní školení týmu: každý, kdo pracuje s CRM, by měl znát základy GDPR.',
        ],
      },
      {
        type: 'h2',
        text: 'Co hrozí při porušení GDPR',
      },
      {
        type: 'p',
        text: 'Úřad pro ochranu osobních údajů (ÚOOÚ) aktivně prověřuje stížnosti a provádí vlastní inspekce. V roce 2024 vydal ÚOOÚ pokuty v celkové výši přes 15 milionů korun. Nejčastěji sankcionované přestupky: neoprávněné zasílání marketingových e-mailů bez souhlasu, nedostatečné zabezpečení zákaznické databáze, neposkytnutí informací zákazníkovi na jeho žádost. Pro malou firmu je i malá pokuta výrazným finančním i reputačním zásahem.',
      },
      {
        type: 'h2',
        text: 'MujCRM a GDPR: Co vám garantujeme',
      },
      {
        type: 'p',
        text: 'MujCRM je navržen s ohledem na GDPR od základu. Data jsou uložena výhradně na serverech v EU (Frankfurt), šifrována při přenosu (TLS 1.3) i při uložení (AES-256). Systém obsahuje nástroje pro správu souhlasů, export dat a smazání konkrétního zákazníka. Bezpečnost vašich zákaznických dat je naší prioritou, protože je to zároveň zákonná povinnost i základ důvěry.',
      },
    ],
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export const categoryColors: Record<string, string> = {
  'Průvodce': '#00BFFF',
  'Tipy & triky': '#00c896',
  'Srovnání': '#ff6b6b',
  'Legislativa': '#ff9500',
};

// Strips Czech diacritics and converts heading text to a URL-safe anchor id
export function slugifyHeading(text: string): string {
  const map: Record<string, string> = {
    á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n',
    ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
  };
  return text
    .toLowerCase()
    .replace(/[áčďéěíňóřšťúůýž]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Calculates reading time based on ~200 words/minute
export function calculateReadTime(content: ContentBlock[]): number {
  let words = 0;
  for (const block of content) {
    if (block.type === 'h2' || block.type === 'h3' || block.type === 'p' || block.type === 'callout') {
      words += block.text.split(/\s+/).filter(Boolean).length;
    } else if (block.type === 'ul' || block.type === 'ol') {
      block.items.forEach((item) => { words += item.split(/\s+/).filter(Boolean).length; });
    } else if (block.type === 'table') {
      block.headers.forEach((h) => { words += h.split(/\s+/).filter(Boolean).length; });
      block.rows.forEach((row) => row.forEach((cell) => { words += cell.split(/\s+/).filter(Boolean).length; }));
    }
  }
  return Math.max(1, Math.ceil(words / 200));
}

// Returns related posts: same category first, then others
export function getRelatedPosts(slug: string, count = 3): Post[] {
  const current = posts.find((p) => p.slug === slug);
  if (!current) return posts.slice(0, count);
  const sameCategory = posts.filter((p) => p.slug !== slug && p.category === current.category);
  const others = posts.filter((p) => p.slug !== slug && p.category !== current.category);
  return [...sameCategory, ...others].slice(0, count);
}
