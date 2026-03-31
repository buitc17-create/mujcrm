'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

type Task = {
  id: string; nazev: string; popis: string | null; deadline: string | null;
  dokonceno: boolean; contact_id: string | null; created_at: string;
  contacts?: { jmeno: string; prijmeni: string | null } | null;
};
type Contact = { id: string; jmeno: string; prijmeni: string | null };

type FilterType = 'vse' | 'aktivni' | 'dokoncene' | 'po-terminu';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'vse', label: 'Vše' },
  { id: 'aktivni', label: 'Aktivní' },
  { id: 'po-terminu', label: 'Po termínu' },
  { id: 'dokoncene', label: 'Dokončené' },
];

function isOverdue(t: Task) {
  return !t.dokonceno && !!t.deadline && new Date(t.deadline) < startOfDay();
}
function isToday(t: Task) {
  if (!t.deadline || t.dokonceno) return false;
  const d = new Date(t.deadline);
  const s = startOfDay();
  const e = new Date(s.getTime() + 86400000);
  return d >= s && d < e;
}
function startOfDay() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function sortTasks(tasks: Task[]): Task[] {
  const overdue = tasks.filter(t => isOverdue(t));
  const today = tasks.filter(t => isToday(t));
  const future = tasks.filter(t => !t.dokonceno && !isOverdue(t) && !isToday(t));
  const done = tasks.filter(t => t.dokonceno);
  return [...overdue, ...today, ...future, ...done];
}

const emptyForm = { nazev: '', popis: '', deadline: '', contact_id: '' };

