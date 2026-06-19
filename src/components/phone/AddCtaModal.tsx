import { useState } from "react";
import ReactDOM from "react-dom";
import { dataStore } from "../../data/datastore";
import "./AddCtaModal.css";
import { i18n } from "../../i18n/i18n";
import { validateWeblinkUrl, normalizeYoutubeUrl } from "../../utils/urlValidators";

interface CtaConfirmAttrs {
  CtaLabel: string;
  CtaAction: string;
  CtaConnectedSupplierId?: string;
  CtaSupplierIsConnected: boolean;
}

interface AddCtaModalProps {
  ctaType: string;
  onConfirm: (attrs: CtaConfirmAttrs) => void;
  onCancel: () => void;
  hideSupplier?: boolean;
}

function validatePhone(v: string): string | null {
  return /^[+]?[\d\s\-(). ]{6,20}$/.test(v.trim())
    ? null
    : i18n.t("cta_modal_forms.phone_error");
}
function validateEmail(v: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
    ? null
    : i18n.t("cta_modal_forms.email_error_addr");
}
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return "https://" + trimmed.slice(7);
  return "https://" + trimmed;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return "https://" + trimmed.slice(7);
  return "https://" + trimmed;
}

function prefill(
  ctaType: string,
  supplier: any,
  defaultLabels: Record<string, string>,
): { label: string; action: string } {
  const companyName =
    supplier.SupplierGenCompanyName || supplier.SupplierGenContactName || "";
  switch (ctaType) {
    case "Phone":
      return {
        label: defaultLabels.Phone,
        action: supplier.SupplierGenContactPhone ?? "",
      };
    case "Email":
      return {
        label: defaultLabels.Email,
        action: supplier.SupplierGenEmail ?? "",
      };
    case "Weblink":
      return {
        label: companyName || defaultLabels.Weblink,
        action: normalizeUrl(supplier.SupplierGenWebsite ?? ""),
      };
    case "Address": {
      const parts = [
        supplier.SupplierGenAddressLine1,
        supplier.SupplierGenAddressCity,
        supplier.SupplierGenAddressCountry,
      ].filter(Boolean);
      return { label: defaultLabels.Address, action: parts.join(", ") };
    }
    default:
      return { label: defaultLabels[ctaType] ?? "Button", action: "" };
  }
}

function hasValueForType(ctaType: string, s: any, allForms: any[]): boolean {
  switch (ctaType) {
    case "Phone":
      return !!s.SupplierGenContactPhone?.trim();
    case "Email":
      return !!s.SupplierGenEmail?.trim();
    case "Weblink":
      return !!s.SupplierGenWebsite?.trim();
    case "Address":
      return !!s.SupplierGenAddressLine1?.trim();
    case "Form":
      return allForms.some((f) => f.SupplierId === s.SupplierGenId);
    default:
      return true;
  }
}

