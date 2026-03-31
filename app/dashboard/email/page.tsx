'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import EmailComposer from '@/app/dashboard/components/EmailComposer';
import { useEmailSync } from '@/app/dashboard/components/EmailSyncProvider';

// ─── Types ───────────────────────────────────────────────────────────────────
type Email = {
  id: string; direction: string; from_email: string; to_email: string;
  subject: string; body: string; sent_at: string; folder: string | null;
  is_read: boolean; is_flagged: boolean;
  contacts?: { jmeno: string; prijmeni: string | null } | null;
};
type Contact = { id: string; jmeno: string; prijmeni: string | null; email: string | null };
type Folder = { id: string; name: string; path: string; type: string; unseen_messages: number };
type Filter = 'all' | 'unread' | 'starred';

const FOLDER_ORDER = ['inbox', 'sent', 'drafts', 'spam', 'trash', 'custom'];
const VIRTUAL_STARRED = '__starred__';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','br','b','i','u','strong','em','a','ul','ol','li','h1','h2','h3','h4',
      'table','tr','td','th','thead','tbody','div','span','img','pre','blockquote','hr','font'],
    ALLOWED_ATTR: ['href','src','style','class','target','color','bgcolor','align',
      'width','height','border','cellpadding','cellspacing','valign'],
  });
}
function isHtml(s: string) { return /<[a-z][\s\S]*>/i.test(s); }
function fmtLS(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'Právě teď';
  if (s < 3600) return `před ${Math.floor(s/60)} min`;
  if (s < 86400) return `před ${Math.floor(s/3600)} hod`;
  return d.toLocaleDateString('cs-CZ', { day:'numeric', month:'short' });
}
function fmtDate(d: string) {
  const date = new Date(d), diff = Date.now() - date.getTime();
  if (diff < 86400000) return date.toLocaleTimeString('cs-CZ', { hour:'2-digit', minute:'2-digit' });
  if (diff < 604800000) return date.toLocaleDateString('cs-CZ', { weekday:'short', hour:'2-digit', minute:'2-digit' });
  return date.toLocaleDateString('cs-CZ', { day:'numeric', month:'short' });
}

