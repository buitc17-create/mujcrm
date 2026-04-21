// All PDF libs loaded dynamically (client-side only) to avoid SSR/Turbopack issues

const CYAN = [0, 191, 255] as [number, number, number];
const DARK = [10, 10, 10] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT_BG = [248, 250, 252] as [number, number, number];

// ─── Czech diacritics transliteration ────────────────────────────────────────
// jsPDF's built-in Helvetica doesn't support UTF-8 diacritics — transliterate.

const TRANSLIT: Record<string, string> = {
  á: 'a', Á: 'A', č: 'c', Č: 'C', ď: 'd', Ď: 'D', é: 'e', É: 'E',
  ě: 'e', Ě: 'E', í: 'i', Í: 'I', ň: 'n', Ň: 'N', ó: 'o', Ó: 'O',
  ř: 'r', Ř: 'R', š: 's', Š: 'S', ť: 't', Ť: 'T', ú: 'u', Ú: 'U',
  ů: 'u', Ů: 'U', ý: 'y', Ý: 'Y', ž: 'z', Ž: 'Z',
};

function t(s: string): string {
  return s.replace(/[^\x00-\x7F]/g, c => TRANSLIT[c] ?? c);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addHeader(doc: any, title: string, subtitle?: string) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...CYAN);
  doc.rect(0, 28, W, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text('Muj', 14, 18);
  doc.setTextColor(...CYAN);
  doc.text('CRM', 14 + doc.getTextWidth('Muj'), 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(t(title), W - 14, 14, { align: 'right' });
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(t(subtitle), W - 14, 22, { align: 'right' });
  }
  return 38;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFooter(doc: any) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('© MujCRM · mujcrm.cz', 14, H - 4);
    doc.text(`Strana ${i} / ${pages}`, W - 14, H - 4, { align: 'right' });
    doc.text(`Vygenerovano: ${new Date().toLocaleDateString('cs-CZ')}`, W / 2, H - 4, { align: 'center' });
  }
}

// ─── CONTACTS PDF ─────────────────────────────────────────────────────────────

export type ContactForPDF = {
  jmeno: string;
  prijmeni?: string | null;
  email?: string | null;
  telefon?: string | null;
  firma?: string | null;
  tag?: string | null;
};

