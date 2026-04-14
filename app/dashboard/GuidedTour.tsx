'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TOUR_KEY = 'mujcrm_tour_completed'

export default function GuidedTour({ userName }: { userName: string }) {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return

    const timer = setTimeout(async () => {
      const Shepherd = (await import('shepherd.js')).default

      // Load CSS via link tag (works reliably with Next.js)
      if (!document.querySelector('link[data-shepherd-css]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/shepherd.js@15/dist/css/shepherd.css'
        link.setAttribute('data-shepherd-css', '1')
        document.head.appendChild(link)
      }

      // Dark theme overrides
      if (!document.querySelector('style[data-shepherd-theme]')) {
        const style = document.createElement('style')
        style.setAttribute('data-shepherd-theme', '1')
        style.textContent = `
          .shepherd-element {
            background: #111111 !important;
            border: 1px solid #333 !important;
            border-radius: 12px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
            max-width: 320px !important;
          }
          .shepherd-text {
            color: #aaaaaa !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            padding: 16px 20px !important;
          }
          .shepherd-header {
            background: #111111 !important;
            padding: 20px 20px 0 !important;
            border-radius: 12px 12px 0 0 !important;
          }
          .shepherd-title {
            color: #ffffff !important;
            font-size: 16px !important;
            font-weight: 600 !important;
          }
          .shepherd-footer {
            padding: 12px 20px 20px !important;
            display: flex !important;
            gap: 8px !important;
            justify-content: flex-end !important;
          }
          .shepherd-button {
            border-radius: 8px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            padding: 8px 16px !important;
            cursor: pointer !important;
            border: none !important;
          }
          .shepherd-button-primary {
            background: linear-gradient(135deg, #00BFFF, #7B2FFF) !important;
            color: white !important;
          }
          .shepherd-button-secondary {
            background: #222222 !important;
            color: #aaaaaa !important;
            border: 1px solid #333 !important;
          }
          .shepherd-cancel-icon {
            color: #666 !important;
          }
          .shepherd-cancel-icon:hover {
            color: #aaaaaa !important;
          }
          .shepherd-modal-overlay-container {
            opacity: 0.7 !important;
          }
          .shepherd-arrow:before {
            background: #111111 !important;
            border-color: #333 !important;
          }
        `
        document.head.appendChild(style)
      }

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: { behavior: 'smooth', block: 'center' },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 8,
        },
      })

      const back = { text: '← Zpět', classes: 'shepherd-button-secondary', action: tour.back }
      const next = { text: 'Další →', classes: 'shepherd-button-primary', action: tour.next }

      const icon = (svg: string) =>
        `<span style="display:inline-flex;align-items:center;gap:9px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:rgba(0,191,255,0.12);flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></span><span>`
      const iconEnd = `</span></span>`

      // 1. Uvítání
      tour.addStep({
        id: 'welcome',
        title: icon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>') + `Vítej, ${userName}!` + iconEnd,
        text: 'Připravili jsme pro tebe krátký průvodce, který ti ukáže kde co najdeš. Zabere to méně než 2 minuty.',
        buttons: [
          { text: 'Přeskočit', classes: 'shepherd-button-secondary', action: tour.cancel },
          { text: 'Začít →', classes: 'shepherd-button-primary', action: tour.next },
        ],
      })

      // 2. Přehled
      tour.addStep({
        id: 'prehled',
        title: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') + 'Přehled' + iconEnd,
        text: 'Tady vidíš souhrn celého svého byznysu – zákazníci, obchody, příjmy a úkoly na jednom místě.',
        attachTo: { element: '[data-tour="nav-prehled"]', on: 'right' },
        buttons: [back, next],
      })

      // 3. Leady
      tour.addStep({
        id: 'leady',
        title: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>') + 'Leady' + iconEnd,
        text: 'Spravuj potenciální zákazníky v tabulce nebo Kanban pohledu. U každého leadu vidíš cenu, popis, aktivní email sekvenci a stav. Přidávej follow-upy a jedním klikem leada převeď na zákazníka.',
        attachTo: { element: '[data-tour="nav-leady"]', on: 'right' },
        buttons: [back, next],
      })

      // 4. Zákazníci
      tour.addStep({
        id: 'zakaznici',
        title: icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') + 'Zákazníci' + iconEnd,
        text: 'Kompletní databáze zákazníků s kontakty, historií komunikace a propojenými zakázkami. Nastav datum narození a systém automaticky odešle přání přes narozeninovou sekvenci.',
        attachTo: { element: '[data-tour="nav-zakaznici"]', on: 'right' },
        buttons: [back, next],
      })

      // 5. Obchody
      tour.addStep({
        id: 'obchody',
        title: icon('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><polyline points="12 12 12 16"/><line x1="10" y1="14" x2="14" y2="14"/>') + 'Zakázky – Kanban' + iconEnd,
        text: 'Vizuální pipeline tvých zakázek. Přesouvej karty mezi sloupci, sleduj hodnotu a nastav si vlastní fáze prodeje.',
        attachTo: { element: '[data-tour="nav-obchody"]', on: 'right' },
        buttons: [back, next],
      })

      // 6. Úkoly
      tour.addStep({
        id: 'ukoly',
        title: icon('<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>') + 'Úkoly' + iconEnd,
        text: 'TO-DO seznam propojený se zákazníky a zakázkami. Nikdy nezapomeneš na follow-up ani důležitý termín.',
        attachTo: { element: '[data-tour="nav-ukoly"]', on: 'right' },
        buttons: [back, next],
      })

      // 7. Kalendář
      tour.addStep({
        id: 'kalendar',
        title: icon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>') + 'Kalendář' + iconEnd,
        text: 'Plánuj schůzky, telefonáty a dema přímo v CRM. Vše propojené s tvými zákazníky a zakázkami.',
        attachTo: { element: '[data-tour="nav-kalendar"]', on: 'right' },
        buttons: [back, next],
      })

      // 8. Aktivity
      tour.addStep({
        id: 'aktivity',
        title: icon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>') + 'Aktivity' + iconEnd,
        text: 'Kompletní timeline všeho co se děje – emaily, hovory, schůzky, poznámky. Celá historie na jednom místě.',
        attachTo: { element: '[data-tour="nav-aktivity"]', on: 'right' },
        buttons: [back, next],
      })

      // 9. Reporting
      tour.addStep({
        id: 'reporting',
        title: icon('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>') + 'Reporting' + iconEnd,
        text: 'Přehledné grafy příjmů, nastavení měsíčních, pololetních a ročních cílů. Vždy víš jak si vedeš.',
        attachTo: { element: '[data-tour="nav-reporting"]', on: 'right' },
        buttons: [back, next],
      })

      // 10. Automatizace
      tour.addStep({
        id: 'automatizace',
        title: icon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>') + 'Automatizace' + iconEnd,
        text: 'Vytvárej emailové sekvence s libovolným počtem kroků a časovými odstupy. Spusť sekvenci přímo z detailu leadu – systém pak odesílá emaily automaticky. Nastav narozeninovou sekvenci pro zákazníky a přání se odešlou sama.',
        attachTo: { element: '[data-tour="nav-automatizace"]', on: 'right' },
        buttons: [back, next],
      })

      // 11. Tým
      tour.addStep({
        id: 'tym',
        title: icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') + 'Tým' + iconEnd,
        text: 'Pozvi kolegy do CRM, přiřaď jim role a úkoly. Celý tým pracuje se stejnými daty.',
        attachTo: { element: '[data-tour="nav-tym"]', on: 'right' },
        buttons: [back, next],
      })

      // 12. Nastavení
      tour.addStep({
        id: 'nastaveni',
        title: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>') + 'Nastavení' + iconEnd,
        text: 'Uprav svůj profil, název firmy, nastav pipeline fáze nebo změň heslo. Vše ovládáš ty.',
        attachTo: { element: '[data-tour="nav-nastaveni"]', on: 'right' },
        buttons: [back, next],
      })

      // 13. Rychlé akce
      tour.addStep({
        id: 'rychle-akce',
        title: icon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>') + 'Rychlé akce' + iconEnd,
        text: 'Odtud můžeš okamžitě přidat zákazníka, vytvořit zakázku nebo přidat úkol – bez zbytečného klikání.',
        attachTo: { element: '[data-tour="rychle-akce"]', on: 'left' },
        buttons: [back, next],
      })

      // 14. Závěr
      tour.addStep({
        id: 'finish',
        title: icon('<polyline points="20 6 9 17 4 12"/>') + 'Jsi připraven!' + iconEnd,
        text: 'To je vše! Začni přidáním prvního zákazníka nebo importem kontaktů z CSV. V případě dotazů jsme tu pro tebe.',
        buttons: [
          back,
          {
            text: 'Začít používat MujCRM →',
            classes: 'shepherd-button-primary',
            action: () => {
              localStorage.setItem(TOUR_KEY, 'true')
              tour.complete()
            },
          },
        ],
      })

      tour.on('cancel', () => {
        localStorage.setItem(TOUR_KEY, 'true')
      })

      tour.start()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null
}
