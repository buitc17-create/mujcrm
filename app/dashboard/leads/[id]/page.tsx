'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import EmailComposer from '@/app/dashboard/components/EmailComposer';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: string; jmeno: string; prijmeni: string | null; email: string | null;
  telefon: string | null; firma: string | null; zdroj: string;
  lead_status_id: string | null; skore: number; poznamky: string | null;
  konvertovan: boolean; created_at: string; contact_id: string | null;
  cena: number | null; popis: string | null;
};

type Enrollment = { id: string; current_step: number; status: string; enrolled_at: string; automation_sequences: { name: string }[] | { name: string } | null };
type Sequence = { id: string; name: string; description: string | null };

type LeadStatus = {
  id: string; nazev: string; barva: string; poradi: number;
};

type PipelineStage = {
  id: string; nazev: string; barva: string; poradi: number;
};

type FollowUp = {
  id: string; typ: string; poznamka: string | null; datum: string; created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_STATUSES = [
  { nazev: 'Nový', barva: '#3B82F6', poradi: 0 },
  { nazev: 'Kontaktován', barva: '#EAB308', poradi: 1 },
  { nazev: 'Kvalifikován', barva: '#7B2FFF', poradi: 2 },
  { nazev: 'Zájem', barva: '#00BFFF', poradi: 3 },
  { nazev: 'Nezájem', barva: '#6b7280', poradi: 4 },
  { nazev: 'Ztracen', barva: '#ef4444', poradi: 5 },
];

const SOURCES = [
  { id: 'doporuceni', label: 'Doporučení', color: '#10b981' },
  { id: 'web', label: 'Web', color: '#3B82F6' },
  { id: 'telefon', label: 'Telefon', color: '#f59e0b' },
  { id: 'email', label: 'Email', color: '#7B2FFF' },
  { id: 'socialni_site', label: 'Sociální sítě', color: '#00BFFF' },
  { id: 'jine', label: 'Jiné', color: '#6b7280' },
];

const FOLLOWUP_TYPES = [
  { id: 'telefonat', label: 'Telefonát', icon: '📞', color: '#10b981' },
  { id: 'email', label: 'Email', icon: '✉️', color: '#7B2FFF' },
  { id: 'schuzka', label: 'Schůzka', icon: '🤝', color: '#00BFFF' },
  { id: 'poznamka', label: 'Poznámka', icon: '📝', color: '#6b7280' },
];

// Mapování follow-up typů → typy aktivit
const FOLLOWUP_TO_ACTIVITY: Record<string, string> = {
  telefonat: 'telefonat',
  email: 'email',
  schuzka: 'schuzka',
  poznamka: 'poznamka',
};

const sourceInfo = (id: string) => SOURCES.find(s => s.id === id) ?? SOURCES[SOURCES.length - 1];

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
  outline: 'none', width: '100%',
};

