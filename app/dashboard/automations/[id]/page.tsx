'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

type AutomationStep = {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_days: number;
  subject: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
};

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  je_narozeninova: boolean;
  automation_steps: AutomationStep[];
};

type StepFormData = {
  delay_days: number;
  subject: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
};

const emptyForm = (): StepFormData => ({
  delay_days: 0,
  subject: '',
  body: '',
  attachment_path: null,
  attachment_name: null,
});

export default function SequenceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Inline name/description editing
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  // Step forms
  const [expandedEdit, setExpandedEdit] = useState<string | null>(null); // step id being edited
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<StepFormData>(emptyForm());
  const [addForm, setAddForm] = useState<StepFormData>(emptyForm());

  // Upload state
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [uploadingAdd, setUploadingAdd] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [deletingStep, setDeletingStep] = useState<string | null>(null);

  const [stepError, setStepError] = useState('');
  const [addError, setAddError] = useState('');

  const fetchSequence = async () => {
    const res = await fetch(`/api/automations/sequences/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const json = await res.json();
    setSequence(json.sequence);
    setNameVal(json.sequence.name);
    setDescVal(json.sequence.description ?? '');
    setLoading(false);
  };

  useEffect(() => { fetchSequence(); }, [id]);

  useEffect(() => { if (editingName) nameInputRef.current?.focus(); }, [editingName]);
  useEffect(() => { if (editingDesc) descInputRef.current?.focus(); }, [editingDesc]);

  const saveName = async () => {
    if (!nameVal.trim() || !sequence) return;
    const res = await fetch(`/api/automations/sequences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal, description: sequence.description, je_narozeninova: sequence.je_narozeninova }),
    });
    const json = await res.json();
    if (res.ok) setSequence(prev => prev ? { ...prev, name: json.sequence.name } : prev);
    setEditingName(false);
  };

  const saveDesc = async () => {
    if (!sequence) return;
    const res = await fetch(`/api/automations/sequences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sequence.name, description: descVal, je_narozeninova: sequence.je_narozeninova }),
    });
    const json = await res.json();
    if (res.ok) setSequence(prev => prev ? { ...prev, description: json.sequence.description } : prev);
    setEditingDesc(false);
  };

  const toggleNarozeninova = async () => {
    if (!sequence) return;
    const newVal = !sequence.je_narozeninova;
    const res = await fetch(`/api/automations/sequences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sequence.name, description: sequence.description, je_narozeninova: newVal }),
    });
    const json = await res.json();
    if (res.ok) setSequence(prev => prev ? { ...prev, je_narozeninova: json.sequence.je_narozeninova } : prev);
  };

  const uploadFile = async (
    file: File,
    setUploading: (v: boolean) => void,
    setForm: React.Dispatch<React.SetStateAction<StepFormData>>,
  ) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/automations/upload', { method: 'POST', body: fd });
    const json = await res.json();
    setUploading(false);
    if (res.ok) {
      setForm(prev => ({ ...prev, attachment_path: json.path, attachment_name: json.name }));
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.subject.trim() || !addForm.body.trim()) { setAddError('Předmět a tělo jsou povinné'); return; }
    setSavingStep(true);
    setAddError('');
    const nextOrder = sequence ? Math.max(0, ...sequence.automation_steps.map(s => s.step_order)) + 1 : 1;
    const res = await fetch('/api/automations/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sequence_id: id,
        step_order: nextOrder,
        delay_days: addForm.delay_days,
        subject: addForm.subject,
        body: addForm.body,
        attachment_path: addForm.attachment_path,
        attachment_name: addForm.attachment_name,
      }),
    });
    const json = await res.json();
    setSavingStep(false);
    if (!res.ok) { setAddError(json.error ?? 'Chyba'); return; }
    setSequence(prev => prev ? { ...prev, automation_steps: [...prev.automation_steps, json.step].sort((a, b) => a.step_order - b.step_order) } : prev);
    setAddForm(emptyForm());
    setShowAddForm(false);
  };

  const handleEditStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedEdit) return;
    if (!editForm.subject.trim() || !editForm.body.trim()) { setStepError('Předmět a tělo jsou povinné'); return; }
    setSavingStep(true);
    setStepError('');
    const step = sequence?.automation_steps.find(s => s.id === expandedEdit);
    const res = await fetch(`/api/automations/steps/${expandedEdit}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_order: step?.step_order,
        delay_days: editForm.delay_days,
        subject: editForm.subject,
        body: editForm.body,
        attachment_path: editForm.attachment_path,
        attachment_name: editForm.attachment_name,
      }),
    });
    const json = await res.json();
    setSavingStep(false);
    if (!res.ok) { setStepError(json.error ?? 'Chyba'); return; }
    setSequence(prev => prev ? {
      ...prev,
      automation_steps: prev.automation_steps.map(s => s.id === expandedEdit ? json.step : s),
    } : prev);
    setExpandedEdit(null);
    setEditForm(emptyForm());
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Smazat tento krok?')) return;
    setDeletingStep(stepId);
    await fetch(`/api/automations/steps/${stepId}`, { method: 'DELETE' });
    setSequence(prev => prev ? { ...prev, automation_steps: prev.automation_steps.filter(s => s.id !== stepId) } : prev);
    setDeletingStep(null);
    if (expandedEdit === stepId) setExpandedEdit(null);
  };

  const openEditForm = (step: AutomationStep) => {
    setExpandedEdit(step.id);
    setEditForm({
      delay_days: step.delay_days,
      subject: step.subject,
      body: step.body,
      attachment_path: step.attachment_path,
      attachment_name: step.attachment_name,
    });
    setStepError('');
    setShowAddForm(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '9px 12px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: 'rgba(237,237,237,0.45)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const StepForm = ({
    form,
    setForm,
    onSubmit,
    onCancel,
    uploading,
    setUploading,
    error,
  }: {
    form: StepFormData;
    setForm: React.Dispatch<React.SetStateAction<StepFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    uploading: boolean;
    setUploading: (v: boolean) => void;
    error: string;
  }) => (
    <form onSubmit={onSubmit} style={{ paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 16 }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#f87171' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Odeslat po (dnech)</label>
          <input
            type="number"
            min={0}
            value={form.delay_days}
            onChange={e => setForm(prev => ({ ...prev, delay_days: parseInt(e.target.value) || 0 }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Předmět emailu *</label>
          <input
            type="text"
            value={form.subject}
            onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Předmět zprávy..."
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Tělo emailu (HTML povoleno) *</label>
        <textarea
          value={form.body}
          onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
          placeholder="Obsah emailu..."
          rows={6}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Příloha (max 10 MB)</label>
        {form.attachment_name ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,191,255,0.07)', border: '1px solid rgba(0,191,255,0.2)', borderRadius: 8 }}>
            <span style={{ fontSize: 16 }}>📎</span>
            <span style={{ fontSize: 13, color: '#00BFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.attachment_name}</span>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, attachment_path: null, attachment_name: null }))}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ) : (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            background: '#0a0a0a',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 8,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: 13,
            color: 'rgba(237,237,237,0.5)',
          }}>
            <input
              type="file"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, setUploading, setForm); }}
            />
            {uploading ? '⏳ Nahrávám...' : '📎 Vybrat soubor'}
          </label>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={savingStep || uploading}
          style={{
            background: '#00BFFF',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 8,
            padding: '9px 20px',
            fontWeight: 600,
            fontSize: 14,
            cursor: (savingStep || uploading) ? 'not-allowed' : 'pointer',
            opacity: (savingStep || uploading) ? 0.7 : 1,
          }}
        >
          {savingStep ? 'Ukládám...' : 'Uložit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            color: 'rgba(237,237,237,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '9px 20px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Zrušit
        </button>
      </div>
    </form>
  );

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '32px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 32 }} />
          <div style={{ width: '60%', height: 28, background: 'rgba(255,255,255,0.07)', borderRadius: 6, marginBottom: 12 }} />
          <div style={{ width: '40%', height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 40 }} />
          {[1, 2].map(i => (
            <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 22, marginBottom: 14 }}>
              <div style={{ width: '30%', height: 16, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 10 }} />
              <div style={{ width: '50%', height: 13, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
            </div>
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(237,237,237,0.5)', marginTop: 80 }}>Sekvence nenalezena.</p>
        <button onClick={() => router.push('/dashboard/automations')} style={{ marginTop: 16, background: '#00BFFF', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
          Zpět na automatizace
        </button>
      </div>
    );
  }

  const steps = sequence?.automation_steps ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'rgba(237,237,237,0.9)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <button
          onClick={() => router.push('/dashboard/automations')}
          style={{
            background: 'none',
            border: 'none',
            color: '#00BFFF',
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Automatizace
        </button>

        {/* Sequence name (inline editable) */}
        <div style={{ marginBottom: 4 }}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameVal(sequence?.name ?? ''); } }}
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#fff',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #00BFFF',
                outline: 'none',
                width: '100%',
                padding: '2px 0',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>{sequence?.name}</h1>
              <button
                onClick={() => setEditingName(true)}
                title="Upravit název"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(237,237,237,0.3)', fontSize: 16, padding: 4, lineHeight: 1 }}
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Description (inline editable) */}
        <div style={{ marginBottom: 36 }}>
          {editingDesc ? (
            <textarea
              ref={descInputRef}
              value={descVal}
              onChange={e => setDescVal(e.target.value)}
              onBlur={saveDesc}
              onKeyDown={e => { if (e.key === 'Escape') { setEditingDesc(false); setDescVal(sequence?.description ?? ''); } }}
              rows={2}
              placeholder="Přidat popis..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,191,255,0.4)',
                outline: 'none',
                color: 'rgba(237,237,237,0.6)',
                fontSize: 14,
                resize: 'none',
                padding: '4px 0',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              title="Klikněte pro úpravu"
              style={{ cursor: 'text', minHeight: 22 }}
            >
              {sequence?.description ? (
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(237,237,237,0.5)' }}>{sequence.description}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(237,237,237,0.25)', fontStyle: 'italic' }}>Klikněte pro přidání popisu...</p>
              )}
            </div>
          )}
        </div>

        {/* Narozeninová sekvence toggle */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={toggleNarozeninova}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: sequence?.je_narozeninova ? 'rgba(0,191,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${sequence?.je_narozeninova ? 'rgba(0,191,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            {/* Toggle switch */}
            <div style={{
              width: 36, height: 20, borderRadius: 10, flexShrink: 0,
              background: sequence?.je_narozeninova ? '#00BFFF' : 'rgba(255,255,255,0.15)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: sequence?.je_narozeninova ? 19 : 3,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: sequence?.je_narozeninova ? '#00BFFF' : 'rgba(237,237,237,0.7)' }}>
                🎂 Narozeninová sekvence
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(237,237,237,0.35)' }}>
                {sequence?.je_narozeninova
                  ? 'Aktivní — odesílá se automaticky zákazníkům v den narozenin'
                  : 'Zapni, aby se tato sekvence odesílala v den narozenin zákazníka'}
              </p>
            </div>
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step, idx) => {
            const isEditing = expandedEdit === step.id;
            const borderColor = idx === 0 ? '#00BFFF' : `rgba(0,191,255,${0.5 - idx * 0.08 > 0.2 ? 0.5 - idx * 0.08 : 0.2})`;

            return (
              <div
                key={step.id}
                style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                }}
              >
                {/* Step header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(0,191,255,0.12)',
                        color: '#00BFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}>
                        Krok {step.step_order}
                      </span>
                      <span style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(237,237,237,0.55)',
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}>
                        {step.delay_days === 0 ? 'Ihned' : `Po ${step.delay_days} ${step.delay_days === 1 ? 'dni' : step.delay_days < 5 ? 'dnech' : 'dnech'}`}
                      </span>
                      {step.attachment_name && (
                        <span style={{
                          background: 'rgba(0,191,255,0.07)',
                          color: 'rgba(0,191,255,0.75)',
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 20,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          📎 {step.attachment_name}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: 'rgba(237,237,237,0.8)', fontWeight: 500 }}>{step.subject}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => isEditing ? (setExpandedEdit(null), setEditForm(emptyForm())) : openEditForm(step)}
                      title="Upravit krok"
                      style={{
                        background: isEditing ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isEditing ? 'rgba(0,191,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: isEditing ? '#00BFFF' : 'rgba(237,237,237,0.6)',
                        borderRadius: 7,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      disabled={deletingStep === step.id}
                      title="Smazat krok"
                      style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.18)',
                        color: '#f87171',
                        borderRadius: 7,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: deletingStep === step.id ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        opacity: deletingStep === step.id ? 0.5 : 1,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <StepForm
                    form={editForm}
                    setForm={setEditForm}
                    onSubmit={handleEditStep}
                    onCancel={() => { setExpandedEdit(null); setEditForm(emptyForm()); setStepError(''); }}
                    uploading={uploadingEdit}
                    setUploading={setUploadingEdit}
                    error={stepError}
                  />
                )}
              </div>
            );
          })}

          {/* Add step form */}
          {showAddForm && (
            <div style={{
              background: '#111',
              border: '1px solid rgba(0,191,255,0.2)',
              borderLeft: '3px solid rgba(0,191,255,0.4)',
              borderRadius: 12,
              padding: '18px 20px',
            }}>
              <h3 style={{ margin: '0 0 0', fontSize: 14, fontWeight: 600, color: 'rgba(0,191,255,0.8)' }}>
                Krok {steps.length + 1}
              </h3>
              <StepForm
                form={addForm}
                setForm={setAddForm}
                onSubmit={handleAddStep}
                onCancel={() => { setShowAddForm(false); setAddForm(emptyForm()); setAddError(''); }}
                uploading={uploadingAdd}
                setUploading={setUploadingAdd}
                error={addError}
              />
            </div>
          )}

          {/* Add step button */}
          {!showAddForm && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setAddForm(emptyForm());
                setAddError('');
                setExpandedEdit(null);
              }}
              style={{
                background: 'transparent',
                border: '1px dashed rgba(0,191,255,0.3)',
                borderRadius: 12,
                padding: '14px 20px',
                color: '#00BFFF',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'center',
                width: '100%',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              + Přidat krok
            </button>
          )}
        </div>

        {steps.length === 0 && !showAddForm && (
          <p style={{ textAlign: 'center', color: 'rgba(237,237,237,0.35)', fontSize: 14, marginTop: 16 }}>
            Sekvence zatím nemá žádné kroky. Přidejte první krok výše.
          </p>
        )}
      </div>
    </div>
  );
}
