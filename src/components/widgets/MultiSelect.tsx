import { useEffect, useRef, useState } from "react";
import "./MultiSelect.css";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((o) => value.includes(o.value));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      onChange(value.filter((v) => !filtered.some((o) => o.value === v)));
    } else {
      const toAdd = filtered.map((o) => o.value).filter((v) => !value.includes(v));
      onChange([...value, ...toAdd]);
    }
  }

  function toggleItem(itemValue: string) {
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue));
    } else {
      onChange([...value, itemValue]);
    }
  }

  const triggerLabel =
    value.length === 0
      ? ""
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? value[0])
        : `${value.length} languages selected`;

  return (
    <div className="ms-wrap" ref={containerRef}>
      <button
        type="button"
        className={`ms-trigger${isOpen ? " ms-trigger--open" : ""}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`ms-trigger-label${!triggerLabel ? " ms-trigger-label--placeholder" : ""}`}>
          {triggerLabel || placeholder}
        </span>
        <svg className="ms-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="ms-dropdown" role="listbox" aria-multiselectable="true">
          <div className="ms-search-wrap">
            <input
              className="ms-search"
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <label className="ms-item ms-item--all">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
            />
            <span className="ms-item-label">Select All</span>
          </label>

          <div className="ms-divider" />

          <div className="ms-list">
            {filtered.length === 0 ? (
              <div className="ms-empty">No results</div>
            ) : (
              filtered.map((opt) => (
                <label key={opt.value} className="ms-item">
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => toggleItem(opt.value)}
                  />
                  <span className="ms-item-label">{opt.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
