'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  to: string;
  toName?: string;
  contactId?: string;
  leadId?: string;
  onClose: () => void;
  onSent?: () => void;
};

type Suggestion = { id: string; jmeno: string; prijmeni: string | null; email: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma'];
const SIZES = [
  { label: '8',  val: '1' }, { label: '10', val: '2' }, { label: '12', val: '3' },
  { label: '14', val: '4' }, { label: '16', val: '5' }, { label: '18', val: '5' },
  { label: '24', val: '6' }, { label: '36', val: '7' },
];
const COLORS = [
  '#000000','#434343','#666666','#999999','#cccccc','#ffffff',
  '#ff0000','#ff7900','#ffd966','#38a169','#00b0f0','#4a86e8',
  '#0000ff','#9900ff','#ff00ff','#ff6699','#cc0000','#e06666',
];

const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"]+)/g;

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmailComposer({ to, toName, contactId, leadId, onClose, onSent }: Props) {
  const supabase = createClient();
  const [toEmail, setToEmail]     = useState(to);
  const [bcc, setBcc]             = useState('');
  const [showBcc, setShowBcc]     = useState(false);
  const [subject, setSubject]     = useState('');
  const [signature, setSignature] = useState('');
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');
  const [hasSettings, setHasSettings] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('14');
  const [attachments, setAttachments] = useState<File[]>([]);

  const editorRef    = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const composerRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('email_settings').select('signature, is_verified').eq('user_id', user.id).single();
      if (data?.is_verified) { setHasSettings(true); setSignature(data.signature || ''); }
      else setHasSettings(false);
    })();
  }, [supabase]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (composerRef.current && composerRef.current.contains(e.target as Node)) return;
      setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToChange = async (val: string) => {
    setToEmail(val); setEmailTouched(true);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const q = val.toLowerCase();
    const { data } = await supabase.from('contacts').select('id, jmeno, prijmeni, email')
      .not('email', 'is', null).or(`jmeno.ilike.%${q}%,prijmeni.ilike.%${q}%,email.ilike.%${q}%`).limit(6);
    if (data && data.length > 0) { setSuggestions(data as Suggestion[]); setShowSuggestions(true); }
    else { setSuggestions([]); setShowSuggestions(false); }
  };

  const pickSuggestion = (s: Suggestion) => { setToEmail(s.email); setSuggestions([]); setShowSuggestions(false); };

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val ?? undefined);
  }, []);

  const insertList = (tag: 'ul' | 'ol', type: string) => {
    editorRef.current?.focus();
    document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node.nodeName !== tag.toUpperCase() && node !== editorRef.current) node = node.parentNode;
      if (node && node.nodeName === tag.toUpperCase()) (node as HTMLElement).style.listStyleType = type;
    }
    setOpenDropdown(null);
  };

  // ── Auto-link on space / enter ─────────────────────────────────────────────
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const sel = window.getSelection();
    if (!sel?.rangeCount || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return;
    const textNode = range.startContainer as Text;
    const beforeCursor = (textNode.textContent || '').substring(0, range.startOffset);
    const match = beforeCursor.match(/((?:https?:\/\/|www\.)[^\s]+)$/);
    if (!match) return;
    const url = match[1];
    const href = url.startsWith('http') ? url : `https://${url}`;
    const startIdx = range.startOffset - url.length;
    const urlRange = document.createRange();
    urlRange.setStart(textNode, startIdx);
    urlRange.setEnd(textNode, range.startOffset);
    sel.removeAllRanges();
    sel.addRange(urlRange);
    document.execCommand('createLink', false, href);
    // Style the link
    const link = editorRef.current.querySelector(`a[href="${href}"]`) as HTMLAnchorElement | null;
    if (link) { link.style.color = '#1a73e8'; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    // Collapse to end
    sel.collapseToEnd();
  };

  // ── Paste: linkify plain-text URLs ─────────────────────────────────────────
  const handlePaste = (e: React.ClipboardEvent) => {
    const plain = e.clipboardData.getData('text/plain');
    const html  = e.clipboardData.getData('text/html');
    // If pure URL, create link
    if (!html && /^(?:https?:\/\/|www\.)[^\s]+$/.test(plain.trim())) {
      e.preventDefault();
      const href = plain.trim().startsWith('http') ? plain.trim() : `https://${plain.trim()}`;
      document.execCommand('createLink', false, href);
      const link = editorRef.current?.querySelector(`a[href="${href}"]`) as HTMLAnchorElement | null;
      if (link) { link.style.color = '#1a73e8'; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      return;
    }
    // If plain text with URLs, linkify
    if (!html && URL_RE.test(plain)) {
      e.preventDefault();
      const linked = plain
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')
        .replace(URL_RE, u => {
          const href = u.startsWith('http') ? u : `https://${u}`;
          return `<a href="${href}" style="color:#1a73e8" target="_blank" rel="noopener noreferrer">${u}</a>`;
        });
      document.execCommand('insertHTML', false, linked);
    }
  };

  const emailInvalid = emailTouched && toEmail.length > 0 && !isValidEmail(toEmail);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = editorRef.current?.innerHTML || '';
    if (!isValidEmail(toEmail) || !subject.trim()) return;
    setSending(true); setError('');
    try {
      let res: Response;
      if (attachments.length > 0) {
        const fd = new FormData();
        fd.append('to', toEmail);
        fd.append('subject', subject);
        fd.append('body', body);
        if (bcc) fd.append('bcc', bcc);
        if (contactId) fd.append('contactId', contactId);
        if (leadId) fd.append('leadId', leadId);
        attachments.forEach(f => fd.append('attachments', f));
        res = await fetch('/api/email/send', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toEmail, subject, body, bcc: bcc || undefined, contactId, leadId }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Chyba při odesílání');
      onSent?.(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chyba při odesílání');
    } finally { setSending(false); }
  };

  const removeAttachment = (idx: number) =>
    setAttachments(prev => prev.filter((_, i) => i !== idx));

  // ── Toolbar helpers ────────────────────────────────────────────────────────
  const TB = ({ title, children, onClick }: { title: string; children: React.ReactNode; onClick: () => void }) => (
    <button type="button" title={title} onClick={onClick}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:26, height:26, background:'transparent', border:'none', borderRadius:4, cursor:'pointer', color:'rgba(40,40,40,0.8)', fontSize:13, fontWeight:600, flexShrink:0 }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {children}
    </button>
  );

  const DD = ({ id, trigger, children }: { id: string; trigger: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ position:'relative', flexShrink:0 }}>
      <button type="button" onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
        style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 5px', border:'1px solid #ddd', borderRadius:4, background:'#fff', cursor:'pointer', height:26, color:'#333', fontSize:12, fontWeight:500 }}>
        {trigger}
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {openDropdown === id && (
        <div style={{ position:'absolute', bottom:'calc(100% + 4px)', left:0, background:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,0.18)', borderRadius:8, zIndex:100, overflow:'hidden', minWidth:100 }}>
          {children}
        </div>
      )}
    </div>
  );

  const menuItem = (label: React.ReactNode, onClick: () => void) => (
    <button type="button" onClick={onClick}
      style={{ display:'block', width:'100%', padding:'7px 12px', fontSize:12, border:'none', cursor:'pointer', background:'none', color:'#333', textAlign:'left', whiteSpace:'nowrap' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
      {label}
    </button>
  );

  const sep = <div style={{ width:1, height:18, background:'#e0e0e0', margin:'0 2px', flexShrink:0 }} />;

  const W = maximized ? 'min(92vw, 860px)' : '580px';
  const H = minimized ? 'auto' : maximized ? 'min(92vh, 740px)' : '560px';

  const fieldRow = { display:'flex', alignItems:'center', padding:'7px 16px', gap:10, borderBottom:'1px solid #e8e8e8', flexShrink:0 } as const;
  const label    = { color:'#888', fontSize:13, width:72, flexShrink:0 } as const;
  const fieldInput = { flex:1, border:'none', outline:'none', fontSize:14, color:'#333', background:'transparent' } as const;

  return (
    <>
      <style>{`
        .email-editor:empty:before { content: attr(data-placeholder); color: #aaa; pointer-events: none; display: block; }
        .email-editor ul { list-style-position: inside; padding-left: 1.5em; }
        .email-editor ol { list-style-position: inside; padding-left: 1.5em; }
        .email-editor blockquote { border-left: 3px solid #ccc; margin: 4px 0; padding-left: 12px; color: #666; }
        .email-editor a { color: #1a73e8; text-decoration: underline; }
      `}</style>

      <div ref={composerRef} style={{
        position:'fixed', bottom:0, right:24, width:W, height:H,
        background:'#fff', borderRadius:'8px 8px 0 0',
        boxShadow:'0 8px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.12)',
        display:'flex', flexDirection:'column', zIndex:9999, overflow:'hidden',
        transition:'width 0.18s ease, height 0.18s ease',
      }}>

        {/* Title bar */}
        <div style={{ background:'#404040', padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'8px 8px 0 0', flexShrink:0, userSelect:'none' }}>
          <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>
            {toName ? `Odpovědět — ${toName}` : 'Nová zpráva'}
          </span>
          <div style={{ display:'flex', gap:2 }}>
            {[
              { title:'Minimalizovat', icon:'−', action: () => setMinimized(m => !m) },
              { title: maximized ? 'Zmenšit' : 'Maximalizovat', icon: maximized ? '⊡' : '⤢', action: () => { setMaximized(m => !m); setMinimized(false); } },
              { title:'Zavřít', icon:'✕', action: onClose },
            ].map(btn => (
              <button key={btn.title} type="button" title={btn.title} onClick={btn.action}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.85)', cursor:'pointer', padding:'2px 8px', borderRadius:4, fontSize:15, lineHeight:1 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {!minimized && (
          <>
            {hasSettings === false ? (
              <div style={{ padding:24, textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontWeight:700, marginBottom:8, color:'#333' }}>Email není nastaven</p>
                <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Nejdřív propoj schránku v nastavení.</p>
                <a href="/dashboard/settings/email" style={{ background:'#1a73e8', color:'#fff', padding:'8px 18px', borderRadius:20, fontSize:13, fontWeight:600, textDecoration:'none' }}>Nastavit email →</a>
              </div>
            ) : (
              <form onSubmit={handleSend} style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

                {/* To */}
                <div ref={suggestionsRef} style={{ position:'relative', ...fieldRow }}>
                  <span style={label}>Komu</span>
                  <input type="email" value={toEmail} onChange={e => handleToChange(e.target.value)}
                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                    placeholder="email@firma.cz" autoComplete="off"
                    style={{ ...fieldInput, borderBottom: emailInvalid ? '1px solid #ef4444' : 'none' }} />
                  {/* BCC toggle */}
                  <button type="button" onClick={() => setShowBcc(b => !b)} title="Přidat skrytou kopii"
                    style={{ fontSize:12, color: showBcc ? '#1a73e8' : '#999', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', borderRadius:4, fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1a73e8')}
                    onMouseLeave={e => (e.currentTarget.style.color = showBcc ? '#1a73e8' : '#999')}>
                    Skrytá kopie
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ position:'absolute', left:0, right:0, top:'100%', background:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', borderRadius:8, zIndex:50, overflow:'hidden' }}>
                      {suggestions.map(s => (
                        <button key={s.id} type="button" onClick={() => pickSuggestion(s)}
                          style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'8px 16px', fontSize:13, borderBottom:'1px solid #f5f5f5', cursor:'pointer', background:'none', border:'none', textAlign:'left' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          <span style={{ fontWeight:600, color:'#333' }}>{s.jmeno} {s.prijmeni ?? ''}</span>
                          <span style={{ color:'#999', fontSize:12 }}>{s.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* BCC */}
                {showBcc && (
                  <div style={fieldRow}>
                    <span style={label}>Skrytá kopie</span>
                    <input type="email" value={bcc} onChange={e => setBcc(e.target.value)}
                      placeholder="bcc@firma.cz" autoComplete="off" style={fieldInput} />
                  </div>
                )}

                {/* Subject */}
                <div style={fieldRow}>
                  <span style={label}>Předmět</span>
                  <input type="text" placeholder="Předmět zprávy" value={subject}
                    onChange={e => setSubject(e.target.value)} style={fieldInput} />
                </div>

                {/* Editor */}
                <div style={{ flex:1, overflow:'auto', position:'relative' }}>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="email-editor"
                    data-placeholder="Napište zprávu…"
                    onKeyDown={handleEditorKeyDown}
                    onPaste={handlePaste}
                    style={{ minHeight:'100%', padding:'14px 16px', fontSize:14, lineHeight:1.65, color:'#333', outline:'none', fontFamily:'Arial, sans-serif' }}
                  />
                  {signature && (
                    <div style={{ padding:'8px 16px 14px', borderTop:'1px solid #ececec', color:'#666', fontSize:13 }}
                      dangerouslySetInnerHTML={{ __html: signature }} />
                  )}
                </div>

                {/* Attachments preview */}
                {attachments.length > 0 && (
                  <div style={{ padding:'6px 12px', borderTop:'1px solid #e8e8e8', display:'flex', flexWrap:'wrap', gap:6, background:'#fafafa', flexShrink:0 }}>
                    {attachments.map((f, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'#fff', border:'1px solid #e0e0e0', borderRadius:20, fontSize:12, color:'#333' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                        <span style={{ color:'#aaa', flexShrink:0 }}>{fmt(f.size)}</span>
                        <button type="button" onClick={() => removeAttachment(i)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', padding:0, lineHeight:1, fontSize:14 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formatting toolbar */}
                <div style={{ borderTop:'1px solid #e8e8e8', padding:'5px 8px', background:'#f6f6f6', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:2, flexWrap:'wrap', rowGap:2 }}>
                    <TB title="Zpět (Ctrl+Z)" onClick={() => exec('undo')}>↩</TB>
                    <TB title="Vpřed (Ctrl+Y)" onClick={() => exec('redo')}>↪</TB>
                    {sep}

                    <DD id="font" trigger={<span style={{ fontSize:11 }}>{selectedFont}</span>}>
                      {FONTS.map(f => menuItem(
                        <span style={{ fontFamily:f }}>{f}</span>,
                        () => { exec('fontName', f); setSelectedFont(f); setOpenDropdown(null); }
                      ))}
                    </DD>

                    <DD id="size" trigger={<span style={{ fontSize:11 }}>{selectedSize}</span>}>
                      {SIZES.map(s => menuItem(s.label, () => { exec('fontSize', s.val); setSelectedSize(s.label); setOpenDropdown(null); }))}
                    </DD>
                    {sep}

                    <TB title="Tučně (Ctrl+B)" onClick={() => exec('bold')}><b>B</b></TB>
                    <TB title="Kurzíva (Ctrl+I)" onClick={() => exec('italic')}><i style={{ fontFamily:'Georgia' }}>I</i></TB>
                    <TB title="Podtržení (Ctrl+U)" onClick={() => exec('underline')}><u>U</u></TB>
                    <TB title="Přeškrtnutí" onClick={() => exec('strikeThrough')}><s>S</s></TB>

                    <DD id="color" trigger={<span style={{ fontWeight:700, fontSize:13, borderBottom:'3px solid #f00', paddingBottom:1 }}>A</span>}>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 22px)', gap:4, padding:8 }}>
                        {COLORS.map(c => (
                          <button key={c} type="button" onClick={() => { exec('foreColor', c); setOpenDropdown(null); }}
                            title={c} style={{ width:22, height:22, background:c, border:'1px solid rgba(0,0,0,0.15)', borderRadius:3, cursor:'pointer', padding:0 }} />
                        ))}
                      </div>
                    </DD>
                    {sep}

                    <DD id="align" trigger={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                    }>
                      {[['Vlevo','justifyLeft'],['Na střed','justifyCenter'],['Vpravo','justifyRight'],['Do bloku','justifyFull']]
                        .map(([label, cmd]) => menuItem(label, () => { exec(cmd); setOpenDropdown(null); }))}
                    </DD>
                    {sep}

                    <DD id="ol" trigger={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                        <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
                        <text x="2" y="8" fontSize="7" fill="#555" stroke="none">1</text>
                        <text x="2" y="14" fontSize="7" fill="#555" stroke="none">2</text>
                        <text x="2" y="20" fontSize="7" fill="#555" stroke="none">3</text>
                      </svg>
                    }>
                      {[['1. 2. 3. — čísla','decimal'],['a. b. c. — malá písm.','lower-alpha'],['A. B. C. — velká písm.','upper-alpha'],['i. ii. iii. — řím. malá','lower-roman'],['I. II. III. — řím. velká','upper-roman']]
                        .map(([label, type]) => menuItem(label, () => insertList('ol', type)))}
                    </DD>

                    <DD id="ul" trigger={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                        <circle cx="4" cy="6" r="1.5" fill="#555" stroke="none"/>
                        <circle cx="4" cy="12" r="1.5" fill="#555" stroke="none"/>
                        <circle cx="4" cy="18" r="1.5" fill="#555" stroke="none"/>
                        <line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>
                      </svg>
                    }>
                      {[['● Kolečko (plné)','disc'],['○ Kolečko (prázdné)','circle'],['■ Čtverec','square']]
                        .map(([label, type]) => menuItem(label, () => insertList('ul', type)))}
                    </DD>

                    <TB title="Odsadit doprava" onClick={() => exec('indent')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="3 10 7 14 3 18"/></svg>
                    </TB>
                    <TB title="Odsadit doleva" onClick={() => exec('outdent')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7 10 3 14 7 18"/></svg>
                    </TB>
                    {sep}

                    <TB title="Citace" onClick={() => exec('formatBlock', 'blockquote')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(40,40,40,0.8)" stroke="none"><path d="M14 17v-7.4C14 4.3 17.7.4 23 0l1 2.2C21.6 3 20 5.8 20 8h4v9h-10zm-14 0V9.6C0 4.3 3.7.4 9 0l1 2.2C8 3 6.4 5.8 6.4 8H10v9H0z"/></svg>
                    </TB>
                    <TB title="Odebrat formátování" onClick={() => exec('removeFormat')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </TB>
                  </div>
                </div>

                {/* Send bar */}
                <div style={{ padding:'8px 14px', background:'#f6f6f6', borderTop:'1px solid #e8e8e8', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <button type="submit" disabled={sending || !isValidEmail(toEmail) || !subject.trim()}
                    style={{ background:'#1a73e8', color:'#fff', border:'none', borderRadius:20, padding:'8px 22px', fontSize:14, fontWeight:600, cursor:'pointer', opacity:(sending || !isValidEmail(toEmail) || !subject.trim()) ? 0.6 : 1, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {sending ? (
                      <>
                        <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeOpacity=".75"/></svg>
                        Odesílám…
                      </>
                    ) : 'Odeslat'}
                  </button>

                  {/* Attach file button */}
                  <input ref={fileInputRef} type="file" multiple style={{ display:'none' }}
                    onChange={e => { if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]); e.target.value = ''; }} />
                  <button type="button" title="Přiložit soubor" onClick={() => fileInputRef.current?.click()}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#888', padding:4, borderRadius:4, display:'flex', alignItems:'center' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1a73e8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>

                  {error && <span style={{ color:'#ef4444', fontSize:12, flex:1 }}>{error}</span>}
                  <div style={{ flex:1 }} />

                  {/* Discard */}
                  <button type="button" onClick={onClose} title="Zahodit"
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', padding:4, borderRadius:4, display:'flex' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>

              </form>
            )}
          </>
        )}
      </div>
    </>
  );
}
