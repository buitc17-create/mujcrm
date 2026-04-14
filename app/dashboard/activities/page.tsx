'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import DateTimePicker from '@/app/components/DateTimePicker';

type Activity = {
  id: string; typ: string; popis: string; datum: string;
  cas_do: string | null; misto: string | null;
  contact_id: string | null; deal_id: string | null; created_at: string;
  contacts?: { jmeno: string; prijmeni: string | null } | null;
  deals?: { nazev: string } | null;
};
type Contact = { id: string; jmeno: string; prijmeni: string | null };
type Deal = { id: string; nazev: string };

const TYPES = [
  { id: 'schuzka', label: 'Schůzka', color: '#00BFFF', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  )},
  { id: 'telefonat', label: 'Telefonát', color: '#10b981', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  )},
  { id: 'email', label: 'Email', color: '#7B2FFF', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  )},
  { id: 'poznamka', label: 'Poznámka', color: '#6b7280', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  )},
  { id: 'demo', label: 'Prezentace', color: '#f97316', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  )},
  { id: 'followup', label: 'Follow-up', color: '#f59e0b', icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  )},
];

function typeMeta(id: string) { return TYPES.find(t => t.id === id) ?? TYPES[3]; }

function groupByDate(activities: Activity[]) {
  const groups: Record<string, Activity[]> = {};
  for (const a of activities) {
    const key = a.datum.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  // Sort by date descending
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

const pad = (n: number) => String(n).padStart(2, '0');
const localNow = () => {
  const now = new Date();
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
};

const REMINDER_OPTIONS = [
  { value: '', label: '— Bez připomínky —' },
  { value: '15', label: '15 minut předem' },
  { value: '30', label: '30 minut předem' },
  { value: '60', label: '1 hodinu předem' },
  { value: '120', label: '2 hodiny předem' },
  { value: '1440', label: '1 den předem' },
  { value: '2880', label: '2 dny předem' },
];

type TeamMember = { id: string; name: string; email: string; role: string; isOwner: boolean };
const emptyForm = () => {
  const { date, time } = localNow();
  return { typ: 'schuzka', popis: '', datum_date: date, cas_od: time, cas_do: '', misto: '', contact_id: '', deal_id: '', reminder: '', assigned_to: '' };
};

const SELECT = 'id, typ, popis, datum, cas_do, misto, contact_id, deal_id, created_at, contacts(jmeno, prijmeni), deals(nazev)';

export default function ActivitiesPage() {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('vse');

  const [showModal, setShowModal] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Inline new contact
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ jmeno: '', prijmeni: '', email: '' });
  const [savingContact, setSavingContact] = useState(false);

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
    outline: 'none', width: '100%',
  };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)');
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)');

  useEffect(() => {
    fetchActivities();
    supabase.from('contacts').select('id, jmeno, prijmeni').order('jmeno').then(({ data }) => setContacts(data ?? []));
    supabase.from('deals').select('id, nazev').order('nazev').then(({ data }) => setDeals((data as Deal[]) ?? []));
    fetch('/api/team/members').then(r => r.json()).then(d => setTeamMembers(d.members ?? []));
  }, []);

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select(SELECT).order('datum', { ascending: false });
    setActivities((data as unknown as Activity[]) ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'vse') return activities;
    return activities.filter(a => a.typ === filter);
  }, [activities, filter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditActivity(null);
    setForm(emptyForm());
    setShowNewContact(false);
    setNewContact({ jmeno: '', prijmeni: '', email: '' });
    setShowModal(true);
  };

  const openEdit = async (a: Activity) => {
    setEditActivity(a);
    let reminder = '';
    if (a.datum) {
      const { data: notif } = await supabase
        .from('notification_queue')
        .select('scheduled_at')
        .eq('source_type', 'activity')
        .eq('source_id', a.id)
        .eq('sent', false)
        .maybeSingle();
      if (notif?.scheduled_at) {
        const diff = Math.round((new Date(a.datum).getTime() - new Date(notif.scheduled_at).getTime()) / 60000);
        const match = [15, 30, 60, 120, 1440, 2880].find(v => Math.abs(v - diff) < 5);
        if (match) reminder = String(match);
      }
    }
    setForm({
      typ: a.typ,
      popis: a.popis,
      datum_date: a.datum.slice(0, 10),
      cas_od: a.datum.length >= 16 ? a.datum.slice(11, 16) : '',
      cas_do: a.cas_do ?? '',
      misto: a.misto ?? '',
      contact_id: a.contact_id ?? '',
      deal_id: a.deal_id ?? '',
      reminder,
      assigned_to: '',
    });
    setShowNewContact(false);
    setNewContact({ jmeno: '', prijmeni: '', email: '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditActivity(null); };

  // ── Create new contact inline ──────────────────────────────────────────────

  const handleCreateContact = async () => {
    if (!newContact.jmeno.trim()) return;
    setSavingContact(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingContact(false); return; }
    const { data } = await supabase.from('contacts').insert({
      user_id: user.id,
      jmeno: newContact.jmeno.trim(),
      prijmeni: newContact.prijmeni.trim() || null,
      email: newContact.email.trim() || null,
      tag: 'zákazník',
    }).select('id, jmeno, prijmeni').single();
    if (data) {
      setContacts(prev => [...prev, data].sort((a, b) => a.jmeno.localeCompare(b.jmeno)));
      setForm(p => ({ ...p, contact_id: data.id }));
    }
    setNewContact({ jmeno: '', prijmeni: '', email: '' });
    setShowNewContact(false);
    setSavingContact(false);
  };

  // ── Save activity ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.popis.trim()) return;
    setSaving(true);

    // Combine date + start time into datum (Czech local time)
    const datum = form.datum_date
      ? (form.cas_od ? `${form.datum_date}T${form.cas_od}` : form.datum_date)
      : (() => { const { date, time } = localNow(); return `${date}T${time}`; })();

    const payload = {
      typ: form.typ,
      popis: form.popis.trim(),
      datum,
      cas_do: form.cas_do || null,
      misto: form.misto.trim() || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
      assigned_to: form.assigned_to || null,
    };

    if (editActivity) {
      const { data } = await supabase.from('activities')
        .update(payload).eq('id', editActivity.id)
        .select(SELECT).single();
      if (data) {
        setActivities(prev => prev.map(a => a.id === editActivity.id ? (data as unknown as Activity) : a));
        await supabase.from('calendar_events').upsert({
          nazev: form.popis.trim(),
          typ: form.typ,
          datum: datum.slice(0, 10),
          cas_od: form.cas_od || null,
          cas_do: form.cas_do || null,
          popis: form.misto ? `Místo: ${form.misto.trim()}` : null,
          contact_id: form.contact_id || null,
          deal_id: form.deal_id || null,
          activity_id: editActivity.id,
        }, { onConflict: 'activity_id' });
        // Update notification
        await supabase.from('notification_queue').delete().eq('source_type', 'activity').eq('source_id', editActivity.id).eq('sent', false);
        if (form.reminder && form.datum_date && form.cas_od) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const scheduledAt = new Date(new Date(`${form.datum_date}T${form.cas_od}`).getTime() - parseInt(form.reminder) * 60 * 1000);
            if (scheduledAt > new Date()) {
              await supabase.from('notification_queue').insert({
                user_id: user.id,
                title: form.popis.trim(),
                body: `Připomínka: ${TYPES.find(t => t.id === form.typ)?.label ?? form.typ}`,
                url: '/dashboard/activities',
                scheduled_at: scheduledAt.toISOString(),
                source_type: 'activity',
                source_id: editActivity.id,
              });
            }
          }
        }
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { data } = await supabase.from('activities')
        .insert({ user_id: user.id, ...payload })
        .select(SELECT).single();
      if (data) {
        const newActivity = data as unknown as Activity;
        setActivities(prev => [newActivity, ...prev]);
        await supabase.from('calendar_events').insert({
          user_id: user.id,
          nazev: form.popis.trim(),
          typ: form.typ,
          datum: datum.slice(0, 10),
          cas_od: form.cas_od || null,
          cas_do: form.cas_do || null,
          popis: form.misto ? `Místo: ${form.misto.trim()}` : null,
          contact_id: form.contact_id || null,
          deal_id: form.deal_id || null,
          activity_id: newActivity.id,
        });
        if (form.reminder && form.datum_date && form.cas_od) {
          const scheduledAt = new Date(new Date(`${form.datum_date}T${form.cas_od}`).getTime() - parseInt(form.reminder) * 60 * 1000);
          if (scheduledAt > new Date()) {
            await supabase.from('notification_queue').insert({
              user_id: user.id,
              title: `Připomínka: ${TYPES.find(t => t.id === form.typ)?.label ?? form.typ}`,
              body: form.popis.trim(),
              url: '/dashboard/activities',
              scheduled_at: scheduledAt.toISOString(),
              source_type: 'activity',
              source_id: newActivity.id,
            });
          }
        }
      }
    }

    closeModal();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat tuto aktivitu?')) return;
    await supabase.from('activities').delete().eq('id', id);
    setActivities(prev => prev.filter(a => a.id !== id));
    if (editActivity?.id === id) closeModal();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Aktivity</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>{activities.length} záznamů</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Přidat aktivitu
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilter('vse')}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: filter === 'vse' ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${filter === 'vse' ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: filter === 'vse' ? '#00BFFF' : 'rgba(237,237,237,0.5)',
          }}>Vše</button>
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === t.id ? t.color + '18' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === t.id ? t.color + '50' : 'rgba(255,255,255,0.1)'}`,
              color: filter === t.id ? t.color : 'rgba(237,237,237,0.5)',
            }}>
            <span style={{ color: filter === t.id ? t.color : 'rgba(237,237,237,0.35)' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-20" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <svg className="mx-auto mb-4" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.2)" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <p className="text-sm font-semibold text-white mb-1">Žádné aktivity</p>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            {filter !== 'vse' ? 'Zkus jiný filtr.' : 'Zaznamenej první aktivitu se zákazníkem.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([dateKey, items]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(237,237,237,0.4)' }}>
                  {fmtDate(dateKey)}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div className="flex flex-col gap-3">
                {items.map(activity => {
                  const meta = typeMeta(activity.typ);
                  const c = activity.contacts;
                  const d = activity.deals;
                  const timeStr = activity.datum.length >= 16 ? activity.datum.slice(11, 16) : null;
                  const timeRange = timeStr
                    ? (activity.cas_do ? `${timeStr} – ${activity.cas_do}` : timeStr)
                    : null;
                  return (
                    <div key={activity.id}
                      className="flex gap-4 px-4 py-4 rounded-xl group transition-all"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {/* Type icon */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: meta.color + '18', color: meta.color }}>
                        {meta.icon}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: meta.color + '15', color: meta.color }}>
                            {meta.label}
                          </span>
                          {timeRange && (
                            <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(237,237,237,0.45)' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {timeRange}
                            </span>
                          )}
                          {activity.misto && (
                            <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(237,237,237,0.4)' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {activity.misto}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white leading-relaxed">{activity.popis}</p>
                        {(c || d) && (
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {c && (
                              <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>
                                👤 {c.jmeno} {c.prijmeni ?? ''}
                              </span>
                            )}
                            {d && (
                              <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>
                                💼 {d.nazev}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                        <button onClick={() => openEdit(activity)}
                          style={{ color: 'rgba(237,237,237,0.35)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.35)')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(activity.id)}
                          style={{ color: 'rgba(239,68,68,0.5)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal – přidat / upravit aktivitu */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editActivity ? 'Upravit aktivitu' : 'Nová aktivita'}</h2>
              <button onClick={closeModal} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Typ */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.5)' }}>Typ aktivity</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => setForm(p => ({ ...p, typ: t.id }))}
                      className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.typ === t.id ? t.color + '18' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.typ === t.id ? t.color + '50' : 'rgba(255,255,255,0.08)'}`,
                        color: form.typ === t.id ? t.color : 'rgba(237,237,237,0.45)',
                      }}>
                      <span style={{ color: form.typ === t.id ? t.color : 'rgba(237,237,237,0.3)' }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popis */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Popis *</label>
                <textarea placeholder="Co se stalo nebo co je plánováno…" rows={3} value={form.popis}
                  onChange={e => setForm(p => ({ ...p, popis: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={focus} onBlur={blur} />
              </div>

              {/* Datum */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Datum</label>
                <DateTimePicker
                  value={form.datum_date}
                  onChange={v => setForm(p => ({ ...p, datum_date: v }))}
                  includeTime={false}
                  placeholder="Vybrat datum"
                />
              </div>

              {/* Čas od – do */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Čas</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input type="time" value={form.cas_od}
                      onChange={e => setForm(p => ({ ...p, cas_od: e.target.value }))}
                      style={{ ...inputStyle, colorScheme: 'dark', textAlign: 'center' }}
                      onFocus={focus} onBlur={blur} />
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'rgba(237,237,237,0.35)' }}>–</span>
                  <div className="flex-1">
                    <input type="time" value={form.cas_do}
                      onChange={e => setForm(p => ({ ...p, cas_do: e.target.value }))}
                      style={{ ...inputStyle, colorScheme: 'dark', textAlign: 'center' }}
                      onFocus={focus} onBlur={blur} />
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.3)' }}>Čas od – do (volitelně)</p>
              </div>

              {/* Připomínka */}
              {form.cas_od && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Připomínka</label>
                  <select value={form.reminder} onChange={e => setForm(p => ({ ...p, reminder: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                    {REMINDER_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Místo */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Místo</label>
                <input type="text" placeholder="Kancelář, online, adresa…" value={form.misto}
                  onChange={e => setForm(p => ({ ...p, misto: e.target.value }))}
                  style={inputStyle}
                  onFocus={focus} onBlur={blur} />
              </div>

              {/* Zákazník */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Zákazník</label>
                <select value={form.contact_id}
                  onChange={e => setForm(p => ({ ...p, contact_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>– Bez zákazníka –</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>
                      {c.jmeno} {c.prijmeni ?? ''}
                    </option>
                  ))}
                </select>
                {/* New contact toggle */}
                <button type="button"
                  onClick={() => { setShowNewContact(p => !p); setNewContact({ jmeno: '', prijmeni: '', email: '' }); }}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold transition-all"
                  style={{ color: showNewContact ? '#00BFFF' : 'rgba(0,191,255,0.6)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {showNewContact
                      ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                      : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="5" x2="19" y2="11"/><line x1="16" y1="8" x2="22" y2="8"/></>}
                  </svg>
                  {showNewContact ? 'Zrušit' : '+ Vytvořit nového zákazníka'}
                </button>

                {/* Inline new contact form */}
                {showNewContact && (
                  <div className="mt-3 p-3 rounded-xl flex flex-col gap-2"
                    style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.2)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#00BFFF' }}>Nový zákazník</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Jméno *" value={newContact.jmeno}
                        onChange={e => setNewContact(p => ({ ...p, jmeno: e.target.value }))}
                        style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
                        onFocus={focus} onBlur={blur} />
                      <input type="text" placeholder="Příjmení" value={newContact.prijmeni}
                        onChange={e => setNewContact(p => ({ ...p, prijmeni: e.target.value }))}
                        style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
                        onFocus={focus} onBlur={blur} />
                    </div>
                    <input type="email" placeholder="E-mail" value={newContact.email}
                      onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                      style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
                      onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={handleCreateContact} disabled={savingContact || !newContact.jmeno.trim()}
                      className="py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                      style={{ background: 'rgba(0,191,255,0.15)', border: '1px solid rgba(0,191,255,0.3)', color: '#00BFFF' }}>
                      {savingContact ? 'Ukládám…' : 'Vytvořit a přiřadit'}
                    </button>
                  </div>
                )}
              </div>

              {/* Zakázka */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Zakázka</label>
                <select value={form.deal_id}
                  onChange={e => setForm(p => ({ ...p, deal_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>– Bez zakázky –</option>
                  {deals.map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#1a1a1a' }}>{d.nazev}</option>
                  ))}
                </select>
              </div>

              {teamMembers.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Přiřadit členovi týmu</label>
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
                  {saving ? 'Ukládám…' : editActivity ? 'Uložit změny' : 'Přidat aktivitu'}
                </button>
                {editActivity && (
                  <button type="button" onClick={() => handleDelete(editActivity.id)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
                    Smazat
                  </button>
                )}
                {!editActivity && (
                  <button type="button" onClick={closeModal}
                    className="px-5 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                    Zrušit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