export async function exportContactsPDF(contacts: ContactForPDF[], userName?: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const subtitle = userName ? `Sestaven pro: ${userName}` : undefined;
  const startY = addHeader(doc, 'Export kontaktu', subtitle);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Celkem kontaktu: ${contacts.length}`, 14, startY + 4);

  autoTable(doc, {
    startY: startY + 10,
    head: [['Jmeno', 'Firma', 'E-mail', 'Telefon', 'Stitek']],
    body: contacts.map(c => [
      t(`${c.jmeno} ${c.prijmeni ?? ''}`.trim()),
      t(c.firma ?? '—'),
      c.email ?? '—',
      c.telefon ?? '—',
      t(c.tag ?? '—'),
    ]),
    headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 50 }, 1: { cellWidth: 55 }, 2: { cellWidth: 65 },
      3: { cellWidth: 35 }, 4: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
    styles: { overflow: 'ellipsize' },
  });

  addFooter(doc);
  doc.save(`mujcrm-kontakty-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── DEALS PDF ────────────────────────────────────────────────────────────────

export type DealForPDF = {
  nazev: string;
  hodnota?: number | null;
  pravdepodobnost?: number | null;
  stage?: string;
  datum_uzavreni?: string | null;
  kontakt?: string | null;
};

export async function exportDealsPDF(deals: DealForPDF[], userName?: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const subtitle = userName ? `Sestaven pro: ${userName}` : undefined;
  const startY = addHeader(doc, 'Export zakazek', subtitle);

  const totalValue = deals.reduce((s, d) => s + (d.hodnota ?? 0), 0);
  const weightedValue = deals.reduce((s, d) => s + (d.hodnota ?? 0) * ((d.pravdepodobnost ?? 100) / 100), 0);

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Celkem zakazek: ${deals.length}`, 14, startY + 4);
  doc.text(`Celkova hodnota: ${Math.round(totalValue).toLocaleString('cs-CZ')} Kc`, 14, startY + 9);
  doc.text(`Vazena hodnota: ${Math.round(weightedValue).toLocaleString('cs-CZ')} Kc`, 14, startY + 14);

  autoTable(doc, {
    startY: startY + 20,
    head: [['Nazev zakazky', 'Kontakt', 'Faze', 'Hodnota', 'Pravdepodobnost', 'Datum uzavreni']],
    body: deals.map(d => [
      t(d.nazev),
      t(d.kontakt ?? '—'),
      t(d.stage ?? '—'),
      d.hodnota != null ? `${Math.round(d.hodnota).toLocaleString('cs-CZ')} Kc` : '—',
      d.pravdepodobnost != null ? `${d.pravdepodobnost} %` : '—',
      d.datum_uzavreni ? new Date(d.datum_uzavreni).toLocaleDateString('cs-CZ') : '—',
    ]),
    headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 70 }, 1: { cellWidth: 50 }, 2: { cellWidth: 40 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    styles: { overflow: 'ellipsize' },
  });

  addFooter(doc);
  doc.save(`mujcrm-zakazky-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── REPORTS PDF (data-driven, no html2canvas) ────────────────────────────────

export type ReportDataForPDF = {
  // Revenue summary
  revenueThisMonth: number;
  revenueThisYear: number;
  weightedTotal: number;
  winRate: number;
  // Monthly chart data (last 12 months)
  monthlyData: { label: string; actual: number; goal: number }[];
  // Pipeline breakdown
  pipelineData: { name: string; count: number; hodnota: number }[];
  // Top deals
  top5: { nazev: string; hodnota: number; kontakt?: string | null }[];
  // Lead summary
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  newLeadsThisMonth: number;
  leadsBySource: { name: string; celkem: number; konvertovano: number }[];
  // Activity summary
  activityByType: { label: string; count: number }[];
  totalActivitiesLast30: number;
};

function fmtKc(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.0', '') + ' M Kc';
  if (v >= 1_000) return Math.round(v / 1000) + ' tis. Kc';
  return Math.round(v).toLocaleString('cs-CZ') + ' Kc';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sectionTitle(doc: any, label: string, y: number): number {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK);
  doc.rect(14, y, W - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...CYAN);
  doc.text(label.toUpperCase(), 18, y + 5.5);
  return y + 14;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statBox(doc: any, x: number, y: number, w: number, label: string, value: string) {
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(x, y, w, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(label, x + w / 2, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(value, x + w / 2, y + 14, { align: 'center' });
}

export async function exportReportsPDF(data: ReportDataForPDF, userName?: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const subtitle = userName ? `Sestaven pro: ${userName}` : undefined;
  let y = addHeader(doc, 'Reporting', subtitle);

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 18) {
      doc.addPage();
      y = 14;
    }
  };

  // ── REVENUE ──────────────────────────────────────────────────────────────────
  y = sectionTitle(doc, 'Prijmy', y);

  const boxW = (W - 28 - 9) / 4;
  statBox(doc, 14, y, boxW, 'Tento mesic', fmtKc(data.revenueThisMonth));
  statBox(doc, 14 + boxW + 3, y, boxW, 'Tento rok', fmtKc(data.revenueThisYear));
  statBox(doc, 14 + (boxW + 3) * 2, y, boxW, 'Vazeny pipeline', fmtKc(data.weightedTotal));
  statBox(doc, 14 + (boxW + 3) * 3, y, boxW, 'Win rate', `${data.winRate} %`);
  y += 24;

  // Monthly table
  checkPage(40);
  y = sectionTitle(doc, 'Mesicni prehled prijmu (posledních 12 mesicu)', y);

  autoTable(doc, {
    startY: y,
    head: [['Mesic', 'Skutecnost', 'Cil', 'Plneni']],
    body: data.monthlyData.map(m => [
      m.label,
      fmtKc(m.actual),
      m.goal > 0 ? fmtKc(m.goal) : '—',
      m.goal > 0 ? `${Math.round((m.actual / m.goal) * 100)} %` : '—',
    ]),
    headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // Pipeline breakdown
  if (data.pipelineData.length > 0) {
    checkPage(30);
    y = sectionTitle(doc, 'Pipeline dle faze', y);

    autoTable(doc, {
      startY: y,
      head: [['Faze', 'Pocet zakazek', 'Celkova hodnota']],
      body: data.pipelineData.map(p => [
        t(p.name),
        String(p.count),
        fmtKc(p.hodnota),
      ]),
      headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Top 5 deals
  if (data.top5.length > 0) {
    checkPage(30);
    y = sectionTitle(doc, 'Top 5 vyhraných zakazek', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Nazev zakazky', 'Kontakt', 'Hodnota']],
      body: data.top5.map((d, i) => [
        String(i + 1),
        t(d.nazev),
        t(d.kontakt ?? '—'),
        fmtKc(d.hodnota),
      ]),
      headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── LEADS ─────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = 14;
  y = sectionTitle(doc, 'Leady', y);

  const lBoxW = (W - 28 - 9) / 4;
  statBox(doc, 14, y, lBoxW, 'Celkem leadu', String(data.totalLeads));
  statBox(doc, 14 + lBoxW + 3, y, lBoxW, 'Konvertovano', String(data.convertedLeads));
  statBox(doc, 14 + (lBoxW + 3) * 2, y, lBoxW, 'Konverze', `${data.conversionRate} %`);
  statBox(doc, 14 + (lBoxW + 3) * 3, y, lBoxW, 'Nowe tento mesic', String(data.newLeadsThisMonth));
  y += 24;

  if (data.leadsBySource.length > 0) {
    y = sectionTitle(doc, 'Leady dle zdroje', y);
    autoTable(doc, {
      startY: y,
      head: [['Zdroj', 'Celkem', 'Konvertovano', 'Konverze']],
      body: data.leadsBySource.map(s => [
        t(s.name),
        String(s.celkem),
        String(s.konvertovano),
        s.celkem > 0 ? `${Math.round((s.konvertovano / s.celkem) * 100)} %` : '—',
      ]),
      headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── ACTIVITIES ────────────────────────────────────────────────────────────────
  checkPage(30);
  y = sectionTitle(doc, `Aktivity (posledních 30 dni) — celkem: ${data.totalActivitiesLast30}`, y);

  if (data.activityByType.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Typ aktivity', 'Pocet']],
      body: data.activityByType.map(a => [t(a.label), String(a.count)]),
      headStyles: { fillColor: DARK, textColor: CYAN, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Zadne aktivity za posledních 30 dni.', 14, y);
    y += 10;
  }

  addFooter(doc);
  doc.save(`mujcrm-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
