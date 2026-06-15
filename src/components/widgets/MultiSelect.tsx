import { useEffect, useRef, useState } from "react";
import "./MultiSelect.css";
import { CheckboxSpan } from './CheckboxSpan';
import { i18n } from "../../i18n/i18n";

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
  placeholder,
  searchPlaceholder,
}: MultiSelectProps) {
  const resolvedPlaceholder = placeholder ?? i18n.t("select");
  const resolvedSearchPlaceholder = searchPlaceholder ?? i18n.t("search");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    }

    // capture:true fires before any bubble-phase stopPropagation in parent components
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
      const toAdd = filtered
        .map((o) => o.value)
        .filter((v) => !value.includes(v));
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

  return (
    <div className="ms-wrap" ref={containerRef}>
      {/* Trigger — div with role=button so chip <button>s inside are valid HTML */}
      <div
        className={`ms-trigger${isOpen ? " ms-trigger--open" : ""}`}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((o) => !o);
          }
        }}
      >
        <div className="ms-chips">
          {value.length === 0 ? (
            <span className="ms-trigger-placeholder">{resolvedPlaceholder}</span>
          ) : (
            value.map((v) => {
              const label = options.find((o) => o.value === v)?.label ?? v;
              return (
                <span key={v} className="ms-chip">
                  <span className="ms-chip-label">{label}</span>
                  <button
                    type="button"
                    className="ms-chip-remove"
                    aria-label={`Remove ${label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(v);
                    }}
                  >
                    <svg
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="2" y1="2" x2="8" y2="8" />
                      <line x1="8" y1="2" x2="2" y2="8" />
                    </svg>
                  </button>
                </span>
              );
            })
          )}
        </div>

        <svg
          className="ms-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isOpen && (
        <div className="ms-dropdown" role="listbox" aria-multiselectable="true">
          <div className="ms-search-wrap">
            <input
              className="ms-search"
              type="text"
              placeholder={resolvedSearchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="ms-item ms-item--all" onClick={toggleSelectAll}>
            <CheckboxSpan checked={allFilteredSelected} onChange={toggleSelectAll} ariaLabel={i18n.t("sidebar.select_all")} />
            <span className="ms-item-label">{i18n.t("sidebar.select_all")}</span>
          </div>

          <div className="ms-divider" />

          <div className="ms-list">
            {filtered.length === 0 ? (
              <div className="ms-empty">No results</div>
            ) : (
              filtered.map((opt) => (
                <div key={opt.value} className="ms-item" onClick={() => toggleItem(opt.value)}>
                  <CheckboxSpan checked={value.includes(opt.value)} onChange={() => toggleItem(opt.value)} ariaLabel={opt.label} />
                  <span className="ms-item-label">{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
