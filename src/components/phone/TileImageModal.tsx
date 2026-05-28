import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { getMedia, uploadMedia, uploadCroppedMedia } from '../../services/mediaApi';
import type { MediaItem } from '../../services/mediaApi';
import './TileImageModal.css';

interface TileImageModalProps {
  tileWidth: number;
  tileHeight: number;
  initialOriginalUrl?: string;
  initialOpacity?: string;
  onConfirm: (result: { bgImageUrl: string; opacity: string; originalImageUrl: string; originalMediaId: string }) => void;
  onCancel: () => void;
}

function compressImage(file: File): Promise<{ base64: string; type: string; size: number; name: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1400 / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], type: 'image/jpeg', size: blob.size, name: file.name.replace(/\.[^.]+$/, '.jpg') });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
    img.src = url;
  });
}

export function TileImageModal({ tileWidth, tileHeight, initialOriginalUrl, initialOpacity, onConfirm, onCancel }: TileImageModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropperSize, setCropperSize] = useState<{ w: number; h: number } | null>(null);
  const [opacity, setOpacity] = useState(initialOpacity != null ? Math.round(Number(initialOpacity)) : 0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewH, setPreviewH] = useState(240);
  const [imgBounds, setImgBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropDragRef = useRef<{ startX: number; startY: number; startCX: number; startCY: number; maxX: number; maxY: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMedia().then(list => {
      if (cancelled) return;
      setMediaList(list);
      if (initialOriginalUrl) {
        const match = list.find(m => m.MediaUrl === initialOriginalUrl);
        setSelectedMedia(match ?? { MediaId: '', MediaName: '', MediaUrl: initialOriginalUrl, MediaImage: '', MediaSize: 0, MediaType: '', IsCropped: false });
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function onImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const containerW = img.clientWidth;
    const naturalAspect = img.naturalWidth / img.naturalHeight;
    const renderedH = Math.round(containerW / naturalAspect);
    const visH = Math.min(Math.max(renderedH, 160), 365);
    setPreviewH(visH);

    // Compute the actual image display bounds within the container (object-fit: contain)
    let displayW: number, displayH: number, offsetX: number, offsetY: number;
    if (containerW / visH >= naturalAspect) {
      // Container is wider relative to image — image fills height, bars on sides
      displayH = visH;
      displayW = Math.round(visH * naturalAspect);
      offsetX = Math.round((containerW - displayW) / 2);
      offsetY = 0;
    } else {
      // Container is taller relative to image — image fills width, bars top/bottom
      displayW = containerW;
      displayH = Math.round(containerW / naturalAspect);
      offsetX = 0;
      offsetY = Math.round((visH - displayH) / 2);
    }
    setImgBounds({ x: offsetX, y: offsetY, w: displayW, h: displayH });

    const tileAspect = tileWidth / tileHeight;
    let cW = Math.round(displayW * 0.65);
    let cH = Math.round(cW / tileAspect);
    if (cH > displayH - 20) {
      cH = Math.max(20, displayH - 20);
      cW = Math.round(cH * tileAspect);
    }
    setCropperSize({ w: cW, h: cH });
    setCropX(offsetX + Math.max(0, Math.round((displayW - cW) / 2)));
    setCropY(offsetY + Math.max(0, Math.round((displayH - cH) / 2)));
  }

  function startCropDrag(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!cropperSize || !imgRef.current || !imgBounds) return;
    const bounds = imgBounds;
    const maxX = Math.max(bounds.x, bounds.x + bounds.w - cropperSize.w);
    const maxY = Math.max(bounds.y, bounds.y + bounds.h - cropperSize.h);
    cropDragRef.current = { startX: e.clientX, startY: e.clientY, startCX: cropX, startCY: cropY, maxX, maxY };
    function onMove(ev: MouseEvent) {
      const d = cropDragRef.current!;
      setCropX(Math.max(bounds.x, Math.min(d.maxX, d.startCX + ev.clientX - d.startX)));
      setCropY(Math.max(bounds.y, Math.min(d.maxY, d.startCY + ev.clientY - d.startY)));
    }
    function onUp() { cropDragRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startResizeDrag(corner: 'tl' | 'tr' | 'bl' | 'br', e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!cropperSize || !imgBounds) return;
    const aspect = tileWidth / tileHeight;
    const bounds = imgBounds;
    const startMouseX = e.clientX;
    const startW = cropperSize.w;
    const startH = cropperSize.h;
    const startCropX = cropX;
    const startCropY = cropY;
    const MIN = 30;
    // Fixed corner stays put; moving corner is the dragged one
    const fixedX = (corner === 'tl' || corner === 'bl') ? startCropX + startW : startCropX;
    const fixedY = (corner === 'tl' || corner === 'tr') ? startCropY + startH : startCropY;
    // Max width/height the cropper can grow to before hitting imgBounds
    const maxW = (corner === 'tr' || corner === 'br') ? bounds.x + bounds.w - startCropX : startCropX + startW - bounds.x;
    const maxH = (corner === 'bl' || corner === 'br') ? bounds.y + bounds.h - startCropY : startCropY + startH - bounds.y;
    const effectiveMaxW = Math.min(maxW, maxH * aspect);
    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startMouseX;
      const sign = (corner === 'tr' || corner === 'br') ? 1 : -1;
      const newW = Math.max(MIN, Math.min(effectiveMaxW, startW + sign * dx));
      const newH = Math.round(newW / aspect);
      setCropperSize({ w: newW, h: newH });
      setCropX((corner === 'tl' || corner === 'bl') ? fixedX - newW : fixedX);
      setCropY((corner === 'tl' || corner === 'tr') ? fixedY - newH : fixedY);
    }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  async function handleConfirm() {
    if (!selectedMedia || !imgRef.current || !cropperSize || !imgBounds) return;
    setIsSaving(true); setSaveError(null);
    try {
      const img = imgRef.current;
      const scaleX = img.naturalWidth / imgBounds.w;
      const scaleY = img.naturalHeight / imgBounds.h;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cropperSize.w * scaleX));
      canvas.height = Math.max(1, Math.round(cropperSize.h * scaleY));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, Math.round((cropX - imgBounds.x) * scaleX), Math.round((cropY - imgBounds.y) * scaleY), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
      const result = await uploadCroppedMedia({
        name: `crop_${selectedMedia.MediaName.replace(/\.[^.]+$/, '')}.jpg`,
        base64,
        size: Math.round(base64.length * 0.75),
        type: 'image/jpeg',
        croppedOriginalMediaId: selectedMedia.MediaId,
      });
      if (!result?.MediaUrl) throw new Error('Upload failed: no URL returned');
      const cacheBustedUrl = result.MediaUrl + (result.MediaUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      onConfirm({ bgImageUrl: cacheBustedUrl, opacity: String(opacity), originalImageUrl: selectedMedia.MediaUrl, originalMediaId: selectedMedia.MediaId });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save');
    } finally { setIsSaving(false); }
  }

  async function processFiles(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    for (let i = 0; i < images.length; i++) {
      setUploadProgress({ done: i, total: images.length });
      let payload;
      try { payload = await compressImage(images[i]); }
      catch { const r = new FileReader(); payload = await new Promise<any>((res, rej) => { r.onload = () => res({ base64: (r.result as string).split(',')[1], type: images[i].type, size: images[i].size, name: images[i].name }); r.onerror = rej; r.readAsDataURL(images[i]); }); }
      try {
        const item = await uploadMedia(payload) as unknown as MediaItem;
        setMediaList(prev => [item, ...prev]);
        setSelectedMedia(item);
        setCropperSize(null);
      } catch (err: any) { console.error('Upload failed:', err.message); }
    }
    setUploadProgress(null);
  }

  const inPreview = !!selectedMedia;

  const modal = (
    <div className="media-modal-overlay tim-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="media-modal">

        <div className="media-modal-header">
          <span>Tile Background Image</span>
          <button className="media-modal-close" type="button" onClick={onCancel} aria-label="Close">×</button>
        </div>

        {/* Upload zone — doubles as preview+crop when image selected */}
        <div
          className={[
            'media-upload-zone',
            'tim-zone',
            inPreview ? 'tim-zone--preview' : '',
            isDraggingOver ? 'media-upload-zone--active' : '',
            uploadProgress && !inPreview ? 'media-upload-zone--busy' : '',
          ].filter(Boolean).join(' ')}
          style={inPreview ? { height: previewH } : undefined}
          onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingOver(false); }}
          onDrop={async e => { e.preventDefault(); setIsDraggingOver(false); await processFiles(Array.from(e.dataTransfer.files)); }}
          onClick={!inPreview && !uploadProgress ? () => fileInputRef.current?.click() : undefined}
        >
          {uploadProgress && !inPreview ? (
            <div className="media-upload-progress">
              <div className="media-upload-spinner" />
              <p className="media-upload-progress-label">Uploading…</p>
              <div className="media-upload-bar-track">
                <div className="media-upload-bar-fill" style={{ width: `${Math.round(uploadProgress.done / uploadProgress.total * 100)}%` }} />
              </div>
              <p className="media-upload-progress-count">{uploadProgress.done}/{uploadProgress.total}</p>
            </div>
          ) : inPreview ? (
            <>
              <img
                ref={imgRef}
                src={selectedMedia!.MediaUrl}
                alt=""
                draggable={false}
                onLoad={onImgLoad}
                crossOrigin="anonymous"
                className="tim-preview-img"
              />
              {/* Live opacity preview — 0% clear, 100% dark */}
              <div className="tim-preview-dim" style={{ background: `rgba(0,0,0,${(opacity / 100).toFixed(2)})` }} />
              {cropperSize && (
                <div
                  className="tim-cropper"
                  style={{ left: cropX, top: cropY, width: cropperSize.w, height: cropperSize.h }}
                  onMouseDown={startCropDrag}
                >
                  <div className="tim-cropper-corner tim-cropper-corner--tl" onMouseDown={e => startResizeDrag('tl', e)} />
                  <div className="tim-cropper-corner tim-cropper-corner--tr" onMouseDown={e => startResizeDrag('tr', e)} />
                  <div className="tim-cropper-corner tim-cropper-corner--bl" onMouseDown={e => startResizeDrag('bl', e)} />
                  <div className="tim-cropper-corner tim-cropper-corner--br" onMouseDown={e => startResizeDrag('br', e)} />
                </div>
              )}
              {uploadProgress && (
                <div className="tim-overlay-progress">
                  <div className="media-upload-bar-track" style={{ width: '80%' }}>
                    <div className="media-upload-bar-fill" style={{ width: `${Math.round(uploadProgress.done / uploadProgress.total * 100)}%` }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <svg className="media-upload-icon" width="42" height="36" viewBox="0 0 42 36" fill="none">
                <path d="M8 28l8-11 7 8 5-6 8 9" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="13" cy="12" r="3" fill="#9ca3af" />
              </svg>
              <p className="media-upload-hint">
                Drag and drop or{' '}
                <span className="media-upload-browse" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>browse</span>
              </p>
            </>
          )}
        </div>

        {/* Opacity — only visible when image selected */}
        {inPreview && (
          <div className="tim-opacity-row">
            <span>Opacity</span>
            <input type="range" min={0} max={100} value={opacity} onChange={e => setOpacity(Number(e.target.value))} />
            <span className="tim-opacity-pct">{opacity}%</span>
          </div>
        )}

        {/* Select image label + action buttons */}
        <div className="media-select-all-row">
          <label className="media-select-all-label">Select Image</label>
          <div className="media-actions-row">
            {saveError && <span className="tim-save-error">{saveError}</span>}
            <button className="media-cancel-btn" type="button" onClick={onCancel}>Cancel</button>
            <button
              className="media-select-btn"
              type="button"
              disabled={!selectedMedia || !cropperSize || isSaving}
              onClick={handleConfirm}
            >
              {isSaving ? 'Applying…' : 'Apply Image'}
            </button>
          </div>
        </div>

        {/* Media grid */}
        <div className="media-grid">
          {loading && <div className="media-grid-loading">Loading…</div>}
          {!loading && mediaList.length === 0 && (
            <div className="media-grid-empty">No images yet — upload one above.</div>
          )}
          {mediaList.map(item => (
            <div
              key={item.MediaId}
              className={`media-item${selectedMedia?.MediaId === item.MediaId ? ' media-item--selected' : ''}`}
              onClick={() => { setSelectedMedia(item); setCropperSize(null); setImgBounds(null); }}
            >
              <img src={item.MediaUrl} alt={item.MediaName} draggable={false} />
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={async e => { const files = Array.from(e.target.files ?? []); e.target.value = ''; await processFiles(files); }}
        />

      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById("root") ?? document.body);
}