export function AddCtaModal({
  ctaType,
  onConfirm,
  onCancel,
  hideSupplier = false,
}: AddCtaModalProps) {
  const suppliers: any[] = dataStore.get("Suppliers") ?? [];
  const allForms: any[] = dataStore.get("SDT_DynamicFormsCollection") ?? [];

  const config: Record<
    string,
    {
      title: string;
      actionLabel: string;
      actionPlaceholder: string;
      validate: (v: string) => string | null;
    }
  > = {
    Phone: {
      title: i18n.t("cta_modal_forms.phone.modal_title"),
      actionLabel: i18n.t("cta_modal_forms.phone.field_label"),
      actionPlaceholder: "+31 6 1234 5678",
      validate: validatePhone,
    },
    Email: {
      title: i18n.t("cta_modal_forms.email.modal_title"),
      actionLabel: i18n.t("cta_modal_forms.email.field_label"),
      actionPlaceholder: "you@example.com",
      validate: validateEmail,
    },
    Weblink: {
      title: i18n.t("cta_modal_forms.web_link.modal_title"),
      actionLabel: i18n.t("cta_modal_forms.web_link.url_label"),
      actionPlaceholder: "https://example.com",
      validate: validateWeblinkUrl,
    },
    Address: {
      title: i18n.t("cta_modal_forms.address.modal_title"),
      actionLabel: i18n.t("cta_modal_forms.address.field_label"),
      actionPlaceholder: "Street, City, Country",
      validate: (v) =>
        v.trim() ? null : i18n.t("cta_modal_forms.address_required"),
    },
    Form: {
      title: i18n.t("cta_modal_forms.form.modal_title"),
      actionLabel: i18n.t("cta_modal_forms.form.field_label"),
      actionPlaceholder: "",
      validate: (v) =>
        v.trim() ? null : i18n.t("cta_modal_forms.form_required"),
    },
  };

  const defaultLabels: Record<string, string> = {
    Phone: i18n.t("cta_modal_forms.phone.default_label"),
    Email: i18n.t("cta_modal_forms.email.default_label"),
    Weblink: i18n.t("cta_modal_forms.web_link.default_label"),
    Address: i18n.t("cta_modal_forms.address.default_label"),
    Form: i18n.t("cta_modal_forms.form.default_label"),
  };

  const cfg = config[ctaType] ?? config.Form;
  const filteredSuppliers = suppliers.filter((s) =>
    hasValueForType(ctaType, s, allForms),
  );
  const isForm = ctaType === "Form";

  const [supplierId, setSupplierId] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");
  const [label, setLabel] = useState(defaultLabels[ctaType] ?? "");
  const [action, setAction] = useState("");
  const [error, setError] = useState<string | null>(null);

  const forms = supplierId
    ? allForms.filter((f) => String(f.SupplierId) === supplierId)
    : allForms;

  function handleFormChange(formId: string) {
    setSelectedFormId(formId);
    setError(null);
    const form = forms.find((f) => f.FormId?.toString() === formId);
    if (form) {
      setAction(form.FormUrl);
      if (!label || label === defaultLabels.Form) setLabel(form.PageName);
    } else {
      setAction("");
    }
  }

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setError(null);
    if (isForm) {
      setSelectedFormId("");
      setAction("");
      setLabel(defaultLabels.Form);
      return;
    }
    if (id) {
      const s = suppliers.find((s) => s.SupplierGenId === id);
      if (s) {
        const { label: pl, action: pa } = prefill(ctaType, s, defaultLabels);
        setLabel(pl);
        setAction(pa);
      }
    }
  }

  function handleClearSupplier() {
    setSupplierId("");
    setLabel(defaultLabels[ctaType] ?? "");
    setAction("");
    if (isForm) setSelectedFormId("");
    setError(null);
  }

  const canSave = action.trim() !== "" && label.trim() !== "";

  function handleSave() {
    const err = cfg.validate(action);
    if (err) {
      setError(err);
      return;
    }
    const trimmed = action.trim();
    onConfirm({
      CtaLabel: label.trim(),
      CtaAction:
        ctaType === "Weblink" && /youtube\.com/i.test(trimmed)
          ? normalizeYoutubeUrl(trimmed)
          : trimmed,
      CtaConnectedSupplierId: supplierId || undefined,
      CtaSupplierIsConnected: !!supplierId,
    });
  }

  function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  return ReactDOM.createPortal(
    <div className="acm-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="acm-modal">
        <div className="acm-header">
          <span className="acm-title">{cfg.title}</span>
          <button
            className="acm-close"
            type="button"
            aria-label={i18n.t("navbar.share.close")}
            title={i18n.t("navbar.share.close")}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="acm-body">
          {!hideSupplier && (
            <>
              <label className="acm-label">
                {i18n.t("cta_modal_forms.connect_supplier_label")}{" "}
                <span className="acm-optional">({i18n.t("optional")})</span>
              </label>
              <div className="acm-select-wrap">
                <select
                  className="acm-select"
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  <option value="">
                    {i18n.t("cta_modal_forms.select_supplier_placeholder")}
                  </option>
                  {filteredSuppliers.map((s) => (
                    <option key={s.SupplierGenId} value={s.SupplierGenId}>
                      {s.SupplierGenCompanyName || s.SupplierGenContactName}
                    </option>
                  ))}
                </select>
                {supplierId && (
                  <button
                    className="acm-select-clear"
                    type="button"
                    title={i18n.t("cta_modal_forms.clear_supplier")}
                    onClick={handleClearSupplier}
                  >
                    ×
                  </button>
                )}
              </div>
            </>
          )}

          <label className="acm-label">{cfg.actionLabel}</label>
          {isForm ? (
            <div className="acm-select-wrap">
              <select
                className={`acm-select${error ? " acm-input--error" : ""}`}
                value={selectedFormId}
                onChange={(e) => handleFormChange(e.target.value)}
              >
                <option value="">
                  {i18n.t("cta_modal_forms.select_form_placeholder")}
                </option>
                {forms.map((f) => (
                  <option key={f.FormId} value={f.FormId?.toString()}>
                    {f.PageName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input
              className={`acm-input${error ? " acm-input--error" : ""}`}
              type="text"
              placeholder={cfg.actionPlaceholder}
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setError(null);
              }}
            />
          )}
          {error && <span className="acm-error">{error}</span>}

          <label className="acm-label">{i18n.t("cta_modal_forms.label")}</label>
          <input
            className="acm-input"
            type="text"
            placeholder={defaultLabels[ctaType] ?? "Button"}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div className="acm-footer">
          <button
            className="acm-btn acm-btn--primary"
            type="button"
            onClick={handleSave}
            disabled={!canSave}
          >
            {i18n.t("cta_modal_forms.save")}
          </button>
          <button
            className="acm-btn acm-btn--secondary"
            type="button"
            onClick={onCancel}
          >
            {i18n.t("cta_modal_forms.cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("root") ?? document.body,
  );
}
