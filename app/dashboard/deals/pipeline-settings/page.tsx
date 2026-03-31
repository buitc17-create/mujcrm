'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

type Stage = {
  id: string;
  nazev: string;
  barva: string;
  poradi: number;
  dealCount: number;
};

const DEFAULT_STAGES = [
  { nazev: 'Nový kontakt', barva: '#3B82F6', poradi: 0 },
  { nazev: 'Jednání', barva: '#EAB308', poradi: 1 },
  { nazev: 'Nabídka odeslána', barva: '#F97316', poradi: 2 },
  { nazev: 'Vyhráno', barva: '#22C55E', poradi: 3 },
  { nazev: 'Prohráno', barva: '#EF4444', poradi: 4 },
];

export default function PipelineSettingsPage() {
  const supabase = createClient();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStages = useCallback(async () => {
    const [{ data: stagesData }, { data: dealsData }] = await Promise.all([
      supabase.from('pipeline_stages').select('id, nazev, barva, poradi').order('poradi'),
      supabase.from('deals').select('stage_id'),
    ]);

    const countMap: Record<string, number> = {};
    (dealsData ?? []).forEach(d => {
      if (d.stage_id) countMap[d.stage_id] = (countMap[d.stage_id] ?? 0) + 1;
    });

    setStages((stagesData ?? []).map(s => ({ ...s, dealCount: countMap[s.id] ?? 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { loadStages(); }, [loadStages]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(stages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, poradi: i }));
    setStages(updated);
    await Promise.all(
      updated.map(s => supabase.from('pipeline_stages').update({ poradi: s.poradi }).eq('id', s.id))
    );
  };

  const handleNameChange = (id: string, nazev: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, nazev } : s));
  };

  const handleNameBlur = async (id: string, nazev: string) => {
    const trimmed = nazev.trim();
    if (!trimmed) { loadStages(); return; }
    await supabase.from('pipeline_stages').update({ nazev: trimmed }).eq('id', id);
  };

  const handleColorChange = async (id: string, barva: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, barva } : s));
    await supabase.from('pipeline_stages').update({ barva }).eq('id', id);
  };

  const handleDelete = async (stage: Stage) => {
    if (stages.length <= 1) {
      alert('Pipeline musí mít alespoň jeden sloupec.');
      return;
    }
    const firstOther = stages.find(s => s.id !== stage.id);
    if (stage.dealCount > 0) {
      const ok = confirm(
        `Tento sloupec obsahuje ${stage.dealCount} ${stage.dealCount === 1 ? 'zakázku' : stage.dealCount < 5 ? 'zakázky' : 'zakázek'}. ` +
        `Budou přesunuty do sloupce „${firstOther?.nazev ?? ''}". Pokračovat?`
      );
      if (!ok) return;
      if (firstOther) {
        await supabase.from('deals').update({ stage_id: firstOther.id }).eq('stage_id', stage.id);
      }
    } else {
      if (!confirm(`Smazat sloupec „${stage.nazev}"?`)) return;
    }
    await supabase.from('pipeline_stages').delete().eq('id', stage.id);
    setStages(prev => prev.filter(s => s.id !== stage.id));
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.poradi)) + 1 : 0;
    const { data } = await supabase.from('pipeline_stages').insert({
      user_id: user.id, nazev: 'Nový sloupec', barva: '#00BFFF', poradi: maxOrder,
    }).select().single();
    if (data) setStages(prev => [...prev, { ...data, dealCount: 0 }]);
  };

  const handleReset = async () => {
    if (!confirm('Obnovit výchozí pipeline? Všechny stávající sloupce budou smazány a nahrazeny výchozími 5 sloupci.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('pipeline_stages').delete().eq('user_id', user.id);
    const { data } = await supabase.from('pipeline_stages')
      .insert(DEFAULT_STAGES.map(s => ({ ...s, user_id: user.id })))
      .select()
      .order('poradi');
    setStages((data ?? []).map(s => ({ ...s, dealCount: 0 })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>
        Načítám…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <Link
          href="/dashboard/deals"
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white">Nastavení pipeline</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            Přizpůsob sloupce Kanbanu — pořadí, název i barvu
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.55)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ededed'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(237,237,237,0.55)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          Obnovit výchozí
        </button>
      </div>

      {/* Stage list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="pipeline-stages">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                      style={{
                        background: snapshot.isDragging ? '#1e1e1e' : '#141414',
                        border: `1px solid ${snapshot.isDragging ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: snapshot.isDragging ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="flex-shrink-0"
                        style={{ color: 'rgba(237,237,237,0.2)', cursor: 'grab', lineHeight: 0 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                          <circle cx="4.5" cy="3" r="1.2"/><circle cx="9.5" cy="3" r="1.2"/>
                          <circle cx="4.5" cy="7" r="1.2"/><circle cx="9.5" cy="7" r="1.2"/>
                          <circle cx="4.5" cy="11" r="1.2"/><circle cx="9.5" cy="11" r="1.2"/>
                        </svg>
                      </div>

                      {/* Color swatch + hidden picker */}
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => document.getElementById(`cp-${stage.id}`)?.click()}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ background: stage.barva, borderColor: stage.barva + '99' }}
                          title="Změnit barvu"
                        />
                        <input
                          id={`cp-${stage.id}`}
                          type="color"
                          value={stage.barva}
                          onChange={e => handleColorChange(stage.id, e.target.value)}
                          className="absolute opacity-0 w-0 h-0 pointer-events-none"
                          tabIndex={-1}
                        />
                      </div>

                      {/* Inline name */}
                      <input
                        type="text"
                        value={stage.nazev}
                        onChange={e => handleNameChange(stage.id, e.target.value)}
                        onBlur={e => handleNameBlur(stage.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-semibold text-white outline-none min-w-0"
                        style={{ border: 'none' }}
                      />

                      {/* Deal count badge */}
                      {stage.dealCount > 0 && (
                        <span
                          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: stage.barva + '20', color: stage.barva }}
                        >
                          {stage.dealCount}
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(stage)}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ color: 'rgba(239,68,68,0.45)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.45)')}
                        title="Smazat sloupec"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add stage */}
      <button
        onClick={handleAdd}
        className="mt-3 w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.12)',
          color: 'rgba(237,237,237,0.45)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,191,255,0.35)'; e.currentTarget.style.color = '#00BFFF'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(237,237,237,0.45)'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Přidat sloupec
      </button>

      <p className="mt-6 text-xs text-center" style={{ color: 'rgba(237,237,237,0.25)' }}>
        Přetažením řádků změníš pořadí · Kliknutím na barevný kruh změníš barvu · Název se uloží po kliknutí mimo pole
      </p>
    </div>
  );
}
