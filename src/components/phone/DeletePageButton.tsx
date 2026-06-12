import { useState } from 'react';
import ReactDOM from 'react-dom';
import { deletePage } from '../../services/pagesApi';
import './DeletePageModal.css';
import { i18n } from '../../i18n/i18n';

interface DeletePageButtonProps {
  onClick: () => void;
}

export function DeletePageButton({ onClick }: DeletePageButtonProps) {
  return (
    <button
      className="delete-page-btn"
      type="button"
      aria-label={i18n.t("page.delete_page")}
      title={i18n.t("page.delete_page")}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19,6 L19,18.5 C19,19.8807119 17.8807119,21 16.5,21 L7.5,21 C6.11928813,21 5,19.8807119 5,18.5 L5,6 L4.5,6 C4.22385763,6 4,5.77614237 4,5.5 C4,5.22385763 4.22385763,5 4.5,5 L9,5 L9,4.5 C9,3.67157288 9.67157288,3 10.5,3 L13.5,3 C14.3284271,3 15,3.67157288 15,4.5 L15,5 L19.5,5 C19.7761424,5 20,5.22385763 20,5.5 C20,5.77614237 19.7761424,6 19.5,6 L19,6 Z M6,6 L6,18.5 C6,19.3284271 6.67157288,20 7.5,20 L16.5,20 C17.3284271,20 18,19.3284271 18,18.5 L18,6 L6,6 Z M14,5 L14,4.5 C14,4.22385763 13.7761424,4 13.5,4 L10.5,4 C10.2238576,4 10,4.22385763 10,4.5 L10,5 L14,5 Z M14,9.5 C14,9.22385763 14.2238576,9 14.5,9 C14.7761424,9 15,9.22385763 15,9.5 L15,16.5 C15,16.7761424 14.7761424,17 14.5,17 C14.2238576,17 14,16.7761424 14,16.5 L14,9.5 Z M9,9.5 C9,9.22385763 9.22385763,9 9.5,9 C9.77614237,9 10,9.22385763 10,9.5 L10,16.5 C10,16.7761424 9.77614237,17 9.5,17 C9.22385763,17 9,16.7761424 9,16.5 L9,9.5 Z" />
      </svg>
    </button>
  );
}

interface DeletePageModalProps {
  appVersionId: string;
  pageId: string;
  onClose: () => void;
  onDeleted: (pageId: string) => void;
  onBeforeDelete?: () => void;
}

export function DeletePageModal({ appVersionId, pageId, onClose, onDeleted, onBeforeDelete }: DeletePageModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      onBeforeDelete?.();
      await deletePage(appVersionId, pageId);
      onDeleted(pageId);
    } catch {
      setError(i18n.t("page.delete_failed"));
      setLoading(false);
    }
  }

  const modal = (
    <div className="dpm-overlay" onMouseDown={onClose}>
      <div className="dpm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dpm-header">
          <span className="dpm-title">{i18n.t("page.delete_page")}</span>
          <button className="dpm-close" type="button" aria-label={i18n.t("navbar.share.close")} title={i18n.t("navbar.share.close")} onClick={onClose}>✕</button>
        </div>
        <div className="dpm-body">
          <p className="dpm-message">{i18n.t("delete_page_warning_message")}</p>
          {error && <div className="dpm-error">{error}</div>}
        </div>
        <div className="dpm-footer">
          <button className="dpm-btn-primary" type="button" disabled={loading} onClick={handleConfirm}>
            {loading ? i18n.t("navbar.loading") : i18n.t("section.delete")}
          </button>
          <button className="dpm-btn-secondary" type="button" onClick={onClose} disabled={loading}>
            {i18n.t("cta_modal_forms.cancel")}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById('root') ?? document.body);
}
