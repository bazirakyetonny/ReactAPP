import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/CreateAppVersionTemplateModal.css";
import type { CategoryTemplates } from "../../types";
import { dataStore } from "../../data/datastore";
import { AppVersionMoodSelection2 } from "./AppVersionMoodSelection2";
import {
  createAppVersion,
  type SDTAppVersion,
} from "../../services/appVersionsApi";
import { i18n } from "../../i18n/i18n";

interface CreateAppVersionTemplateModalProps {
  onClose: () => void;
  onCreated: (version: SDTAppVersion) => void;
}

export function CreateAppVersionTemplateModal({
  onClose,
  onCreated,
}: CreateAppVersionTemplateModalProps) {
  const userRoles: string[] = dataStore.get("UserRoles") ?? [];

  const templatesCollection: CategoryTemplates[] =
    dataStore.get("TemplatesCollection") ?? [];

  if (!userRoles.includes("Comforta Admin")) return null;

  const [step, setStep] = useState<1 | 2>(1);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNextToMood() {
    if (!templateName.trim()) {
      setError(i18n.t("navbar.appversion.template_name_required"));
      return;
    }
    if (!selectedCategoryId) {
      setError(i18n.t("navbar.appversion.category_required"));
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleCreate() {
    if (!selectedMoodId) {
      setError(i18n.t("navbar.appversion.mood_required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createAppVersion({
        AppVersionName: templateName.trim(),
        AppVersionDescription: templateDescription.trim(),
        TemplateCategoryId: selectedCategoryId,
        MoodId: selectedMoodId,
        VersionTemplatePagesCollection: [],
      });
      onCreated(result);
    } catch {
      setError(i18n.t("navbar.appversion.create_template_failed"));
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="catm-overlay" onMouseDown={onClose}>
      <div className="catm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="catm-header">
          <span className="catm-title">
            {i18n.t("navbar.appversion.new_template")}
          </span>
          <button
            className="catm-close"
            type="button"
            aria-label={i18n.t("navbar.share.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="catm-body">
              <p className="catm-step-heading">
                {i18n.t("navbar.appversion.template_name_and_description")}
              </p>
              <p className="catm-step-subheading">
                {i18n.t(
                  "navbar.appversion.enter_template_name_and_description",
                )}
              </p>

              <div className="catm-field">
                <label className="catm-label" htmlFor="catm-name">
                  {i18n.t("navbar.appversion.template_name")}{" "}
                  <span className="catm-required">*</span>
                </label>
                <input
                  id="catm-name"
                  className="catm-input"
                  type="text"
                  maxLength={100}
                  placeholder={i18n.t("navbar.appversion.enter_template_name")}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="catm-field">
                <label className="catm-label" htmlFor="catm-desc">
                  {i18n.t("navbar.appversion.template_description")}{" "}
                  <span className="catm-optional">
                    {i18n.t("optional_hint")}
                  </span>
                </label>
                <textarea
                  id="catm-desc"
                  className="catm-textarea"
                  maxLength={200}
                  placeholder={i18n.t(
                    "navbar.appversion.enter_template_description",
                  )}
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
                <span className="catm-char-count">
                  {templateDescription.length}/200
                </span>
              </div>

              <div className="catm-field">
                <label className="catm-label" htmlFor="catm-category">
                  {i18n.t("category")}{" "}
                  <span className="catm-required">*</span>
                </label>
                <select
                  id="catm-category"
                  className="catm-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">{i18n.t("select_category")}</option>
                  {templatesCollection.map((cat) => (
                    <option
                      key={cat.TemplateCategoryId}
                      value={cat.TemplateCategoryId}
                    >
                      {cat.TemplateCategoryName}
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className="catm-error">{error}</div>}
            </div>

            <div className="catm-footer">
              <button
                className="catm-btn-secondary"
                type="button"
                onClick={onClose}
              >
                {i18n.t("navbar.publish.modal_cancel")}
              </button>
              <button
                className="catm-btn-primary"
                type="button"
                disabled={!templateName.trim() || !selectedCategoryId}
                onClick={handleNextToMood}
              >
                {i18n.t("navbar.next")}
              </button>
            </div>
          </>
        ) : (
          <>
            <AppVersionMoodSelection2
              selectedMoodId={selectedMoodId}
              onMoodChange={setSelectedMoodId}
              noMood={false}
              onNoMoodChange={() => {}}
              hideNoMood
            />
            {error && (
              <div
                style={{
                  padding: "0 28px 8px",
                  fontSize: 12,
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}
            <div className="catm-footer">
              <button
                className="catm-btn-secondary"
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                disabled={loading}
              >
                {i18n.t("navbar.appversion.back")}
              </button>
              <button
                className="catm-btn-primary"
                type="button"
                disabled={loading || !selectedMoodId}
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
