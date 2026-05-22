import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/CreateAppVersionModal.css";
import type {
  AppVersion,
  CategoryTemplates,
  ThemeColors,
  ThemeIcon,
  SupportedLanguages,
} from "../../types";
import { dataStore } from "../../data/datastore";
import { AppVersionMoodSelection1 } from "./AppVersionMoodSelection1";
import { AppVersionMoodSelection2 } from "./AppVersionMoodSelection2";
import { MultiSelect } from "../widgets/MultiSelect";
import {
  createAppVersion,
  type SDTAppVersion,
} from "../../services/appVersionsApi";
import { AppVersionPreviewCard } from "./AppVersionPreviewCard";

interface CreateAppVersionModalProps {
  templatesCollection: CategoryTemplates[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  onClose: () => void;
  onCreated: (version: SDTAppVersion) => void;
}

const BLANK_ID = "__blank__";

export function CreateAppVersionModal({
  templatesCollection,
  themeColors,
  themeIcons,
  onClose,
  onCreated,
}: CreateAppVersionModalProps) {
  const filledCategories = templatesCollection.filter(
    (c) => c.Versions?.length > 0,
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(
    filledCategories[0]?.TemplateCategoryId ?? BLANK_ID,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const languages: SupportedLanguages[] =
    dataStore.get("SupportedLanguages") ?? [];

  const defaultLanguage: string = dataStore.get("Current_Language") ?? "";

  const [versionName, setVersionName] = useState("");
  const [versionLanguage, setVersionLanguage] = useState("");
  const [translateLanguages, setTranslateLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMood, setNoMood] = useState(false);

  const isBlank = selectedId === BLANK_ID;

  const activeCategory = filledCategories.find(
    (c) => c.TemplateCategoryId === activeTab,
  );

  // The template object matching the selection (null = blank)
  const selectedTemplate: AppVersion | null =
    selectedId && selectedId !== BLANK_ID
      ? (activeCategory?.Versions.find((v) => v.AppVersionId === selectedId) ??
        null)
      : null;

  function handleNext() {
    if (!selectedId) return;
    setSelectedMoodId(selectedTemplate?.MoodId ?? null);
    setError(null);
    if (selectedId === BLANK_ID) {
      setVersionName("");
      setVersionLanguage(defaultLanguage);
    }
    setStep(2);
  }

  function handleNextToDetails() {
    setVersionName(selectedTemplate?.AppVersionName ?? "");
    setVersionLanguage(selectedTemplate?.AppVersionLanguage ?? defaultLanguage);
    setError(null);
    setStep(3);
  }

  function handleBlankNext() {
    if (!versionName.trim()) { setError("Version name is required."); return; }
    if (!versionLanguage) { setError("Please select a base language."); return; }
    setError(null);
    setStep(3);
  }

  async function handleCreate() {
    const name = versionName.trim();
    if (!name) {
      setError("Version name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createAppVersion({
        AppVersionName: name,
        AppVersionLanguage: versionLanguage,
        TranslateLanguages: translateLanguages,
        MoodId: isBlank
            ? (noMood ? undefined : selectedMoodId ?? undefined)
            : (selectedMoodId ?? selectedTemplate?.MoodId),
        ThemeId: selectedTemplate?.ThemeId,
        VersionTemplatePagesCollection: selectedTemplate?.Pages ?? [],
        TemplateCategoryId: selectedTemplate?.TemplateCategoryId,
      });
      onCreated(result);
    } catch {
      setError("Failed to create version. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="cav-overlay" onMouseDown={onClose}>
      <div
        className={`cav-modal${step === 2 && !isBlank ? " cav-modal--wide" : ""}${step === 3 && isBlank ? " cav-modal--narrow" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cav-header">
          <span className="cav-title">New Version</span>
          <button
            className="cav-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {step === 1 /* template selection */ ? (
          <>
            {/* Category tabs */}
            {filledCategories.length > 0 && (
              <div className="cav-tabs">
                <div className="cav-tab-group" role="tablist">
                  {filledCategories.map((cat) => (
                    <button
                      key={cat.TemplateCategoryId}
                      className={`cav-tab${activeTab === cat.TemplateCategoryId ? " cav-tab--active" : ""}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === cat.TemplateCategoryId}
                      onClick={() => {
                        setActiveTab(cat.TemplateCategoryId);
                        setSelectedId(null);
                      }}
                    >
                      {cat.TemplateCategoryName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Template cards — blank always first */}
            <div className="cav-cards">
              <AppVersionPreviewCard
                version={null}
                isSelected={selectedId === BLANK_ID}
                onClick={() =>
                  setSelectedId(selectedId === BLANK_ID ? null : BLANK_ID)
                }
                name="Blank Version"
                description="Start from a clean canvas with no pre-existing content."
                themeColors={themeColors}
                themeIcons={themeIcons}
              />

              {activeCategory?.Versions.map((v) => (
                <AppVersionPreviewCard
                  key={v.AppVersionId}
                  version={v}
                  isSelected={selectedId === v.AppVersionId}
                  onClick={() =>
                    setSelectedId(
                      selectedId === v.AppVersionId ? null : v.AppVersionId,
                    )
                  }
                  name={v.AppVersionName}
                  description={v.AppVersionDescription}
                  themeColors={themeColors}
                  themeIcons={themeIcons}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="cav-footer">
              <button
                className="cav-btn-secondary"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="cav-btn-primary"
                type="button"
                disabled={!selectedId}
                onClick={handleNext}
              >
                Next →
              </button>
            </div>
          </>
        ) : step === 2 ? (
          isBlank ? (
            /* Blank flow — step 2: version details */
            <>
              <div className="cav-body">
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-name">
                    Version name <span className="cav-required">*</span>
                  </label>
                  <input
                    id="cav-name"
                    className="cav-input"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Summer Campaign"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-lang">
                    Base language <span className="cav-required">*</span>
                  </label>
                  <p className="cav-field-hint">
                    Select the base language for the app's translations.
                  </p>
                  <select
                    id="cav-lang"
                    className="cav-select"
                    value={versionLanguage}
                    onChange={(e) => setVersionLanguage(e.target.value)}
                  >
                    {languages?.length === 0 && (
                      <option value="">No languages available</option>
                    )}
                    {languages?.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-translate">
                    Translation languages{" "}
                    <span className="cav-optional">(optional)</span>
                  </label>
                  <p className="cav-field-hint">
                    Select additional languages for translation.
                  </p>
                  <MultiSelect
                    options={languages.map((l) => ({
                      value: l.value,
                      label: l.label,
                    }))}
                    value={translateLanguages}
                    onChange={setTranslateLanguages}
                  />
                </div>
                {error && <div className="cav-error">{error}</div>}
              </div>
              <div className="cav-footer">
                <button
                  className="cav-btn-secondary"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  className="cav-btn-primary"
                  type="button"
                  disabled={!versionName.trim() || !versionLanguage}
                  onClick={handleBlankNext}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            /* Non-blank flow — step 2: mood + phone preview */
            <>
              <AppVersionMoodSelection1
                template={selectedTemplate}
                baseThemeColors={themeColors}
                themeIcons={themeIcons ?? []}
                selectedMoodId={selectedMoodId}
                onMoodChange={setSelectedMoodId}
              />
              <div className="cav-footer">
                <button
                  className="cav-btn-secondary"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  className="cav-btn-primary"
                  type="button"
                  onClick={handleNextToDetails}
                >
                  Next →
                </button>
              </div>
            </>
          )
        ) : (
          isBlank ? (
            /* Blank flow — step 3: mood grid */
            <>
              <AppVersionMoodSelection2
                selectedMoodId={selectedMoodId}
                onMoodChange={setSelectedMoodId}
                noMood={noMood}
                onNoMoodChange={setNoMood}
              />
              <div className="cav-footer">
                <button
                  className="cav-btn-secondary"
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  className="cav-btn-primary"
                  type="button"
                  disabled={loading}
                  onClick={handleCreate}
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </>
          ) : (
            /* Non-blank flow — step 3: version details */
            <>
              <div className="cav-body">
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-name">
                    Version name <span className="cav-required">*</span>
                  </label>
                  <input
                    id="cav-name"
                    className="cav-input"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Summer Campaign"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-lang">
                    Base language <span className="cav-required">*</span>
                  </label>
                  <p className="cav-field-hint">
                    Select the base language for the app's translations.
                  </p>
                  <select
                    id="cav-lang"
                    className="cav-select"
                    value={versionLanguage}
                    onChange={(e) => setVersionLanguage(e.target.value)}
                  >
                    {languages?.length === 0 && (
                      <option value="">No languages available</option>
                    )}
                    {languages?.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-translate">
                    Translation languages{" "}
                    <span className="cav-optional">(optional)</span>
                  </label>
                  <p className="cav-field-hint">
                    Select additional languages for translation.
                  </p>
                  <MultiSelect
                    options={languages.map((l) => ({
                      value: l.value,
                      label: l.label,
                    }))}
                    value={translateLanguages}
                    onChange={setTranslateLanguages}
                  />
                </div>
                {error && <div className="cav-error">{error}</div>}
              </div>
              <div className="cav-footer">
                <button
                  className="cav-btn-secondary"
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  className="cav-btn-primary"
                  type="button"
                  disabled={loading || !versionName.trim() || !versionLanguage}
                  onClick={handleCreate}
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