export default function TasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('vse');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('id, nazev, popis, deadline, dokonceno, contact_id, created_at, contacts(jmeno, prijmeni)')
      .order('created_at', { ascending: false });
    setTasks((data as unknown as Task[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    supabase.from('contacts').select('id, jmeno, prijmeni').order('jmeno').then(({ data }) => setContacts(data ?? []));
  }, []);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'aktivni') list = tasks.filter(t => !t.dokonceno);
    else if (filter === 'dokoncene') list = tasks.filter(t => t.dokonceno);
    else if (filter === 'po-terminu') list = tasks.filter(t => isOverdue(t));
    return sortTasks(list);
  }, [tasks, filter]);

  const openAdd = () => {
    setEditTask(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      nazev: task.nazev,
      popis: task.popis ?? '',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      contact_id: task.contact_id ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTask(null);
    setForm(emptyForm);
  };

  const toggleTask = async (id: string, current: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, dokonceno: !current } : t));
    await supabase.from('tasks').update({ dokonceno: !current }).eq('id', id);
    if (!current) {
      // označeno jako dokončené — smaž z kalendáře
      await supabase.from('calendar_events').delete().eq('task_id', id);
    } else {
      // označeno jako nedokončené — obnov v kalendáři
      const task = tasks.find(t => t.id === id);
      if (task?.deadline) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('calendar_events').upsert({
            user_id: user.id,
            nazev: task.nazev,
            typ: 'deadline',
            datum: task.deadline.slice(0, 10),
            cas_od: task.deadline.length >= 16 ? task.deadline.slice(11, 16) : null,
            contact_id: task.contact_id || null,
            task_id: id,
          }, { onConflict: 'task_id' });
        }
      }
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Smazat tento úkol?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nazev.trim()) return;
    setSaving(true);

    if (editTask) {
      const { data } = await supabase.from('tasks')
        .update({
          nazev: form.nazev.trim(),
          popis: form.popis.trim() || null,
          deadline: form.deadline || null,
          contact_id: form.contact_id || null,
        })
        .eq('id', editTask.id)
        .select('id, nazev, popis, deadline, dokonceno, contact_id, created_at, contacts(jmeno, prijmeni)')
        .single();
      if (data) {
        setTasks(prev => prev.map(t => t.id === editTask.id ? (data as unknown as Task) : t));
        if (form.deadline) {
          await supabase.from('calendar_events').upsert({
            nazev: form.nazev.trim(),
            typ: 'deadline',
            datum: form.deadline.slice(0, 10),
            cas_od: form.deadline.length >= 16 ? form.deadline.slice(11, 16) : null,
            popis: form.popis.trim() || null,
            contact_id: form.contact_id || null,
            task_id: editTask.id,
          }, { onConflict: 'task_id' });
        } else {
          await supabase.from('calendar_events').delete().eq('task_id', editTask.id);
        }
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { data } = await supabase.from('tasks').insert({
        user_id: user.id,
        nazev: form.nazev.trim(),
        popis: form.popis.trim() || null,
        deadline: form.deadline || null,
        contact_id: form.contact_id || null,
        dokonceno: false,
      }).select('id, nazev, popis, deadline, dokonceno, contact_id, created_at, contacts(jmeno, prijmeni)').single();
      if (data) {
        const newTask = data as unknown as Task;
        setTasks(prev => [newTask, ...prev]);
        if (form.deadline) {
          await supabase.from('calendar_events').insert({
            user_id: user.id,
            nazev: form.nazev.trim(),
            typ: 'deadline',
            datum: form.deadline.slice(0, 10),
            cas_od: form.deadline.length >= 16 ? form.deadline.slice(11, 16) : null,
            cas_do: null,
            popis: form.popis.trim() || null,
            contact_id: form.contact_id || null,
            deal_id: null,
            task_id: newTask.id,
          });
        }
      }
    }

    closeModal();
    setSaving(false);
  };

  const activeCount = tasks.filter(t => !t.dokonceno).length;
  const overdueCount = tasks.filter(t => isOverdue(t)).length;

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
    outline: 'none', width: '100%',
  };

  const groups = [
    { key: 'overdue', label: 'Po termínu', color: '#ef4444', items: filtered.filter(t => isOverdue(t)) },
    { key: 'today', label: 'Dnes', color: '#f59e0b', items: filtered.filter(t => isToday(t)) },
    { key: 'future', label: 'Budoucí', color: '#00BFFF', items: filtered.filter(t => !t.dokonceno && !isOverdue(t) && !isToday(t)) },
    { key: 'done', label: 'Dokončené', color: '#10b981', items: filtered.filter(t => t.dokonceno) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Úkoly</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            {activeCount} aktivních
            {overdueCount > 0 && <span style={{ color: '#ef4444' }}> · {overdueCount} po termínu</span>}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Přidat úkol
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f.id ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === f.id ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: filter === f.id ? '#00BFFF' : 'rgba(237,237,237,0.5)',
            }}>
            {f.label}
            {f.id === 'po-terminu' && overdueCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-20" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <svg className="mx-auto mb-4" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.2)" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p className="text-sm font-semibold text-white mb-1">Žádné úkoly</p>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            {filter !== 'vse' ? 'Zkus jiný filtr.' : 'Přidej první úkol a nezapomeň na nic důležitého.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(group => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: group.color }}>
                  {group.label}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: group.color + '18', color: group.color }}>
                  {group.items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {group.items.map(task => {
                  const overdue = isOverdue(task);
                  const today = isToday(task);
                  const c = task.contacts;
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-xl group transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : today ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        opacity: task.dokonceno ? 0.6 : 1,
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(task.id, task.dokonceno)}
                        className="mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all"
                        style={{
                          background: task.dokonceno ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${task.dokonceno ? '#10b981' : overdue ? '#ef4444' : today ? '#f59e0b' : 'rgba(255,255,255,0.2)'}`,
                        }}
                      >
                        {task.dokonceno && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${task.dokonceno ? 'line-through' : 'text-white'}`}
                          style={{ color: task.dokonceno ? 'rgba(237,237,237,0.4)' : undefined }}>
                          {task.nazev}
                        </p>
                        {task.popis && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(237,237,237,0.45)' }}>{task.popis}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          {task.deadline && (
                            <span className="text-xs flex items-center gap-1"
                              style={{ color: overdue ? '#f87171' : today ? '#f59e0b' : 'rgba(237,237,237,0.4)' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              {overdue && 'Po termínu · '}{new Date(task.deadline).toLocaleDateString('cs-CZ')}
                            </span>
                          )}
                          {c && (
                            <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>
                              👤 {c.jmeno} {c.prijmeni ?? ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(task)}
                          style={{ color: 'rgba(237,237,237,0.35)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.35)')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{ color: 'rgba(239,68,68,0.5)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}
                        >
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

      {/* Modal – přidat / upravit úkol */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editTask ? 'Upravit úkol' : 'Nový úkol'}</h2>
              <button onClick={closeModal} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Název úkolu *</label>
                <input type="text" placeholder="Co je potřeba udělat?" value={form.nazev}
                  onChange={e => setForm(p => ({ ...p, nazev: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Popis</label>
                <textarea placeholder="Podrobnosti…" rows={3} value={form.popis}
                  onChange={e => setForm(p => ({ ...p, popis: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Deadline</label>
                <input type="datetime-local" value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Přiřadit ke kontaktu</label>
                <select value={form.contact_id} onChange={e => setForm(p => ({ ...p, contact_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>– Bez kontaktu –</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>
                      {c.jmeno} {c.prijmeni ?? ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {saving ? 'Ukládám…' : editTask ? 'Uložit změny' : 'Přidat úkol'}
                </button>
                <button type="button" onClick={closeModal}
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
