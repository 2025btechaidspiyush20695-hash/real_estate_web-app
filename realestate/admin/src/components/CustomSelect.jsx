import React, { useEffect, useRef, useState } from 'react';
import { IconChevronDown, IconCheck } from '../icons';

/**
 * Professional custom dropdown — replaces native <select>
 * - click outside / Esc se close
 * - selected option pe checkmark
 * - smooth animation, scrollable list
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select…', icon, className = '', size }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div className={`cs ${open ? 'open' : ''} ${size ? `cs-${size}` : ''} ${className}`} ref={ref}>
      <button type="button" className="cs-trigger" onClick={() => setOpen((o) => !o)}>
        {icon && <span className="cs-icon">{icon}</span>}
        <span className={`cs-value ${current ? '' : 'placeholder'}`}>{current ? current.label : placeholder}</span>
        <IconChevronDown size={16} className="cs-chevron" />
      </button>
      {open && (
        <div className="cs-menu" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              className={`cs-option ${value === opt.value ? 'on' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
              {value === opt.value && <IconCheck size={15} />}
            </button>
          ))}
          {options.length === 0 && <p className="cs-empty">No options</p>}
        </div>
      )}
    </div>
  );
}
