import { useState } from 'react';
import ReactDOM from 'react-dom';
import { dataStore } from '../../data/datastore';
import './AddCtaModal.css';

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
  return /^[+]?[\d\s\-(). ]{6,20}$/.test(v.trim()) ? null : 'Enter a valid phone number';
}
function validateEmail(v: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email address';
}
function validateUrl(v: string): string | null {
  return /^https?:\/\/.+/.test(v.trim()) ? null : 'Enter a valid URL starting with http:// or https://';
}

const CONFIG: Record<string, { title: string; actionLabel: string; actionPlaceholder: string; validate: (v: string) => string | null }> = {
  Phone:   { title: 'Add Phone Number',  actionLabel: 'Phone Number',  actionPlaceholder: '+31 6 1234 5678',        validate: validatePhone },
  Email:   { title: 'Add Email',         actionLabel: 'Email Address', actionPlaceholder: 'you@example.com',        validate: validateEmail },
  Weblink: { title: 'Add Web Link',      actionLabel: 'URL',           actionPlaceholder: 'https://example.com',    validate: validateUrl },
  Address: { title: 'Add Address',       actionLabel: 'Address',       actionPlaceholder: 'Street, City, Country',  validate: v => v.trim() ? null : 'Address is required' },
  Form:    { title: 'Add Form',          actionLabel: 'Form',          actionPlaceholder: '',                       validate: v => v.trim() ? null : 'Please select a form' },
};

const DEFAULT_LABELS: Record<string, string> = {
  Phone: 'Call us', Email: 'Email us', Weblink: 'Visit website', Address: 'Find us', Form: 'Fill form',
};

function prefill(ctaType: string, supplier: any): { label: string; action: string } {
  const companyName = supplier.SupplierGenCompanyName || supplier.SupplierGenContactName || '';
  switch (ctaType) {
    case 'Phone':   return { label: 'Call us',        action: supplier.SupplierGenContactPhone ?? '' };
    case 'Email':   return { label: 'Email us',       action: supplier.SupplierGenEmail ?? '' };
    case 'Weblink': return { label: companyName || 'Visit website', action: supplier.SupplierGenWebsite ?? '' };
    case 'Address': {
      const parts = [
        supplier.SupplierGenAddressLine1,
        supplier.SupplierGenAddressCity,
        supplier.SupplierGenAddressCountry,
      ].filter(Boolean);
      return { label: 'Find us', action: parts.join(', ') };
    }
    default: return { label: DEFAULT_LABELS[ctaType] ?? 'Button', action: '' };
  }
}

export function AddCtaModal({ ctaType, onConfirm, onCancel, hideSupplier = false }: AddCtaModalProps) {
  const suppliers: any[] = dataStore.get('Suppliers') ?? [];
  const allForms: any[] = dataStore.get('SDT_DynamicFormsCollection') ?? [];
  const cfg = CONFIG[ctaType] ?? CONFIG.Form;
  const isForm = ctaType === 'Form';

  const [supplierId, setSupplierId] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [label, setLabel] = useState(DEFAULT_LABELS[ctaType] ?? '');
  const [action, setAction] = useState('');
  const [error, setError] = useState<string | null>(null);

  const forms = supplierId
    ? allForms.filter(f => f.SupplierId === supplierId)
    : allForms;

  function handleFormChange(formId: string) {
    setSelectedFormId(formId);
    setError(null);
    const form = forms.find(f => f.FormId?.toString() === formId);
    if (form) {
      setAction(form.FormUrl);
      if (!label || label === DEFAULT_LABELS.Form) setLabel(form.PageName);
    } else {
      setAction('');
    }
  }

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setError(null);
    if (isForm) {
      setSelectedFormId('');
      setAction('');
      setLabel(DEFAULT_LABELS.Form);
      return;
    }
    if (id) {
      const s = suppliers.find(s => s.SupplierGenId === id);
      if (s) {
        const { label: pl, action: pa } = prefill(ctaType, s);
        setLabel(pl);
        setAction(pa);
      }
    }
  }

  function handleClearSupplier() {
    setSupplierId('');
    setLabel(DEFAULT_LABELS[ctaType] ?? '');
    setAction('');
    if (isForm) setSelectedFormId('');
    setError(null);
  }

  function handleSave() {
    const err = cfg.validate(action);
    if (err) { setError(err); return; }
    onConfirm({
      CtaLabel: label.trim(),
      CtaAction: action.trim(),
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
          <button className="acm-close" type="button" onClick={onCancel}>×</button>
        </div>

        <div className="acm-body">
          {!hideSupplier && (
            <>
              <label className="acm-label">
                Connect Supplier <span className="acm-optional">(optional)</span>
              </label>
              <div className="acm-select-wrap">
                <select
                  className="acm-select"
                  value={supplierId}
                  onChange={e => handleSupplierChange(e.target.value)}
                >
                  <option value="">Select supplier to connect...</option>
                  {suppliers.map(s => (
                    <option key={s.SupplierGenId} value={s.SupplierGenId}>
                      {s.SupplierGenCompanyName || s.SupplierGenContactName}
                    </option>
                  ))}
                </select>
                {supplierId && (
                  <button
                    className="acm-select-clear"
                    type="button"
                    title="Clear supplier"
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
                className={`acm-select${error ? ' acm-input--error' : ''}`}
                value={selectedFormId}
                onChange={e => handleFormChange(e.target.value)}
              >
                <option value="">Select a form…</option>
                {forms.map(f => (
                  <option key={f.FormId} value={f.FormId?.toString()}>{f.PageName}</option>
                ))}
              </select>
            </div>
          ) : (
            <input
              className={`acm-input${error ? ' acm-input--error' : ''}`}
              type="text"
              placeholder={cfg.actionPlaceholder}
              value={action}
              onChange={e => { setAction(e.target.value); setError(null); }}
            />
          )}
          {error && <span className="acm-error">{error}</span>}

          <label className="acm-label">Label</label>
          <input
            className="acm-input"
            type="text"
            placeholder={DEFAULT_LABELS[ctaType] ?? 'Button'}
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>

        <div className="acm-footer">
          <button className="acm-btn acm-btn--primary" type="button" onClick={handleSave}>Save</button>
          <button className="acm-btn acm-btn--secondary" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>,
    document.getElementById("root") ?? document.body
  );
}
