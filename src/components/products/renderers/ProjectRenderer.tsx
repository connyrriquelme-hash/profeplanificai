/** Project Renderer */

import React from 'react';
import { ProductHeader } from '../ProductHeader';
import { ProductSection } from '../ProductSection';
import { PrintToolbar } from '../PrintToolbar';
import type { PedagogicalProduct, ProjectTask } from '../types';

interface ProjectRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
}

export function ProjectRenderer({ product, className, style }: ProjectRendererProps) {
  const { metadata, data } = product;
  const tasks = (data.tasks as ProjectTask[]) || [];
  const roles = (data.roles as Array<{ name: string; description: string }>) || [];
  const products = (data.products as string[]) || [];
  const objective = data.objective as string | undefined;
  const phases = (data.phases as Array<{ name: string; duration: string; tasks: string[] }>) || [];
  const evaluationCriteria = (data.evaluationCriteria as string[]) || [];

  return (
    <div
      className={`project-renderer max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || 'Proyecto de Aprendizaje'}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        topic={metadata.topic}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
      />

      {objective && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-1">Objetivo del Proyecto</h3>
          <p className="text-indigo-700 text-sm">{objective}</p>
        </div>
      )}

      {roles.length > 0 && (
        <ProductSection title="Roles del Equipo" icon="👥">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map((role, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-800">{role.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{role.description}</p>
              </div>
            ))}
          </div>
        </ProductSection>
      )}

      {phases.length > 0 && (
        <ProductSection title="Cronograma" icon="📅">
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={index} className="relative pl-8">
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                {index < phases.length - 1 && (
                  <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-indigo-200" />
                )}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-800">{phase.name}</h4>
                    <span className="text-xs text-gray-500">{phase.duration}</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.tasks.map((task, ti) => (
                      <li key={ti} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-indigo-400 mt-0.5">▸</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </ProductSection>
      )}

      {tasks.length > 0 && (
        <ProductSection title="Tareas" icon="📝">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="grid" aria-label="Tareas del proyecto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tarea</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Responsable</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plazo</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{task.task}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.responsible || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.deadline || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {task.status || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ProductSection>
      )}

      {products.length > 0 && (
        <ProductSection title="Productos Esperados" icon="📦">
          <ul className="space-y-2">
            {products.map((product, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-500 mt-0.5">◆</span>
                {product}
              </li>
            ))}
          </ul>
        </ProductSection>
      )}

      {evaluationCriteria.length > 0 && (
        <ProductSection title="Criterios de Evaluación" icon="✓">
          <ul className="space-y-2">
            {evaluationCriteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                <span className="text-green-500 mt-0.5">✓</span>
                {criterion}
              </li>
            ))}
          </ul>
        </ProductSection>
      )}

      <div className="print:hidden">
        <PrintToolbar onPrint={() => window.print()} onReset={() => {}} />
      </div>
    </div>
  );
}