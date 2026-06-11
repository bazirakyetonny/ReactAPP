import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/UpdateTranslationsModal.css";
import { CheckboxSpan } from '../widgets/CheckboxSpan';
import type { SupportedLanguages } from "../../types";
import { dataStore } from "../../data/datastore";
import { updateVersionTranslationLanguages } from "../../services/appVersionsApi";

interface UpdateTranslationsModalProps {
  versionId: string;
  versionName: string;
  baseLanguage: string;
  currentTranslateLanguages: string; // JSON-encoded string[]
  onClose: () => void;
  onUpdated: (selectedLanguages: string[]) => void;
}

function parseTranslateLanguages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function UpdateTranslationsModal({
  versionId,
  versionName,
  baseLanguage,
  currentTranslateLanguages,
  onClose,
  onUpdated,
}: UpdateTranslationsModalProps) {
  const languages: SupportedLanguages[] =
    dataStore.get("SupportedLanguages") ?? [];

  // Languages available for translation = all except the base language
  const translatable = languages.filter((l) => l.value !== baseLanguage);

  const baseLabel =
    languages.find((l) => l.value === baseLanguage)?.label ?? baseLanguage;

  const [selected, setSelected] = useState<string[]>(
    parseTranslateLanguages(currentTranslateLanguages),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateVersionTranslationLanguages(versionId, selected);
      onUpdated(selected);
    } catch {
      setError("Failed to update translation languages. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="utl-overlay" onMouseDown={onClose}>
      <div className="utl-modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="utl-header">
          <span className="utl-title">{versionName}</span>
          <button
            className="utl-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="utl-body">
          {/* Base language — read-only */}
          <div className="utl-field">
            <span className="utl-label">Version Default Language:</span>
            <div className="utl-base-lang">{baseLabel}</div>
          </div>

          {/* Translation checkboxes */}
          <div className="utl-field">
            <span className="utl-label">Translation Languages:</span>
            <div className="utl-check-list">
              {translatable.length === 0 ? (
                <p className="utl-empty">No other languages available.</p>
              ) : (
                translatable.map((lang) => (
                  <div key={lang.value} className="utl-check-item" onClick={() => toggle(lang.value)}>
                    <CheckboxSpan checked={selected.includes(lang.value)} onChange={() => toggle(lang.value)} ariaLabel={lang.label} />
                    <span>{lang.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && <div className="utl-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="utl-footer">
          <button
            className="utl-btn-primary"
            type="button"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            className="utl-btn-secondary"
            type="button"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body,
  );
}
