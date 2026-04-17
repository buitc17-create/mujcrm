'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

type Stage = { id: string; nazev: string; barva: string; poradi: number };

type Deal = {
  id: string; nazev: string; hodnota: number; status: string;
  stage_id: string | null;
  datum_uzavreni: string | null; contact_id: string | null; poznamky?: string | null;
  priorita: string; pravdepodobnost: number; zdroj: string; assigned_to?: string | null;
  assignment_status?: string | null;
  contacts?: { jmeno: string; prijmeni: string | null; firma: string | null } | null;
};
type Contact = { id: string; jmeno: string; prijmeni: string | null; firma: string | null };

type DealItem = {
  id: string; deal_id: string; nazev: string; popis: string | null;
  mnozstvi: number; jednotka: string; cena_za_kus: number;
  sleva_procent: number; celkem: number; poradi: number;
};
type DealTab = 'info' | 'polozky' | 'aktivity';

const JEDNOTKY = ['ks', 'hod', 'den', 'měs', 'rok', 'm²', 'm', 'km', 'l', 'kg'];
const VAT = 0.21;

const DEFAULT_STAGES = [
  { nazev: 'Nový kontakt', barva: '#3B82F6', poradi: 0 },
  { nazev: 'Jednání', barva: '#EAB308', poradi: 1 },
  { nazev: 'Nabídka odeslána', barva: '#F97316', poradi: 2 },
  { nazev: 'Vyhráno', barva: '#22C55E', poradi: 3 },
  { nazev: 'Prohráno', barva: '#EF4444', poradi: 4 },
];

const PRIORITY = [
  { id: 'nizka', label: 'Nízká', color: '#6b7280' },
  { id: 'stredni', label: 'Střední', color: '#f59e0b' },
  { id: 'vysoka', label: 'Vysoká', color: '#ef4444' },
];

const ZDROJ = [
  { id: 'doporuceni', label: 'Doporučení' },
  { id: 'web', label: 'Web' },
  { id: 'telefon', label: 'Telefon' },
  { id: 'email', label: 'Email' },
  { id: 'socialni_site', label: 'Sociální sítě' },
  { id: 'jine', label: 'Jiné' },
];

function fmtKc(v: number) { return v ? v.toLocaleString('cs-CZ') + ' Kč' : '–'; }
function priorityColor(p: string) { return PRIORITY.find(x => x.id === p)?.color ?? '#6b7280'; }

const DEAL_SELECT = 'id, nazev, hodnota, status, stage_id, datum_uzavreni, contact_id, priorita, pravdepodobnost, zdroj, assigned_to, assignment_status, contacts(jmeno, prijmeni, firma)';

type TeamMember = { id: string; name: string; email: string; role: string; isOwner: boolean };
const emptyForm = () => ({ nazev: '', hodnota: '', contact_id: '', datum_uzavreni: '', stage_id: '', priorita: 'stredni', pravdepodobnost: '50', zdroj: 'jine', assigned_to: '' });

