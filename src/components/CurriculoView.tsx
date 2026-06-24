import { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, ClipboardEdit, FileText, Copy, Star, Filter, Upload, Download, ChevronDown, ChevronUp, Check, ExternalLink, Sparkles, Eye, EyeOff, AlertTriangle, Database, RefreshCw, Trash2 } from 'lucide-react';
import { searchCurriculum, getNiveles, getCursos, getAsignaturas, getEjes, getFavoritos, isFavorito, toggleFavorito, setSelectedCurriculumItem, getAutoSuggestions } from '../services/curriculumService';
import { generateActividadAligned, generateEvalFromIndicadores } from '../services/localGenerator';
import { generarConIA } from '../services/aiService';
import { validateCurriculumJSON, saveImportedData, getImportedData, clearImportedData, exportCurriculumJSON, getImportStats, countImported } from '../services/curriculumImportService';
import type { CurriculumItem, AutoSuggestion } from '../types';
import type { ImportValidationResult } from '../services/curriculumImportService';

interface CurriculoViewProps {
  onNavigate: (view: string) => void;
}

export function CurriculoView({ onNavigate }: CurriculoViewProps) {
  const [search, setSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');
  const [asigFilter, setAsigFilter] = useState('');
  const [ejeFilter, setEjeFilter] = useState('');
  const [tab, setTab] = useState<'buscar' | 'favoritos'>('buscar');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<CurriculumItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importTab, setImportTab] = useState<'subir' | 'gestionar'>('subir');
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<ImportValidationResult | null>(null);
  const [importSaved, setImportSaved] = useState<CurriculumItem[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [generating, setGenerating] = useState<'actividad' | 'evaluacion' | null>(null);
  const [genOutput, setGenOutput] = useState('');
  const [genTitle, setGenTitle] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [minimalView, setMinimalView] = useState(false);

  const ejes = useMemo(() => getEjes(asigFilter || undefined), [asigFilter]);

  useEffect(() => {
    if (tab === 'favoritos') {
      setFavorites(getFavoritos());
    }
  }, [tab]);

  const results = useMemo(() =>
    searchCurriculum(search, {
      nivel: nivelFilter || undefined,
      curso: cursoFilter || undefined,
      asignatura: asigFilter || undefined,
      eje: ejeFilter || undefined,
    }),
    [search, nivelFilter, cursoFilter, asigFilter, ejeFilter]
  );

  const focusedItem: CurriculumItem | undefined = useMemo(() => {
    if (!focusedId) return undefined;
    return results.find((i) => i.id === focusedId) || getFavoritos().find((i) => i.id === focusedId);
  }, [focusedId, results]);

  const suggestions: AutoSuggestion | null = useMemo(() => {
    if (!focusedItem) return null;
    return getAutoSuggestions(focusedItem);
  }, [focusedItem]);

  const toggleFocus = (id: string) => {
    setFocusedId(focusedId === id ? null : id);
    setShowOutput(false);
    setGenOutput('');
  };

  const handleFavorito = (id: string) => {
    toggleFavorito(id);
    if (tab === 'favoritos') {
      setFavorites(getFavoritos());
    }
  };

  const handleUse = (item: CurriculumItem, target: string) => {
    setSelectedCurriculumItem(item);
    onNavigate(target);
  };

  const handleCopy = async (item: CurriculumItem) => {
    const text = `**${item.id}** — ${item.asignatura} — ${item.curso}\n${item.oa}\n\nHabilidades: ${item.habilidad}\nIndicadores:\n${item.indicadores.map((i) => `- ${i}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    setImportedCount(countImported());
    setImportSaved(getImportedData());
  }, []);

  const handlePreview = () => {
    const result = validateCurriculumJSON(importText);
    setImportPreview(result);
  };

  const handleSaveImport = () => {
    if (!importPreview || importPreview.items.length === 0) return;
    saveImportedData(importPreview.items);
    setImportedCount(countImported());
    setImportSaved(getImportedData());
    setImportTab('gestionar');
  };

  const handleClearImported = () => {
    if (!confirm('¿Eliminar todos los datos curriculares importados? Esta acción no se puede deshacer.')) return;
    clearImportedData();
    setImportedCount(0);
    setImportSaved([]);
    setImportPreview(null);
    setImportText('');
  };

  const handleExportBase = () => {
    const all = getImportedData();
    if (all.length === 0) {
      alert('No hay datos importados para exportar.');
      return;
    }
    const json = exportCurriculumJSON(all);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculo-importado-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
      const result = validateCurriculumJSON(text);
      setImportPreview(result);
    };
    reader.readAsText(file);
  };

  const handleGenerarActividad = async () => {
    if (!focusedItem) return;
    setGenerating('actividad');
    setShowOutput(true);
    setGenTitle(`Actividad alineada — ${focusedItem.asignatura} — ${focusedItem.id}`);

    const nivel = focusedItem.curso;
    const asignatura = focusedItem.asignatura;
    const act = focusedItem.actividadesSugeridas;

    try {
      const cfgStr = localStorage.getItem('planificaia_cfg');
      const cfg = cfgStr ? JSON.parse(cfgStr) : { provider: 'local' };
      const prompt = buildActividadPrompt(focusedItem, nivel, asignatura);

      if (cfg.provider !== 'local' && cfg.apiKey) {
        const result = await generarConIA({
          tipo: 'planificacion',
          nivel,
          asignatura,
          oa: focusedItem.oa,
          promptExt: prompt,
          onStatus: () => {},
        });
        if (result.ok && result.texto) {
          setGenOutput(result.texto);
          setGenerating(null);
          return;
        }
      }

      const local = generateActividadAligned(focusedItem, nivel, asignatura, focusedItem.eje);
      setGenOutput(local);
    } catch {
      const local = generateActividadAligned(focusedItem, nivel, asignatura, focusedItem.eje);
      setGenOutput(local);
    }
    setGenerating(null);
  };

  const handleGenerarEvaluacion = async () => {
    if (!focusedItem) return;
    setGenerating('evaluacion');
    setShowOutput(true);
    setGenTitle(`Evaluación desde indicadores — ${focusedItem.asignatura} — ${focusedItem.id}`);

    const nivel = focusedItem.curso;
    const asignatura = focusedItem.asignatura;

    try {
      const cfgStr = localStorage.getItem('planificaia_cfg');
      const cfg = cfgStr ? JSON.parse(cfgStr) : { provider: 'local' };
      const prompt = buildEvalPrompt(focusedItem, nivel, asignatura);

      if (cfg.provider !== 'local' && cfg.apiKey) {
        const result = await generarConIA({
          tipo: 'evaluacion',
          nivel,
          asignatura,
          oa: focusedItem.oa,
          promptExt: prompt,
          onStatus: () => {},
        });
        if (result.ok && result.texto) {
          setGenOutput(result.texto);
          setGenerating(null);
          return;
        }
      }

      const local = generateEvalFromIndicadores(focusedItem, nivel, asignatura);
      setGenOutput(local);
    } catch {
      const local = generateEvalFromIndicadores(focusedItem, nivel, asignatura);
      setGenOutput(local);
    }
    setGenerating(null);
  };

  const fuenteTag = (item: CurriculumItem) => {
    const colors: Record<string, { bg: string; text: string }> = {
      ejemplo_editable: { bg: '#e0f2fe', text: '#0369a1' },
      docente: { bg: '#ede9fe', text: '#6d28d9' },
      oficial: { bg: '#dcfce7', text: '#166534' },
      oficial_importado: { bg: '#fef3c7', text: '#92400e' },
      docente_personalizado: { bg: '#fce7f3', text: '#9d174d' },
    };
    const c = colors[item.fuente] || colors.ejemplo_editable;
    const labels: Record<string, string> = {
      ejemplo_editable: 'OA de ejemplo — Editable por docente',
      docente: 'Creado por docente',
      oficial: 'Fuente oficial cargada',
      oficial_importado: 'Importado desde base oficial MINEDUC',
      docente_personalizado: 'Personalizado por docente',
    };
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 8,
        fontSize: 11, fontWeight: 600, background: c.bg, color: c.text,
      }}>
        {labels[item.fuente] || item.fuente}
      </span>
    );
  };

  const renderCard = (item: CurriculumItem) => {
    const isFocused = focusedId === item.id;
    const fav = isFavorito(item.id);
    const copied = copiedId === item.id;
    const sug = isFocused ? getAutoSuggestions(item) : null;

    return (
      <div key={item.id} className="card" style={{
        marginBottom: 12, padding: 14,
        borderLeft: isFocused ? '3px solid var(--primary)' : '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              {fuenteTag(item)}
              <code style={{ fontSize: 11, color: 'var(--muted)' }}>{item.id}</code>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              <span>{item.curso}</span>
              <span>·</span>
              <span>{item.asignatura}</span>
              <span>·</span>
              <span>{item.eje}</span>
            </div>
          </div>
          <button
            onClick={() => handleFavorito(item.id)}
            className="ghost"
            style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer' }}
            title={fav ? 'Quitar favorito' : 'Marcar favorito'}
          >
            <Star size={16} fill={fav ? '#f59e0b' : 'none'} color={fav ? '#f59e0b' : 'var(--muted)'} />
          </button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.5 }}>
          {item.oa}
        </p>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Habilidades:</label>
          <p style={{ fontSize: 13, color: 'var(--ink)' }}>{item.habilidad}</p>
        </div>

        <div className="btnrow" style={{ marginTop: 8 }}>
          <button className="small secondary" onClick={() => handleUse(item, 'planificador')} title="Usar este OA en el planificador">
            <ClipboardEdit size={12} /> Planificar
          </button>
          <button className="small secondary" onClick={() => handleUse(item, 'recursos')} title="Usar este OA para crear recursos">
            <BookOpen size={12} /> Recurso
          </button>
          <button className="small secondary" onClick={() => handleUse(item, 'evaluaciones')} title="Usar este OA para evaluaciones">
            <FileText size={12} /> Evaluación
          </button>
          <button className="small secondary" onClick={() => handleUse(item, 'docente')}>
            <ExternalLink size={12} /> Docente
          </button>
          <button className="small ghost" onClick={() => handleCopy(item)} title="Copiar OA al portapapeles">
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button className="small primary" onClick={() => toggleFocus(item.id)}>
            {isFocused ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {isFocused ? 'Ocultar sugerencias' : 'Ver sugerencias'}
          </button>
        </div>

        {isFocused && sug && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--surface)', borderRadius: 8, fontSize: 13 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={14} color="var(--primary)" /> Sugerencias automáticas
            </h4>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Propósito de aprendizaje</label>
              <p style={{ color: 'var(--ink)' }}>{sug.proposito}</p>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Habilidad principal</label>
              <p style={{ color: 'var(--ink)' }}>{sug.habilidadPrincipal}</p>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Indicadores evaluables</label>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {sug.indicadores.map((ind, i) => <li key={i}>{ind}</li>)}
              </ul>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Tipo de actividad</label>
                <p style={{ color: 'var(--ink)' }}>{sug.tipoActividad}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Instrumento de evaluación</label>
                <p style={{ color: 'var(--ink)' }}>{sug.instrumentoEvaluacion}</p>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Criterios de logro</label>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {sug.criteriosLogro.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Recursos sugeridos</label>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {sug.recursosSugeridos.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Adecuaciones DUA</label>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {sug.adecuacionesDUA.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>

            <div className="btnrow" style={{ marginTop: 10 }}>
              <button
                className="primary small"
                onClick={handleGenerarActividad}
                disabled={generating !== null}
                title="Generar actividad pedagógica alineada al OA"
              >
                <Sparkles size={12} />
                {generating === 'actividad' ? 'Generando...' : 'Generar actividad alineada'}
              </button>
              <button
                className="secondary small"
                onClick={handleGenerarEvaluacion}
                disabled={generating !== null}
                title="Generar evaluación desde los indicadores del OA"
              >
                <FileText size={12} />
                {generating === 'evaluacion' ? 'Generando...' : 'Generar evaluación desde indicadores'}
              </button>
              <button className="small ghost" onClick={() => toggleFocus(item.id)}>
                <ChevronUp size={12} /> Cerrar
              </button>
            </div>
          </div>
        )}

        {isFocused && showOutput && focusedId === item.id && genOutput && (
          <div style={{ marginTop: 12, padding: 14, background: 'var(--card-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} /> {genTitle}
              </h4>
              <div className="btnrow">
                <button className="small ghost" onClick={() => { navigator.clipboard.writeText(genOutput); }}>
                  <Copy size={12} /> Copiar
                </button>
                <button className="small ghost" onClick={() => setShowOutput(false)}>
                  <EyeOff size={12} /> Ocultar
                </button>
              </div>
            </div>
            <pre style={{
              fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              maxHeight: 400, overflowY: 'auto',
              background: 'var(--surface)', padding: 12, borderRadius: 6,
            }}>
              {genOutput}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="view" id="banco">
      <div className="module-header">
        <h2 className="module-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} />
          Banco Curricular Chileno
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {results.length} OA
          </span>
          <button className="small ghost" onClick={() => setMinimalView(!minimalView)} title={minimalView ? 'Vista completa' : 'Vista minimalista'}>
            {minimalView ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>

      <div className="card" style={{
        marginBottom: 14, padding: '10px 14px', fontSize: 13,
        borderLeft: '3px solid var(--warning)', background: 'var(--warning-bg)',
      }}>
        <strong>Estos OA son ejemplos editables.</strong>{' '}
        <span className="muted">
          Para uso formal, importa o pega los OA oficiales del Currículum Nacional MINEDUC.
        </span>
      </div>

      <div className="btnrow" style={{ marginBottom: 14 }}>
        <button className={`tab-btn${tab === 'buscar' ? ' active' : ''}`} onClick={() => setTab('buscar')}>
          <Search size={14} /> Buscar OA
        </button>
        <button className={`tab-btn${tab === 'favoritos' ? ' active' : ''}`} onClick={() => setTab('favoritos')}>
          <Star size={14} /> Favoritos ({getFavoritos().length})
        </button>
        <button className={`tab-btn${importText || importPreview ? ' active' : ''}`} onClick={() => { setImportText(''); setImportPreview(null); setImportTab('subir'); }}>
          <Upload size={14} /> Importar{importedCount > 0 ? ` (${importedCount})` : ''}
        </button>
        <button className="tab-btn" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={14} /> Filtros
        </button>
      </div>

      {(importText || importPreview || importedCount > 0) && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="btnrow" style={{ marginBottom: 10 }}>
            <button className={`tab-btn${importTab === 'subir' ? ' active' : ''}`} onClick={() => setImportTab('subir')}>
              <Upload size={14} /> Subir y validar
            </button>
            <button className={`tab-btn${importTab === 'gestionar' ? ' active' : ''}`} onClick={() => setImportTab('gestionar')}>
              <Database size={14} /> Gestionar importados ({importedCount})
            </button>
          </div>

          {importTab === 'subir' && (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={16} /> Importar currículum desde JSON
              </h3>
              <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 10, fontSize: 12 }}>
                <p>
                  <strong>⚠️ Aviso importante:</strong> Este importador solo acepta archivos JSON preparados
                  a partir de <strong>recursos oficiales del Currículum Nacional MINEDUC</strong> descargados
                  manualmente por el/la docente. No se realiza scraping automático de sitios web.
                  Verifica que tus datos provengan de fuentes ministeriales confiables
                  (curriculumnacional.mineduc.cl) antes de importar.
                </p>
              </div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Pega el JSON curricular o sube un archivo .json. Los OA se validan, normalizan y
                almacenan en tu navegador. Puedes combinar múltiples importaciones.
              </p>

              <div className="btnrow" style={{ marginBottom: 8 }}>
                <label className="primary small" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Upload size={12} /> Seleccionar archivo .json
                  <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportPreview(null); }}
                placeholder='Pega aquí el JSON curricular o usa el botón "Seleccionar archivo"'
                style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
              />

              <div className="btnrow" style={{ marginTop: 8 }}>
                <button className="primary" onClick={handlePreview} disabled={!importText.trim()}>
                  <Search size={14} /> Validar y previsualizar
                </button>
                <button className="ghost" onClick={() => { setImportText(''); setImportPreview(null); }}>
                  Limpiar
                </button>
              </div>

              {importPreview && (
                <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {importPreview.errors.length > 0 && !importPreview.valid && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, marginBottom: 10 }}>
                      <h4 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={14} /> Errores de validación
                      </h4>
                      <div style={{ maxHeight: 150, overflowY: 'auto', fontSize: 12 }}>
                        {importPreview.errors.map((err, i) => (
                          <p key={i} style={{ marginBottom: 2 }}>
                            <strong>Ítem #{err.index >= 0 ? err.index + 1 : 'N/A'}</strong> — {err.campo}: {err.mensaje}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {importPreview.duplicados.length > 0 && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: 10, marginBottom: 10, fontSize: 12 }}>
                      <strong>IDs duplicados:</strong> {importPreview.duplicados.join(', ')} — se actualizarán con los datos más recientes.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13 }}>
                    <span><strong>Total en archivo:</strong> {importPreview.total}</span>
                    <span style={{ color: '#16a34a' }}><strong>Válidos:</strong> {importPreview.validCount}</span>
                    {importPreview.errorCount > 0 && (
                      <span style={{ color: '#dc2626' }}><strong>Con errores:</strong> {importPreview.errorCount}</span>
                    )}
                  </div>

                  {importPreview.validCount > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <h4>Vista previa ({importPreview.validCount} items)</h4>
                      <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--surface)' }}>
                              <th style={{ padding: '4px 8px', textAlign: 'left' }}>ID</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left' }}>Curso</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left' }}>Asignatura</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left' }}>Eje</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left' }}>Fuente</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left' }}>OA (resumen)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.items.slice(0, 50).map((item, i) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '4px 8px' }}><code>{item.id}</code></td>
                                <td style={{ padding: '4px 8px' }}>{item.curso}</td>
                                <td style={{ padding: '4px 8px' }}>{item.asignatura}</td>
                                <td style={{ padding: '4px 8px' }}>{item.eje}</td>
                                <td style={{ padding: '4px 8px' }}>{item.fuente}</td>
                                <td style={{ padding: '4px 8px', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.oa}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {importPreview.validCount > 50 && (
                          <p className="muted" style={{ marginTop: 4 }}>... y {importPreview.validCount - 50} items más</p>
                        )}
                      </div>
                    </div>
                  )}

                  {importPreview.validCount > 0 && (
                    <div className="btnrow">
                      <button className="primary" onClick={handleSaveImport}>
                        <Database size={14} /> Guardar {importPreview.validCount} OA en el navegador
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {importTab === 'gestionar' && importedCount > 0 && (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={16} /> Base curricular importada
              </h3>

              <div style={{ marginBottom: 10, fontSize: 13 }}>
                <p><strong>Total de OA importados:</strong> {importedCount}</p>
                {(() => {
                  const stats = getImportStats(importSaved);
                  return (
                    <>
                      {Object.keys(stats.porFuente).length > 0 && (
                        <p><strong>Por fuente:</strong> {Object.entries(stats.porFuente).map(([k, v]) => `${k} (${v})`).join(', ')}
                        </p>
                      )}
                      {Object.keys(stats.porAsignatura).length > 0 && (
                        <p><strong>Por asignatura:</strong> {Object.entries(stats.porAsignatura).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="btnrow">
                <button className="secondary" onClick={handleExportBase}>
                  <Download size={14} /> Exportar base como JSON
                </button>
                <button className="danger" onClick={handleClearImported}>
                  <Trash2 size={14} /> Limpiar base importada
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showFilters && tab === 'buscar' && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h4 style={{ marginBottom: 8 }}>Filtros curriculares</h4>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            <div>
              <label>Nivel</label>
              <select value={nivelFilter} onChange={(e) => { setNivelFilter(e.target.value); setCursoFilter(''); setAsigFilter(''); setEjeFilter(''); }}>
                <option value="">Todos los niveles</option>
                {getNiveles().map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label>Curso</label>
              <select value={cursoFilter} onChange={(e) => setCursoFilter(e.target.value)}>
                <option value="">Todos los cursos</option>
                {getCursos().filter((c) => !nivelFilter || (nivelFilter === 'Educación Parvularia' ? ['Prekinder', 'Kinder'].includes(c) : nivelFilter === 'Educación Básica' ? c.includes('básico') : c.includes('medio'))).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Asignatura</label>
              <select value={asigFilter} onChange={(e) => { setAsigFilter(e.target.value); setEjeFilter(''); }}>
                <option value="">Todas</option>
                {getAsignaturas().map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label>Eje</label>
              <select value={ejeFilter} onChange={(e) => setEjeFilter(e.target.value)}>
                <option value="">Todos</option>
                {ejes.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'buscar' && (
        <>
          <div className="search-bar" style={{ marginBottom: 14 }}>
            <span className="search-icon"><Search size={14} /></span>
            <input
              placeholder="Buscar por OA, habilidad, indicador, palabra clave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={32} />
              <p>No se encontraron OA con los filtros actuales.</p>
              <p className="muted">Intenta con otros términos o limpia los filtros.</p>
              <button className="secondary" onClick={() => { setSearch(''); setNivelFilter(''); setCursoFilter(''); setAsigFilter(''); setEjeFilter(''); }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div style={{ maxHeight: minimalView ? 'calc(100vh - 300px)' : 'none', overflowY: minimalView ? 'auto' : 'visible' }}>
              {results.map(renderCard)}
            </div>
          )}
        </>
      )}

      {tab === 'favoritos' && (
        <div>
          {favorites.length === 0 ? (
            <div className="empty-state">
              <Star size={32} />
              <p>No tienes OA favoritos aún.</p>
              <p className="muted">Marca OA como favoritos usando el ícono de estrella.</p>
            </div>
          ) : (
            favorites.map(renderCard)
          )}
        </div>
      )}

      <div className="card">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Database size={14} /> Gestión de base curricular
        </h4>
        <p className="muted" style={{ fontSize: 12 }}>
          <strong>Favoritos:</strong> Guarda OA marcados con estrella en tu navegador.{' '}
          <strong>Importación:</strong> Sube archivos JSON preparados desde recursos oficiales MINEDUC
          (curriculumnacional.mineduc.cl). Los datos se almacenan solo en tu navegador.{' '}
          <strong>Fuentes:</strong> Los OA importados se etiquetan como "oficial_importado" o
          "docente_personalizado" para trazabilidad.{' '}
          Al seleccionar "Ver sugerencias" sobre un OA, se muestran sugerencias pedagógicas automáticas.
        </p>
      </div>
    </div>
  );
}

function buildActividadPrompt(item: CurriculumItem, nivel: string, asignatura: string): string {
  return [
    `Eres un/una docente chileno/a experto/a. Genera una actividad pedagógica COMPLETA para ${nivel} en ${asignatura}.`,
    '',
    `OA: ${item.id} — ${item.oa}`,
    `Eje: ${item.eje}`,
    `Habilidad: ${item.habilidad}`,
    `Indicadores: ${item.indicadores.join('; ')}`,
    ...(item.conocimientos.length ? [`Conocimientos: ${item.conocimientos.join(', ')}`] : []),
    ...(item.actitudes.length ? [`Actitudes: ${item.actitudes.join(', ')}`] : []),
    '',
    `La actividad debe incluir obligatoriamente:`,
    `1. Título de la actividad`,
    `2. OA seleccionado`,
    `3. Habilidad a desarrollar`,
    `4. Indicadores de evaluación`,
    `5. Inicio (activación, propósito, vocabulario clave)`,
    `6. Desarrollo (modelaje, práctica guiada, trabajo individual) con actividades sugeridas`,
    `7. Preguntas de mediación docente`,
    `8. Diferenciación para estudiantes descendidos`,
    `9. Adaptación DUA (Representación, Acción, Participación)`,
    `10. Evidencia de aprendizaje`,
    `11. Evaluación formativa con indicadores e instrumento`,
    `12. Retroalimentación sugerida por nivel de logro`,
    '',
    `Usa formato Markdown con secciones ## y **negritas** para énfasis.`,
    `Sé específico/a, práctico/a y aplicable al aula chilena.`,
  ].join('\n');
}

function buildEvalPrompt(item: CurriculumItem, nivel: string, asignatura: string): string {
  return [
    `Eres un/una docente chileno/a experto/a. Genera una evaluación COMPLETA para ${nivel} en ${asignatura}, basada en los siguientes indicadores.`,
    '',
    `OA: ${item.id} — ${item.oa}`,
    `Habilidad: ${item.habilidad}`,
    `Indicadores de evaluación: ${item.indicadores.map((ind, i) => `${i + 1}. ${ind}`).join('\n')}`,
    '',
    `La evaluación debe incluir obligatoriamente:`,
    `1. Instrucciones claras para el/la estudiante`,
    `2. Preguntas o tareas para cada indicador (una por indicador mínimo)`,
    `3. Indicador evaluado en cada pregunta/tarea`,
    `4. Habilidad medida en cada pregunta`,
    `5. Pauta de corrección detallada (tabla)`,
    `6. Niveles de logro (Destacado, Esperado, En Proceso, Por Lograr)`,
    `7. Retroalimentación por nivel de logro`,
    `8. Reforzamiento sugerido para quienes no logren el OA`,
    '',
    `Usa formato Markdown con secciones ## y **negritas** para énfasis.`,
    `Sé específico/a y práctico/a.`,
  ].join('\n');
}
