import { Check, ChevronDown } from '../icons.jsx';
import { useEffect, useRef, useState } from 'react';

export function SelectMenu({ value, onChange, options = [], placeholder = '请选择', disabled = false, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`select-menu ${className}`.trim()} ref={rootRef}>
      <button
        className="select-menu-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label || placeholder}</span>
        <ChevronDown className={open ? 'chevron-open' : ''} size={16} />
      </button>
      {open && (
        <div className="select-menu-popover" role="listbox" aria-label={ariaLabel || placeholder}>
          {options.map((option) => {
            const active = String(option.value) === String(value);
            return (
              <button
                className={active ? 'active' : ''}
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange?.(option.value); setOpen(false); }}
              >
                <span>{option.label}</span>
                {active && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
