'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: string; jmeno: string; prijmeni: string | null; email: string | null;
  telefon: string | null; firma: string | null; zdroj: string;
  lead_status_id: string | null; skore: number; poznamky: string | null;
  konvertovan: boolean; created_at: string;
  cena: number | null; popis: string | null;
};

type ActiveEnrollment = { lead_id: string; current_step: number; automation_sequences: { name: string }[] | { name: string } | null };

type LeadStatus = {
  id: string; nazev: string; barva: string; poradi: number;
};
type TeamMember = { id: string; name: string; email: string; role: string; isOwner: boolean };

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

const sourceInfo = (id: string) => SOURCES.find(s => s.id === id) ?? SOURCES[SOURCES.length - 1];

function Stars({ score, onClick }: { score: number; onClick?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          onClick={() => onClick?.(i + 1)}
          style={{ color: i < score ? '#f59e0b' : 'rgba(255,255,255,0.15)', fontSize: 13, cursor: onClick ? 'pointer' : 'default', lineHeight: 1 }}
        >★</span>
      ))}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
  outline: 'none', width: '100%',
};

type SortKey = 'skore' | 'jmeno' | 'firma' | 'lead_status_id' | 'created_at';

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('vse');
  const [filterZdroj, setFilterZdroj] = useState('vse');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, string>>({});
  const [sequences, setSequences] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ jmeno: '', prijmeni: '', email: '', telefon: '', firma: '', zdroj: 'jine', lead_status_id: '', skore: 3, poznamky: '', assigned_to: '', cena: '', sequence_id: '' });

  const statusInfo = useCallback((id: string | null) => {
    if (!id) return statuses[0] ?? { id: '', nazev: '–', barva: '#6b7280' };
    return statuses.find(s => s.id === id) ?? statuses[0] ?? { id: '', nazev: '–', barva: '#6b7280' };
  }, [statuses]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data: statusData } = await supabase
      .from('lead_statuses').select('id, nazev, barva, poradi').order('poradi');

    // Auto-create defaults if none
    if (!statusData || statusData.length === 0) {
      const { data: created } = await supabase
        .from('lead_statuses')
        .insert(DEFAULT_STATUSES.map(s => ({ ...s, user_id: user.id })))
        .select().order('poradi');
      statusData = created ?? [];
    }

    const [{ data: leadsData }, { data: enrollData }] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('automation_enrollments').select('lead_id, current_step, automation_sequences(name)').eq('user_id', user.id).eq('status', 'active'),
    ]);

    const map: Record<string, string> = {};
    (enrollData ?? []).forEach((e: ActiveEnrollment) => {
      const seqName = Array.isArray(e.automation_sequences)
        ? e.automation_sequences[0]?.name
        : (e.automation_sequences as { name: string } | null)?.name;
      if (e.lead_id && seqName) map[e.lead_id] = seqName;
    });

    setStatuses(statusData ?? []);
    setLeads(leadsData ?? []);
    setEnrollmentMap(map);
    if (statusData && statusData.length > 0) {
      setForm(f => f.lead_status_id ? f : { ...f, lead_status_id: statusData![0].id });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    fetch('/api/team/members').then(r => r.json()).then(d => setTeamMembers(d.members ?? []));
    fetch('/api/automations/sequences').then(r => r.json()).then(d => setSequences(d.sequences ?? []));
  }, [loadData]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo && !l.konvertovan).length;
  const active = leads.filter(l => !l.konvertovan).length;
  const converted = leads.filter(l => l.konvertovan).length;
  const convRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

  // ── Filtered + sorted ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      if (filterStatus !== 'vse' && l.lead_status_id !== filterStatus) return false;
      if (filterZdroj !== 'vse' && l.zdroj !== filterZdroj) return false;
      if (q && !([l.jmeno, l.prijmeni, l.firma, l.email].some(v => v?.toLowerCase().includes(q)))) return false;
      return true;
    });
  }, [leads, search, filterStatus, filterZdroj]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = (a as Record<string, unknown>)[sortKey] as string ?? '';
      let bv: string | number = (b as Record<string, unknown>)[sortKey] as string ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Kanban grouping ───────────────────────────────────────────────────────

  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    statuses.forEach(s => { map[s.id] = []; });
    filtered.forEach(l => {
      const sid = l.lead_status_id ?? statuses[0]?.id;
      if (sid && map[sid]) map[sid].push(l);
      else if (statuses[0]) map[statuses[0].id].push(l);
    });
    return map;
  }, [filtered, statuses]);

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, lead_status_id: destination.droppableId } : l));
    await supabase.from('leads').update({ lead_status_id: destination.droppableId }).eq('id', draggableId);
  };

  // ── Add lead ──────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jmeno.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data, error } = await supabase.from('leads').insert({
      user_id: user.id,
      jmeno: form.jmeno.trim(),
      prijmeni: form.prijmeni.trim() || null,
      email: form.email.trim() || null,
      telefon: form.telefon.trim() || null,
      firma: form.firma.trim() || null,
      zdroj: form.zdroj,
      status: 'novy',
      lead_status_id: form.lead_status_id || statuses[0]?.id || null,
      skore: form.skore,
      poznamky: form.poznamky.trim() || null,
      assigned_to: form.assigned_to || null,
      cena: form.cena ? parseFloat(form.cena) : null,
    }).select().single();
    if (error) {
      alert('Chyba při přidávání leadu: ' + error.message);
      setSaving(false);
      return;
    }
    if (data) {
      setLeads(prev => [data as Lead, ...prev]);
      // Spustit sekvenci pokud je vybrána a lead má email
      if (form.sequence_id && (data as Lead).email) {
        await fetch('/api/automations/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: (data as Lead).id, sequence_id: form.sequence_id }),
        });
      }
      // Push notifikace — nový lead
      fetch('/api/leads/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadName: `${form.jmeno} ${form.prijmeni}`.trim() }),
      }).catch(() => {});
    }
    setForm({ jmeno: '', prijmeni: '', email: '', telefon: '', firma: '', zdroj: 'jine', lead_status_id: statuses[0]?.id ?? '', skore: 3, poznamky: '', assigned_to: '', cena: '', sequence_id: '' });
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Smazat lead "${name}"?`)) return;

    // Najdi všechny follow-upy tohoto leadu
    const { data: followups } = await supabase
      .from('lead_followups').select('id').eq('lead_id', id);

    if (followups && followups.length > 0) {
      const followupIds = followups.map((f: { id: string }) => f.id);
      // Smaž propojené aktivity
      await supabase.from('activities').delete().in('lead_followup_id', followupIds);
      // Smaž follow-upy
      await supabase.from('lead_followups').delete().eq('lead_id', id);
    }

    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? <span style={{ color: '#00BFFF', marginLeft: 2, fontSize: 10 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
      : <span style={{ color: 'rgba(237,237,237,0.2)', marginLeft: 2, fontSize: 10 }}>▼</span>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Leady</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            {leads.filter(l => !l.konvertovan).length} aktivních · {converted} konvertovaných
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/leads/status-settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}
            title="Nastavení statusů"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00BFFF'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,191,255,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(237,237,237,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Přidat lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Celkem leadů', value: leads.length, color: '#00BFFF' },
          { label: 'Nové tento týden', value: newThisWeek, color: '#3B82F6' },
          { label: 'Aktivních', value: active, color: '#7B2FFF' },
          { label: 'Konverzní poměr', value: `${convRate} %`, color: '#22C55E' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.4)' }}>{c.label}</p>
            <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Hledat jméno, firmu, email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ededed', outline: 'none' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', outline: 'none', cursor: 'pointer' }}>
          <option value="vse" style={{ background: '#1a1a1a' }}>Všechny statusy</option>
          {statuses.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.nazev}</option>)}
        </select>
        <select value={filterZdroj} onChange={e => setFilterZdroj(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', outline: 'none', cursor: 'pointer' }}>
          <option value="vse" style={{ background: '#1a1a1a' }}>Všechny zdroje</option>
          {SOURCES.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.label}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['table', 'kanban'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className="px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5"
              style={{ background: viewMode === v ? 'rgba(0,191,255,0.12)' : 'rgba(255,255,255,0.03)', color: viewMode === v ? '#00BFFF' : 'rgba(237,237,237,0.45)' }}>
              {v === 'table'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>}
              {v === 'table' ? 'Tabulka' : 'Kanban'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ── */
        sorted.length === 0 ? (
          <div className="rounded-2xl py-20 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-sm font-semibold text-white mb-1">{search || filterStatus !== 'vse' || filterZdroj !== 'vse' ? 'Žádné výsledky' : 'Zatím žádné leady'}</p>
            <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>{search || filterStatus !== 'vse' ? 'Zkus jiné hledání.' : 'Přidej prvního leada.'}</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                    {[
                      { key: 'skore' as SortKey, label: 'Skóre', cls: 'pl-4 pr-2 w-28' },
                      { key: 'jmeno' as SortKey, label: 'Jméno', cls: 'px-2' },
                      { key: 'firma' as SortKey, label: 'Firma', cls: 'px-2 hidden md:table-cell' },
                      null, null,
                      { key: 'lead_status_id' as SortKey, label: 'Status', cls: 'px-2' },
                      { key: 'created_at' as SortKey, label: 'Cena', cls: 'px-2 hidden lg:table-cell' },
                      null,
                    ].map((col, i) => col ? (
                      <th key={i} className={`${col.cls} py-3 text-left font-semibold uppercase tracking-wider cursor-pointer select-none`}
                        onClick={() => toggleSort(col.key)}>
                        {col.label === 'Cena' ? 'Cena' : col.label}<SortIcon k={col.key} />
                      </th>
                    ) : (
                      <th key={i} className="px-2 py-3 hidden md:table-cell" />
                    ))}
                    <th className="px-2 py-3 hidden xl:table-cell text-left font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>Sekvence</th>
                    <th className="pr-4 py-3 text-right font-semibold uppercase tracking-wider">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((lead, i) => {
                    const st = statusInfo(lead.lead_status_id);
                    const sr = sourceInfo(lead.zdroj);
                    const isLast = i === sorted.length - 1;
                    return (
                      <tr key={lead.id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="pl-4 pr-2 py-3"><Stars score={lead.skore} /></td>
                        <td className="px-2 py-3">
                          <Link href={`/dashboard/leads/${lead.id}`} className="font-semibold text-white hover:text-cyan-400 transition-colors">
                            {lead.jmeno} {lead.prijmeni ?? ''}
                          </Link>
                          {lead.konvertovan && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#22C55E20', color: '#22C55E' }}>✓</span>}
                        </td>
                        <td className="px-2 py-3 hidden md:table-cell" style={{ color: 'rgba(237,237,237,0.55)' }}>{lead.firma || '–'}</td>
                        <td className="px-2 py-3 hidden md:table-cell" style={{ color: 'rgba(237,237,237,0.45)', fontSize: 12 }}>{lead.email || '–'}</td>
                        <td className="px-2 py-3 hidden lg:table-cell" style={{ color: 'rgba(237,237,237,0.45)', fontSize: 12 }}>{lead.telefon || '–'}</td>
                        <td className="px-2 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: st.barva + '18', color: st.barva, border: `1px solid ${st.barva}30` }}>{st.nazev}</span>
                        </td>
                        <td className="px-2 py-3 hidden lg:table-cell" style={{ color: 'rgba(237,237,237,0.35)', fontSize: 12 }}>
                          {lead.cena != null ? lead.cena.toLocaleString('cs-CZ') + ' Kč' : '–'}
                        </td>
                        <td className="px-2 py-3 hidden xl:table-cell">
                          {enrollmentMap[lead.id] ? (
                            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.25)' }}>
                              ▶ {enrollmentMap[lead.id]}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(237,237,237,0.2)', fontSize: 12 }}>–</span>
                          )}
                        </td>
                        <td className="pr-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/leads/${lead.id}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ color: 'rgba(237,237,237,0.4)' }}
                              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#00BFFF')}
                              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(237,237,237,0.4)')}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </Link>
                            <button onClick={() => handleDelete(lead.id, `${lead.jmeno} ${lead.prijmeni ?? ''}`.trim())}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ color: 'rgba(239,68,68,0.5)' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ── KANBAN VIEW ── */
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map(st => {
              const colLeads = leadsByStatus[st.id] ?? [];
              return (
                <div key={st.id} className="flex-shrink-0 w-60 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: st.barva }} />
                      <span className="text-xs font-bold text-white">{st.nazev}</span>
                    </div>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(237,237,237,0.5)' }}>
                      {colLeads.length}
                    </span>
                  </div>
                  <Droppable droppableId={st.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className="flex-1 flex flex-col gap-2 rounded-xl p-2 min-h-24 transition-all"
                        style={{
                          background: snapshot.isDraggingOver ? st.barva + '0d' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${snapshot.isDraggingOver ? st.barva + '30' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        {colLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                className="rounded-xl p-3 group"
                                style={{
                                  background: snapshot.isDragging ? '#1e1e1e' : '#171717',
                                  border: `1px solid ${snapshot.isDragging ? st.barva + '50' : 'rgba(255,255,255,0.08)'}`,
                                  boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
                                  cursor: 'grab',
                                  ...provided.draggableProps.style,
                                }}>
                                <div className="flex items-start justify-between gap-1 mb-2">
                                  <Link href={`/dashboard/leads/${lead.id}`}
                                    className="text-sm font-semibold text-white hover:underline leading-snug">
                                    {lead.jmeno} {lead.prijmeni ?? ''}
                                  </Link>
                                  <button onClick={() => handleDelete(lead.id, lead.jmeno)}
                                    className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                                    style={{ color: 'rgba(239,68,68,0.6)' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.6)')}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                  </button>
                                </div>
                                {lead.firma && <p className="text-xs mb-1.5" style={{ color: 'rgba(237,237,237,0.45)' }}>{lead.firma}</p>}
                                <div className="flex items-center justify-between">
                                  <Stars score={lead.skore} />
                                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: sourceInfo(lead.zdroj).color + '15', color: sourceInfo(lead.zdroj).color }}>
                                    {sourceInfo(lead.zdroj).label}
                                  </span>
                                </div>
                                {lead.konvertovan && (
                                  <div className="mt-1.5 text-xs font-semibold" style={{ color: '#22C55E' }}>✓ Konvertován</div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center py-4">
                            <p className="text-xs" style={{ color: 'rgba(237,237,237,0.18)' }}>Přetáhni sem</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* ── Add Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nový lead</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Jméno *</label>
                  <input type="text" value={form.jmeno} onChange={e => setForm(p => ({ ...p, jmeno: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Příjmení</label>
                  <input type="text" value={form.prijmeni} onChange={e => setForm(p => ({ ...p, prijmeni: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Telefon</label>
                  <input type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Firma</label>
                  <input type="text" value={form.firma} onChange={e => setForm(p => ({ ...p, firma: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Zdroj</label>
                  <select value={form.zdroj} onChange={e => setForm(p => ({ ...p, zdroj: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {SOURCES.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Status</label>
                  <select value={form.lead_status_id} onChange={e => setForm(p => ({ ...p, lead_status_id: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {statuses.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.nazev}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Cena (Kč)</label>
                <input type="number" min={0} step={1} value={form.cena} onChange={e => setForm(p => ({ ...p, cena: e.target.value }))} placeholder="0"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.5)' }}>Skóre</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setForm(p => ({ ...p, skore: n }))}
                      style={{ fontSize: 22, color: n <= form.skore ? '#f59e0b' : 'rgba(255,255,255,0.15)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Poznámky</label>
                <textarea rows={2} value={form.poznamky} onChange={e => setForm(p => ({ ...p, poznamky: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              {/* Automatizace */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Spustit sekvenci po přidání</label>
                {sequences.length === 0 ? (
                  <p className="text-xs px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(237,237,237,0.35)' }}>
                    Nejprve vytvořte sekvenci v sekci Automatizace.
                  </p>
                ) : (
                  <select
                    value={form.sequence_id}
                    onChange={e => setForm(p => ({ ...p, sequence_id: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>– Nespouštět sekvenci –</option>
                    {sequences.map(s => (
                      <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.name}</option>
                    ))}
                  </select>
                )}
                {form.sequence_id && !form.email && (
                  <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>⚠ Pro spuštění sekvence vyplň email leadu.</p>
                )}
              </div>
              {teamMembers.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Přiřadit členovi týmu</label>
                  <select value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ background: '#1a1a1a' }}>– Nepřiřazeno –</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#1a1a1a' }}>
                        {m.name} {m.isOwner ? '(Admin)' : `(${m.role === 'clen' ? 'Člen' : m.role === 'cteni' ? 'Čtení' : m.role})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {saving ? 'Ukládám…' : 'Přidat lead'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
