/** Scientific Notebook Product Renderer

A comprehensive notebook viewer for prebásica, básica, and media level scientific notebooks.
Features a modular, responsive, and printable design for displaying and interacting with notebook contents.
*/

import type { ClassroomScientificNotebook } from '../../../types/scientificNotebook';

// Import specific components for modularity
import { MaterialsGrid } from '../MaterialsGrid';
import { ProcedureTimeline } from '../ProcedureTimeline';
import { EditableTable } from '../EditableTable';
import { DrawingBox } from '../DrawingBox';
import { SelfAssessment } from '../SelfAssessment';
import { TeacherFeedbackBox } from '../TeacherFeedbackBox';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';

// Props interface for the ScientificNotebookRenderer
interface ScientificNotebookRendererProps {
  notebook: ClassroomScientificNotebook;
  className?: string;
  style?: React.CSSProperties;
}

// Main component that renders the scientific notebook based on the education level
export function ScientificNotebookRenderer({ 
  notebook, 
  className, 
  style 
}: ScientificNotebookRendererProps) {

  const evidenceGroups = [
    { key: 'photos' as const, label: 'Fotografías' },
    { key: 'audio' as const, label: 'Audio' },
    { key: 'video' as const, label: 'Video' },
    { key: 'attachments' as const, label: 'Archivos' },
  ];

  // Minimal schema validation
  const hasMinimumSchema = () => {
    const required = ['metadata', 'intro', 'materials', 'procedure', 'tables', 'questions', 'conclusion', 'assessment', 'portfolio'];
    return required.every(key => key in notebook);
  };

  if (!notebook) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No hay datos de bitácora para mostrar.</p>
      </div>
    );
  }

  if (!hasMinimumSchema()) {
    return (
      <div className="p-6 text-center bg-yellow-50 border border-yellow-200 rounded-xl">
        <svg className="w-12 h-12 mx-auto text-yellow-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Formato incompleto</h3>
        <p className="text-yellow-700 text-sm">
          No se pudo mostrar la bitácora porque el formato está incompleto.
        </p>
      </div>
    );
  }

  return (
    <div 
      className={`scientific-notebook-container max-w-4xl mx-auto p-4 md:p-6 lg:p-8 ${className || ''}`} 
      style={style}
    >
      {/* Header Section with title and metadata */}
      <ProductHeader 
        title={notebook.metadata.title}
        subtitle={notebook.metadata.subtitle}
        level={notebook.metadata.level}
        subject={notebook.metadata.subject}
        oaCode={notebook.metadata.oaCode}
        oaText={notebook.metadata.oaText}
        topic={notebook.metadata.topic}
        date={notebook.metadata.date}
        teacherName={notebook.metadata.teacherName}
        estimatedTime={notebook.metadata.estimatedTime}
        className="mb-6"
      />

      {/* Main Content Grid with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Introduction, Materials, Procedure, Drawing */}
        <div className="space-y-6">
          {/* Introduction Section */}
          <ProductSection title="Introducción" icon="📚">
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-indigo-700">¿Qué exploraremos hoy?:</span> {notebook.intro.motivatingQuestion}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed bg-indigo-50 p-3 rounded-lg">
                <span className="font-semibold text-indigo-700">Explicación amigable:</span> {notebook.intro.childFriendlyExplanation}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed bg-teal-50 p-3 rounded-lg">
                <span className="font-semibold text-teal-700">Instrucción visual:</span> {notebook.intro.visualPrompt}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed bg-amber-50 p-3 rounded-lg">
                <span className="font-semibold text-amber-700">¿Qué debemos tener en cuenta?:</span> {notebook.intro.priorKnowledgePrompt}
              </p>
            </div>
          </ProductSection>

          {/* Materials Section */}
          <ProductSection title="Materiales" icon="🧰">
            <MaterialsGrid materials={notebook.materials} />
          </ProductSection>

          {/* Procedure Section */}
          <ProductSection title="Procedimiento" icon="⏰">
            <ProcedureTimeline procedure={notebook.procedure} />
          </ProductSection>

          {/* Drawing Section */}
          <ProductSection title="Dibujo" icon="🎨">
            <DrawingBox 
              title={notebook.drawingAreas[0]?.title || "Espacio de Dibujo Principal"}
              instruction={notebook.drawingAreas[0]?.instruction || "Dibuja lo que observaste"}
              size={notebook.drawingAreas[0]?.size || 'large'}
              borderStyle={notebook.drawingAreas[0]?.borderStyle || 'solid'}
            />
          </ProductSection>
        </div>

        {/* Right Column: Advanced Sections */}
        <div className="space-y-6">
          {/* Table Section */}
          {notebook.tables.length > 0 && (
            <ProductSection title="Tabla de Datos" icon="📊">
              <EditableTable 
                title={notebook.tables[0]?.title || "Datos"}
                headers={notebook.tables[0]?.headers || []}
                rows={notebook.tables[0]?.rows || []}
                editable={false}
                studentFillable={true}
              />
            </ProductSection>
          )}

          {/* Hypothesis/Answer Section */}
          <ProductSection title="Hipótesis o Respuesta" icon="❓">
            {notebook.metadata.educationGroup === 'prebasica' ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold text-yellow-800">Nota importante:</span> Nivel Prebásica no tiene hipótesis científica formal. 
                  ¡Observa y comparte tus hallazgos!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {notebook.hypothesis.prompt || 'No hay hipótesis establecida para este nivel.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-semibold text-indigo-700">Pregunta:</span> {notebook.hypothesis.prompt}
                </p>
                {notebook.hypothesis.sentenceStarter && (
                  <p className="text-gray-600 text-sm">
                    <span className="font-semibold">Pista:</span> {notebook.hypothesis.sentenceStarter}
                  </p>
                )}
                {notebook.hypothesis.drawingOption && (
                  <p className="text-gray-600 text-sm">
                    <span className="font-semibold">Visualización opcional:</span> {notebook.hypothesis.drawingOption}
                  </p>
                )}
              </div>
            )}
          </ProductSection>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mt-8">
        <ProductSection title="Preguntas" icon="💬">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-2">¿Antes?</h4>
              <p className="text-gray-700 text-sm">{notebook.questions.before}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-2">¿Durante?</h4>
              <p className="text-gray-700 text-sm">{notebook.questions.during}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-2">¿Después?</h4>
              <p className="text-gray-700 text-sm">{notebook.questions.after}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-2">Nuevas Preguntas:</h4>
              <ul className="text-gray-700 text-sm list-disc list-inside">
                {notebook.questions.newQuestions.map((q: string, idx: number) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </ProductSection>
      </div>

      {/* Evidence Section */}
      <ProductSection title="Evidencias" icon="📸">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evidenceGroups.map(({ key, label }) => {
            const data = notebook.portfolio[key];
            if (!data || data.length === 0) return null;

            return (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-700 mb-2 capitalize">{label}</h4>
                <ul className="text-gray-700 text-sm list-disc list-inside">
                  {data.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </ProductSection>

      {/* Assessment Section */}
      <div className="mt-8">
        <ProductSection title="Evaluación" icon="✓">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checklist */}
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Lista de Cotejo</h4>
              <SelfAssessment checklist={notebook.assessment.checklist} />
            </div>
            {/* Self Assessment */}
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Autoevaluación</h4>
              <SelfAssessment checklist={notebook.assessment.selfAssessment} />
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold text-green-700 mb-2">Feedback Docente</h4>
            <TeacherFeedbackBox feedback={notebook.assessment.teacherFeedback} />
          </div>
        </ProductSection>
      </div>

      {/* Curriculum Reference Section */}
      <ProductSection title="Referencia Curricular" icon="📋">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">OA:</span> {notebook.metadata.oaCode} - {notebook.metadata.oaText}
          </p>
          <p className="text-gray-700 text-sm mt-1">
            <span className="font-semibold">Asignatura:</span> {notebook.metadata.subject}
          </p>
          <p className="text-gray-700 text-sm mt-1">
            <span className="font-semibold">Nivel educativo:</span> {notebook.metadata.educationGroup}
          </p>
        </div>
      </ProductSection>

      {/* Print Toolbar */}
      <div className="mt-8 print:hidden">
        <PrintToolbar 
          onPrint={() => window.print()} 
          onReset={() => {}} 
        />
      </div>
    </div>
  );
}