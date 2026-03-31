'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type CalEvent = {
  id: string; nazev: string; typ: string; datum: string;
  cas_od: string | null; cas_do: string | null; popis: string | null;
  contact_id: string | null; deal_id: string | null;
  contacts?: { jmeno: string; prijmeni: string | null } | null;
  deals?: { nazev: string } | null;
};
type Contact = { id: string; jmeno: string; prijmeni: string | null };
type Deal = { id: string; nazev: string };
type Holiday = { datum: string; nazev: string };
type ViewMode = 'den' | 'tyden' | 'mesic' | 'rok';

const TYPES = [
  { id: 'schuzka', label: 'Schůzka', color: '#00BFFF' },
  { id: 'telefonat', label: 'Telefonát', color: '#10b981' },
  { id: 'demo', label: 'Prezentace', color: '#7B2FFF' },
  { id: 'followup', label: 'Follow-up', color: '#f59e0b' },
  { id: 'deadline', label: 'Deadline', color: '#ef4444' },
];
const DAYS_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DAYS_LONG = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const MONTHS_GEN = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];

function typeMeta(id: string) { return TYPES.find(t => t.id === id) ?? TYPES[0]; }

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayYMD() { return toYMD(new Date()); }
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDOW(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; } // Mon=0

// ── Easter Sunday (Anonymous Gregorian algorithm) ──────────────────────────
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m2 = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m2 + 114) / 31);
  const day = ((h + l - 7 * m2 + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── Czech public holidays for a given year ─────────────────────────────────
function czechHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const fixed: Holiday[] = [
    { datum: `${year}-01-01`, nazev: 'Nový rok' },
    { datum: `${year}-05-01`, nazev: 'Svátek práce' },
    { datum: `${year}-05-08`, nazev: 'Den vítězství' },
    { datum: `${year}-07-05`, nazev: 'Den Cyrila a Metoděje' },
    { datum: `${year}-07-06`, nazev: 'Den Jana Husa' },
    { datum: `${year}-09-28`, nazev: 'Den české státnosti' },
    { datum: `${year}-10-28`, nazev: 'Den vzniku Československa' },
    { datum: `${year}-11-17`, nazev: 'Den svobody a demokracie' },
    { datum: `${year}-12-24`, nazev: 'Štědrý den' },
    { datum: `${year}-12-25`, nazev: '1. svátek vánoční' },
    { datum: `${year}-12-26`, nazev: '2. svátek vánoční' },
  ];
  const movable: Holiday[] = [
    { datum: toYMD(addDays(easter, -2)), nazev: 'Velký pátek' },
    { datum: toYMD(addDays(easter, 1)),  nazev: 'Velikonoční pondělí' },
  ];
  return [...fixed, ...movable];
}

// ── Week helpers ────────────────────────────────────────────────────────────
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const dow = (r.getDay() + 6) % 7; // Mon=0
  r.setDate(r.getDate() - dow);
  return r;
}
function weekDays(d: Date): Date[] {
  const mon = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

const emptyForm = { nazev: '', typ: 'schuzka', datum: '', cas_od: '', cas_do: '', popis: '', contact_id: '', deal_id: '' };

export default function CalendarPage() {
  const supabase = createClient();
  const nowDate = new Date();

  const [view, setView] = useState<ViewMode>('mesic');
  const [curDate, setCurDate] = useState(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const weekHeaderRef = useRef<HTMLDivElement>(null);
  const weekBodyRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const year = curDate.getFullYear();
  const month = curDate.getMonth();
  const todayStr = todayYMD();

  // Czech holidays for current year (and adjacent for year view)
  const holidays = useMemo(() => {
    const yrs = view === 'rok' ? [year - 1, year, year + 1] : [year - 1, year, year + 1];
    const all: Record<string, string> = {};
    for (const y of yrs) {
      for (const h of czechHolidays(y)) all[h.datum] = h.nazev;
    }
    return all;
  }, [year, view]);

  // Fetch range based on view
  useEffect(() => {
    fetchEvents();
    if (contacts.length === 0) {
      supabase.from('contacts').select('id, jmeno, prijmeni').order('jmeno').then(({ data }) => setContacts(data ?? []));
      supabase.from('deals').select('id, nazev').order('nazev').then(({ data }) => setDeals((data as Deal[]) ?? []));
    }
  }, [curDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    let start: string, end: string;
    if (view === 'den') {
      start = end = toYMD(curDate);
    } else if (view === 'tyden') {
      const wd = weekDays(curDate);
      start = toYMD(wd[0]); end = toYMD(wd[6]);
    } else if (view === 'mesic') {
      start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      end = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;
    } else {
      start = `${year}-01-01`; end = `${year}-12-31`;
    }
    const { data } = await supabase.from('calendar_events')
      .select('id, nazev, typ, datum, cas_od, cas_do, popis, contact_id, deal_id, contacts(jmeno, prijmeni), deals(nazev)')
      .gte('datum', start).lte('datum', end).order('datum').order('cas_od');
    setEvents((data as unknown as CalEvent[]) ?? []);
    setLoading(false);
  };

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) {
      if (!map[e.datum]) map[e.datum] = [];
      map[e.datum].push(e);
    }
    return map;
  }, [events]);

  // Navigation
  const navigate = (dir: number) => {
    const d = new Date(curDate);
    if (view === 'den') d.setDate(d.getDate() + dir);
    else if (view === 'tyden') d.setDate(d.getDate() + dir * 7);
    else if (view === 'mesic') d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setCurDate(d);
  };

  const goToday = () => setCurDate(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()));

  // Modal helpers
  const openAdd = (dateStr: string, cas_od = '') => {
    setEditEvent(null);
    setForm({ ...emptyForm, datum: dateStr, cas_od });
    setShowModal(true);
  };
  const openEdit = (e: CalEvent) => {
    setEditEvent(e);
    setForm({ nazev: e.nazev, typ: e.typ, datum: e.datum, cas_od: e.cas_od ?? '', cas_do: e.cas_do ?? '', popis: e.popis ?? '', contact_id: e.contact_id ?? '', deal_id: e.deal_id ?? '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditEvent(null); setForm(emptyForm); };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.nazev.trim() || !form.datum) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { nazev: form.nazev.trim(), typ: form.typ, datum: form.datum, cas_od: form.cas_od || null, cas_do: form.cas_do || null, popis: form.popis.trim() || null, contact_id: form.contact_id || null, deal_id: form.deal_id || null };
    if (editEvent) {
      const { data } = await supabase.from('calendar_events').update(payload).eq('id', editEvent.id)
        .select('id, nazev, typ, datum, cas_od, cas_do, popis, contact_id, deal_id, contacts(jmeno, prijmeni), deals(nazev)').single();
      if (data) setEvents(prev => prev.map(e => e.id === editEvent.id ? (data as unknown as CalEvent) : e));
    } else {
      const { data } = await supabase.from('calendar_events').insert({ ...payload, user_id: user.id })
        .select('id, nazev, typ, datum, cas_od, cas_do, popis, contact_id, deal_id, contacts(jmeno, prijmeni), deals(nazev)').single();
      if (data) setEvents(prev => [...prev, data as unknown as CalEvent].sort((a, b) => a.datum.localeCompare(b.datum)));
    }
    closeModal(); setSaving(false);
  };

  const handleDelete = async () => {
    if (!editEvent || !confirm('Smazat tuto událost?')) return;
    await supabase.from('calendar_events').delete().eq('id', editEvent.id);
    setEvents(prev => prev.filter(e => e.id !== editEvent.id));
    closeModal();
  };

  // Title
  const navTitle = () => {
    if (view === 'den') {
      const d = curDate;
      return `${d.getDate()}. ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (view === 'tyden') {
      const wd = weekDays(curDate);
      return `${wd[0].getDate()}. ${MONTHS_GEN[wd[0].getMonth()]} – ${wd[6].getDate()}. ${MONTHS_GEN[wd[6].getMonth()]} ${wd[6].getFullYear()}`;
    }
    if (view === 'mesic') return `${MONTHS[month]} ${year}`;
    return `${year}`;
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px', outline: 'none', width: '100%',
  };

  // ── Mini month grid (used in Month and Year views) ────────────────────────
  const MiniMonth = ({ y, m, small }: { y: number; m: number; small?: boolean }) => {
    const firstDow = getFirstDOW(y, m);
    const dim = getDaysInMonth(y, m);
    const cells = Array.from({ length: Math.ceil((firstDow + dim) / 7) * 7 }, (_, i) => {
      const day = i - firstDow + 1;
      return day >= 1 && day <= dim ? day : null;
    });
    return (
      <div>
        {small && <p className="text-xs font-bold text-center mb-2 text-white">{MONTHS[m]}</p>}
        <div className="grid grid-cols-7 gap-px">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-xs py-0.5" style={{ color: 'rgba(237,237,237,0.3)', fontSize: '10px' }}>{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = ds === todayStr;
            const isHoliday = !!holidays[ds];
            const evCount = (eventsByDay[ds] ?? []).length;
            const isWeekend = (i % 7) >= 5;
            return (
              <button
                key={i}
                onClick={() => { if (small) { setCurDate(new Date(y, m, day)); setView('mesic'); } else openAdd(ds); }}
                className="relative flex flex-col items-center justify-center rounded transition-all"
                style={{
                  height: small ? '22px' : '36px',
                  background: isToday ? '#00BFFF' : 'transparent',
                  color: isToday ? '#0a0a0a' : isHoliday ? '#f87171' : isWeekend ? 'rgba(237,237,237,0.4)' : 'rgba(237,237,237,0.75)',
                  fontSize: small ? '11px' : '13px',
                  fontWeight: isToday ? 700 : 400,
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent'; }}
                title={isHoliday ? holidays[ds] : undefined}
              >
                {day}
                {evCount > 0 && !small && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {(eventsByDay[ds] ?? []).slice(0, 3).map((ev, ei) => (
                      <div key={ei} className="w-1 h-1 rounded-full" style={{ background: typeMeta(ev.typ).color }} />
                    ))}
                  </div>
                )}
                {evCount > 0 && small && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#00BFFF' }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Day view ───────────────────────────────────────────────────────────────
  const DayView = () => {
    const ds = toYMD(curDate);
    const dayEvents = eventsByDay[ds] ?? [];
    const holiday = holidays[ds];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className="flex-1 overflow-y-auto">
        {holiday && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
            🇨🇿 Státní svátek: {holiday}
          </div>
        )}
        <div className="flex flex-col">
          {hours.map(h => {
            const timeStr = `${String(h).padStart(2, '0')}:00`;
            const hEvents = dayEvents.filter(e => e.cas_od?.startsWith(String(h).padStart(2, '0')));
            return (
              <div key={h} className="flex gap-3 group"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', minHeight: '52px' }}>
                <div className="w-14 flex-shrink-0 pt-2 text-xs text-right" style={{ color: 'rgba(237,237,237,0.3)' }}>{timeStr}</div>
                <div className="flex-1 py-1 flex flex-col gap-1 cursor-pointer"
                  onClick={() => openAdd(ds, timeStr)}>
                  {hEvents.map(ev => {
                    const meta = typeMeta(ev.typ);
                    return (
                      <button key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: meta.color + '20', color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {ev.cas_od?.slice(0, 5)} {ev.nazev}
                        {ev.contacts && <span className="ml-2 opacity-60">· {ev.contacts.jmeno}</span>}
                      </button>
                    );
                  })}
                  {hEvents.length === 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs" style={{ color: 'rgba(0,191,255,0.4)' }}>+ Přidat událost</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week view ──────────────────────────────────────────────────────────────
  const WeekView = () => {
    const wd = weekDays(curDate);
    const MIN_W = 700;

    const syncHeaderScroll = () => {
      if (weekHeaderRef.current && weekBodyRef.current) {
        weekHeaderRef.current.scrollLeft = weekBodyRef.current.scrollLeft;
      }
    };

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Ukotvená hlavička */}
        <div
          ref={weekHeaderRef}
          className="flex-shrink-0"
          style={{ overflowX: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#111111' }}
        >
          <div className="flex" style={{ minWidth: `${MIN_W}px` }}>
            <div className="flex-shrink-0" style={{ width: '52px' }} />
            {wd.map((d, i) => {
              const ds = toYMD(d);
              const isToday = ds === todayStr;
              const holiday = holidays[ds];
              const isWeekend = i >= 5;
              return (
                <div key={i} className="flex-1 text-center py-2.5 px-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-medium" style={{ color: isWeekend ? 'rgba(237,237,237,0.3)' : 'rgba(237,237,237,0.45)' }}>
                    {DAYS_SHORT[i]}
                  </p>
                  <div
                    className="mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: isToday ? '#00BFFF' : 'transparent', color: isToday ? '#0a0a0a' : holiday ? '#f87171' : isWeekend ? 'rgba(237,237,237,0.4)' : 'rgba(237,237,237,0.85)' }}
                  >
                    {d.getDate()}
                  </div>
                  {holiday && (
                    <p className="truncate px-1 mt-0.5" style={{ color: 'rgba(248,113,113,0.7)', fontSize: '9px' }}>{holiday}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollovatelné tělo hodin */}
        <div
          ref={weekBodyRef}
          className="flex-1 overflow-auto"
          onScroll={syncHeaderScroll}
        >
          <div style={{ minWidth: `${MIN_W}px` }}>
            {Array.from({ length: 24 }, (_, h) => {
              const timeStr = `${String(h).padStart(2, '0')}:00`;
              return (
                <div key={h} className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', minHeight: '52px' }}>
                  <div className="flex-shrink-0 pt-1.5 pr-2 text-right text-xs" style={{ width: '52px', color: 'rgba(237,237,237,0.28)' }}>
                    {timeStr}
                  </div>
                  {wd.map((d, di) => {
                    const ds = toYMD(d);
                    const hEvents = (eventsByDay[ds] ?? []).filter(e => e.cas_od?.startsWith(String(h).padStart(2, '0')));
                    const isWeekend = di >= 5;
                    return (
                      <div
                        key={di}
                        className="flex-1 py-0.5 px-0.5 flex flex-col gap-0.5 group cursor-pointer"
                        style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                        onClick={() => openAdd(ds, timeStr)}
                      >
                        {hEvents.map(ev => {
                          const meta = typeMeta(ev.typ);
                          return (
                            <button
                              key={ev.id}
                              onClick={e => { e.stopPropagation(); openEdit(ev); }}
                              className="w-full text-left px-1.5 py-1 rounded text-xs font-semibold truncate"
                              style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}30` }}
                            >
                              {ev.cas_od?.slice(0, 5) && <span className="opacity-70 mr-1">{ev.cas_od.slice(0, 5)}</span>}
                              {ev.nazev}
                            </button>
                          );
                        })}
                        {hEvents.length === 0 && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 pl-1">
                            <span className="text-xs" style={{ color: 'rgba(0,191,255,0.35)' }}>+</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Month view ─────────────────────────────────────────────────────────────
  const MonthView = () => {
    const firstDow = getFirstDOW(year, month);
    const dim = getDaysInMonth(year, month);
    const cells = Array.from({ length: Math.ceil((firstDow + dim) / 7) * 7 }, (_, i) => {
      const day = i - firstDow + 1;
      return day >= 1 && day <= dim ? day : null;
    });
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 mb-1 flex-shrink-0">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center py-2 text-xs font-bold" style={{ color: 'rgba(237,237,237,0.35)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1" style={{ gridTemplateRows: `repeat(${cells.length / 7}, 1fr)` }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = ds === todayStr;
            const holiday = holidays[ds];
            const dayEvents = eventsByDay[ds] ?? [];
            const isWeekend = (i % 7) >= 5;
            return (
              <div key={i} onClick={() => openAdd(ds)}
                className="rounded-xl p-1.5 flex flex-col min-h-0 transition-all cursor-pointer"
                style={{
                  background: isToday ? 'rgba(0,191,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isToday ? 'rgba(0,191,255,0.3)' : holiday ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isToday ? 'rgba(0,191,255,0.12)' : 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(0,191,255,0.08)' : 'rgba(255,255,255,0.02)'; }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full`}
                    style={{
                      background: isToday ? '#00BFFF' : 'transparent',
                      color: isToday ? '#0a0a0a' : holiday ? '#f87171' : isWeekend ? 'rgba(237,237,237,0.35)' : 'rgba(237,237,237,0.7)',
                    }}>
                    {day}
                  </div>
                  {holiday && <span className="text-xs truncate max-w-[60%] hidden sm:block" style={{ color: 'rgba(248,113,113,0.7)', fontSize: '9px' }}>{holiday}</span>}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map(ev => {
                    const meta = typeMeta(ev.typ);
                    return (
                      <button key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className="text-left px-1.5 py-0.5 rounded text-xs font-medium truncate w-full"
                        style={{ background: meta.color + '20', color: meta.color }}>
                        {ev.cas_od ? ev.cas_od.slice(0, 5) + ' ' : ''}{ev.nazev}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && <p className="text-xs px-1" style={{ color: 'rgba(237,237,237,0.35)' }}>+{dayEvents.length - 3}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Year view ──────────────────────────────────────────────────────────────
  const YearView = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 12 }, (_, m2) => (
          <div key={m2}
            className="rounded-xl p-3 cursor-pointer transition-all"
            style={{ background: m2 === month ? 'rgba(0,191,255,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m2 === month ? 'rgba(0,191,255,0.2)' : 'rgba(255,255,255,0.06)'}` }}
            onMouseEnter={e => { if (m2 !== month) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (m2 !== month) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <MiniMonth y={year} m={m2} small />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">{navTitle()}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(237,237,237,0.6)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(237,237,237,0.6)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button onClick={goToday}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold ml-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
              Dnes
            </button>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
          {(['den', 'tyden', 'mesic', 'rok'] as ViewMode[]).map((v, i) => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: view === v ? 'rgba(0,191,255,0.15)' : 'transparent',
                color: view === v ? '#00BFFF' : 'rgba(237,237,237,0.5)',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
              {v === 'den' ? 'Den' : v === 'tyden' ? 'Týden' : v === 'mesic' ? 'Měsíc' : 'Rok'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      {view !== 'rok' && (
        <div className="flex items-center gap-4 flex-wrap mb-3 flex-shrink-0">
          {TYPES.map(t => (
            <div key={t.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>{t.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
            <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Státní svátek</span>
          </div>
        </div>
      )}

      {/* View content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : (
        <>
          {view === 'den' && <DayView />}
          {view === 'tyden' && <WeekView />}
          {view === 'mesic' && <MonthView />}
          {view === 'rok' && <YearView />}
        </>
      )}

      {/* Modal – přidat / upravit událost */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editEvent ? 'Upravit událost' : 'Nová událost'}</h2>
              <button onClick={closeModal} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.5)' }}>Typ události</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, typ: t.id }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: form.typ === t.id ? t.color + '20' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.typ === t.id ? t.color + '60' : 'rgba(255,255,255,0.08)'}`,
                        color: form.typ === t.id ? t.color : 'rgba(237,237,237,0.45)',
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: form.typ === t.id ? t.color : 'rgba(237,237,237,0.25)' }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Název *</label>
                <input type="text" placeholder="Název události" value={form.nazev} onChange={e => setForm(p => ({ ...p, nazev: e.target.value }))} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Datum *</label>
                <input type="date" value={form.datum} onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Čas od</label>
                  <input type="time" value={form.cas_od} onChange={e => setForm(p => ({ ...p, cas_od: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Čas do</label>
                  <input type="time" value={form.cas_do} onChange={e => setForm(p => ({ ...p, cas_do: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Popis</label>
                <textarea placeholder="Poznámky…" rows={2} value={form.popis} onChange={e => setForm(p => ({ ...p, popis: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Zákazník</label>
                <select value={form.contact_id} onChange={e => setForm(p => ({ ...p, contact_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>– Bez zákazníka –</option>
                  {contacts.map(c => <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>{c.jmeno} {c.prijmeni ?? ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Zakázka</label>
                <select value={form.deal_id} onChange={e => setForm(p => ({ ...p, deal_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>– Bez zakázky –</option>
                  {deals.map(d => <option key={d.id} value={d.id} style={{ background: '#1a1a1a' }}>{d.nazev}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {saving ? 'Ukládám…' : editEvent ? 'Uložit změny' : 'Přidat událost'}
                </button>
                {editEvent ? (
                  <button type="button" onClick={handleDelete}
                    className="px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
                    Smazat
                  </button>
                ) : (
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
