import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Ara...',
  className,
}) => (
  <div className={cn('relative', className)}>
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const SelectFilter: React.FC<SelectFilterProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Tümü',
  className,
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={cn(
      'bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all cursor-pointer',
      className
    )}
  >
    <option value="" className="bg-bg">{placeholder}</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value} className="bg-bg">
        {opt.label}
      </option>
    ))}
  </select>
);
