import { useState } from 'react';
import { Sparkles, Layers, FileEdit, Users, X } from 'lucide-react';

interface CreativeHubProps {
  onSelect: (tipo: string) => void;
}

const ACTIONS = [
  { tipo: 'leccion', icon: Sparkles, title: 'Lección individual', desc: 'Una lección puntual', color: '#6d5dfc' },
  { tipo: 'serie', icon: Layers, title: 'Serie de lecciones', desc: 'Varias lecciones sobre un tema', color: '#00a7a7' },
  { tipo: 'fichas', icon: FileEdit, title: 'Fichas de actividades', desc: 'Fichas de tareas listas para imprimir', color: '#f59e0b' },
];

export function CreativeHub({ onSelect }: CreativeHubProps) {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">¿Qué creamos hoy? ✨</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {ACTIONS.map(({ tipo, icon: Icon, title, desc, color }) => (
          <div
            key={tipo}
            onClick={() => onSelect(tipo)}
            className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
            >
              <Icon size={24} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)] mb-1">{title}</h3>
            <p className="text-sm text-[var(--muted)]">{desc}</p>
          </div>
        ))}
      </div>

      {isBannerVisible && (
        <div className="relative rounded-3xl bg-[#fffcf5] border border-orange-200/60 p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <button
            className="absolute top-3 right-3 p-1 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-100 transition-colors"
            onClick={() => setIsBannerVisible(false)}
            aria-label="Cerrar banner"
          >
            <X size={16} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Users size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-orange-900 mb-1">ProfePlanificaI es mejor en equipo</h3>
            <p className="text-sm text-orange-700 leading-relaxed">
              Comparte y remixea lecciones con tus colegas para crear mejores planificaciones juntos.
            </p>
          </div>
          <button className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
            Crear un equipo
          </button>
        </div>
      )}
    </div>
  );
}
