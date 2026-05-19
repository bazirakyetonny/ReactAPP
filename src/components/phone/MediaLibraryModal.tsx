import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { getMedia, uploadMedia, deleteMedia } from '../../utils/mediaApi';
import type { MediaItem } from '../../utils/mediaApi';

interface MediaLibraryModalProps {
  initialSelectedIds: string[];
  onSelect: (images: { InfoImageId: string; InfoImageValue: string }[]) => void;
  onCancel: () => void;
}

export function MediaLibraryModal({ initialSelectedIds, onSelect, onCancel }: MediaLibraryModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getMedia()
      .then((list) => { if (!cancelled) setMediaList(list); })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load media'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function toggleSelect(mediaId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const newItem = await uploadMedia(file);
      setMediaList((prev) => [newItem, ...prev]);
    } catch (err: any) {
      alert(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, mediaId: string) {
    e.stopPropagation();
    setDeletingId(mediaId);
    try {
      await deleteMedia(mediaId);
      setMediaList((prev) => prev.filter((m) => m.MediaId !== mediaId));
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(mediaId); return s; });
    } catch (err: any) {
      alert(err.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  function handleConfirm() {
    const selected = mediaList.filter((m) => selectedIds.has(m.MediaId));
    const images = selected.map((m) => ({
      InfoImageId: m.MediaId,
      InfoImageValue: m.MediaUrl || `data:${m.MediaType};base64,${m.MediaImage}`,
    }));
    onSelect(images);
  }

  const modal = (
    <div className="media-modal-overlay" onMouseDown={(e) => e.stopPropagation()}>
      <div className="media-modal">
        <div className="media-modal-header">
          <span>Media Library</span>
          <button
            className="media-upload-btn"
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : '+ Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div className="media-grid">
          {loading && <div className="media-grid-loading">Loading…</div>}
          {!loading && error && <div className="media-grid-error">{error}</div>}
          {!loading && !error && mediaList.length === 0 && (
            <div className="media-grid-empty">No media yet. Upload an image to get started.</div>
          )}
          {mediaList.map((item) => {
            const isSelected = selectedIds.has(item.MediaId);
            const isDeleting = deletingId === item.MediaId;
            const thumb = item.MediaUrl || `data:${item.MediaType};base64,${item.MediaImage}`;
            return (
              <div
                key={item.MediaId}
                className={`media-item${isSelected ? ' media-item--selected' : ''}`}
                onClick={() => toggleSelect(item.MediaId)}
              >
                <img src={thumb} alt={item.MediaName} />
                {isSelected && (
                  <div className="media-item-check">✓</div>
                )}
                <button
                  className="media-item-delete"
                  type="button"
                  aria-label="Delete media"
                  disabled={isDeleting}
                  onClick={(e) => handleDelete(e, item.MediaId)}
                >
                  {isDeleting ? '…' : '×'}
                </button>
                <div className="media-item-name">{item.MediaName}</div>
              </div>
            );
          })}
        </div>

        <div className="media-modal-footer">
          <span className="media-selected-count">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'No images selected'}
          </span>
          <button className="media-cancel-btn" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="media-select-btn"
            type="button"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
