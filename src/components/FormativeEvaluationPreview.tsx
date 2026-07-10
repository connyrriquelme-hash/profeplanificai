import { useMemo } from 'react';
import type { PremiumSlide, SubjectTheme } from '../utils/premiumPptModel';
import { getSubjectTheme } from '../utils/premiumPptModel';

const SUBJECT_ICONS: Record<string, string> = {
  'celula': '🧬', 'planta': '🌱', 'semilla': '🌱', 'flor': '🌸', 'poliniz': '🐝',
  'animal': '🦋', 'ecosistema': '🌿', 'ciclo': '🔄', 'fotosintesis': '☀️',
  'numero': '🔢', 'suma': '➕', 'resta': '➖', 'multiplic': '✖️', 'divis': '➗',
  'fraccion': '📊', 'geometr': '📐', 'figura': '🔷', 'angulo': '📐',
  'texto': '📖', 'lectura': '📖', 'escritura': '✍️', 'palabra': '🔤', 'cuento': '📚', 'historia': '📜',
  'personaje': '👤', 'narrativa': '📝', 'poema': '🎭', 'rima': '🎵',
  'mapa': '🗺️', 'chile': '🇨🇱', 'indigena': '🏞️', 'colonia': '⛪', 'independencia': '🎖️',
  'ingles': '🇬🇧', 'english': '🇬🇧', 'vocabulario': '📝', 'gramatica': '📐',
  'color': '🎨', 'forma': '🔷', 'textura': '🖌️', 'composicion': '🖼️', 'dibujo': '✏️', 'pintura': '🖌️',
  'ritmo': '🥁', 'melodia': '🎵', 'instrumento': '🎸', 'cancion': '🎤', 'partitura': '🎼',
  'movimiento': '🏃', 'deporte': '⚽', 'ejercicio': '💪', 'salud': '❤️', 'equipo': '🤝',
  'tecnologia': '💻', 'programa': '💻', 'robot': '🤖', 'diseno': '🎨', 'prototipo': '🔧',
  'filosof': '🤔', 'etica': '⚖️', 'argumento': '💬', 'pregunta': '❓', 'razon': '🧠',
  'fuerza': '⚡', 'energia': '⚡', 'onda': '🌊', 'luz': '💡', 'electricidad': '⚡',
  'atomo': '⚛️', 'molecula': '🧪', 'reaccion': '⚗️', 'elemento': '🧪',
  'ciudadan': '🏛️', 'derecho': '⚖️', 'deber': '📋', 'participa': '🗳️', 'comunidad': '👥', 'convivencia': '🤝',
  'identidad': '👶', 'cuerpo': '🤸',
};

function hexToCss(hex: string): string {
  return `#${hex}`;
}

function getSubjectIcon(keyword: string): string {
  const kw = keyword.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (kw.includes(key)) return icon;
  }
  return '📚';
}

interface FormativeEvaluationPreviewProps {
  evaluation: any;
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
}

