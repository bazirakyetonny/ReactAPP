import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { getMedia, uploadMedia, deleteMedia } from '../../services/mediaApi';
import type { MediaItem } from '../../services/mediaApi';

interface MediaLibraryModalProps {
  initialImages: { InfoImageId: string; InfoImageValue?: string }[];
  onSelect: (images: { InfoImageId: string; InfoImageValue: string }[]) => void;
  onCancel: () => void;
  singleSelect?: boolean;
}

function compressImage(
  file: File,
  maxWidth = 1400,
  quality = 0.82,
): Promise<{ base64: string; type: string; size: number; name: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            base64: (reader.result as string).split(',')[1],
            type: 'image/jpeg',
            size: blob.size,
            name: file.name.replace(/\.[^.]+$/, '.jpg'),
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Load failed')); };
    img.src = objectUrl;
  });
}

export function MediaLibraryModal({ initialImages, onSelect, onCancel, singleSelect = false }: MediaLibraryModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; phase: 'compressing' | 'uploading' } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getMedia()
      .then((list) => { if (!cancelled) setMediaList(list); })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Failed to load media'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (mediaList.length === 0 || initialImages.length === 0) return;
    const matched = new Set<string>();
    for (const item of mediaList) {
      if (initialImages.some(
        (img) => img.InfoImageId === item.MediaId || (img.InfoImageValue && img.InfoImageValue === item.MediaUrl)
      )) {
        matched.add(item.MediaId);
      }
    }
    if (matched.size > 0) setSelectedIds(matched);
  }, [mediaList]); // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = mediaList.length > 0 && mediaList.every((m) => selectedIds.has(m.MediaId));
  const someSelected = !allSelected && mediaList.some((m) => selectedIds.has(m.MediaId));


  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(mediaList.map((m) => m.MediaId)));
  }

  function toggleSelect(mediaId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId); else next.add(mediaId);
      return next;
    });
  }

  async function processFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    for (let i = 0; i < images.length; i++) {
      const file = images[i];

      setUploadProgress({ done: i, total: images.length, phase: 'compressing' });
      let payload;
      try {
        const compressed = await compressImage(file);
        payload = compressed;
      } catch {
        const b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(',')[1]);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        payload = { base64: b64, type: file.type, size: file.size, name: file.name };
      }

      setUploadProgress({ done: i, total: images.length, phase: 'uploading' });
      try {
        const newItem = await uploadMedia(payload) as unknown as MediaItem;
        setMediaList((prev) => [newItem, ...prev]);
      } catch (err: any) {
        console.error('Upload failed:', file.name, err.message);
      }

      setUploadProgress({ done: i + 1, total: images.length, phase: 'uploading' });
    }

    setUploadProgress(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    await processFiles(files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingOver(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    await processFiles(Array.from(e.dataTransfer.files));
  }

  async function handleDelete(mediaId: string) {
    setDeletingId(mediaId);
    setConfirmDeleteId(null);
    try {
      await deleteMedia(mediaId);
      setMediaList((prev) => prev.filter((m) => m.MediaId !== mediaId));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(mediaId); return next; });
    } catch (err: any) {
      console.error('Delete failed:', err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleConfirm() {
    const selected = mediaList.filter((m) => selectedIds.has(m.MediaId));
    onSelect(selected.map((m) => ({
      InfoImageId: m.MediaId,
      InfoImageValue: m.MediaUrl,
    })));
  }

  const progressPct = uploadProgress
    ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
    : 0;

  const modal = (
    <div className="media-modal-overlay" onMouseDown={(e) => e.stopPropagation()}>
      <div className="media-modal">

        <div className="media-modal-header">
          <span>Edit Content</span>
          <button className="media-modal-close" type="button" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div
          className={`media-upload-zone${isDraggingOver ? ' media-upload-zone--active' : ''}${uploadProgress ? ' media-upload-zone--busy' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploadProgress && fileInputRef.current?.click()}
        >
          {uploadProgress ? (
            <div className="media-upload-progress">
              <div className="media-upload-spinner" />
              <p className="media-upload-progress-label">
                {uploadProgress.phase === 'compressing' ? 'Compressing images…' : 'Uploading images…'}
              </p>
              <div className="media-upload-bar-track">
                <div className="media-upload-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="media-upload-progress-count">{uploadProgress.done} / {uploadProgress.total}</p>
            </div>
          ) : (
            <>
              <svg className="media-upload-icon" width="42" height="36" viewBox="0 0 42 36" fill="none">
                <rect x="1" y="1" width="40" height="34" rx="4" stroke="#d1d5db" strokeWidth="0" />
                <path d="M8 28l8-11 7 8 5-6 8 9" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="13" cy="12" r="3" fill="#9ca3af" />
              </svg>
              <p className="media-upload-hint">
                Drag and drop or{' '}
                <span
                  className="media-upload-browse"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  browse
                </span>
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {!singleSelect && (
          <div className="media-select-all-row">
            <label className="media-select-all-label">
              <span
                role="checkbox"
                aria-checked={allSelected}
                aria-label="Select all images"
                tabIndex={0}
                title="Select all images"
                className={`select-media-checkbox fa-regular ${allSelected ? 'fa-square-check' : someSelected ? 'fa-square-minus' : 'fa-square'}`}
                onClick={toggleAll}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleAll(); } }}
                style={{
                  fontSize: '25px',
                  lineHeight: 0.8,
                  backgroundColor: 'rgb(255, 255, 255)',
                  color: 'rgb(80, 104, 168)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginLeft: '2px',
                }}
              />
              Select Images
            </label>
            {selectedIds.size > 0 && (
              <div className="media-actions-row">
                <button className="media-cancel-btn" type="button" onClick={onCancel}>Cancel</button>
                <button className="media-select-btn" type="button" onClick={handleConfirm}>Save</button>
              </div>
            )}
          </div>
        )}

        <div className="media-grid">
          {loading && <div className="media-grid-loading">Loading…</div>}
          {!loading && error && <div className="media-grid-error">{error}</div>}
          {!loading && !error && mediaList.length === 0 && (
            <div className="media-grid-empty">No media yet. Upload images to get started.</div>
          )}
          {mediaList.map((item) => {
            const isSelected = selectedIds.has(item.MediaId);
            const thumb = item.MediaUrl;
            return (
              <div
                key={item.MediaId}
                className={`media-item${isSelected ? ' media-item--selected' : ''}`}
                onClick={() => {
                  if (singleSelect) {
                    onSelect([{ InfoImageId: item.MediaId, InfoImageValue: item.MediaUrl }]);
                  } else {
                    toggleSelect(item.MediaId);
                  }
                }}
              >
                {!singleSelect && (
                <span
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label="Select image"
                  tabIndex={0}
                  title="Select image"
                  className={`select-media-checkbox fa-regular ${isSelected ? 'fa-square-check' : 'fa-square'}`}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(item.MediaId); }}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSelect(item.MediaId); } }}
                  style={{
                    fontSize: '25px',
                    lineHeight: 0.8,
                    backgroundColor: 'rgb(255, 255, 255)',
                    color: 'rgb(80, 104, 168)',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginLeft: '2px',
                  }}
                />
                )}
                <button
                  className="media-item-delete"
                  type="button"
                  disabled={deletingId === item.MediaId}
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.MediaId); }}
                  aria-label="Delete image"
                >
                  {deletingId === item.MediaId ? (
                    <svg width="33" height="33" viewBox="0 0 33 33" fill="none">
                      <circle cx="16.5" cy="16.5" r="16" stroke="#5068a8" strokeWidth="1" fill="#fff" />
                      <circle cx="16.5" cy="16.5" r="4" stroke="#5068a8" strokeWidth="1.5" strokeDasharray="6 6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="33" height="33" viewBox="0 0 33 33">
                      <g fill="#fff" stroke="#5068a8" strokeWidth="1">
                        <circle cx="16.5" cy="16.5" r="16.5" stroke="none" />
                        <circle cx="16.5" cy="16.5" r="16" fill="none" />
                      </g>
                      <g transform="translate(9.75 9)">
                        <path d="M4.5,9H18" transform="translate(-4.5 -6)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                        <path d="M18.572,6V16.5A1.542,1.542,0,0,1,16.99,18H9.082A1.542,1.542,0,0,1,7.5,16.5V6M9.872,6V4.5A1.542,1.542,0,0,1,11.454,3h3.163A1.542,1.542,0,0,1,16.2,4.5V6" transform="translate(-6.286 -3)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                        <path d="M15,16.5v3.643" transform="translate(-9.75 -9.199)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                        <path d="M21,16.5v3.643" transform="translate(-12.75 -9.199)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                      </g>
                    </svg>
                  )}
                </button>
                <img src={thumb} alt={item.MediaName} draggable={false} />
              </div>
            );
          })}
        </div>

        {confirmDeleteId && (
          <div className="media-confirm-overlay">
            <div className="media-confirm-dialog">
              <button className="media-confirm-close" type="button" onClick={() => setConfirmDeleteId(null)} aria-label="Close">×</button>
              <h3 className="media-confirm-title">Delete selected media files</h3>
              <p className="media-confirm-message">Are you sure you want to delete this media file?</p>
              <div className="media-confirm-actions">
                <button
                  className="media-confirm-btn"
                  type="button"
                  disabled={!!deletingId}
                  onClick={() => handleDelete(confirmDeleteId)}
                >
                  {deletingId ? 'Deleting…' : 'Confirm'}
                </button>
                <button className="media-confirm-cancel-btn" type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById("root") ?? document.body);
}
