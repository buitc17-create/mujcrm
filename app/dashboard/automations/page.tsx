'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = { id: string; step_order: number; delay_days: number; subject: string; attachment_name: string | null };
type Sequence = { id: string; name: string; description: string | null; created_at: string; automation_steps: Step[] };

export default function AutomationsPage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchSequences = async () => {
    setLoading(true);
    const res = await fetch('/api/automations/sequences');
    const json = await res.json();
    setSequences(json.sequences ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchSequences(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setError('Název je povinný'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/automations/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Chyba'); setSaving(false); return; }
    router.push(`/dashboard/automations/${json.sequence.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tuto sekvenci a všechny její kroky?')) return;
    setDeleting(id);
    await fetch(`/api/automations/sequences/${id}`, { method: 'DELETE' });
    setSequences(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'rgba(237,237,237,0.9)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#fff' }}>Automatizace</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(237,237,237,0.5)' }}>
              Emailové sekvence pro automatické follow-upy
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            style={{
              background: '#00BFFF',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nová sekvence
          </button>
        </div>

        {/* New sequence form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            style={{
              background: '#111',
              border: '1px solid rgba(0,191,255,0.3)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#00BFFF' }}>Nová sekvence</h2>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#f87171' }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(237,237,237,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Název *
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Např. Onboarding sekvence"
                autoFocus
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(237,237,237,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Popis
              </label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Volitelný popis sekvence..."
                rows={3}
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#00BFFF',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 20px',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Ukládám...' : 'Vytvořit a pokračovat →'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName(''); setNewDescription(''); setError(''); }}
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
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: 22,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                <div style={{ width: '40%', height: 18, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ width: '65%', height: 13, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
              </div>
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && sequences.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'rgba(237,237,237,0.7)', margin: '0 0 8px' }}>
              Zatím žádné sekvence
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(237,237,237,0.4)', margin: '0 0 24px' }}>
              Vytvořte první emailovou sekvenci pro automatické follow-upy
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                background: '#00BFFF',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Vytvořit první sekvenci
            </button>
          </div>
        )}

        {/* Sequences list */}
        {!loading && sequences.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sequences.map(seq => {
              const stepCount = seq.automation_steps?.length ?? 0;
              return (
                <div
                  key={seq.id}
                  style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: '20px 22px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>{seq.name}</h3>
                      <span
                        style={{
                          background: stepCount > 0 ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.07)',
                          color: stepCount > 0 ? '#00BFFF' : 'rgba(237,237,237,0.4)',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 20,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {stepCount === 0 ? 'Bez kroků' : `${stepCount} ${stepCount === 1 ? 'krok' : stepCount < 5 ? 'kroky' : 'kroků'}`}
                      </span>
                    </div>
                    {seq.description && (
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(237,237,237,0.5)', whiteSpace: 'pre-wrap' }}>
                        {seq.description}
                      </p>
                    )}
                    <span style={{ fontSize: 12, color: 'rgba(237,237,237,0.3)' }}>
                      Vytvořeno {formatDate(seq.created_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => router.push(`/dashboard/automations/${seq.id}`)}
                      style={{
                        background: 'rgba(0,191,255,0.1)',
                        color: '#00BFFF',
                        border: '1px solid rgba(0,191,255,0.25)',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(seq.id)}
                      disabled={deleting === seq.id}
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: deleting === seq.id ? 'not-allowed' : 'pointer',
                        opacity: deleting === seq.id ? 0.6 : 1,
                      }}
                    >
                      {deleting === seq.id ? '...' : 'Smazat'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
