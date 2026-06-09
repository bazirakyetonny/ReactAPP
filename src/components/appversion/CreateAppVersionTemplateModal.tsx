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
    if (!templateName.trim()) { setError("Template name is required."); return; }
    if (!selectedCategoryId) { setError("Please select a category."); return; }
    setError(null);
    setStep(2);
  }

  async function handleCreate() {
    if (!selectedMoodId) { setError("Please select a color mood."); return; }
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
      setError("Failed to create template. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="catm-overlay" onMouseDown={onClose}>
      <div className="catm-modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="catm-header">
          <span className="catm-title">New Template</span>
          <button
            className="catm-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="catm-body">
              <p className="catm-step-heading">Template name and description</p>
              <p className="catm-step-subheading">
                Enter template name and description
              </p>

              <div className="catm-field">
                <label className="catm-label" htmlFor="catm-name">
                  Template name <span className="catm-required">*</span>
                </label>
                <input
                  id="catm-name"
                  className="catm-input"
                  type="text"
                  maxLength={100}
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="catm-field">
                <label className="catm-label" htmlFor="catm-desc">
                  Template description{" "}
                  <span className="catm-optional">(optional)</span>
                </label>
                <textarea
                  id="catm-desc"
                  className="catm-textarea"
                  maxLength={200}
                  placeholder="Enter template description (optional)"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
                <span className="catm-char-count">
                  {templateDescription.length}/200
                </span>
              </div>

              <div className="catm-field">
                <label className="catm-label" htmlFor="catm-category">
                  Category <span className="catm-required">*</span>
                </label>
                <select
                  id="catm-category"
                  className="catm-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">Select A category</option>
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
                Cancel
              </button>
              <button
                className="catm-btn-primary"
                type="button"
                disabled={!templateName.trim() || !selectedCategoryId}
                onClick={handleNextToMood}
              >
                Next →
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
              <div style={{ padding: "0 28px 8px", fontSize: 12, color: "#dc2626" }}>
                {error}
              </div>
            )}
            <div className="catm-footer">
              <button
                className="catm-btn-secondary"
                type="button"
                onClick={() => { setError(null); setStep(1); }}
                disabled={loading}
              >
                ← Back
              </button>
              <button
                className="catm-btn-primary"
                type="button"
                disabled={loading || !selectedMoodId}
                onClick={handleCreate}
              >
                {loading ? "Creating…" : "Create"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById("root") ?? document.body);
}