function FolderIcon({ type, size=14 }: { type: string; size?: number }) {
  const s = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round' as const, strokeLinejoin:'round' as const };
  if (type==='inbox') return <svg {...s}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
  if (type==='sent') return <svg {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  if (type==='drafts') return <svg {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
  if (type==='spam') return <svg {...s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  if (type==='trash') return <svg {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
  if (type==='starred') return <svg {...s} fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  return <svg {...s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmailPage() {
  const supabase = createClient();
  const [emails, setEmails] = useState<Email[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [loading, setLoading] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Email | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composerTo, setComposerTo] = useState('');
  const [composerToName, setComposerToName] = useState('');
  const [search, setSearch] = useState('');
  const [folderSyncing, setFolderSyncing] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Selection & filter
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState<{emailId: string | 'bulk'; x: number; y: number} | null>(null);
  // Drag & drop
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  // Swipe (touch + mouse)
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});
  const [swipeAction, setSwipeAction] = useState<Record<string, 'delete' | 'unread' | null>>({});
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchSwipingId = useRef<string | null>(null);
  const mouseStartX = useRef(0);
  const isDraggingEmailRef = useRef<string | null>(null);
  const initDone = useRef(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  const { syncing, lastSync, triggerSync } = useEmailSync();

  // ─── Close menus on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setShowBulkMenu(false);
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) setShowMoveMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Folders ──────────────────────────────────────────────────────────────
  const loadFolders = useCallback(async () => {
    const { data } = await supabase.from('email_folders').select('id, name, path, type, unseen_messages').order('type');
    if (data) setFolders([...data].sort((a, b) => FOLDER_ORDER.indexOf(a.type) - FOLDER_ORDER.indexOf(b.type)) as Folder[]);
    return data ?? [];
  }, [supabase]);

  const initFolders = useCallback(async () => {
    if (initDone.current) return;
    initDone.current = true;
    setLoadingFolders(true);
    try {
      const existing = await loadFolders();
      if (existing.length === 0) { await fetch('/api/email/folders', { method: 'POST' }); await loadFolders(); }
    } finally { setLoadingFolders(false); }
  }, [loadFolders]);

  const refreshFolders = async () => {
    setLoadingFolders(true);
    try { await fetch('/api/email/folders', { method: 'POST' }); await loadFolders(); }
    finally { setLoadingFolders(false); }
  };

  // ─── Emails ───────────────────────────────────────────────────────────────
  const loadEmails = useCallback(async (folderPath: string) => {
    let query = supabase.from('emails')
      .select('id, direction, from_email, to_email, subject, body, sent_at, folder, is_read, is_flagged, contacts(jmeno, prijmeni)')
      .order('sent_at', { ascending: false }).limit(100);
    if (folderPath === VIRTUAL_STARRED) query = query.eq('is_flagged', true);
    else if (folderPath === 'INBOX') query = query.or('folder.eq.INBOX,folder.is.null');
    else query = query.eq('folder', folderPath);
    const { data } = await query;
    if (data) setEmails(data as unknown as Email[]);
  }, [supabase]);

  const syncFolder = useCallback(async (folderPath: string) => {
    if (folderPath === VIRTUAL_STARRED) return;
    setFolderSyncing(true);
    try {
      await fetch('/api/email/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: folderPath }) });
      await loadEmails(folderPath);
    } finally { setFolderSyncing(false); }
  }, [loadEmails]);

  const switchFolder = useCallback(async (folderPath: string) => {
    setActiveFolder(folderPath); setSelected(null); setSearch(''); setSelectedIds(new Set());
    await loadEmails(folderPath);
    if (folderPath !== VIRTUAL_STARRED) syncFolder(folderPath);
  }, [loadEmails, syncFolder]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: settings }, { data: contactData }] = await Promise.all([
        supabase.from('email_settings').select('is_verified').eq('user_id', user.id).single(),
        supabase.from('contacts').select('id, jmeno, prijmeni, email').not('email', 'is', null).order('jmeno'),
      ]);
      setIsVerified(settings?.is_verified ?? false);
      setContacts(contactData ?? []);
      if (settings?.is_verified) { await loadEmails('INBOX'); initFolders(); }
      setLoading(false);
    };
    load();
  }, [supabase, loadEmails, initFolders]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const callAction = (action: string, emailId: string, extra?: object) =>
    fetch('/api/email/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, emailId, ...extra }) });

  const markAsRead = useCallback((email: Email) => {
    if (email.is_read) return;
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
    setFolders(prev => prev.map(f => f.path === email.folder && f.unseen_messages > 0 ? { ...f, unseen_messages: f.unseen_messages - 1 } : f));
    callAction('mark_read', email.id);
  }, []);

  const markAsUnread = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: false } : e));
    callAction('mark_unread', emailId);
  }, []);

  const toggleFlag = useCallback((email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    const v = !email.is_flagged;
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, is_flagged: v } : em));
    if (selected?.id === email.id) setSelected(s => s ? { ...s, is_flagged: v } : s);
    callAction(v ? 'flag' : 'unflag', email.id);
  }, [selected]);

  const moveToTrash = useCallback((emailId: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selected?.id === emailId) setSelected(null);
    callAction('move_trash', emailId);
  }, [selected]);

  const moveEmailToFolder = useCallback((emailId: string, targetFolder: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selected?.id === emailId) setSelected(null);
    callAction('move_folder', emailId, { targetFolder });
    setShowMoveMenu(null);
  }, [selected]);

  // ─── Bulk actions ─────────────────────────────────────────────────────────
  const handleBulkAction = async (action: string, targetFolder?: string) => {
    const ids = Array.from(selectedIds);
    if (action === 'mark_read') {
      setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, is_read: true } : e));
    } else if (action === 'mark_unread') {
      setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, is_read: false } : e));
    } else {
      setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
      if (selected && selectedIds.has(selected.id)) setSelected(null);
    }
    await Promise.all(ids.map(id => callAction(action, id, targetFolder ? { targetFolder } : {})));
    setSelectedIds(new Set());
    setShowBulkMenu(false);
    setShowMoveMenu(null);
  };

  // ─── Drag & drop ─────────────────────────────────────────────────────────
  const handleEmailDragStart = (e: React.DragEvent, emailId: string) => {
    e.dataTransfer.setData('emailId', emailId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleFolderDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderPath);
  };
  const handleFolderDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    const emailId = e.dataTransfer.getData('emailId');
    if (emailId) moveEmailToFolder(emailId, folderPath);
    setDragOverFolder(null);
  };

  // ─── Touch swipe ─────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent, emailId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchSwipingId.current = emailId;
  };
  const handleTouchMove = (e: React.TouchEvent, emailId: string) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    setSwipeOffset(p => ({ ...p, [emailId]: dx }));
    setSwipeAction(p => ({ ...p, [emailId]: dx < -80 ? 'delete' : dx > 80 ? 'unread' : null }));
  };
  const handleTouchEnd = async (emailId: string) => {
    const offset = swipeOffset[emailId] ?? 0;
    touchSwipingId.current = null;
    if (offset < -80) moveToTrash(emailId);
    else if (offset > 80) markAsUnread(emailId);
    setSwipeOffset(p => ({ ...p, [emailId]: 0 }));
    setSwipeAction(p => ({ ...p, [emailId]: null }));
  };

  // ─── Mouse swipe ─────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent, emailId: string) => {
    if (e.button !== 0) return;
    mouseStartX.current = e.clientX;
    isDraggingEmailRef.current = emailId;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingEmailRef.current) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 10) {
      setSwipeOffset(p => ({ ...p, [isDraggingEmailRef.current!]: dx }));
      setSwipeAction(p => ({ ...p, [isDraggingEmailRef.current!]: dx < -80 ? 'delete' : dx > 80 ? 'unread' : null }));
    }
  };
  const handleMouseUp = () => {
    if (!isDraggingEmailRef.current) return;
    const emailId = isDraggingEmailRef.current;
    const offset = swipeOffset[emailId] ?? 0;
    isDraggingEmailRef.current = null;
    if (offset < -80) moveToTrash(emailId);
    else if (offset > 80) markAsUnread(emailId);
    setSwipeOffset(p => ({ ...p, [emailId]: 0 }));
    setSwipeAction(p => ({ ...p, [emailId]: null }));
  };

  // ─── Expose reply opener for popup windows ────────────────────────────────
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__openReply = (to: string, subject: string) => {
      openCompose(to);
      (window as unknown as Record<string, unknown>).__replySubject = subject;
    };
    return () => { delete (window as unknown as Record<string, unknown>).__openReply; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Double-click new window ──────────────────────────────────────────────
  const openEmailInNewWindow = (email: Email) => {
    const sanitized = isHtml(email.body) ? sanitizeHtml(email.body) : `<pre style="white-space:pre-wrap;word-break:break-word;font-family:Arial,sans-serif">${email.body.replace(/</g,'&lt;')}</pre>`;
    const replyTo = email.direction === 'sent' ? email.to_email : email.from_email;
    const replySubject = email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`;
    const newWin = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no');
    if (!newWin) return;
    newWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${email.subject || '(bez předmětu)'}</title><style>
      *{box-sizing:border-box}body{background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;margin:0;padding:0}
      .toolbar{background:#111;border-bottom:1px solid #222;padding:8px 24px;display:flex;align-items:center;gap:8px}
      .toolbar-right{margin-left:auto}
      .btn{background:#222;border:1px solid #333;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px}
      .btn:hover{background:#333}.btn-primary{background:#00BFFF;color:#000;border-color:#00BFFF}
      .btn-reply{background:rgba(0,191,255,0.12);border:1px solid rgba(0,191,255,0.35);color:#00BFFF}
      .btn-reply:hover{background:rgba(0,191,255,0.22)}
      .header{background:#111;border-bottom:1px solid #222;padding:20px 24px}
      .subject{font-size:20px;font-weight:600;margin-bottom:12px}
      .meta{display:grid;grid-template-columns:80px 1fr;gap:6px;font-size:13px}
      .ml{color:#666}.mv{color:#aaa}
      .body{padding:24px;font-size:14px;line-height:1.6;color:#ccc}
      a{color:#00BFFF}
    </style></head><body>
    <div class="toolbar">
      <button class="btn btn-primary" onclick="window.close()">✕ Zavřít</button>
      <button class="btn" onclick="window.print()">🖨 Tisknout</button>
      <div class="toolbar-right">
        <button class="btn btn-reply" onclick="if(window.opener&&window.opener.__openReply){window.opener.__openReply('${replyTo.replace(/'/g,"\\'")}','${replySubject.replace(/'/g,"\\'")}');window.close();}">↩ Odpovědět</button>
      </div>
    </div>
    <div class="header">
      <div class="subject">${email.subject || '(bez předmětu)'}</div>
      <div class="meta">
        <span class="ml">Od:</span><span class="mv">${email.from_email}</span>
        <span class="ml">Komu:</span><span class="mv">${email.to_email}</span>
        <span class="ml">Datum:</span><span class="mv">${new Date(email.sent_at).toLocaleString('cs-CZ')}</span>
        <span class="ml">Složka:</span><span class="mv">${email.folder || 'INBOX'}</span>
      </div>
    </div>
    <div class="body">${sanitized}</div>
    </body></html>`);
    newWin.document.close();
  };

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filtered = emails.filter(e => {
    if (search && ![e.subject, e.to_email, e.from_email].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filter === 'unread') return !e.is_read;
    if (filter === 'starred') return e.is_flagged;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;
  const starredCount = emails.filter(e => e.is_flagged).length;

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(e => e.id)));
  };
  const handleSelectOne = (emailId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const s = new Set(selectedIds);
    s.has(emailId) ? s.delete(emailId) : s.add(emailId);
    setSelectedIds(s);
  };

  const openCompose = (to = '', toName = '') => { setComposerTo(to); setComposerToName(toName); setShowComposer(true); };
  const onSync = async () => { await triggerSync(); await loadEmails(activeFolder); };
  const onSent = async () => { await loadEmails(activeFolder); };

  // ─── Early returns ────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>;

  if (!isVerified) return (
    <div className="p-6 lg:p-8 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <h1 className="text-xl font-black text-white mb-2">Email není nastaven</h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.45)' }}>Propoj svou emailovou schránku a piš emaily přímo z CRM.</p>
      <Link href="/dashboard/settings/email" className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold"
        style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>Nastavit email →</Link>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black text-white">Email</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,191,255,0.12)', color: '#00BFFF' }}>{emails.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <select onChange={e => { const c = contacts.find(c => c.id === e.target.value); if (c?.email) openCompose(c.email, `${c.jmeno} ${c.prijmeni ?? ''}`.trim()); e.target.value = ''; }}
            defaultValue="" className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', outline: 'none', cursor: 'pointer' }}>
            <option value="" disabled>Napsat zákazníkovi…</option>
            {contacts.map(c => <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>{c.jmeno} {c.prijmeni ?? ''} — {c.email}</option>)}
          </select>
          <div className="flex flex-col items-end gap-0.5">
            <button onClick={onSync} disabled={syncing || folderSyncing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.65)' }}>
              <svg className={(syncing || folderSyncing) ? 'animate-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {(syncing || folderSyncing) ? 'Synchronizuji…' : 'Aktualizovat'}
            </button>
            {lastSync && <span className="text-xs" style={{ color: 'rgba(237,237,237,0.25)' }}>{fmtLS(lastSync)}</span>}
          </div>
          <button onClick={() => openCompose()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Napsat email
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Col 1: Folders ── */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 200, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-xs font-bold" style={{ color: 'rgba(237,237,237,0.4)' }}>Složky</span>
            <button onClick={refreshFolders} disabled={loadingFolders} style={{ color: 'rgba(237,237,237,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.3)')}>
              <svg className={loadingFolders ? 'animate-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {/* Starred virtual folder */}
            {(() => { const a = activeFolder === VIRTUAL_STARRED; return (
              <button onClick={() => switchFolder(VIRTUAL_STARRED)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                style={{ background: a ? 'rgba(251,191,36,0.08)' : 'transparent', borderLeft: a ? '2px solid #fbbf24' : '2px solid transparent', color: a ? '#fbbf24' : 'rgba(237,237,237,0.55)' }}>
                <span style={{ flexShrink: 0, color: a ? '#fbbf24' : 'rgba(251,191,36,0.5)' }}><FolderIcon type="starred" size={14} /></span>
                <span className="text-xs font-semibold truncate flex-1">Označené</span>
                {starredCount > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 10 }}>{starredCount}</span>}
              </button>
            ); })()}

            {/* Real folders (drag-droppable) */}
            {loadingFolders && folders.length === 0
              ? <p className="px-3 py-3 text-xs" style={{ color: 'rgba(237,237,237,0.3)' }}>Načítám…</p>
              : folders.map(f => {
                const a = activeFolder === f.path;
                const isDragOver = dragOverFolder === f.path;
                return (
                  <button key={f.id} onClick={() => switchFolder(f.path)}
                    onDragOver={e => handleFolderDragOver(e, f.path)}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={e => handleFolderDrop(e, f.path)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                    style={{
                      background: isDragOver ? 'rgba(0,191,255,0.15)' : a ? 'rgba(0,191,255,0.08)' : 'transparent',
                      borderLeft: a || isDragOver ? '2px solid #00BFFF' : '2px solid transparent',
                      color: a ? '#00BFFF' : isDragOver ? '#00BFFF' : 'rgba(237,237,237,0.55)',
                      outline: isDragOver ? '1px dashed rgba(0,191,255,0.4)' : 'none',
                    }}>
                    <span style={{ flexShrink: 0, opacity: a || isDragOver ? 1 : 0.5 }}><FolderIcon type={f.type} size={14} /></span>
                    <span className="text-xs font-semibold truncate flex-1">{f.name}</span>
                    {f.unseen_messages > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 10 }}>{f.unseen_messages}</span>}
                  </button>
                );
              })
            }
          </div>
        </div>

        {/* ── Col 2: Email list ── */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 340, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Search */}
          <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.3)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Hledat…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#ededed', outline: 'none' }} />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
            {/* Left: checkbox + bulk */}
            <div className="flex items-center gap-2">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded accent-cyan-400 cursor-pointer" />
              </label>
              {someSelected && (
                <div style={{ position: 'relative' }} ref={bulkMenuRef}>
                  <button onClick={() => setShowBulkMenu(b => !b)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.2)' }}>
                    Vybráno: {selectedIds.size}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showBulkMenu && (
                    <div className="absolute left-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                      style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 200 }}>
                      {[
                        { label: 'Označit jako přečtené', action: 'mark_read' },
                        { label: 'Označit jako nepřečtené', action: 'mark_unread' },
                        { label: 'Smazat', action: 'move_trash', red: true },
                      ].map(item => (
                        <button key={item.action} onClick={() => handleBulkAction(item.action)}
                          className="w-full text-left px-4 py-2.5 text-sm"
                          style={{ color: item.red ? '#f87171' : 'rgba(237,237,237,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {item.label}
                        </button>
                      ))}
                      {/* Move to submenu */}
                      <button className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between"
                        style={{ color: 'rgba(237,237,237,0.8)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={e => setShowMoveMenu({ emailId: 'bulk', x: e.clientX, y: e.clientY })}>
                        Přesunout do…
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 6 15 12 9 18"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: filter */}
            <div className="flex items-center gap-0.5">
              {([['all','Vše'], ['unread','Nepřečtené'], ['starred','★']] as [Filter, string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: filter === f ? 'rgba(0,191,255,0.12)' : 'transparent',
                    color: filter === f ? '#00BFFF' : 'rgba(237,237,237,0.4)',
                    border: filter === f ? '1px solid rgba(0,191,255,0.25)' : '1px solid transparent',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-4 py-12 text-center"><p className="text-sm" style={{ color: 'rgba(237,237,237,0.3)' }}>{search ? 'Žádné výsledky' : folderSyncing ? 'Načítám…' : 'Žádné emaily'}</p></div>
              : filtered.map(e => {
                const isActive = selected?.id === e.id;
                const contact = e.contacts ? `${e.contacts.jmeno} ${e.contacts.prijmeni ?? ''}`.trim() : null;
                const displayName = e.direction === 'sent' ? e.to_email : (contact || e.from_email);
                const offset = swipeOffset[e.id] ?? 0;
                const action = swipeAction[e.id];
                const isSnapping = touchSwipingId.current !== e.id && isDraggingEmailRef.current !== e.id && offset === 0;
                const isHovered = hoveredId === e.id;
                const isChecked = selectedIds.has(e.id);

                return (
                  <div key={e.id} style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Swipe backgrounds */}
                    {offset < -10 && (
                      <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4"
                        style={{ background: action === 'delete' ? '#ef4444' : 'rgba(239,68,68,0.3)', width: Math.min(Math.abs(offset), 160) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </div>
                    )}
                    {offset > 10 && (
                      <div className="absolute inset-y-0 left-0 flex items-center justify-start px-4"
                        style={{ background: action === 'unread' ? '#3b82f6' : 'rgba(59,130,246,0.3)', width: Math.min(offset, 160) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </div>
                    )}

                    {/* Row */}
                    <div
                      draggable
                      onDragStart={ev => handleEmailDragStart(ev, e.id)}
                      onClick={() => { setSelected(e); markAsRead(e); }}
                      onDoubleClick={() => openEmailInNewWindow(e)}
                      onMouseEnter={() => setHoveredId(e.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onMouseDown={ev => handleMouseDown(ev, e.id)}
                      onTouchStart={ev => handleTouchStart(ev, e.id)}
                      onTouchMove={ev => handleTouchMove(ev, e.id)}
                      onTouchEnd={() => handleTouchEnd(e.id)}
                      title="Dvojklik pro otevření v novém okně"
                      style={{
                        transform: `translateX(${offset}px)`,
                        transition: isSnapping ? 'transform 0.2s ease' : 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isChecked ? 'rgba(0,191,255,0.05)' : isActive ? 'rgba(0,191,255,0.07)' : 'transparent',
                        borderLeft: isActive ? '2px solid #00BFFF' : isChecked ? '2px solid rgba(0,191,255,0.3)' : '2px solid transparent',
                        cursor: 'pointer',
                        padding: '10px 12px 10px 10px',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        userSelect: 'none',
                      }}>

                      {/* Checkbox */}
                      <div style={{ paddingTop: 2, flexShrink: 0, opacity: isChecked || isHovered || someSelected ? 1 : 0, transition: 'opacity 0.15s' }}
                        onClick={ev => ev.stopPropagation()}>
                        <input type="checkbox" checked={isChecked} onChange={ev => handleSelectOne(e.id, ev)}
                          className="w-3.5 h-3.5 rounded accent-cyan-400 cursor-pointer" />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!e.is_read && e.direction === 'received' && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00BFFF' }} />}
                            <p className="text-xs font-bold truncate text-white">{displayName}</p>
                          </div>

                          {/* Hover actions OR date */}
                          {isHovered ? (
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={ev => ev.stopPropagation()}>
                              {/* Trash */}
                              <button onClick={() => moveToTrash(e.id)} title="Smazat"
                                className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
                                style={{ color: 'rgba(239,68,68,0.6)' }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                                </svg>
                              </button>
                              {/* Star */}
                              <button onClick={ev => toggleFlag(e, ev)} title={e.is_flagged ? 'Odznačit' : 'Označit'}
                                className="w-6 h-6 flex items-center justify-center rounded-md"
                                style={{ color: e.is_flagged ? '#fbbf24' : 'rgba(237,237,237,0.35)' }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(251,191,36,0.1)')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill={e.is_flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              </button>
                              {/* Read toggle */}
                              <button onClick={() => e.is_read ? markAsUnread(e.id) : markAsRead(e)} title={e.is_read ? 'Označit jako nepřečtené' : 'Označit jako přečtené'}
                                className="w-6 h-6 flex items-center justify-center rounded-md"
                                style={{ color: 'rgba(237,237,237,0.35)' }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill={e.is_read ? 'none' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  {e.is_read
                                    ? <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
                                    : <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/><line x1="4" y1="20" x2="20" y2="4"/></>}
                                </svg>
                              </button>
                              {/* Move to folder */}
                              <button title="Přesunout do složky"
                                className="w-6 h-6 flex items-center justify-center rounded-md"
                                style={{ color: 'rgba(237,237,237,0.35)' }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                                onClick={ev => { ev.stopPropagation(); setShowMoveMenu({ emailId: e.id, x: ev.clientX, y: ev.clientY }); }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                  <polyline points="12 11 12 17"/><polyline points="9 14 12 17 15 14"/>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {e.is_flagged && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              )}
                              <span className="text-xs" style={{ color: 'rgba(237,237,237,0.3)' }}>{fmtDate(e.sent_at)}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm font-semibold truncate" style={{ color: isActive ? '#ededed' : 'rgba(237,237,237,0.7)' }}>{e.subject}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(237,237,237,0.35)' }}>
                          {e.body.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* ── Col 3: Detail ── */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(237,237,237,0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.3)' }}>Vyber email ze seznamu</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.2)' }}>Dvojklik pro otevření v novém okně</p>
            </div>
          ) : (
            <div className="p-6 max-w-2xl">
              {/* Action row */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={ev => toggleFlag(selected, ev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: selected.is_flagged ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selected.is_flagged ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`, color: selected.is_flagged ? '#fbbf24' : 'rgba(237,237,237,0.5)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={selected.is_flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {selected.is_flagged ? 'Označeno' : 'Označit'}
                </button>
                <button onClick={() => markAsUnread(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Nepřečtené
                </button>
                <button onClick={ev => { ev.stopPropagation(); setShowMoveMenu({ emailId: selected.id, x: ev.clientX, y: ev.clientY }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Přesunout
                </button>
                <button onClick={() => openEmailInNewWindow(selected)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Nové okno
                </button>
                <button onClick={() => moveToTrash(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.6)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                  Smazat
                </button>
              </div>

              <h2 className="text-xl font-black text-white mb-4">{selected.subject}</h2>
              <div className="flex flex-col gap-1.5 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[['Od', selected.from_email], ['Komu', selected.to_email],
                  ['Odesláno', new Date(selected.sent_at).toLocaleString('cs-CZ', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })],
                  ...(selected.folder ? [['Složka', selected.folder]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-xs w-16 flex-shrink-0 font-semibold" style={{ color: 'rgba(237,237,237,0.35)' }}>{k}:</span>
                    <span className="text-sm" style={{ color: 'rgba(237,237,237,0.7)' }}>{v}</span>
                  </div>
                ))}
              </div>

              {isHtml(selected.body)
                ? <div className="text-sm leading-relaxed email-body" style={{ color: 'rgba(237,237,237,0.8)', maxWidth: '100%', overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.body) }} />
                : <pre className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.8)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'Arial, sans-serif' }}>{selected.body}</pre>
              }

              <div className="mt-8">
                <button onClick={() => openCompose(selected.direction === 'sent' ? selected.to_email : selected.from_email, selected.contacts ? `${selected.contacts.jmeno} ${selected.contacts.prijmeni ?? ''}`.trim() : '')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(0,191,255,0.08)', border: '1px solid rgba(0,191,255,0.2)', color: '#00BFFF' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                  </svg>
                  Odpovědět
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Move to folder floating menu ── */}
      {showMoveMenu && (
        <div ref={moveMenuRef} className="fixed z-50 rounded-xl overflow-hidden"
          style={{ top: Math.min(showMoveMenu.y, window.innerHeight - 300), left: Math.min(showMoveMenu.x, window.innerWidth - 220), background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 200 }}>
          <p className="px-4 py-2 text-xs font-bold" style={{ color: 'rgba(237,237,237,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Přesunout do složky</p>
          {folders.map(f => (
            <button key={f.id}
              onClick={() => {
                if (showMoveMenu.emailId === 'bulk') handleBulkAction('move_folder', f.path);
                else moveEmailToFolder(showMoveMenu.emailId, f.path);
              }}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5"
              style={{ color: 'rgba(237,237,237,0.75)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ color: 'rgba(237,237,237,0.35)' }}><FolderIcon type={f.type} size={13} /></span>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {showComposer && (
        <EmailComposer to={composerTo} toName={composerToName} onClose={() => setShowComposer(false)} onSent={onSent} />
      )}
    </div>
  );
}
