// Sdílená HTML šablona měsíčního výkazu — používá cron i on-demand endpoint

export function buildMonthlyReportHtml(p: {
  memberName: string;
  memberEmail: string;
  adminEmail: string;
  periodStart: Date;
  periodEnd: Date;
  stages: { id: string; nazev: string; barva: string; poradi: number }[];
  deals: Record<string, unknown>[];
  wonDeals: Record<string, unknown>[];
  lostDeals: Record<string, unknown>[];
  activeDeals: Record<string, unknown>[];
  wonValue: number;
  totalValue: number;
  newThisMonthCount: number;
  stageCounts: Record<string, number>;
  maxCount: number;
  stageMap: Record<string, { id: string; nazev: string; barva: string; poradi: number }>;
  isOnDemand?: boolean;
}): string {
  const fmt = (d: Date) => d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const fmtCzk = (v: number) => v.toLocaleString('cs-CZ') + ' Kč';
  const period = `${fmt(p.periodStart)} – ${fmt(p.periodEnd)}`;
  const monthLabel = p.periodStart.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const activeStages = p.stages.filter(s => !/vyhráno|vyhrano|prohr/i.test(s.nazev));

  const barChart = activeStages.map(stage => {
    const count = p.stageCounts[stage.id] ?? 0;
    const pct = Math.round((count / p.maxCount) * 100);
    const barColor = stage.barva ?? '#00BFFF';
    return `
      <tr>
        <td style="padding:6px 12px 6px 0; font-size:13px; color:#374151; white-space:nowrap; width:160px;">${stage.nazev}</td>
        <td style="padding:6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f3f4f6; border-radius:4px; height:22px;">
                <div style="background:${barColor}; width:${pct}%; min-width:${count > 0 ? '28px' : '0'}; height:22px; border-radius:4px; display:flex; align-items:center; padding-left:${count > 0 ? '8px' : '0'};"></div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:6px 0 6px 10px; font-size:13px; font-weight:700; color:#111827; width:30px; text-align:right;">${count}</td>
      </tr>`;
  }).join('');

  const dealsRows = p.activeDeals.slice(0, 20).map((d: Record<string, unknown>) => {
    const contact = d.contacts as { jmeno?: string; prijmeni?: string; firma?: string } | null;
    const contactName = contact
      ? (contact.firma ?? (`${contact.jmeno ?? ''} ${contact.prijmeni ?? ''}`.trim() || '–'))
      : '–';
    const stage = p.stageMap[d.stage_id as string];
    const stageColor = stage?.barva ?? '#9CA3AF';
    const stageName  = stage?.nazev ?? '–';
    const prob = d.pravdepodobnost ? `${d.pravdepodobnost} %` : '–';
    const closeDate = d.datum_uzavreni
      ? new Date(d.datum_uzavreni as string).toLocaleDateString('cs-CZ')
      : '–';
    return `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px; font-size:13px; color:#111827; font-weight:500;">${d.nazev ?? '–'}</td>
        <td style="padding:10px 12px; font-size:13px; color:#6b7280;">${contactName}</td>
        <td style="padding:10px 12px; font-size:13px; color:#111827; text-align:right; white-space:nowrap;">${fmtCzk(Number(d.hodnota ?? 0))}</td>
        <td style="padding:10px 12px; text-align:center;">
          <span style="background:${stageColor}22; color:${stageColor}; font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px;">${stageName}</span>
        </td>
        <td style="padding:10px 12px; font-size:12px; color:#6b7280; text-align:center;">${prob}</td>
        <td style="padding:10px 12px; font-size:12px; color:#6b7280; text-align:center; white-space:nowrap;">${closeDate}</td>
      </tr>`;
  }).join('');

  const wonRows = p.wonDeals.slice(0, 10).map((d: Record<string, unknown>) => {
    const contact = d.contacts as { jmeno?: string; prijmeni?: string; firma?: string } | null;
    const contactName = contact
      ? (contact.firma ?? (`${contact.jmeno ?? ''} ${contact.prijmeni ?? ''}`.trim() || '–'))
      : '–';
    return `
      <tr style="border-bottom:1px solid #f0fdf4;">
        <td style="padding:9px 12px; font-size:13px; color:#111827; font-weight:500;">${d.nazev ?? '–'}</td>
        <td style="padding:9px 12px; font-size:13px; color:#6b7280;">${contactName}</td>
        <td style="padding:9px 12px; font-size:13px; color:#16a34a; font-weight:700; text-align:right; white-space:nowrap;">${fmtCzk(Number(d.hodnota ?? 0))}</td>
      </tr>`;
  }).join('');

  const onDemandBanner = p.isOnDemand ? `
  <!-- ON-DEMAND BADGE -->
  <tr><td style="padding:16px 32px 0; text-align:center;">
    <span style="display:inline-block; background:#fef3c7; border:1px solid #fcd34d; color:#92400e; font-size:11px; font-weight:700; padding:5px 14px; border-radius:20px; letter-spacing:0.5px; text-transform:uppercase;">
      Výkaz odeslán na vyžádání — aktuální stav ke dni ${fmt(p.periodEnd)}
    </span>
  </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Měsíční výkaz – ${p.memberName}</title></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg, #0a0a0a 0%, #1a1040 100%); padding:36px 40px; text-align:center;">
    <div style="color:#00BFFF; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:12px;">MujCRM</div>
    <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:800;">Měsíční výkaz</h1>
    <p style="margin:10px 0 4px; color:rgba(255,255,255,0.85); font-size:16px; font-weight:600;">${p.memberName}</p>
    <p style="margin:0; color:#00BFFF; font-size:13px;">Období: ${period}</p>
  </td></tr>

  ${onDemandBanner}

  <!-- KPI CARDS -->
  <tr><td style="padding:28px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="25%" style="padding:0 6px 0 0;">
          <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:18px 14px; text-align:center;">
            <div style="font-size:28px; font-weight:800; color:#111827;">${p.deals.length}</div>
            <div style="font-size:11px; color:#6b7280; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Zakázek celkem</div>
          </div>
        </td>
        <td width="25%" style="padding:0 6px;">
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:18px 14px; text-align:center;">
            <div style="font-size:28px; font-weight:800; color:#16a34a;">${p.wonDeals.length}</div>
            <div style="font-size:11px; color:#16a34a; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Vyhráno</div>
          </div>
        </td>
        <td width="25%" style="padding:0 6px;">
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:18px 14px; text-align:center;">
            <div style="font-size:28px; font-weight:800; color:#ea580c;">${p.lostDeals.length}</div>
            <div style="font-size:11px; color:#ea580c; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Prohráno</div>
          </div>
        </td>
        <td width="25%" style="padding:0 0 0 6px;">
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:18px 14px; text-align:center;">
            <div style="font-size:28px; font-weight:800; color:#2563eb;">${p.newThisMonthCount}</div>
            <div style="font-size:11px; color:#2563eb; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Nové v měsíci</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- VALUE SUMMARY -->
  <tr><td style="padding:16px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="padding:0 6px 0 0;">
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px;">
            <div style="font-size:11px; color:#16a34a; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Hodnota výher</div>
            <div style="font-size:22px; font-weight:800; color:#16a34a;">${p.wonValue.toLocaleString('cs-CZ')} Kč</div>
          </div>
        </td>
        <td width="50%" style="padding:0 0 0 6px;">
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:16px 20px;">
            <div style="font-size:11px; color:#2563eb; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Hodnota aktivní pipeline</div>
            <div style="font-size:22px; font-weight:800; color:#2563eb;">${p.totalValue.toLocaleString('cs-CZ')} Kč</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  ${activeStages.length > 0 && Object.keys(p.stageCounts).length > 0 ? `
  <!-- PIPELINE CHART -->
  <tr><td style="padding:28px 32px 0;">
    <h2 style="margin:0 0 16px; font-size:16px; font-weight:700; color:#111827; border-bottom:2px solid #f3f4f6; padding-bottom:10px;">Aktivní zakázky dle fáze</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${barChart}
    </table>
  </td></tr>` : ''}

  ${p.activeDeals.length > 0 ? `
  <!-- DEALS TABLE -->
  <tr><td style="padding:28px 32px 0;">
    <h2 style="margin:0 0 16px; font-size:16px; font-weight:700; color:#111827; border-bottom:2px solid #f3f4f6; padding-bottom:10px;">Přehled aktivních zakázek</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <th style="padding:10px 12px; font-size:11px; color:#6b7280; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Zakázka</th>
        <th style="padding:10px 12px; font-size:11px; color:#6b7280; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Zákazník</th>
        <th style="padding:10px 12px; font-size:11px; color:#6b7280; text-align:right; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Hodnota</th>
        <th style="padding:10px 12px; font-size:11px; color:#6b7280; text-align:center; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Fáze</th>
        <th style="padding:10px 12px; font-size:11px; color:#6b7280; text-align:center; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Pravd.</th>
        <th style="padding:10px 12px; font-size:11px; color:#6b7280; text-align:center; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Uzavřít do</th>
      </tr>
      ${dealsRows}
    </table>
    ${p.activeDeals.length > 20 ? `<p style="margin:10px 12px 0; font-size:12px; color:#9ca3af;">+ dalších ${p.activeDeals.length - 20} zakázek</p>` : ''}
  </td></tr>` : ''}

  ${p.wonDeals.length > 0 ? `
  <!-- WON DEALS -->
  <tr><td style="padding:28px 32px 0;">
    <h2 style="margin:0 0 16px; font-size:16px; font-weight:700; color:#16a34a; border-bottom:2px solid #f0fdf4; padding-bottom:10px;">✓ Vyhráné zakázky</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr style="background:#f0fdf4;">
        <th style="padding:10px 12px; font-size:11px; color:#16a34a; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Zakázka</th>
        <th style="padding:10px 12px; font-size:11px; color:#16a34a; text-align:left; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Zákazník</th>
        <th style="padding:10px 12px; font-size:11px; color:#16a34a; text-align:right; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Hodnota</th>
      </tr>
      ${wonRows}
    </table>
  </td></tr>` : ''}

  <!-- FOOTER -->
  <tr><td style="padding:32px 32px 28px; margin-top:16px;">
    <div style="background:#f8fafc; border-radius:10px; padding:20px 24px; text-align:center; border:1px solid #e5e7eb;">
      <p style="margin:0 0 6px; font-size:13px; color:#374151;">Výkaz za <strong>${monthLabel}</strong> byl ${p.isOnDemand ? 'odeslán na vyžádání z' : 'automaticky vygenerován systémem'} <strong>MujCRM</strong>.</p>
      <p style="margin:0; font-size:12px; color:#9ca3af;">Přihlaste se do MujCRM pro detailní přehled → <a href="https://www.mujcrm.cz/dashboard" style="color:#00BFFF;">www.mujcrm.cz</a></p>
    </div>
    <p style="margin:16px 0 0; text-align:center; font-size:11px; color:#d1d5db;">© ${new Date().getFullYear()} MujCRM · Automatický e‑mail, neodpovídejte na tuto zprávu.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}
