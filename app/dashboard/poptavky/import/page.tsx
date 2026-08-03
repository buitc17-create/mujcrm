'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type RawRow = Record<string, string>;

const CRM_FIELDS = [
  { id: 'jmeno', label: 'Jméno', required: true },
  { id: 'prijmeni', label: 'Příjmení' },
  { id: 'telefon', label: 'Telefon' },
  { id: 'email', label: 'Email' },
  { id: 'typ', label: 'Typ (investor/kupující)' },
  { id: 'co_shani', label: 'Co shání' },
  { id: 'castka_do', label: 'Do jaké částky' },
  { id: 'poznamky', label: 'Poznámky' },
];

const VALID_TYPY = ['investor', 'kupujici_fo'];

type ImportResult = { imported: number; errors: number } | null;

export default function ImportPoptavkyPage() {
  const router = useRouter();
  const supabase = createClient();
  const dropRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult>(null);

  const autoMap = (hdrs: string[]) => {
    const guesses: Record<string, string> = {};
    const aliases: Record<string, string[]> = {
      jmeno: ['jméno', 'jmeno', 'first name', 'firstname', 'name', 'křestní', 'krestni', 'first_name'],
      prijmeni: ['příjmení', 'prijmeni', 'last name', 'lastname', 'surname', 'last_name'],
      telefon: ['telefon', 'tel', 'phone', 'mobile', 'mobil', 'telefonní číslo', 'číslo'],
      email: ['email', 'e-mail', 'mail', 'e mail', 'emailová adresa'],
      typ: ['typ', 'kategorie', 'category', 'druh', 'segment'],
      co_shani: ['co shání', 'co shani', 'poptávka', 'poptavka', 'požadavek', 'pozadavek', 'hledá', 'hleda', 'description', 'popis'],
      castka_do: ['do jaké částky', 'castka', 'částka', 'rozpočet', 'rozpocet', 'budget', 'cena do', 'do částky'],
      poznamky: ['poznámky', 'poznamky', 'notes', 'note', 'komentář'],
    };
    for (const [field, alts] of Object.entries(aliases)) {
      const match = hdrs.find(h => alts.includes(h.toLowerCase().trim()));
      if (match) guesses[field] = match;
    }
    setMapping(guesses);
  };

  const parseFile = (file: File) => {
    setFileName(file.name);
    setRows([]);
    setHeaders([]);
    setMapping({});
    setResult(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const hdrs = res.meta.fields ?? [];
          setHeaders(hdrs);
          setRows(res.data);
          autoMap(hdrs);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });
        if (json.length === 0) return;
        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setRows(json);
        autoMap(hdrs);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let imported = 0, errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const record: Record<string, string | number | null> = { user_id: user.id };

      for (const field of CRM_FIELDS) {
        const col = mapping[field.id];
        record[field.id] = col ? (row[col]?.trim() || null) : null;
      }

      if (!record['jmeno']) { errors++; setProgress(Math.round(((i + 1) / rows.length) * 100)); continue; }

      // Typ normalizace
      if (record['typ']) {
        const t = String(record['typ']).toLowerCase();
        record['typ'] = t.includes('invest') ? 'investor' : (VALID_TYPY.includes(t) ? t : 'kupujici_fo');
      } else {
        record['typ'] = 'kupujici_fo';
      }

      // Částka na číslo
      if (record['castka_do']) {
        const num = parseFloat(String(record['castka_do']).replace(/[^\d.,]/g, '').replace(',', '.'));
        record['castka_do'] = isNaN(num) ? null : num;
      } else {
        record['castka_do'] = null;
      }

      const { error } = await supabase.from('poptavky').insert(record);
      if (error) errors++; else imported++;

      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setResult({ imported, errors });
    setImporting(false);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '8px 12px', color: '#ededed', fontSize: '13px',
    outline: 'none',
  };

  const preview = rows.slice(0, 5);
  const canImport = rows.length > 0 && mapping['jmeno'];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/poptavky" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Import poptávek</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>Nahraj CSV nebo Excel soubor</p>
        </div>
      </div>

      {result && (
        <div className="mb-6 p-5 rounded-2xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-sm font-bold text-white mb-1">Import dokončen</p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="text-sm" style={{ color: '#10b981' }}>✓ Importováno: <strong>{result.imported}</strong></span>
            {result.errors > 0 && <span className="text-sm" style={{ color: '#f87171' }}>✕ Chyb: <strong>{result.errors}</strong></span>}
          </div>
          <button onClick={() => router.push('/dashboard/poptavky')}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
            Zobrazit poptávky
          </button>
        </div>
      )}

      {!result && (
        <>
          <div
            ref={dropRef}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="rounded-2xl p-10 text-center mb-6 transition-all cursor-pointer"
            style={{
              border: `2px dashed ${dragging ? '#00BFFF' : 'rgba(255,255,255,0.12)'}`,
              background: dragging ? 'rgba(0,191,255,0.05)' : 'rgba(255,255,255,0.02)',
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
            <svg className="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#00BFFF' : 'rgba(237,237,237,0.25)'} strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {fileName ? (
              <p className="text-sm font-semibold" style={{ color: '#00BFFF' }}>{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-white mb-1">Přetáhni soubor sem nebo klikni</p>
                <p className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Podporované formáty: .csv, .xlsx, .xls</p>
              </>
            )}
          </div>

          {headers.length > 0 && (
            <>
              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-bold text-white mb-4">Mapování sloupců</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CRM_FIELDS.map(field => (
                    <div key={field.id} className="flex items-center gap-3">
                      <span className="text-xs font-semibold w-36 flex-shrink-0" style={{ color: field.required ? '#00BFFF' : 'rgba(237,237,237,0.5)' }}>
                        {field.label}{field.required && ' *'}
                      </span>
                      <select
                        value={mapping[field.id] ?? ''}
                        onChange={e => {
                          const v = e.target.value;
                          setMapping(p => {
                            const n = { ...p };
                            if (v) n[field.id] = v; else delete n[field.id];
                            return n;
                          });
                        }}
                        style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                      >
                        <option value="" style={{ background: '#1a1a1a' }}>– Nevybráno –</option>
                        {headers.map(h => <option key={h} value={h} style={{ background: '#1a1a1a' }}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-bold text-white">Náhled (prvních 5 řádků)</p>
                  <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>{rows.length} řádků celkem</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {headers.map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'rgba(237,237,237,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          {headers.map(h => (
                            <td key={h} className="px-4 py-2.5" style={{ color: 'rgba(237,237,237,0.7)', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row[h] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importing && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(237,237,237,0.5)' }}>
                    <span>Importuji…</span>
                    <span>{progress} %</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00BFFF, #0090cc)' }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!canImport || importing}
                className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: canImport ? 'linear-gradient(135deg, #00BFFF, #0090cc)' : 'rgba(255,255,255,0.06)', color: canImport ? '#0a0a0a' : 'rgba(237,237,237,0.4)' }}
              >
                {importing ? `Importuji… ${progress} %` : `Importovat ${rows.length} poptávek`}
              </button>
              {!mapping['jmeno'] && (
                <p className="text-xs text-center mt-2" style={{ color: 'rgba(239,68,68,0.7)' }}>Musíš namapovat pole Jméno</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
