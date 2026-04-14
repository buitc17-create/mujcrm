'use client';

import { useState, useRef, useEffect } from 'react';

const DAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDOW(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; } // Mon=0

type Props = {
  value: string;          // '' | 'YYYY-MM-DD' | 'YYYY-MM-DDTHH:MM'
  onChange: (v: string) => void;
  placeholder?: string;
  includeTime?: boolean;  // default true
};

function parseVal(value: string) {
  if (!value) return { date: '', h: 9, min: 0 };
  const hasT = value.includes('T');
  return {
    date: value.slice(0, 10),
    h: hasT ? parseInt(value.slice(11, 13)) : 9,
    min: hasT ? parseInt(value.slice(14, 16)) : 0,
  };
}

export default function DateTimePicker({ value, onChange, placeholder = 'Vybrat datum', includeTime = true }: Props) {
  const parsed = parseVal(value);
  const [open, setOpen] = useState(false);
  const [selDate, setSelDate] = useState(parsed.date);
  const [hour, setHour] = useState(parsed.h);
  const [minute, setMinute] = useState(parsed.min);
  const now = new Date();
  const [viewY, setViewY] = useState(parsed.date ? parseInt(parsed.date.slice(0, 4)) : now.getFullYear());
  const [viewM, setViewM] = useState(parsed.date ? parseInt(parsed.date.slice(5, 7)) - 1 : now.getMonth());
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });

  // Sync when value resets externally
  useEffect(() => {
    const p = parseVal(value);
    setSelDate(p.date);
    setHour(p.h);
    setMinute(p.min);
    if (p.date) {
      setViewY(parseInt(p.date.slice(0, 4)));
      setViewM(parseInt(p.date.slice(5, 7)) - 1);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const emit = (d: string, h: number, m: number) => {
    if (!d) { onChange(''); return; }
    onChange(includeTime ? `${d}T${pad(h)}:${pad(m)}` : d);
  };

  const pickDate = (d: string) => {
    setSelDate(d);
    emit(d, hour, minute);
    if (!includeTime) setOpen(false);
  };

  const adjH = (delta: number) => { const n = (hour + delta + 24) % 24; setHour(n); emit(selDate, n, minute); };
  const adjM = (delta: number) => { const n = (minute + delta + 60) % 60; setMinute(n); emit(selDate, hour, n); };

  const clear = () => { setSelDate(''); setHour(9); setMinute(0); onChange(''); setOpen(false); };

  const goToday = () => {
    const t = new Date();
    const d = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    setSelDate(d); setViewY(t.getFullYear()); setViewM(t.getMonth());
    emit(d, hour, minute);
    if (!includeTime) setOpen(false);
  };

  const prevM = () => viewM === 0 ? (setViewM(11), setViewY(y => y - 1)) : setViewM(m => m - 1);
  const nextM = () => viewM === 11 ? (setViewM(0), setViewY(y => y + 1)) : setViewM(m => m + 1);

  // Build calendar cells
  const dim = daysInMonth(viewY, viewM);
  const fd = firstDOW(viewY, viewM);
  const prevDim = daysInMonth(viewY, viewM === 0 ? 11 : viewM - 1);
  type Cell = { day: number; str: string; cur: boolean };
  const cells: Cell[] = [];

  for (let i = 0; i < fd; i++) {
    const d = prevDim - fd + 1 + i;
    const pM = viewM === 0 ? 11 : viewM - 1;
    const pY = viewM === 0 ? viewY - 1 : viewY;
    cells.push({ day: d, str: `${pY}-${pad(pM + 1)}-${pad(d)}`, cur: false });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ day: d, str: `${viewY}-${pad(viewM + 1)}-${pad(d)}`, cur: true });
  }
  while (cells.length < 42) {
    const d = cells.length - fd - dim + 1;
    const nM = viewM === 11 ? 0 : viewM + 1;
    const nY = viewM === 11 ? viewY + 1 : viewY;
    cells.push({ day: d, str: `${nY}-${pad(nM + 1)}-${pad(d)}`, cur: false });
  }

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const label = selDate
    ? (() => {
        const [y, mo, d] = selDate.split('-').map(Number);
        const dl = `${d}. ${mo}. ${y}`;
        return includeTime ? `${dl},  ${pad(hour)}:${pad(minute)}` : dl;
      })()
    : null;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (!open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            const dropH = includeTime ? 480 : 340;
            const top = Math.min(r.top, window.innerHeight - dropH - 8);
            setDropPos({ top: Math.max(8, top), left: r.right + 8 });
          }
          setOpen(o => !o);
        }}
        className="w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center justify-between gap-2 transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(0,191,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: label ? '#ededed' : 'rgba(237,237,237,0.3)',
        }}
      >
        <span>{label ?? placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: 'rgba(237,237,237,0.35)' }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={ref}
          className="fixed z-[9999] rounded-2xl shadow-2xl"
          style={{
            top: dropPos.top,
            left: dropPos.left,
            background: '#161618',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '280px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
          }}
        >
          {/* Month header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button type="button" onClick={prevM}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.6)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-bold text-white">{MONTHS[viewM]} {viewY}</span>
            <button type="button" onClick={nextM}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.6)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 px-3 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'rgba(237,237,237,0.3)' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {cells.map((cell, i) => {
              const isSel = cell.str === selDate;
              const isToday = cell.str === todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickDate(cell.str)}
                  className="h-8 w-full flex items-center justify-center rounded-xl text-sm transition-all"
                  style={{
                    fontWeight: isSel || isToday ? 700 : 400,
                    color: isSel ? '#0a0a0a' : cell.cur ? '#ededed' : 'rgba(237,237,237,0.22)',
                    background: isSel ? 'linear-gradient(135deg, #00BFFF, #0090cc)' : 'transparent',
                    outline: isToday && !isSel ? '1.5px solid rgba(0,191,255,0.55)' : 'none',
                    outlineOffset: '-1px',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(0,191,255,0.1)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          {includeTime && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-center gap-2">
                {/* Hours */}
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => adjH(1)}
                    className="w-9 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <div className="w-12 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white"
                    style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.2)' }}>
                    {pad(hour)}
                  </div>
                  <button type="button" onClick={() => adjH(-1)}
                    className="w-9 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                <span className="text-2xl font-black text-white pb-1">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => adjM(5)}
                    className="w-9 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <div className="w-12 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white"
                    style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.2)' }}>
                    {pad(minute)}
                  </div>
                  <button type="button" onClick={() => adjM(-5)}
                    className="w-9 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: 'rgba(237,237,237,0.25)' }}>minuty po 5</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={clear}
              className="text-xs font-semibold transition-all"
              style={{ color: 'rgba(237,237,237,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ededed')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.4)')}>
              Vymazat
            </button>
            {includeTime && selDate && (
              <span className="text-sm font-black text-white">{pad(hour)}:{pad(minute)}</span>
            )}
            <button type="button" onClick={goToday}
              className="text-xs font-semibold transition-all"
              style={{ color: '#00BFFF' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Dnes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
