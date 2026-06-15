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
import { applyMoodColorRemapToPages } from "../../utils/contentTransforms";
import { AppVersionPreviewCard } from "./AppVersionPreviewCard";
import { i18n } from "../../i18n/i18n";

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
  // Match by value (code) first, then by label — ensures we always store a code, not a display name.
  const defaultLanguageCode: string =
    languages.find(
      (l) => l.value === defaultLanguage || l.label === defaultLanguage,
    )?.value ??
    languages[0]?.value ??
    "";

  const [versionName, setVersionName] = useState("");
  const [versionLanguage, setVersionLanguage] = useState("");
  const [translateLanguages, setTranslateLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMood, setNoMood] = useState(false);

  // Options for the translation MultiSelect — exclude the selected base language
  const translateOptions = languages
    .filter((l) => l.value !== versionLanguage)
    .map((l) => ({ value: l.value, label: l.label }));

  function handleLanguageChange(lang: string) {
    setVersionLanguage(lang);
    setTranslateLanguages((prev) => prev.filter((v) => v !== lang));
  }

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

  function handleNext(id: string) {
    const template: AppVersion | null =
      id !== BLANK_ID
        ? (activeCategory?.Versions.find((v) => v.AppVersionId === id) ?? null)
        : null;
    const moods: { MoodId: string }[] = dataStore.get("Moods") ?? [];
    const templateMoodId = template?.MoodId ?? "";
    const moodExists = moods.some((m) => m.MoodId === templateMoodId);
    setSelectedId(id);
    console.log("Selected template:", template);
    setSelectedMoodId(moodExists ? templateMoodId : (moods[0]?.MoodId ?? null));
    setError(null);
    if (id === BLANK_ID) {
      setVersionName("");
      setVersionLanguage(defaultLanguageCode);
    }
    setStep(2);
  }

  function handleNextToDetails() {
    setVersionName(selectedTemplate?.AppVersionName ?? "");
    setVersionLanguage(
      selectedTemplate?.AppVersionLanguage ?? defaultLanguageCode,
    );
    setError(null);
    setStep(3);
  }

  function handleBlankNext() {
    if (!versionName.trim()) {
      setError(i18n.t("navbar.appversion.version_name_required"));
      return;
    }
    if (!versionLanguage) {
      setError(i18n.t("navbar.appversion.base_language_required"));
      return;
    }
    setError(null);
    setStep(3);
  }

  async function handleCreate() {
    const name = versionName.trim();
    if (!name) {
      setError(i18n.t("navbar.appversion.version_name_required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const moods: { MoodId: string; MoodColorNames?: string }[] =
        dataStore.get("Moods") ?? [];
      const templatePages = selectedTemplate?.Pages ?? [];
      let pages = templatePages;
      if (
        !isBlank &&
        selectedTemplate?.MoodId &&
        selectedMoodId &&
        selectedMoodId !== selectedTemplate.MoodId
      ) {
        const originalMood = moods.find(
          (m) => m.MoodId === selectedTemplate.MoodId,
        );
        const selectedMood = moods.find((m) => m.MoodId === selectedMoodId);
        let originalNames: string[] = [];
        let selectedNames: string[] = [];
        try {
          originalNames = JSON.parse(originalMood?.MoodColorNames ?? "[]");
        } catch {
          /* */
        }
        try {
          selectedNames = JSON.parse(selectedMood?.MoodColorNames ?? "[]");
        } catch {
          /* */
        }
        pages = applyMoodColorRemapToPages(
          templatePages,
          originalNames,
          selectedNames,
        );
      }
      const result = await createAppVersion({
        AppVersionName: name,
        AppVersionLanguage: versionLanguage,
        TranslateLanguages: translateLanguages.filter(
          (l) => l !== versionLanguage,
        ),
        MoodId: isBlank
          ? noMood
            ? undefined
            : (selectedMoodId ?? undefined)
          : (selectedMoodId ?? selectedTemplate?.MoodId),
        ThemeId: selectedTemplate?.ThemeId,
        VersionTemplatePagesCollection: pages,
        TemplateCategoryId: selectedTemplate?.TemplateCategoryId,
      });
      onCreated(result);
    } catch {
      setError(i18n.t("navbar.appversion.create_failed"));
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
          <span className="cav-title">
            {i18n.t("navbar.appversion.create_new")}
          </span>
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
                onClick={() => handleNext(BLANK_ID)}
                name={i18n.t("navbar.appversion.blank_version")}
                description={i18n.t(
                  "navbar.appversion.blank_version_description",
                )}
                themeColors={themeColors}
                themeIcons={themeIcons}
              />

              {activeCategory?.Versions.map((v) => (
                <AppVersionPreviewCard
                  key={v.AppVersionId}
                  version={v}
                  isSelected={selectedId === v.AppVersionId}
                  onClick={() => handleNext(v.AppVersionId)}
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
                {i18n.t("navbar.appversion.cancel")}
              </button>
              <button
                className="cav-btn-primary"
                type="button"
                disabled={!selectedId}
                onClick={() => handleNext(selectedId!)}
              >
                {i18n.t("navbar.next")}
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
                    {i18n.t("navbar.appversion.version_name")}{" "}
                    <span className="cav-required">*</span>
                  </label>
                  <input
                    id="cav-name"
                    className="cav-input"
                    type="text"
                    maxLength={100}
                    placeholder={i18n.t("navbar.appversion.version_name")}
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="cav-field">
                  <label className="cav-label" htmlFor="cav-lang">
                    {i18n.t("navbar.appversion.base_language")}{" "}
                    <span className="cav-required">*</span>
                  </label>
                  <p className="cav-field-hint">
                    {i18n.t("navbar.appversion.base_language_hint")}
                  </p>
                  <select
                    id="cav-lang"
                    className="cav-select"
                    value={versionLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    {languages?.length === 0 && (
                      <option value="">
                        {i18n.t("navbar.appversion.no_languages")}
                      </option>
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
                    {i18n.t("navbar.appversion.translation_languages_label")}{" "}
                    <span className="cav-optional">({i18n.t("optional")})</span>
                  </label>
                  <p className="cav-field-hint">
                    {i18n.t("navbar.appversion.translation_languages_hint")}
                  </p>
                  <MultiSelect
                    options={translateOptions}
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
                  {i18n.t("navbar.appversion.back")}
                </button>
                <button
                  className="cav-btn-primary"
                  type="button"
                  disabled={!versionName.trim() || !versionLanguage}
                  onClick={handleBlankNext}
                >
                  {i18n.t("navbar.next")}
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
                  {i18n.t("navbar.appversion.back")}
                </button>
                <button
                  className="cav-btn-primary"
                  type="button"
                  onClick={handleNextToDetails}
                >
                  {i18n.t("navbar.next")}
                </button>
              </div>
            </>
          )
        ) : isBlank ? (
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
                Back
              </button>
              <button
                className="cav-btn-primary"
                type="button"
                disabled={loading}
                onClick={handleCreate}
              >
                {loading
                  ? i18n.t("navbar.appversion.creating")
                  : i18n.t("navbar.appversion.create")}
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
                  onChange={(e) => handleLanguageChange(e.target.value)}
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
                  options={translateOptions}
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
                Back
              </button>
              <button
                className="cav-btn-primary"
                type="button"
                disabled={loading || !versionName.trim() || !versionLanguage}
                onClick={handleCreate}
              >
                {loading
                  ? i18n.t("navbar.appversion.creating")
                  : i18n.t("navbar.appversion.create")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body,
  );
}