export default function DealsPage() {
  const supabase = createClient();
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDeal, setNewDeal] = useState(emptyForm());

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editForm, setEditForm] = useState({ nazev: '', hodnota: '', stage_id: '', contact_id: '', datum_uzavreni: '', priorita: 'stredni', pravdepodobnost: '50', zdroj: 'jine', assigned_to: '' });
  const [editSaving, setEditSaving] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberUserId, setMemberUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ jmeno: '', prijmeni: '', email: '' });
  const [savingContact, setSavingContact] = useState(false);

  // Deal items
  const [dealTab, setDealTab] = useState<DealTab>('info');
  const [items, setItems] = useState<DealItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showDph, setShowDph] = useState(false);
  const [templateItems, setTemplateItems] = useState<DealItem[]>([]);
  const [showTemplateDD, setShowTemplateDD] = useState(false);

  const handleCreateContact = async () => {
    if (!newContact.jmeno.trim()) return;
    setSavingContact(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingContact(false); return; }
    const { data } = await supabase.from('contacts').insert({
      user_id: ownerId ?? user.id,
      jmeno: newContact.jmeno.trim(),
      prijmeni: newContact.prijmeni.trim() || null,
      email: newContact.email.trim() || null,
    }).select('id, jmeno, prijmeni, firma').single();
    if (data) {
      setContacts(prev => [...prev, data]);
      setNewDeal(p => ({ ...p, contact_id: data.id }));
    }
    setNewContact({ jmeno: '', prijmeni: '', email: '' });
    setShowNewContact(false);
    setSavingContact(false);
  };

  // ── Item helpers ──────────────────────────────────────────────────────────
  const loadItems = async (dealId: string) => {
    setLoadingItems(true);
    const { data } = await supabase.from('deal_items').select('*').eq('deal_id', dealId).order('poradi');
    setItems((data as DealItem[]) ?? []);
    setLoadingItems(false);
  };

  const recalcDealValue = async (dealId: string, newItems: DealItem[]) => {
    const total = newItems.reduce((s, i) => s + (i.celkem ?? 0), 0);
    await supabase.from('deals').update({ hodnota: total }).eq('id', dealId);
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, hodnota: total } : d));
    if (selectedDeal?.id === dealId) {
      setEditForm(p => ({ ...p, hodnota: String(total) }));
    }
  };

  const addItem = async () => {
    if (!selectedDeal) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const poradi = items.length;
    const { data } = await supabase.from('deal_items').insert({
      deal_id: selectedDeal.id, user_id: ownerId ?? user.id,
      nazev: 'Nová položka', mnozstvi: 1, jednotka: 'ks', cena_za_kus: 0, sleva_procent: 0, poradi,
    }).select('*').single();
    if (data) {
      const updated = [...items, data as DealItem];
      setItems(updated);
      recalcDealValue(selectedDeal.id, updated);
    }
  };

  const updateItem = async (id: string, field: string, value: string | number) => {
    const { data } = await supabase.from('deal_items').update({ [field]: value }).eq('id', id).select('*').single();
    if (data) {
      const updated = items.map(i => i.id === id ? (data as DealItem) : i);
      setItems(updated);
      if (selectedDeal) recalcDealValue(selectedDeal.id, updated);
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('deal_items').delete().eq('id', id);
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    if (selectedDeal) recalcDealValue(selectedDeal.id, updated);
  };

  const loadTemplateItems = async () => {
    if (!selectedDeal) return;
    const { data } = await supabase.from('deal_items')
      .select('*').neq('deal_id', selectedDeal.id)
      .order('created_at', { ascending: false }).limit(20);
    if (!data) return;
    // deduplicate by name, keep last 5 unique
    const seen = new Set<string>();
    const unique: DealItem[] = [];
    for (const item of (data as DealItem[])) {
      if (!seen.has(item.nazev)) { seen.add(item.nazev); unique.push(item); }
      if (unique.length >= 5) break;
    }
    setTemplateItems(unique);
  };

  const addFromTemplate = async (tpl: DealItem) => {
    if (!selectedDeal) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('deal_items').insert({
      deal_id: selectedDeal.id, user_id: ownerId ?? user.id,
      nazev: tpl.nazev, popis: tpl.popis, mnozstvi: tpl.mnozstvi,
      jednotka: tpl.jednotka, cena_za_kus: tpl.cena_za_kus,
      sleva_procent: tpl.sleva_procent, poradi: items.length,
    }).select('*').single();
    if (data) {
      const updated = [...items, data as DealItem];
      setItems(updated);
      recalcDealValue(selectedDeal.id, updated);
    }
    setShowTemplateDD(false);
  };

  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const showToast = (message: string, color: string) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 2000);
  };

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load stages
    let { data: stagesData } = await supabase
      .from('pipeline_stages')
      .select('id, nazev, barva, poradi')
      .order('poradi');

    // Auto-create defaults if none exist
    if (!stagesData || stagesData.length === 0) {
      const { data: created } = await supabase
        .from('pipeline_stages')
        .insert(DEFAULT_STAGES.map(s => ({ ...s, user_id: ownerId ?? user.id })))
        .select()
        .order('poradi');
      stagesData = created ?? [];
    }

    const loadedStages = stagesData ?? [];
    setStages(loadedStages);

    // Show: unassigned/pending/declined + deals assigned TO this owner (from members)
    const { data: dealsData } = await supabase
      .from('deals')
      .select(DEAL_SELECT)
      .or(`assignment_status.is.null,assignment_status.eq.declined,assigned_to.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setDeals((dealsData as unknown as Deal[]) ?? []);

    // Load contacts
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, jmeno, prijmeni, firma')
      .order('jmeno');
    setContacts(contactsData ?? []);

    // Set default stage for new deal form
    if (loadedStages.length > 0) {
      setNewDeal(p => ({ ...p, stage_id: loadedStages[0].id }));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const membersData = await fetch('/api/team/members').then(r => r.json());
      setTeamMembers(membersData.members ?? []);
      setOwnerId(membersData.ownerId ?? null);

      if (user && membersData.ownerId && membersData.ownerId !== user.id) {
        // Member: load all workspace data via service role
        setIsMember(true);
        setMemberUserId(user.id);
        const ws = await fetch('/api/team/workspace').then(r => r.json());
        setDeals((ws.deals ?? []) as Deal[]);
        setStages((ws.stages ?? []) as Stage[]);
        setContacts(ws.contacts ?? []);
        if ((ws.stages ?? []).length > 0) {
          setNewDeal(p => ({ ...p, stage_id: ws.stages[0].id }));
        }
        setLoading(false);
      } else {
        loadData();
      }
    };
    init();
  }, [loadData]);

  // Group deals by stage_id; deals with null stage_id go to first stage
  const dealsByStage = stages.reduce<Record<string, Deal[]>>((acc, s) => {
    acc[s.id] = [];
    return acc;
  }, {});
  deals.forEach(d => {
    const stageId = d.stage_id ?? stages[0]?.id;
    if (stageId && dealsByStage[stageId]) {
      dealsByStage[stageId].push(d);
    }
  });

  const openDetail = (deal: Deal) => {
    setSelectedDeal(deal);
    setDealTab('info');
    setItems([]);
    setShowTemplateDD(false);
    const stageId = deal.stage_id ?? stages[0]?.id ?? '';
    setEditForm({
      nazev: deal.nazev,
      hodnota: deal.hodnota ? String(deal.hodnota) : '',
      stage_id: stageId,
      contact_id: deal.contact_id ?? '',
      datum_uzavreni: deal.datum_uzavreni ?? '',
      priorita: deal.priorita ?? 'stredni',
      pravdepodobnost: deal.pravdepodobnost != null ? String(deal.pravdepodobnost) : '50',
      zdroj: deal.zdroj ?? 'jine',
      assigned_to: deal.assigned_to ?? '',
    });
    loadItems(deal.id);
  };

  const closeDetail = () => { setSelectedDeal(null); setItems([]); };

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    const newStageId = destination.droppableId;
    setDeals(prev => prev.map(d => d.id === draggableId ? { ...d, stage_id: newStageId } : d));
    if (selectedDeal?.id === draggableId) {
      setSelectedDeal(prev => prev ? { ...prev, stage_id: newStageId } : null);
      setEditForm(prev => ({ ...prev, stage_id: newStageId }));
    }
    if (isMember) {
      await fetch('/api/team/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggableId, stage_id: newStageId }),
      });
    } else {
      await supabase.from('deals').update({ stage_id: newStageId }).eq('id', draggableId);
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.nazev.trim()) return;
    setSaving(true);

    const dealPayload = {
      nazev: newDeal.nazev.trim(),
      hodnota: parseFloat(newDeal.hodnota) || 0,
      contact_id: newDeal.contact_id || null,
      datum_uzavreni: newDeal.datum_uzavreni || null,
      stage_id: newDeal.stage_id || null,
      status: 'novy',
      priorita: newDeal.priorita,
      pravdepodobnost: parseInt(newDeal.pravdepodobnost) || 50,
      zdroj: newDeal.zdroj,
      assigned_to: newDeal.assigned_to || null,
    };

    let data: Deal | null = null;

    if (isMember) {
      const res = await fetch('/api/team/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealPayload),
      });
      const json = await res.json();
      data = json.deal ?? null;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { data: inserted } = await supabase.from('deals').insert({
        user_id: ownerId ?? user.id,
        ...dealPayload,
      }).select(DEAL_SELECT).single();
      data = inserted as unknown as Deal ?? null;
    }

    if (data) {
      setDeals(prev => [data, ...prev]);
      if (newDeal.assigned_to) {
        // Notify whoever was assigned (works for owner→member and member→owner)
        fetch('/api/team/notify-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'deal', id: data.id, assignedToId: newDeal.assigned_to, itemName: newDeal.nazev.trim() }),
        });
      }
    }
    setNewDeal({ ...emptyForm(), stage_id: stages[0]?.id ?? '' });
    setShowModal(false);
    setSaving(false);
  };

  const handleAssignmentAction = async (dealId: string, action: 'accepted' | 'declined') => {
    setActioningId(dealId);
    await fetch('/api/team/assignment-action', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'deal', id: dealId, action }),
    });
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, assignment_status: action } : d));
    setActioningId(null);
  };

  const handleOwnerAssignmentAction = async (dealId: string, action: 'accepted' | 'declined') => {
    setActioningId(dealId);
    await fetch('/api/team/owner-assignment-action', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dealId, action }),
    });
    if (action === 'accepted') {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, assignment_status: 'accepted', assigned_to: null } : d));
    } else {
      // Declined → deal returns to unassigned pool
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, assigned_to: null, assignment_status: null } : d));
    }
    setActioningId(null);
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !editForm.nazev.trim()) return;
    setEditSaving(true);

    const newAssignedTo = editForm.assigned_to || null;
    const assignmentChanged = newAssignedTo !== (selectedDeal.assigned_to ?? null);

    const updates: Record<string, unknown> = {
      nazev: editForm.nazev.trim(),
      hodnota: parseFloat(editForm.hodnota) || 0,
      stage_id: editForm.stage_id || null,
      contact_id: editForm.contact_id || null,
      datum_uzavreni: editForm.datum_uzavreni || null,
      priorita: editForm.priorita,
      pravdepodobnost: parseInt(editForm.pravdepodobnost) || 50,
      zdroj: editForm.zdroj,
      assigned_to: newAssignedTo,
    };

    // Reset assignment_status when assignment changes
    if (assignmentChanged) {
      updates.assignment_status = null;
    }

    if (isMember) {
      const res = await fetch('/api/team/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedDeal.id, ...updates }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditSaving(false);
        showToast('Chyba při ukládání: ' + (json.error ?? res.status), '#ef4444');
        return;
      }
      const updatedContact = contacts.find(c => c.id === editForm.contact_id) ?? null;
      setDeals(prev => prev.map(d => d.id === selectedDeal.id ? {
        ...d, ...updates,
        contacts: updatedContact ? { jmeno: updatedContact.jmeno, prijmeni: updatedContact.prijmeni, firma: updatedContact.firma } : null,
      } : d));
    } else {
      const { data } = await supabase.from('deals')
        .update(updates)
        .eq('id', selectedDeal.id)
        .select(DEAL_SELECT)
        .single();
      if (data) {
        setDeals(prev => prev.map(d => d.id === selectedDeal.id ? (data as unknown as Deal) : d));
      }
    }

    // Send notification if assignment changed
    if (assignmentChanged && newAssignedTo) {
      fetch('/api/team/notify-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deal', id: selectedDeal.id, assignedToId: newAssignedTo, itemName: editForm.nazev.trim() }),
      });
    }

    setEditSaving(false);
    closeDetail();
    showToast('Zakázka byla uložena', '#10b981');
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Smazat tuto zakázku?')) return;
    await supabase.from('deals').delete().eq('id', id);
    setDeals(prev => prev.filter(d => d.id !== id));
    if (selectedDeal?.id === id) closeDetail();
    showToast('Zakázka byla smazána', '#ef4444');
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
    outline: 'none', width: '100%',
  };
  const labelStyle = { color: 'rgba(237,237,237,0.5)' };

  const totalValue = deals.filter(d => {
    const s = stages.find(st => st.id === d.stage_id);
    return s ? !s.nazev.toLowerCase().includes('prohr') : true;
  }).reduce((s, d) => s + d.hodnota, 0);

  const wonStages = stages.filter(s => s.nazev.toLowerCase().includes('vyhráno') || s.nazev.toLowerCase().includes('vyhrano'));
  const wonValue = deals.filter(d => wonStages.some(s => s.id === d.stage_id)).reduce((s, d) => s + d.hodnota, 0);

  const selectedStage = selectedDeal
    ? stages.find(s => s.id === editForm.stage_id) ?? stages.find(s => s.id === selectedDeal.stage_id)
    : null;

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Zakázky</h1>
              <Link
                href="/dashboard/deals/pipeline-settings"
                title="Nastavení pipeline"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ color: 'rgba(237,237,237,0.3)', background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00BFFF'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,191,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(237,237,237,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </Link>
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
              Pipeline: {fmtKc(totalValue)} · Vyhráno: <span style={{ color: '#22C55E' }}>{fmtKc(wonValue)}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Přidat zakázku
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {stages.map(stage => {
              const colDeals = dealsByStage[stage.id] ?? [];
              const colTotal = colDeals.reduce((s, d) => s + d.hodnota, 0);
              return (
                <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.barva }} />
                      <span className="text-xs font-bold text-white">{stage.nazev}</span>
                    </div>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(237,237,237,0.5)' }}>
                      {colDeals.length}
                    </span>
                  </div>
                  {colTotal > 0 && (
                    <p className="text-xs mb-2" style={{ color: stage.barva + 'bb' }}>{fmtKc(colTotal)}</p>
                  )}

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 flex flex-col gap-2 rounded-xl p-2 min-h-32 transition-all"
                        style={{
                          background: snapshot.isDraggingOver ? stage.barva + '0d' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${snapshot.isDraggingOver ? stage.barva + '30' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {colDeals.map((deal, index) => {
                          const c = deal.contacts;
                          const contactName = c ? `${c.jmeno}${c.prijmeni ? ' ' + c.prijmeni : ''}` : null;
                          const isSelected = selectedDeal?.id === deal.id;
                          const pColor = priorityColor(deal.priorita);
                          const prob = deal.pravdepodobnost ?? 50;
                          return (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="rounded-xl p-3.5 group transition-all"
                                  style={{
                                    background: isSelected ? '#1e2a2a' : snapshot.isDragging ? '#1e1e1e' : '#171717',
                                    border: `1px solid ${isSelected ? stage.barva + '50' : snapshot.isDragging ? stage.barva + '40' : 'rgba(255,255,255,0.08)'}`,
                                    boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
                                    cursor: 'grab',
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  {/* Title row */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: pColor }} title={PRIORITY.find(p => p.id === deal.priorita)?.label} />
                                      <button
                                        onClick={() => openDetail(deal)}
                                        className="text-sm font-semibold text-white leading-snug text-left hover:underline truncate"
                                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                                      >
                                        {deal.nazev}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <button onClick={() => openDetail(deal)}
                                        style={{ color: 'rgba(237,237,237,0.4)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.4)')}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                      <button onClick={() => handleDeleteDeal(deal.id)}
                                        style={{ color: 'rgba(239,68,68,0.6)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.6)')}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Value */}
                                  {deal.hodnota > 0 && (
                                    <p className="text-sm font-black mb-2" style={{ color: stage.barva }}>
                                      {deal.hodnota.toLocaleString('cs-CZ')} Kč
                                    </p>
                                  )}

                                  {/* Probability bar */}
                                  <div className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>Pravděpodobnost</span>
                                      <span className="text-xs font-semibold" style={{ color: prob >= 70 ? '#10b981' : prob >= 40 ? '#f59e0b' : '#6b7280' }}>{prob} %</span>
                                    </div>
                                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                      <div className="h-full rounded-full transition-all" style={{
                                        width: `${prob}%`,
                                        background: prob >= 70 ? '#10b981' : prob >= 40 ? '#f59e0b' : '#6b7280',
                                      }} />
                                    </div>
                                  </div>

                                  {/* Meta */}
                                  <div className="flex flex-col gap-1">
                                    {contactName && (
                                      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>
                                        👤 {contactName}{c?.firma ? ` · ${c.firma}` : ''}
                                      </p>
                                    )}
                                    {deal.datum_uzavreni && (
                                      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
                                        📅 {new Date(deal.datum_uzavreni).toLocaleDateString('cs-CZ')}
                                      </p>
                                    )}
                                    {deal.assignment_status === 'accepted' && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-md self-start mt-0.5"
                                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                        ✓ Přijato
                                      </span>
                                    )}
                                    {deal.assignment_status === 'declined' && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-md self-start mt-0.5"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                                        ✗ Odmítnuto
                                      </span>
                                    )}
                                    {/* Member: accept/decline deal assigned by owner */}
                                    {isMember && deal.assigned_to === memberUserId && !deal.assignment_status && (
                                      <div className="flex gap-1.5 mt-1.5">
                                        <button
                                          onClick={() => handleAssignmentAction(deal.id, 'accepted')}
                                          disabled={actioningId === deal.id}
                                          className="flex-1 text-xs py-1 rounded-lg font-semibold"
                                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                                        >Přijmout</button>
                                        <button
                                          onClick={() => handleAssignmentAction(deal.id, 'declined')}
                                          disabled={actioningId === deal.id}
                                          className="flex-1 text-xs py-1 rounded-lg font-semibold"
                                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                        >Odmítnout</button>
                                      </div>
                                    )}
                                    {/* Owner: accept/decline deal assigned by member */}
                                    {!isMember && deal.assigned_to === userId && !deal.assignment_status && (
                                      <div className="flex gap-1.5 mt-1.5">
                                        <button
                                          onClick={() => handleOwnerAssignmentAction(deal.id, 'accepted')}
                                          disabled={actioningId === deal.id}
                                          className="flex-1 text-xs py-1 rounded-lg font-semibold"
                                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                                        >Přijmout</button>
                                        <button
                                          onClick={() => handleOwnerAssignmentAction(deal.id, 'declined')}
                                          disabled={actioningId === deal.id}
                                          className="flex-1 text-xs py-1 rounded-lg font-semibold"
                                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                        >Odmítnout</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {colDeals.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex-1 flex items-center justify-center py-6">
                            <p className="text-xs text-center" style={{ color: 'rgba(237,237,237,0.2)' }}>Přetáhni sem zakázku</p>
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

      {/* Modal – nová zakázka */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => { setShowModal(false); setShowNewContact(false); }} />
          <div className="relative w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nová zakázka</h2>
              <button onClick={() => { setShowModal(false); setShowNewContact(false); }} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddDeal} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Název zakázky *</label>
                <input type="text" placeholder="Nový web pro klienta" value={newDeal.nazev}
                  onChange={e => setNewDeal(p => ({ ...p, nazev: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Hodnota (Kč)</label>
                <input type="number" placeholder="50000" value={newDeal.hodnota}
                  onChange={e => setNewDeal(p => ({ ...p, hodnota: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Datum uzavření</label>
                <input type="date" value={newDeal.datum_uzavreni}
                  onChange={e => setNewDeal(p => ({ ...p, datum_uzavreni: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={labelStyle}>Zákazník</label>
                  <button type="button" onClick={() => setShowNewContact(v => !v)}
                    className="text-xs font-semibold"
                    style={{ color: showNewContact ? 'rgba(237,237,237,0.4)' : '#00BFFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showNewContact ? '× Zrušit' : '+ Vytvořit nového'}
                  </button>
                </div>
                {showNewContact ? (
                  <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.15)' }}>
                    <input type="text" placeholder="Jméno *" value={newContact.jmeno}
                      onChange={e => setNewContact(p => ({ ...p, jmeno: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    <input type="text" placeholder="Příjmení" value={newContact.prijmeni}
                      onChange={e => setNewContact(p => ({ ...p, prijmeni: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    <input type="email" placeholder="Email" value={newContact.email}
                      onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    <button type="button" onClick={handleCreateContact} disabled={savingContact || !newContact.jmeno.trim()}
                      className="py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                      style={{ background: 'rgba(0,191,255,0.15)', border: '1px solid rgba(0,191,255,0.3)', color: '#00BFFF', cursor: 'pointer' }}>
                      {savingContact ? 'Ukládám…' : 'Uložit zákazníka'}
                    </button>
                  </div>
                ) : (
                  <select value={newDeal.contact_id} onChange={e => setNewDeal(p => ({ ...p, contact_id: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ background: '#1a1a1a' }}>– Bez zákazníka –</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>
                        {c.jmeno} {c.prijmeni ?? ''}{c.firma ? ` (${c.firma})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Fáze pipeline</label>
                <select value={newDeal.stage_id} onChange={e => setNewDeal(p => ({ ...p, stage_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {stages.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.nazev}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Priorita</label>
                <select value={newDeal.priorita} onChange={e => setNewDeal(p => ({ ...p, priorita: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PRIORITY.map(p => <option key={p.id} value={p.id} style={{ background: '#1a1a1a' }}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                  Pravděpodobnost uzavření — <span style={{ color: '#ededed' }}>{newDeal.pravdepodobnost} %</span>
                </label>
                <input type="range" min="0" max="100" value={newDeal.pravdepodobnost}
                  onChange={e => setNewDeal(p => ({ ...p, pravdepodobnost: e.target.value }))}
                  style={{ width: '100%', accentColor: '#00BFFF', cursor: 'pointer' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Zdroj zakázky</label>
                <select value={newDeal.zdroj} onChange={e => setNewDeal(p => ({ ...p, zdroj: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ZDROJ.map(z => <option key={z.id} value={z.id} style={{ background: '#1a1a1a' }}>{z.label}</option>)}
                </select>
              </div>
              {teamMembers.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Přiřadit členovi týmu</label>
                  <select value={newDeal.assigned_to} onChange={e => setNewDeal(p => ({ ...p, assigned_to: e.target.value }))}
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
                  {saving ? 'Ukládám…' : 'Přidat zakázku'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setShowNewContact(false); }}
                  className="px-5 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{
            background: toast.color + '18',
            border: `1px solid ${toast.color}40`,
            color: toast.color,
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {toast.color === '#10b981'
              ? <polyline points="20 6 9 17 4 12"/>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
          {toast.message}
        </div>
      )}

      {/* Slide-over – detail obchodu */}
      {selectedDeal && (() => {
        // Item totals
        const mezisoucet = items.reduce((s, i) => s + i.mnozstvi * i.cena_za_kus, 0);
        const slevaTotal = items.reduce((s, i) => s + i.mnozstvi * i.cena_za_kus * (i.sleva_procent / 100), 0);
        const bezDph = items.reduce((s, i) => s + (i.celkem ?? 0), 0);
        const dph = bezDph * VAT;
        const sDph = bezDph + dph;

        const cellInput = (
          type: string, value: string | number, onBlur: (v: string) => void,
          extra?: React.CSSProperties
        ) => (
          <input
            type={type}
            defaultValue={String(value)}
            onBlur={e => onBlur(e.target.value)}
            onClick={e => (e.target as HTMLInputElement).select()}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid transparent',
              borderRadius: 6, padding: '3px 6px', color: '#ededed', fontSize: 12, outline: 'none', ...extra,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'transparent')}
          />
        );

        return (
          <>
            <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={closeDetail} />
            <div className="fixed right-0 top-0 h-full z-50 flex flex-col"
              style={{ width: dealTab === 'polozky' ? 'min(720px, 100vw)' : 'min(400px, 100vw)', background: '#141414', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)', transition: 'width 0.2s ease' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selectedStage?.barva ?? '#888' }} />
                  <span className="text-sm font-bold text-white truncate">{selectedDeal.nazev}</span>
                </div>
                <button onClick={closeDetail} style={{ color: 'rgba(237,237,237,0.4)', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ededed')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.4)')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {([['info','Základní info'],['polozky','Položky zakázky'],['aktivity','Aktivity']] as [DealTab, string][]).map(([id, label]) => (
                  <button key={id} onClick={() => {
                    setDealTab(id);
                    if (id === 'polozky') { loadItems(selectedDeal.id); loadTemplateItems(); }
                  }}
                    className="px-5 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      color: dealTab === id ? '#00BFFF' : 'rgba(237,237,237,0.45)',
                      borderBottom: dealTab === id ? '2px solid #00BFFF' : '2px solid transparent',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                    }}>
                    {label}
                    {id === 'polozky' && items.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'rgba(0,191,255,0.15)', color: '#00BFFF', fontSize: 10 }}>{items.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── TAB: Základní info ── */}
              {dealTab === 'info' && (
                <form onSubmit={handleUpdateDeal} className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Název zakázky *</label>
                    <input type="text" value={editForm.nazev} onChange={e => setEditForm(p => ({ ...p, nazev: e.target.value }))} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                      Hodnota (Kč) {items.length > 0 && <span style={{ color: 'rgba(237,237,237,0.3)' }}>— automaticky z položek</span>}
                    </label>
                    <input type="number" value={editForm.hodnota} onChange={e => setEditForm(p => ({ ...p, hodnota: e.target.value }))} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Fáze pipeline</label>
                    <select value={editForm.stage_id} onChange={e => setEditForm(p => ({ ...p, stage_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {stages.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>{s.nazev}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Zákazník</label>
                    <select value={editForm.contact_id} onChange={e => setEditForm(p => ({ ...p, contact_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="" style={{ background: '#1a1a1a' }}>– Bez zákazníka –</option>
                      {contacts.map(c => <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>{c.jmeno} {c.prijmeni ?? ''}{c.firma ? ` (${c.firma})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Datum uzavření</label>
                    <input type="date" value={editForm.datum_uzavreni} onChange={e => setEditForm(p => ({ ...p, datum_uzavreni: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Priorita</label>
                    <div className="flex gap-2">
                      {PRIORITY.map(p => (
                        <button key={p.id} type="button" onClick={() => setEditForm(prev => ({ ...prev, priorita: p.id }))}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold"
                          style={{ background: editForm.priorita === p.id ? p.color + '20' : 'rgba(255,255,255,0.04)', border: `1px solid ${editForm.priorita === p.id ? p.color + '60' : 'rgba(255,255,255,0.08)'}`, color: editForm.priorita === p.id ? p.color : 'rgba(237,237,237,0.4)' }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Pravděpodobnost — <span style={{ color: '#ededed' }}>{editForm.pravdepodobnost} %</span></label>
                    <input type="range" min="0" max="100" value={editForm.pravdepodobnost} onChange={e => setEditForm(p => ({ ...p, pravdepodobnost: e.target.value }))}
                      style={{ width: '100%', accentColor: '#00BFFF', cursor: 'pointer' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Zdroj zakázky</label>
                    <select value={editForm.zdroj} onChange={e => setEditForm(p => ({ ...p, zdroj: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {ZDROJ.map(z => <option key={z.id} value={z.id} style={{ background: '#1a1a1a' }}>{z.label}</option>)}
                    </select>
                  </div>
                  {teamMembers.length > 1 && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Předat členovi týmu</label>
                      <select value={editForm.assigned_to} onChange={e => setEditForm(p => ({ ...p, assigned_to: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="" style={{ background: '#1a1a1a' }}>– Nepřiřazeno –</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id} style={{ background: '#1a1a1a' }}>
                            {m.name} {m.isOwner ? '(Admin)' : `(${m.role === 'clen' ? 'Člen' : m.role === 'cteni' ? 'Čtení' : m.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-2">
                    <button type="submit" disabled={editSaving} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                      {editSaving ? 'Ukládám…' : 'Uložit změny'}
                    </button>
                    <button type="button" onClick={() => handleDeleteDeal(selectedDeal.id)} className="w-full py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
                      Smazat zakázku
                    </button>
                  </div>
                </form>
              )}

              {/* ── TAB: Položky zakázky ── */}
              {dealTab === 'polozky' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    {loadingItems ? (
                      <div className="flex items-center justify-center py-12" style={{ color: 'rgba(237,237,237,0.3)' }}>Načítám…</div>
                    ) : (
                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Název','Popis','Mn.','Jedn.','Cena/ks','Sleva %','Celkem',''].map(h => (
                              <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: 'rgba(237,237,237,0.4)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '4px 6px', minWidth: 100 }}>
                                {cellInput('text', item.nazev, v => updateItem(item.id, 'nazev', v))}
                              </td>
                              <td style={{ padding: '4px 6px', minWidth: 80 }}>
                                {cellInput('text', item.popis ?? '', v => updateItem(item.id, 'popis', v))}
                              </td>
                              <td style={{ padding: '4px 6px', width: 52 }}>
                                {cellInput('number', item.mnozstvi, v => updateItem(item.id, 'mnozstvi', parseFloat(v) || 0), { textAlign: 'right' })}
                              </td>
                              <td style={{ padding: '4px 6px', width: 70 }}>
                                <select defaultValue={item.jednotka} onBlur={e => updateItem(item.id, 'jednotka', e.target.value)}
                                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid transparent', borderRadius: 6, padding: '3px 4px', color: '#ededed', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                                  {JEDNOTKY.map(j => <option key={j} value={j} style={{ background: '#1a1a1a' }}>{j}</option>)}
                                </select>
                              </td>
                              <td style={{ padding: '4px 6px', width: 80 }}>
                                {cellInput('number', item.cena_za_kus, v => updateItem(item.id, 'cena_za_kus', parseFloat(v) || 0), { textAlign: 'right' })}
                              </td>
                              <td style={{ padding: '4px 6px', width: 60 }}>
                                {cellInput('number', item.sleva_procent, v => updateItem(item.id, 'sleva_procent', Math.min(100, Math.max(0, parseFloat(v) || 0))), { textAlign: 'right' })}
                              </td>
                              <td style={{ padding: '4px 8px', width: 80, textAlign: 'right', color: '#00BFFF', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {(item.celkem ?? 0).toLocaleString('cs-CZ')} Kč
                              </td>
                              <td style={{ padding: '4px 6px', width: 28 }}>
                                <button onClick={() => deleteItem(item.id)} title="Smazat položku"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', padding: 2, borderRadius: 4, display: 'flex' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'rgba(237,237,237,0.25)', fontSize: 13 }}>Žádné položky – přidejte první</td></tr>
                          )}
                        </tbody>
                      </table>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button onClick={addItem}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF', cursor: 'pointer' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Přidat položku
                    </button>

                    {/* Template dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => { setShowTemplateDD(d => !d); loadTemplateItems(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)', cursor: 'pointer' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Ze šablony
                      </button>
                      {showTemplateDD && (
                        <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 260, zIndex: 10, marginBottom: 4, overflow: 'hidden' }}>
                          <p style={{ padding: '8px 12px 6px', fontSize: 11, color: 'rgba(237,237,237,0.4)', fontWeight: 600 }}>Naposledy použité položky</p>
                          {templateItems.length === 0
                            ? <p style={{ padding: '8px 12px 12px', fontSize: 12, color: 'rgba(237,237,237,0.3)' }}>Žádné šablony zatím</p>
                            : templateItems.map(t => (
                              <button key={t.id} onClick={() => addFromTemplate(t)}
                                style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 12px', fontSize: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left', color: '#ededed' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <span style={{ fontWeight: 600 }}>{t.nazev}</span>
                                <span style={{ color: '#00BFFF', flexShrink: 0, marginLeft: 8 }}>{t.cena_za_kus.toLocaleString('cs-CZ')} Kč/{t.jednotka}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.015)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold" style={{ color: 'rgba(237,237,237,0.5)' }}>SOUHRN</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setShowDph(d => !d)}
                          className="relative w-8 h-4 rounded-full transition-all"
                          style={{ background: showDph ? '#00BFFF' : 'rgba(255,255,255,0.15)', cursor: 'pointer' }}>
                          <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ background: '#fff', left: showDph ? '18px' : '2px' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>Zobrazit DPH</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        ['Mezisoučet', mezisoucet],
                        ['Sleva celkem', -slevaTotal],
                        ['Celkem bez DPH', bezDph, true],
                        ...(showDph ? [['DPH (21 %)', dph], ['Celkem s DPH', sDph, true]] as [string, number, boolean?][] : []),
                      ].map(([label, val, bold]) => (
                        <div key={label as string} className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: bold ? 'rgba(237,237,237,0.8)' : 'rgba(237,237,237,0.45)', fontWeight: bold ? 700 : 400 }}>{label as string}</span>
                          <span className="text-sm" style={{ color: bold ? '#fff' : 'rgba(237,237,237,0.6)', fontWeight: bold ? 800 : 400 }}>
                            {(val as number).toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Kč
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Aktivity ── */}
              {dealTab === 'aktivity' && (
                <div className="flex flex-col flex-1 overflow-y-auto p-5">
                  <p className="text-sm font-semibold text-white mb-1">Aktivity zakázky</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(237,237,237,0.4)' }}>Hovory, schůzky, emaily a úkoly spojené s touto zakázkou.</p>
                  <div className="flex items-center justify-center flex-1 text-center">
                    <div>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(237,237,237,0.2)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(237,237,237,0.3)' }}>Zatím žádné aktivity</p>
                      <Link href="/dashboard/activities" className="inline-block mt-3 text-xs font-semibold" style={{ color: '#00BFFF' }}>
                        Přejít na aktivity →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