function Stars({ score, onChange }: { score: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}
          style={{ fontSize: 24, color: i < score ? '#f59e0b' : 'rgba(255,255,255,0.15)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', lineHeight: 1 }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Follow-up modal
  const [showFuModal, setShowFuModal] = useState(false);
  const [fuForm, setFuForm] = useState({ typ: 'telefonat', poznamka: '', datum: new Date().toISOString().slice(0, 16) });
  const [fuSaving, setFuSaving] = useState(false);

  // Email composer
  const [showEmail, setShowEmail] = useState(false);

  // Enrollment
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSeqId, setSelectedSeqId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [stopping, setStopping] = useState(false);

  // Cena editing
  const [editingCena, setEditingCena] = useState(false);
  const [cenaVal, setCenaVal] = useState('');

  // Convert modal
  const [showConvert, setShowConvert] = useState(false);
  const [convForm, setConvForm] = useState({ createDeal: true, nazevObchodu: '', hodnota: '', stage_id: '' });
  const [converting, setConverting] = useState(false);
  const [convStageError, setConvStageError] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const showToast = (message: string, color: string) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load statuses (auto-create defaults if none)
    let { data: statusData } = await supabase
      .from('lead_statuses').select('id, nazev, barva, poradi').order('poradi');
    if (!statusData || statusData.length === 0) {
      const { data: created } = await supabase
        .from('lead_statuses')
        .insert(DEFAULT_STATUSES.map(s => ({ ...s, user_id: user.id })))
        .select().order('poradi');
      statusData = created ?? [];
    }

    const [{ data: leadData }, { data: fuData }, { data: enrollData }, { data: stagesData }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase.from('lead_followups').select('*').eq('lead_id', id).order('datum', { ascending: false }),
      supabase.from('automation_enrollments').select('id, current_step, status, automation_sequences(name)').eq('lead_id', id).eq('status', 'active').limit(1),
      supabase.from('pipeline_stages').select('id, nazev, barva, poradi').order('poradi'),
    ]);

    if (!leadData) { router.push('/dashboard/leads'); return; }
    setStatuses(statusData ?? []);
    setLead(leadData as Lead);
    setFollowups(fuData ?? []);
    setEnrollment((enrollData?.[0] as unknown as Enrollment) ?? null);
    setCenaVal((leadData as Lead).cena != null ? String((leadData as Lead).cena) : '');
    setPipelineStages((stagesData as PipelineStage[]) ?? []);
    const leadName = (leadData as Lead).firma || `${(leadData as Lead).jmeno} ${(leadData as Lead).prijmeni ?? ''}`.trim();
    setConvForm(p => ({ ...p, nazevObchodu: leadName }));
    setConvForm(p => ({ ...p, hodnota: (leadData as Lead).cena != null ? String((leadData as Lead).cena) : '' }));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
    fetch('/api/automations/sequences')
      .then(r => r.json())
      .then(d => {
        setSequences(d.sequences ?? []);
        if (d.sequences?.length > 0) setSelectedSeqId(d.sequences[0].id);
      });
    // Pipeline stages: for members load via workspace (admin client bypasses RLS)
    // For admins, stages are loaded in loadData via supabase client
    fetch('/api/team/workspace')
      .then(r => r.json())
      .then(ws => {
        if (ws.stages?.length) setPipelineStages(ws.stages as PipelineStage[]);
      })
      .catch(() => {}); // Ignore errors for non-members (admin loads stages in loadData)
  }, [loadData]);

  const statusInfo = useCallback((id: string | null) => {
    if (!id) return statuses[0] ?? { id: '', nazev: '–', barva: '#6b7280' };
    return statuses.find(s => s.id === id) ?? statuses[0] ?? { id: '', nazev: '–', barva: '#6b7280' };
  }, [statuses]);

  // ── Field updates ─────────────────────────────────────────────────────────

  const updateField = async (field: Partial<Lead>) => {
    if (!lead) return;
    setLead(prev => prev ? { ...prev, ...field } : null);
    await supabase.from('leads').update(field).eq('id', id);
  };

  const handleScoreChange = (n: number) => updateField({ skore: n });
  const handleStatusChange = (lead_status_id: string) => updateField({ lead_status_id });

  const handleNotesBlur = async (val: string) => {
    if (!lead || val === lead.poznamky) return;
    await supabase.from('leads').update({ poznamky: val }).eq('id', id);
    setLead(p => p ? { ...p, poznamky: val } : null);
  };

  // ── Follow-ups ────────────────────────────────────────────────────────────

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const datumIso = new Date(fuForm.datum).toISOString();
    const datumLocal = fuForm.datum; // datetime-local: "YYYY-MM-DDTHH:MM"
    const datumDate = datumLocal.slice(0, 10);
    const casOd = datumLocal.length >= 16 ? datumLocal.slice(11, 16) : null;

    const { data } = await supabase.from('lead_followups').insert({
      lead_id: id, user_id: user.id,
      typ: fuForm.typ,
      poznamka: fuForm.poznamka.trim() || null,
      datum: datumIso,
    }).select().single();

    const followupId = (data as FollowUp & { id: string })?.id ?? null;
    if (data) setFollowups(prev => [data as FollowUp, ...prev]);

    // Automaticky vytvořit aktivitu
    const leadName = lead ? `${lead.jmeno}${lead.prijmeni ? ' ' + lead.prijmeni : ''}`.trim() : '';
    const leadInfo = [
      leadName,
      lead?.firma,
      lead?.email,
      lead?.telefon,
    ].filter(Boolean).join(' · ');

    const aktTyp = FOLLOWUP_TO_ACTIVITY[fuForm.typ] ?? 'poznamka';

    // Popis vždy obsahuje info o klientovi z leadu
    const popis = fuForm.poznamka.trim()
      ? `${leadInfo} — ${fuForm.poznamka.trim()}`
      : leadInfo || 'Follow-up z leadu';

    await supabase.from('activities').insert({
      user_id: user.id,
      typ: aktTyp,
      popis,
      datum: datumDate + 'T' + (casOd ?? '00:00'),
      cas_do: null,
      misto: null,
      contact_id: lead?.contact_id ?? null,
      deal_id: null,
      lead_followup_id: followupId,
    });

    setFuForm({ typ: 'telefonat', poznamka: '', datum: new Date().toISOString().slice(0, 16) });
    setShowFuModal(false);
    setFuSaving(false);
  };

  const handleDeleteFollowUp = async (fuId: string) => {
    await supabase.from('lead_followups').delete().eq('id', fuId);
    setFollowups(prev => prev.filter(f => f.id !== fuId));
  };

  // ── Enrollment ────────────────────────────────────────────────────────────

  const handleEnroll = async () => {
    if (!selectedSeqId) return;
    setEnrolling(true);
    setEnrollError('');
    const res = await fetch('/api/automations/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id, sequence_id: selectedSeqId }),
    });
    const json = await res.json();
    setEnrolling(false);
    if (!res.ok) { setEnrollError(json.error ?? 'Chyba'); return; }
    setEnrollment(json.enrollment);
    setShowEnrollModal(false);
    showToast(
      json.emailSent ? 'Sekvence spuštěna, první email odeslán' : 'Sekvence spuštěna',
      json.emailSent ? '#22C55E' : '#00BFFF',
    );
  };

  const handleStopEnrollment = async () => {
    if (!enrollment || !confirm('Zastavit sekvenci pro tento lead?')) return;
    setStopping(true);
    await fetch(`/api/automations/enroll/${enrollment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'stopped', stopped_reason: 'Ručně zastaveno' }),
    });
    setStopping(false);
    setEnrollment(null);
    showToast('Sekvence zastavena', '#f59e0b');
  };

  // ── Conversion ────────────────────────────────────────────────────────────

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (convForm.createDeal && !convForm.stage_id) { setConvStageError(true); return; }
    setConvStageError(false);
    setConverting(true);

    const res = await fetch('/api/leads/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: id,
        jmeno: lead.jmeno,
        prijmeni: lead.prijmeni,
        email: lead.email,
        telefon: lead.telefon,
        firma: lead.firma,
        zdroj: lead.zdroj,
        create_deal: convForm.createDeal && !!convForm.nazevObchodu.trim(),
        deal_name: convForm.nazevObchodu.trim(),
        deal_value: convForm.hodnota,
        stage_id: convForm.stage_id || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      showToast(json.error ?? 'Chyba při konverzi', '#ef4444');
      setConverting(false);
      return;
    }

    setLead(p => p ? { ...p, konvertovan: true, contact_id: json.contact_id } : null);
    showToast('Lead byl úspěšně převeden na zákazníka', '#22C55E');
    setShowConvert(false);
    setConverting(false);
    setTimeout(() => router.push(`/dashboard/contacts/${json.contact_id}`), 800);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>;
  }

  if (!lead) return null;

  const st = statusInfo(lead.lead_status_id);
  const sr = sourceInfo(lead.zdroj);
  const initials = `${lead.jmeno[0]}${lead.prijmeni?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/leads"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'rgba(237,237,237,0.4)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#00BFFF')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(237,237,237,0.4)')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Zpět na leady
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">

          {/* Header card */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0"
                style={{ background: st.barva + '20', color: st.barva }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-white">{lead.jmeno} {lead.prijmeni ?? ''}</h1>
                {lead.firma && <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.55)' }}>{lead.firma}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Stars score={lead.skore} onChange={handleScoreChange} />
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: sr.color + '18', color: sr.color, border: `1px solid ${sr.color}30` }}>
                    {sr.label}
                  </span>
                  {lead.konvertovan && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#22C55E18', color: '#22C55E', border: '1px solid #22C55E30' }}>
                      ✓ Konvertován
                    </span>
                  )}
                  {lead.email && (
                    <button onClick={() => setShowEmail(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      Napsat email
                    </button>
                  )}
                </div>
              </div>
              {/* Status select — dynamic */}
              <select
                value={lead.lead_status_id ?? ''}
                onChange={e => handleStatusChange(e.target.value)}
                className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl"
                style={{ background: st.barva + '18', border: `1px solid ${st.barva}40`, color: st.barva, outline: 'none', cursor: 'pointer' }}
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#1a1a1a', color: '#ededed' }}>{s.nazev}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact info */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-4">Kontaktní informace</h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: '✉️', label: 'Email', value: lead.email, href: lead.email ? `mailto:${lead.email}` : null },
                { icon: '📞', label: 'Telefon', value: lead.telefon, href: lead.telefon ? `tel:${lead.telefon}` : null },
                { icon: '🏢', label: 'Firma', value: lead.firma, href: null },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  <span className="text-xs w-12 flex-shrink-0" style={{ color: 'rgba(237,237,237,0.35)' }}>{item.label}</span>
                  {item.value ? (
                    item.href ? (
                      <a href={item.href} className="text-sm font-semibold transition-colors" style={{ color: '#00BFFF' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}>
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm text-white font-semibold">{item.value}</span>
                    )
                  ) : (
                    <span className="text-sm" style={{ color: 'rgba(237,237,237,0.25)' }}>–</span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>📅</span>
                <span className="text-xs w-12 flex-shrink-0" style={{ color: 'rgba(237,237,237,0.35)' }}>Přidán</span>
                <span className="text-sm" style={{ color: 'rgba(237,237,237,0.55)' }}>
                  {new Date(lead.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Popis */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-3">Popis leadu</h2>
            <textarea
              rows={3}
              defaultValue={lead.popis ?? ''}
              onBlur={e => { const val = e.target.value; if (val !== (lead.popis ?? '')) updateField({ popis: val || null }); }}
              placeholder="Krátký popis leadu, co hledá, kontext…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontSize: 13 }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
            />
          </div>

          {/* Notes */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-3">Poznámky</h2>
            <textarea
              rows={4}
              defaultValue={lead.poznamky ?? ''}
              onBlur={e => handleNotesBlur(e.target.value)}
              placeholder="Přidej poznámku k tomuto leadu…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontSize: 13 }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
            />
          </div>

          {/* Follow-ups timeline */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Follow-upy</h2>
              <button onClick={() => setShowFuModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Přidat
              </button>
            </div>

            {followups.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'rgba(237,237,237,0.3)' }}>Zatím žádné follow-upy</p>
            ) : (
              <div className="flex flex-col gap-0">
                {followups.map((fu, i) => {
                  const ft = FOLLOWUP_TYPES.find(t => t.id === fu.typ) ?? FOLLOWUP_TYPES[3];
                  const isLast = i === followups.length - 1;
                  return (
                    <div key={fu.id} className="flex gap-3 group">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ background: ft.color + '18', border: `1px solid ${ft.color}30` }}>
                          {ft.icon}
                        </div>
                        {!isLast && <div className="w-px flex-1 my-1" style={{ background: 'rgba(255,255,255,0.08)', minHeight: 16 }} />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold" style={{ color: ft.color }}>{ft.label}</span>
                            <span className="text-xs ml-2" style={{ color: 'rgba(237,237,237,0.35)' }}>
                              {new Date(fu.datum).toLocaleString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <button onClick={() => handleDeleteFollowUp(fu.id)}
                            className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                            style={{ color: 'rgba(239,68,68,0.5)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                        </div>
                        {fu.poznamka && <p className="text-sm mt-1" style={{ color: 'rgba(237,237,237,0.6)' }}>{fu.poznamka}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">
          {!lead.konvertovan ? (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                <span className="text-sm font-bold" style={{ color: '#22C55E' }}>Konverze leadu</span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'rgba(237,237,237,0.45)' }}>
                Převeď tento lead na zákazníka a volitelně vytvoř zakázku v pipeline.
              </p>
              <button onClick={() => setShowConvert(true)}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: '#0a0a0a' }}>
                Převést na zákazníka →
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: '#22C55E', fontSize: 16 }}>✓</span>
                <span className="text-sm font-bold" style={{ color: '#22C55E' }}>Konvertován</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(237,237,237,0.45)' }}>Tento lead byl převeden na zákazníka.</p>
              {lead.contact_id && (
                <Link href={`/dashboard/contacts/${lead.contact_id}`}
                  className="block w-full py-2.5 rounded-xl text-sm font-bold text-center"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
                  Zobrazit zákazníka →
                </Link>
              )}
            </div>
          )}

          {/* Automation Section */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Email sekvence</h2>
              {!enrollment && sequences.length > 0 && (
                <button
                  onClick={() => { setShowEnrollModal(true); setEnrollError(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Spustit
                </button>
              )}
            </div>
            {enrollment ? (
              <div>
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#00BFFF' }} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {Array.isArray(enrollment.automation_sequences)
                        ? enrollment.automation_sequences[0]?.name
                        : (enrollment.automation_sequences as { name: string } | null)?.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
                      Krok {enrollment.current_step} odeslán · aktivní
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStopEnrollment}
                  disabled={stopping}
                  className="w-full py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: stopping ? 'not-allowed' : 'pointer', opacity: stopping ? 0.6 : 1 }}
                >
                  {stopping ? 'Zastavuji…' : 'Zastavit sekvenci'}
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
                {sequences.length === 0 ? 'Nejprve vytvořte sekvenci v Automatizacích.' : 'Žádná aktivní sekvence. Klikněte Spustit.'}
              </p>
            )}
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-4">Přehled</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Skóre</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ color: i < lead.skore ? '#f59e0b' : 'rgba(255,255,255,0.15)', fontSize: 12 }}>★</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Follow-upy</span>
                <span className="text-sm font-bold text-white">{followups.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Status</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.barva + '18', color: st.barva }}>{st.nazev}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Zdroj</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sr.color + '15', color: sr.color }}>
                  {sr.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Cena</span>
                {editingCena ? (
                  <input
                    type="number" min={0} value={cenaVal}
                    onChange={e => setCenaVal(e.target.value)}
                    onBlur={() => {
                      const val = cenaVal ? parseFloat(cenaVal) : null;
                      updateField({ cena: val });
                      setEditingCena(false);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); if (e.key === 'Escape') { setCenaVal(lead.cena != null ? String(lead.cena) : ''); setEditingCena(false); } }}
                    autoFocus
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,191,255,0.4)', borderRadius: 6, padding: '2px 8px', color: '#fff', fontSize: 13, outline: 'none', width: 110, textAlign: 'right' }}
                  />
                ) : (
                  <button onClick={() => setEditingCena(true)}
                    className="text-sm font-bold text-white transition-colors"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px', borderRadius: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#fff')}
                    title="Klikněte pro úpravu">
                    {lead.cena != null ? lead.cena.toLocaleString('cs-CZ') + ' Kč' : <span style={{ color: 'rgba(237,237,237,0.3)', fontSize: 12 }}>+ Přidat</span>}
                  </button>
                )}
              </div>
              {enrollment && (
                <div className="pt-1 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs block mb-1" style={{ color: 'rgba(237,237,237,0.4)' }}>Aktivní sekvence</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.25)' }}>
                    ▶ {Array.isArray(enrollment.automation_sequences) ? enrollment.automation_sequences[0]?.name : (enrollment.automation_sequences as { name: string } | null)?.name} · krok {enrollment.current_step + 1}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Enroll modal ── */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowEnrollModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Spustit sekvenci</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
                  Pro {lead.jmeno} {lead.prijmeni ?? ''}
                </p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {!lead.email && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                Lead nemá emailovou adresu — přidej ji nejdříve.
              </div>
            )}

            <div className="flex flex-col gap-3 mb-5">
              {sequences.map(seq => (
                <button
                  key={seq.id}
                  type="button"
                  onClick={() => setSelectedSeqId(seq.id)}
                  className="text-left p-3 rounded-xl transition-all"
                  style={{
                    background: selectedSeqId === seq.id ? 'rgba(0,191,255,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selectedSeqId === seq.id ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedSeqId === seq.id ? '#00BFFF' : 'rgba(237,237,237,0.2)' }} />
                    <span className="text-sm font-semibold" style={{ color: selectedSeqId === seq.id ? '#00BFFF' : '#fff' }}>{seq.name}</span>
                  </div>
                  {seq.description && (
                    <p className="text-xs mt-1 ml-4" style={{ color: 'rgba(237,237,237,0.4)' }}>{seq.description}</p>
                  )}
                </button>
              ))}
            </div>

            {enrollError && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {enrollError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleEnroll}
                disabled={enrolling || !lead.email || !selectedSeqId}
                className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a', cursor: (enrolling || !lead.email) ? 'not-allowed' : 'pointer' }}
              >
                {enrolling ? 'Spouštím…' : 'Spustit sekvenci'}
              </button>
              <button type="button" onClick={() => setShowEnrollModal(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up modal ── */}
      {showFuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowFuModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Nový follow-up</h2>
              <button onClick={() => setShowFuModal(false)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddFollowUp} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.5)' }}>Typ</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOLLOWUP_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setFuForm(p => ({ ...p, typ: t.id }))}
                      className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{
                        background: fuForm.typ === t.id ? t.color + '18' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${fuForm.typ === t.id ? t.color + '50' : 'rgba(255,255,255,0.08)'}`,
                        color: fuForm.typ === t.id ? t.color : 'rgba(237,237,237,0.5)',
                      }}>
                      <span>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Datum a čas</label>
                <input type="datetime-local" value={fuForm.datum}
                  onChange={e => setFuForm(p => ({ ...p, datum: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Poznámka</label>
                <textarea rows={3} value={fuForm.poznamka}
                  onChange={e => setFuForm(p => ({ ...p, poznamka: e.target.value }))}
                  placeholder="Co bylo domluveno…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontSize: 13 }} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={fuSaving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {fuSaving ? 'Ukládám…' : 'Uložit'}
                </button>
                <button type="button" onClick={() => setShowFuModal(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Convert modal ── */}
      {showConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowConvert(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
              </div>
              <h2 className="text-base font-bold text-white">Převést na zákazníka</h2>
            </div>
            <p className="text-xs mb-5 ml-11" style={{ color: 'rgba(237,237,237,0.45)' }}>
              Vytvoří se nový zákazník z dat tohoto leadu.
            </p>
            <form onSubmit={handleConvert} className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={convForm.createDeal}
                  onChange={e => setConvForm(p => ({ ...p, createDeal: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-green-500 cursor-pointer" />
                <div>
                  <span className="text-sm font-semibold text-white">Automaticky vytvořit zakázku</span>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>Přidá zakázku do první fáze pipeline</p>
                </div>
              </label>
              {convForm.createDeal && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Název zakázky</label>
                    <input type="text" value={convForm.nazevObchodu}
                      onChange={e => setConvForm(p => ({ ...p, nazevObchodu: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Hodnota zakázky (Kč)</label>
                    <input type="number" placeholder="0" value={convForm.hodnota}
                      onChange={e => setConvForm(p => ({ ...p, hodnota: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: convStageError ? '#f87171' : 'rgba(237,237,237,0.5)' }}>
                      Fáze pipeline *
                    </label>
                    <select value={convForm.stage_id}
                      onChange={e => { setConvForm(p => ({ ...p, stage_id: e.target.value })); setConvStageError(false); }}
                      style={{ ...inputStyle, borderColor: convStageError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <option value="" style={{ background: '#1a1a1a' }}>– Vyberte fázi –</option>
                      {pipelineStages.map(s => (
                        <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.nazev}</option>
                      ))}
                    </select>
                    {convStageError && <p className="text-xs mt-1" style={{ color: '#f87171' }}>Vyberte fázi pipeline před uložením</p>}
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={converting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: '#0a0a0a' }}>
                  {converting ? 'Převádím…' : 'Převést →'}
                </button>
                <button type="button" onClick={() => setShowConvert(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email composer */}
      {showEmail && lead.email && (
        <EmailComposer
          to={lead.email}
          toName={`${lead.jmeno} ${lead.prijmeni ?? ''}`.trim()}
          leadId={lead.id}
          contactId={lead.contact_id ?? undefined}
          onClose={() => setShowEmail(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: toast.color + '18', border: `1px solid ${toast.color}40`, color: toast.color, backdropFilter: 'blur(8px)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast.message}
        </div>
      )}
    </div>
  );
}
