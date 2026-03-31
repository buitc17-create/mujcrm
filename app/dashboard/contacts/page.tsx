'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Contact = {
  id: string;
  jmeno: string;
  prijmeni: string | null;
  email: string | null;
  telefon: string | null;
  firma: string | null;
  tag: string;
  created_at: string;
};

const tagColors: Record<string, string> = {
  zákazník: '#00BFFF',
  lead: '#f59e0b',
  vip: '#7B2FFF',
  partner: '#10b981',
};

const TAGS = ['Vše', 'zákazník', 'lead', 'vip', 'partner'];

export default function ContactsPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('Vše');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, jmeno, prijmeni, email, telefon, firma, tag, created_at')
      .order('created_at', { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(c => {
      const matchTag = tagFilter === 'Vše' || c.tag === tagFilter;
      const matchSearch = !q || [c.jmeno, c.prijmeni, c.firma, c.email].some(v => v?.toLowerCase().includes(q));
      return matchTag && matchSearch;
    });
  }, [contacts, search, tagFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Smazat zákazníka "${name}"? Tato akce je nevratná.`)) return;
    setDeleting(id);
    await supabase.from('contacts').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Zákazníci</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            {contacts.length} {contacts.length === 1 ? 'kontakt' : contacts.length < 5 ? 'kontakty' : 'kontaktů'} celkem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/contacts/import"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.8)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import CSV
          </Link>
          <Link
            href="/dashboard/contacts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Přidat zákazníka
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Hledat podle jména, firmy nebo e-mailu…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ededed', outline: 'none' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TAGS.map(tag => {
            const active = tagFilter === tag;
            const color = tagColors[tag] ?? '#00BFFF';
            return (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                style={{
                  background: active ? (tag === 'Vše' ? 'rgba(0,191,255,0.15)' : color + '18') : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? (tag === 'Vše' ? 'rgba(0,191,255,0.4)' : color + '45') : 'rgba(255,255,255,0.1)'}`,
                  color: active ? (tag === 'Vše' ? '#00BFFF' : color) : 'rgba(237,237,237,0.5)',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <p className="text-sm font-semibold text-white mb-1">
            {search || tagFilter !== 'Vše' ? 'Žádné výsledky' : 'Zatím žádní zákazníci'}
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(237,237,237,0.4)' }}>
            {search || tagFilter !== 'Vše' ? 'Zkus jiné hledání nebo filtr.' : 'Přidej prvního zákazníka a začni budovat svou databázi.'}
          </p>
          {!search && tagFilter === 'Vše' && (
            <Link href="/dashboard/contacts/new" className="text-sm font-semibold" style={{ color: '#00BFFF' }}>
              + Přidat zákazníka
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[40px_1fr_1fr_1fr_1fr_100px_80px] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(237,237,237,0.35)' }}>
            <div />
            <div>Jméno</div>
            <div>Firma</div>
            <div>E-mail</div>
            <div>Telefon</div>
            <div>Tag</div>
            <div>Akce</div>
          </div>

          {filtered.map((c, i) => {
            const initials = `${c.jmeno?.[0] ?? ''}${c.prijmeni?.[0] ?? ''}`.toUpperCase() || '?';
            const tagColor = tagColors[c.tag] ?? '#00BFFF';
            const isLast = i === filtered.length - 1;
            return (
              <div
                key={c.id}
                className="grid md:grid-cols-[40px_1fr_1fr_1fr_1fr_100px_80px] gap-4 px-4 py-3.5 items-center transition-all"
                style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: tagColor + '20', color: tagColor }}>{initials}</div>

                {/* Name */}
                <div>
                  <p className="text-sm font-semibold text-white">{c.jmeno} {c.prijmeni}</p>
                </div>

                {/* Firma */}
                <div className="text-sm" style={{ color: 'rgba(237,237,237,0.55)' }}>{c.firma || '–'}</div>

                {/* Email */}
                <div className="text-sm truncate" style={{ color: 'rgba(237,237,237,0.55)' }}>{c.email || '–'}</div>

                {/* Telefon */}
                <div className="text-sm" style={{ color: 'rgba(237,237,237,0.55)' }}>{c.telefon || '–'}</div>

                {/* Tag */}
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{ background: tagColor + '18', color: tagColor, border: `1px solid ${tagColor}30` }}>
                    {c.tag}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/contacts/${c.id}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: 'rgba(237,237,237,0.4)' }}
                    title="Detail"
                    onMouseEnter={undefined}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, `${c.jmeno} ${c.prijmeni ?? ''}`.trim())}
                    disabled={deleting === c.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: 'rgba(239,68,68,0.5)' }}
                    title="Smazat"
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
