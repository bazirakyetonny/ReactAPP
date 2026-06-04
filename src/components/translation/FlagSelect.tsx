import { useState, useEffect, useRef } from "react";
import "./FlagSelect.css";
import type { SupportedLanguages } from "../../types";

interface FlagSelectProps {
  options: SupportedLanguages[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function FlagSelect({ options, value, onChange, disabled }: FlagSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={`fls-wrap${disabled ? " fls-disabled" : ""}`}
    >
      <button
        type="button"
        className="fls-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        {selected?.flag ? (
          <img
            src={selected.flag}
            alt={selected.label}
            className="fls-flag"
          />
        ) : (
          <span className="fls-code">{selected?.value?.toUpperCase()}</span>
        )}
      </button>

      {open && (
        <ul className="fls-dropdown" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`fls-option${opt.value === value ? " fls-option--active" : ""}`}
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.flag ? (
                <img src={opt.flag} alt={opt.label} className="fls-flag" />
              ) : (
                <span className="fls-code">{opt.value.toUpperCase()}</span>
              )}
              <span className="fls-label">{opt.value.toUpperCase()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
