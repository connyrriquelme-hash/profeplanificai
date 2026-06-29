import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '', compact = false }: SearchInputProps) {
  return (
    <div className={`relative group ${className}`}>
      <Search
        size={compact ? 14 : 16}
        strokeWidth={2.25}
        className={`absolute top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500 ${
          compact ? 'left-3' : 'left-3.5'
        }`}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl bg-white border border-gray-200/80 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all shadow-sm ${
          compact ? 'h-9 pl-9 pr-8 text-xs' : 'h-10 pl-10 pr-10'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all ${
            compact ? 'right-2' : 'right-3'
          }`}
          aria-label="Limpiar búsqueda"
        >
          <X size={compact ? 12 : 14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
