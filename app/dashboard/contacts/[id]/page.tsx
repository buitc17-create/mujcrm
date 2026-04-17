'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import EmailComposer from '@/app/dashboard/components/EmailComposer';

type Contact = {
  id: string; jmeno: string; prijmeni: string | null; email: string | null;
  telefon: string | null; firma: string | null; tag: string; poznamky: string | null; created_at: string;
  datum_narozeni: string | null;
};
type Deal = { id: string; nazev: string; hodnota: number; status: string; datum_uzavreni: string | null };
type PipelineStage = { id: string; nazev: string; barva: string; poradi: number };
type Task = { id: string; nazev: string; deadline: string | null; dokonceno: boolean };

const tagColors: Record<string, string> = {
  zákazník: '#00BFFF', lead: '#f59e0b', vip: '#7B2FFF', partner: '#10b981',
};
const dealStatusLabels: Record<string, string> = {
  novy: 'Nový', jednani: 'Jednání', nabidka: 'Nabídka', vyhrano: 'Vyhráno', prohrano: 'Prohráno',
};
const dealStatusColors: Record<string, string> = {
  novy: '#00BFFF', jednani: '#f59e0b', nabidka: '#f97316', vyhrano: '#10b981', prohrano: '#ef4444',
};
const TAGS = ['zákazník', 'lead', 'vip', 'partner'];

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
  outline: 'none', width: '100%', transition: 'border-color 0.2s',
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [showEmail, setShowEmail] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [dealForm, setDealForm] = useState({ nazev: '', hodnota: '', stage_id: '' });
  const [dealSaving, setDealSaving] = useState(false);
  const [dealStageError, setDealStageError] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const membersData = await fetch('/api/team/members').then(r => r.json());
      const resolvedOwnerId: string | null = membersData.ownerId ?? null;
      const member = resolvedOwnerId !== null && resolvedOwnerId !== user.id;
      setIsMember(member);
      setOwnerId(resolvedOwnerId);

      if (member) {
        const [res, ws] = await Promise.all([
          fetch(`/api/team/member-contacts/${id}`).then(r => r.json()),
          fetch('/api/team/workspace').then(r => r.json()),
        ]);
        if (res.contact) { setContact(res.contact); setEditForm(res.contact); }
        setDeals(res.deals ?? []);
        setTasks(res.tasks ?? []);
        if (ws.stages?.length) setPipelineStages(ws.stages as PipelineStage[]);
        setDealForm(p => ({ ...p, nazev: res.contact ? `${res.contact.firma || res.contact.jmeno}` : '' }));
      } else {
        const [cRes, dRes, tRes, stagesRes] = await Promise.all([
          supabase.from('contacts').select('*').eq('id', id).single(),
          supabase.from('deals').select('id, nazev, hodnota, status, datum_uzavreni').eq('contact_id', id).order('created_at', { ascending: false }),
          supabase.from('tasks').select('id, nazev, deadline, dokonceno').eq('contact_id', id).order('created_at', { ascending: false }),
          supabase.from('pipeline_stages').select('id, nazev, barva, poradi').order('poradi'),
        ]);
        if (cRes.data) {
          setContact(cRes.data);
          setEditForm(cRes.data);
          setDealForm(p => ({ ...p, nazev: cRes.data.firma || cRes.data.jmeno }));
        }
        setDeals(dRes.data ?? []);
        setTasks(tRes.data ?? []);
        setPipelineStages((stagesRes.data as PipelineStage[]) ?? []);
      }
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const handleSave = async () => {
    if (!editForm.jmeno?.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('contacts').update({
      jmeno: editForm.jmeno?.trim(),
      prijmeni: editForm.prijmeni?.trim() || null,
      email: editForm.email?.trim() || null,
      telefon: editForm.telefon?.trim() || null,
      firma: editForm.firma?.trim() || null,
      tag: editForm.tag,
      poznamky: editForm.poznamky?.trim() || null,
      datum_narozeni: editForm.datum_narozeni || null,
    }).eq('id', id).select().single();
    if (data) { setContact(data); setEditing(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!contact) return;
    const name = `${contact.jmeno} ${contact.prijmeni ?? ''}`.trim();
    if (!confirm(`Smazat zákazníka "${name}"? Tato akce je nevratná.`)) return;
    await supabase.from('contacts').delete().eq('id', id);
    router.push('/dashboard/contacts');
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.stage_id) { setDealStageError(true); return; }
    setDealStageError(false);
    setDealSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDealSaving(false); return; }

    if (isMember) {
      await fetch('/api/team/member-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nazev: dealForm.nazev.trim() || contact?.firma || contact?.jmeno || 'Zakázka',
          hodnota: dealForm.hodnota,
          contact_id: id,
          stage_id: dealForm.stage_id,
          zdroj: 'jine',
        }),
      });
    } else {
      const { data: newDeal } = await supabase.from('deals').insert({
        user_id: user.id,
        nazev: dealForm.nazev.trim() || contact?.firma || contact?.jmeno || 'Zakázka',
        hodnota: parseFloat(dealForm.hodnota) || 0,
        contact_id: id,
        stage_id: dealForm.stage_id,
        status: 'novy', priorita: 'stredni', pravdepodobnost: 50, zdroj: 'jine',
      }).select('id, nazev, hodnota, status, datum_uzavreni').single();
      if (newDeal) setDeals(prev => [newDeal as Deal, ...prev]);
    }

    setShowDealModal(false);
    setDealSaving(false);
    setDealForm(p => ({ ...p, hodnota: '', stage_id: '' }));
  };

  if (loading) return (
    <div className="p-8 text-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
  );

  if (!contact) return (
    <div className="p-8 text-center">
      <p className="text-white mb-4">Zákazník nenalezen.</p>
      <Link href="/dashboard/contacts" style={{ color: '#00BFFF' }}>← Zpět na seznam</Link>
    </div>
  );

  const tagColor = tagColors[contact.tag] ?? '#00BFFF';
  const initials = `${contact.jmeno?.[0] ?? ''}${contact.prijmeni?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/contacts" className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: 'rgba(237,237,237,0.45)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Zákazníci
      </Link>

      {/* Header card */}
      <div className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {editing ? (
          /* Edit form */
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[['Jméno *', 'jmeno', 'text', 'Jan'], ['Příjmení', 'prijmeni', 'text', 'Novák'],
                ['E-mail', 'email', 'email', 'jan@firma.cz'], ['Telefon', 'telefon', 'tel', '+420 …'],
                ['Firma', 'firma', 'text', 'Novák s.r.o.']].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>{label}</label>
                  <input type={type as string} value={(editForm as Record<string, string>)[key as string] ?? ''} placeholder={ph as string}
                    onChange={e => setEditForm(f => ({ ...f, [key as string]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Datum narození</label>
                <input type="date" value={editForm.datum_narozeni ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, datum_narozeni: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Tag</label>
                <select value={editForm.tag ?? 'zákazník'} onChange={e => setEditForm(f => ({ ...f, tag: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {TAGS.map(t => <option key={t} value={t} style={{ background: '#1a1a1a' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Poznámky</label>
              <textarea value={editForm.poznamky ?? ''} rows={3} placeholder="Interní poznámky…"
                onChange={e => setEditForm(f => ({ ...f, poznamky: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                {saving ? 'Ukládám…' : 'Uložit změny'}
              </button>
              <button onClick={() => { setEditing(false); setEditForm(contact); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                Zrušit
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
                style={{ background: tagColor + '20', color: tagColor }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-white">{contact.jmeno} {contact.prijmeni}</h1>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                    style={{ background: tagColor + '18', color: tagColor, border: `1px solid ${tagColor}30` }}>
                    {contact.tag}
                  </span>
                </div>
                {contact.firma && <p className="text-sm mb-3" style={{ color: 'rgba(237,237,237,0.55)' }}>{contact.firma}</p>}
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgba(237,237,237,0.55)' }}>
                  {contact.email && <a href={`mailto:${contact.email}`} style={{ color: '#00BFFF' }}>{contact.email}</a>}
                  {contact.telefon && <span>{contact.telefon}</span>}
                  {contact.datum_narozeni && (
                    <span className="flex items-center gap-1">
                      <span style={{ fontSize: 13 }}>🎂</span>
                      {new Date(contact.datum_narozeni + 'T12:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              {contact.email && (
                <button onClick={() => setShowEmail(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(0,191,255,0.08)', border: '1px solid rgba(0,191,255,0.2)', color: '#00BFFF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,191,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,191,255,0.08)'; }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Napsat email
                </button>
              )}
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ededed'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(237,237,237,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Upravit
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                Smazat
              </button>
            </div>
          </div>
        )}

        {/* Notes (view only) */}
        {!editing && contact.poznamky && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.35)' }}>POZNÁMKY</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.6)' }}>{contact.poznamky}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Related deals */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-bold text-white">Zakázky ({deals.length})</p>
            <button onClick={() => { setDealStageError(false); setShowDealModal(true); }} className="text-xs font-semibold" style={{ color: '#00BFFF', background: 'none', border: 'none', cursor: 'pointer' }}>+ Přidat do pipeline</button>
          </div>
          {deals.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Žádné zakázky</p>
          ) : deals.map((d, i) => {
            const sc = dealStatusColors[d.status] ?? '#00BFFF';
            return (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: i < deals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{d.nazev}</p>
                  <p className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>{dealStatusLabels[d.status]}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: sc }}>
                  {d.hodnota.toLocaleString('cs-CZ')} Kč
                </p>
              </div>
            );
          })}
        </div>

        {/* Related tasks */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-bold text-white">Úkoly ({tasks.length})</p>
            <Link href="/dashboard/tasks" className="text-xs" style={{ color: '#00BFFF' }}>Přidat →</Link>
          </div>
          {tasks.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Žádné úkoly</p>
          ) : tasks.map((t, i) => {
            const overdue = t.deadline && !t.dokonceno && new Date(t.deadline) < new Date();
            return (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: t.dokonceno ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${t.dokonceno ? '#10b981' : 'rgba(255,255,255,0.15)'}` }}>
                  {t.dokonceno && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${t.dokonceno ? 'line-through' : 'text-white'}`}
                    style={{ color: t.dokonceno ? 'rgba(237,237,237,0.35)' : undefined }}>{t.nazev}</p>
                  {t.deadline && (
                    <p className="text-xs" style={{ color: overdue ? '#f87171' : 'rgba(237,237,237,0.4)' }}>
                      {new Date(t.deadline).toLocaleDateString('cs-CZ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showEmail && contact.email && (
        <EmailComposer
          to={contact.email}
          toName={`${contact.jmeno} ${contact.prijmeni ?? ''}`.trim()}
          contactId={contact.id}
          onClose={() => setShowEmail(false)}
        />
      )}

      {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowDealModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Přidat do pipeline</h2>
              <button onClick={() => setShowDealModal(false)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateDeal} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Název zakázky</label>
                <input type="text" value={dealForm.nazev}
                  onChange={e => setDealForm(p => ({ ...p, nazev: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Hodnota (Kč)</label>
                <input type="number" placeholder="0" value={dealForm.hodnota}
                  onChange={e => setDealForm(p => ({ ...p, hodnota: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: dealStageError ? '#f87171' : 'rgba(237,237,237,0.5)' }}>Fáze pipeline *</label>
                <select value={dealForm.stage_id}
                  onChange={e => { setDealForm(p => ({ ...p, stage_id: e.target.value })); setDealStageError(false); }}
                  style={{ ...inputStyle, borderColor: dealStageError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>– Vyberte fázi –</option>
                  {pipelineStages.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.nazev}</option>
                  ))}
                </select>
                {dealStageError && <p className="text-xs mt-1" style={{ color: '#f87171' }}>Vyberte fázi pipeline</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={dealSaving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {dealSaving ? 'Ukládám…' : 'Přidat do pipeline →'}
                </button>
                <button type="button" onClick={() => setShowDealModal(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
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