function FormativeEvaluationPreview({
  evaluation,
  level,
  subject,
  objectiveCode,
  objectiveText,
  topic,
}: FormativeEvaluationPreviewProps) {
  const theme = useMemo(() => getSubjectTheme(subject), [subject]);
  const subType = evaluation?.evaluationSubType;

  const renderContent = () => {
    switch (subType) {
      case 'evaluation_exit_ticket':
        return renderExitTicket();
      case 'evaluation_321':
        return render321Format();
      case 'evaluation_checklist':
        return renderChecklist();
      case 'evaluation_formative_rubric':
        return renderFormativeRubric();
      case 'evaluation_traffic_light':
        return renderTrafficLight();
      default:
        return renderDefault();
    }
  };

  const renderExitTicket = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎫</span>
          <h3 className="text-lg font-bold text-gray-900">Ticket de Salida</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{evaluation.instructions || 'Completa antes de salir de clase. Responde con honestidad.'}</p>
        <div className="space-y-4">
          {evaluation.questions?.map((q: any, i: number) => (
            <div key={i} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pregunta {q.number || i + 1}: {q.question}
              </label>
              {q.type === 'traffic_light' && (
                <div className="flex gap-2 flex-wrap">
                  {q.options?.map((opt: string, j: number) => (
                    <label key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name={`q${i}`} className="text-violet-600 focus:ring-violet-500" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'open' && (
                <textarea
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-none"
                  rows={3}
                  placeholder="Tu respuesta..."
                />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" placeholder="Tu nombre" />
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );

  const render321Format = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">3️⃣</span>
          <h3 className="text-lg font-bold text-gray-900">Formato 3-2-1</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{evaluation.instructions || 'Completa cada sección con tus propias palabras.'}</p>
        <div className="space-y-4">
          {evaluation.sections?.map((s: any) => (
            <div key={s.number} className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">{s.number}</span>
                <h4 className="font-semibold text-gray-800">{s.title}</h4>
              </div>
              <p className="text-xs text-gray-500 ml-8 mb-1">{s.description}</p>
              <div className="space-y-1 ml-8">
                {Array.from({ length: s.lines || 3 }, (_, i) => (
                  <input
                    key={i}
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none"
                    placeholder={`Escribe aquí...`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" placeholder="Tu nombre" />
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderChecklist = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✅</span>
          <h3 className="text-lg font-bold text-gray-900">Lista de Cotejo / Autoevaluación</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{evaluation.instructions || 'Marca cada criterio según tu desempeño: Sí / No / En proceso'}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-8">#</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Criterio</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 w-20">✅ Sí</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 w-28">⚠️ En proceso</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 w-20">❌ No</th>
              </tr>
              </thead>
              <tbody>
                {evaluation.criteria?.map((c: any) => (
                  <tr key={c.number} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 font-medium">{c.number}</td>
                    <td className="px-3 py-2 text-gray-700">{c.description}</td>
                    <td className="px-3 py-2 text-center"><input type="radio" name={`c${c.number}`} className="text-green-600 focus:ring-green-500" /></td>
                    <td className="px-3 py-2 text-center"><input type="radio" name={`c${c.number}`} className="text-yellow-600 focus:ring-yellow-500" /></td>
                    <td className="px-3 py-2 text-center"><input type="radio" name={`c${c.number}`} className="text-red-600 focus:ring-red-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {evaluation.summaryRow && (
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
              <p className="text-sm font-medium text-indigo-800">Resumen: Cuenta tus respuestas para ver tu progreso</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" placeholder="Tu nombre" />
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
        </div>
    </div>
  );

  const renderFormativeRubric = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900">Rúbrica Analítica Formativa</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{evaluation.instructions || 'Evalúa cada criterio marcando el nivel alcanzado. Escribe retroalimentación específica.'}</p>
        <div className="space-y-4">
          {evaluation.criteria?.map((c: any) => (
            <div key={c.number} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">{c.number}</span>
                <h4 className="font-semibold text-gray-800">{c.name}</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">{c.indicator} — {c.skill}</p>
              <div className="space-y-2">
                {c.levels?.map((l: any) => (
                  <label key={l.level} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name={`c${c.number}`} className="text-indigo-600 focus:ring-indigo-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{l.level}</span>
                        <span className="text-sm text-gray-500">{l.points} pt</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{l.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {c.feedbackRequired && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Retroalimentación obligatoria:</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-none"
                    rows={2}
                    placeholder="Escribe retroalimentación específica para este criterio..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
          <p className="text-sm font-medium text-indigo-800">Total máximo: {evaluation.totalScore || 9} puntos</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" placeholder="Tu nombre" />
        </div>
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
          <input type="date" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
        </div>
      </div>
    </div>
  );

  const renderTrafficLight = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚦</span>
          <h3 className="text-lg font-bold text-gray-900">Semáforo de Comprensión</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{evaluation.instructions || 'Marca el color que representa tu nivel de comprensión para cada aspecto.'}</p>
        <div className="space-y-4">
          {evaluation.aspects?.map((a: any) => (
            <div key={a.number} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">{a.number}</span>
                <p className="font-medium text-gray-800">{a.description}</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">{a.indicator}</p>
              <div className="grid grid-cols-3 gap-2">
                {evaluation.colors?.map((col: any) => (
                  <label key={col.color} className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-violet-400 cursor-pointer transition-colors">
                    <input type="radio" name={`a${a.number}`} className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium">{col.color}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 p-2 rounded-lg bg-gray-50 text-xs text-gray-600">
                <strong>Significado:</strong> {evaluation.colors?.map((col: any) => `${col.color}: ${col.meaning} — ${col.action}`).join(' | ')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" placeholder="Tu nombre" />
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefault = () => (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl overflow-auto max-h-[500px]">{JSON.stringify(evaluation, null, 2)}</pre>
    </div>
  );

  return (
    <div className="prose prose-sm max-w-none">
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
          <span className="text-xl">{getSubjectIcon(topic)}</span>
        </div>
        <div>
          <h2 className="font-bold text-gray-900" style={{ color: `#${theme.text}` }}>{evaluation.title || 'Evaluación Formativa'}</h2>
          <p className="text-sm text-gray-500">{level} — {subject} — {objectiveCode}</p>
        </div>
      </div>

      {evaluation.subtitle && (
        <div className="text-sm italic mb-4" style={{ color: `#${theme.text}99` }}>
          {evaluation.subtitle}
        </div>
      )}

      <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: theme.primary + '20', color: `#${theme.primary}` }}>
          {evaluation.type?.replace('_', ' ') || 'formativa'}
        </span>
        {evaluation.evaluationSubType && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: theme.secondary + '20', color: `#${theme.secondary}` }}>
            Subtipo: {evaluation.evaluationSubType}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {renderContent()}
      </div>

      {evaluation.teacherNotes && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-medium text-amber-800 mb-1">📝 Notas para el docente:</p>
          <p className="text-xs text-amber-800">{evaluation.teacherNotes}</p>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">Datos curriculares:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span><strong>Nivel:</strong> {level}</span>
          <span><strong>Asignatura:</strong> {subject}</span>
          <span><strong>OA:</strong> {objectiveCode}</span>
          <span><strong>Tema:</strong> {topic}</span>
        </div>
      </div>
    </div>
  );
}

export default FormativeEvaluationPreview;