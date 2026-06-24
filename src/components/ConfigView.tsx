import { useState } from 'react';
import type { AIConfig, Provider } from '../types';
import { getConfig, saveConfig, resetConfig } from '../services/storageService';
import { testAIConnection } from '../services/aiService';

interface ConfigViewProps {
  onConfigChange: (cfg: AIConfig) => void;
}

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'local', label: 'Local sin clave' },
  { value: 'gemini', label: 'Gemini API' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'huggingface', label: 'Hugging Face Router' },
];

export function ConfigView({ onConfigChange }: ConfigViewProps) {
  const [cfg, setCfg] = useState<AIConfig>(getConfig());
  const [status, setStatus] = useState(
    cfg.provider === 'local'
      ? 'Modo local: no se enviará información a servicios externos.'
      : `Conectado a: ${cfg.provider}`
  );
  const [statusType, setStatusType] = useState('');

  const handleSave = () => {
    saveConfig(cfg);
    onConfigChange(cfg);
    setStatus(
      cfg.provider === 'local'
        ? 'Modo local guardado.'
        : 'Configuración guardada. Prueba con el botón antes de generar material importante.'
    );
    setStatusType('ok');
  };

  const handleReset = () => {
    resetConfig();
    const fresh = { provider: 'local' as Provider, model: '', apiKey: '' };
    setCfg(fresh);
    onConfigChange(fresh);
    setStatus('Volviste a modo local sin API key.');
    setStatusType('ok');
  };

  const handleTest = async () => {
    handleSave();
    setStatus('Probando conexión...');
    setStatusType('');
    try {
      const txt = await testAIConnection(cfg);
      setStatus('Respuesta: ' + txt.slice(0, 220));
      setStatusType('ok');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setStatus(
        'No se pudo conectar. La app puede seguir en modo local. Detalle: ' + msg
      );
      setStatusType('bad');
    }
  };

  return (
    <div className="view" id="config">
      <div className="card">
        <h2>Conectar IA gratuita/opcional</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          La app funciona sin clave. Si agregas una API key, se guardará solo en este
          navegador. Si el proveedor bloquea CORS o supera cuota, la app vuelve al modo local.
        </p>
        <div className="grid">
          <div>
            <label>Proveedor</label>
            <select
              value={cfg.provider}
              onChange={(e) => setCfg((prev) => ({ ...prev, provider: e.target.value as Provider }))}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Modelo (opcional)</label>
            <input
              value={cfg.model}
              onChange={(e) => setCfg((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="Ej.: gemini-2.0-flash, openrouter/auto"
            />
          </div>
        </div>
        <label>API key</label>
        <input
          type="password"
          value={cfg.apiKey}
          onChange={(e) => setCfg((prev) => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Pega tu API key aquí si usarás proveedor externo"
        />
        <div className="btnrow">
          <button className="primary" onClick={handleSave}>Guardar configuración</button>
          <button className="secondary" onClick={handleTest}>Probar IA</button>
          <button className="danger" onClick={handleReset}>Volver a modo local</button>
        </div>
        <div className={`status ${statusType}`}>{status}</div>
      </div>

      <div className="card">
        <h3>Configuración avanzada</h3>
        <p className="muted" style={{ marginBottom: 10, fontSize: 13 }}>
          Importa o gestiona bases curriculares desde archivos JSON preparados con
          datos oficiales del Currículum Nacional MINEDUC. Los datos se almacenan solo en tu navegador.
        </p>
        <button className="secondary" onClick={() => window.location.hash = '#banco'}>
          Ir al importador curricular
        </button>
      </div>

      <div className="card">
        <h3>Generadores gratuitos externos que puedes usar con los prompts</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--muted)' }}>
          <li>Google AI Studio / Gemini: para texto, ideas y recursos.</li>
          <li>Hugging Face Spaces: para probar modelos abiertos.</li>
          <li>
            Canva, Adobe Express u otros editores gratuitos: para convertir prompts en
            afiches o infografías.
          </li>
          <li>
            Copilot, Gemini web o ChatGPT Free: puedes pegar los prompts generados sin
            conectar API.
          </li>
        </ul>
      </div>
    </div>
  );
}
