import { useState, useRef, useEffect } from 'react';
import './FilterDropdown.css';

export type SortOption = 'relevance' | 'downloads' | 'stars';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'downloads', label: 'Most Downloads' },
  { value: 'stars', label: 'Most Stars' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = SORT_OPTIONS.find(o => o.value === value);

  return (
    <div className="filter-dropdown" ref={ref}>
      <button 
        className={`filter-trigger ${value !== 'relevance' ? 'filter-active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span>{selectedOption?.label || 'Sort'}</span>
        <ChevronIcon open={open} />
      </button>
      
      {open && (
        <div className="filter-menu sort-menu">
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`filter-option ${value === option.value ? 'filter-option-selected' : ''}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 12 12" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
    >
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}
