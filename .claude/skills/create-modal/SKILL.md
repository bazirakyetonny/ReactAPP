---
noteId: "a0c73af05f5b11f18816c530166be5ee"
tags: []
name: "create-modal"
description: "How to create a popup modal dialog in this ReactAPP project. Use this skill whenever the user says \"create a modal\", \"add a popup\", \"make a dialog\", \"add a confirmation dialog\", \"build a form modal\", or asks to build any overlay / popup UI — even if they don't use the word \"modal\". Also trigger when the user asks to add a new app-version action (rename, duplicate, delete, etc.) that needs a focused dialog, or when a feature needs to collect input from the user via an overlay.\n"

---

# Creating a Popup Modal

Every modal in this project follows the same established pattern. Study the existing modals before
writing a new one — don't invent a new structure.

**Best reference files** (read these before starting):
- Simple form modal: [src/components/phone/AddCtaModal.tsx](../../../src/components/phone/AddCtaModal.tsx) + [AddCtaModal.css](../../../src/components/phone/AddCtaModal.css)
- Confirmation modal: [src/components/appversion/RenameAppVersionModal.tsx](../../../src/components/appversion/RenameAppVersionModal.tsx)
- Destructive confirmation: [src/components/appversion/MoveToTrashModal.tsx](../../../src/components/appversion/MoveToTrashModal.tsx)
- Media picker (large modal): [src/components/phone/MediaLibraryModal.tsx](../../../src/components/phone/MediaLibraryModal.tsx)

---

## File naming convention

| What to create | Where |
|---|---|
| Simple form / confirmation modal | `src/components/phone/XxxModal.tsx` + `XxxModal.css` |
| App-version lifecycle modal | `src/components/appversion/XxxModal.tsx` + `appversion/css/XxxModal.css` |
| Complex multi-step modal | same as above |

Choose a **CSS prefix** that matches the component name, e.g. `RenameAppVersionModal` → `rav-`.
All class names in the file use that prefix (`rav-overlay`, `rav-modal`, `rav-header`, …).

---

## Standard structure

### TSX component

```tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./XxxModal.css";

interface XxxModalProps {
  // required data the modal needs to show
  onConfirm: (result: XxxResult) => void;
  onClose: () => void;
}

export default function XxxModal({ onConfirm, onClose }: XxxModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSave() {
    if (!value.trim()) { setError("Required"); return; }
    setLoading(true);
    try {
      await somethingAsync(value);
      onConfirm({ value });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return ReactDOM.createPortal(
    <div className="xxx-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="xxx-modal" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="xxx-header">
          <span className="xxx-title">Dialog Title</span>
          <button className="xxx-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="xxx-body">
          <label className="xxx-label">Field label</label>
          <input
            className={`xxx-input${error ? " xxx-input--error" : ""}`}
            value={value}
            onChange={e => { setValue(e.target.value); setError(""); }}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && !loading) handleSave();
            }}
            autoFocus
          />
          {error && <span className="xxx-error">{error}</span>}
        </div>

        {/* Footer */}
        <div className="xxx-footer">
          <button className="xxx-btn xxx-btn--secondary" onClick={onClose}>Cancel</button>
          <button
            className="xxx-btn xxx-btn--primary"
            onClick={handleSave}
            disabled={loading || !value.trim()}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>

      </div>
    </div>,
    document.getElementById("root") ?? document.body
  );
}
```

### CSS file

Copy the pattern below, substituting `xxx` with the real prefix:

```css
/* === Overlay === */
.xxx-overlay {
  position: fixed;
  inset: 0;
  z-index: 10002;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === Modal container === */
.xxx-modal {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 440px;
  max-width: 96vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* === Header === */
.xxx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.xxx-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}
.xxx-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 4px;
  line-height: 1;
}
.xxx-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* === Body === */
.xxx-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.xxx-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}
.xxx-input {
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  color: #374151;
  outline: none;
}
.xxx-input:focus {
  border-color: #1a3a6e;
  box-shadow: 0 0 0 2px rgba(26, 58, 110, 0.12);
}
.xxx-input--error {
  border-color: #dc2626;
}
.xxx-error {
  font-size: 12px;
  color: #dc2626;
}

/* === Footer === */
.xxx-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.xxx-btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.xxx-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.xxx-btn--primary {
  background: #1a3a6e;
  color: #ffffff;
}
.xxx-btn--primary:hover:not(:disabled) {
  background: #162f5c;
}
.xxx-btn--secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0 14px;
}
.xxx-btn--secondary:hover {
  background: #f9fafb;
}
```

---

## Visibility / trigger pattern

The parent component holds the open/closed state. Never put visibility state inside the modal itself.

```tsx
// In the parent (e.g., DraggableScreen.tsx or SidebarRight.tsx)
const [showXxx, setShowXxx] = useState(false);

// Trigger button / handler
<button onClick={() => setShowXxx(true)}>Open dialog</button>

// Conditional render — the modal is simply absent from the DOM when closed
{showXxx && (
  <XxxModal
    onConfirm={(result) => {
      doSomethingWith(result);
      setShowXxx(false);
    }}
    onClose={() => setShowXxx(false)}
  />
)}
```

---

## Variant: destructive confirmation

For delete / move-to-trash actions, replace the primary button with a danger style. See [MoveToTrashModal.tsx](../../../src/components/appversion/MoveToTrashModal.tsx) for reference.

```css
.xxx-btn--danger {
  background: #dc2626;
  color: #ffffff;
}
.xxx-btn--danger:hover:not(:disabled) {
  background: #b91c1c;
}
```

The body should show a plain-language warning — no input field needed.

---

## Variant: multi-step modal

For two- or three-step flows (e.g., CreateAppVersionModal), keep a `step` state variable and render different body content per step. Keep the header and footer consistent across steps. See [CreateAppVersionModal.tsx](../../../src/components/appversion/CreateAppVersionModal.tsx) for reference.

---

## Z-index rules

| Modal type | z-index |
|---|---|
| Context menus (TileActionMenu, AddBlockMenu) | 9999 |
| Content / media modals | 10001 |
| App-version / lifecycle modals | 10002 |
| Nested confirmation inside a modal | 10 (relative to its parent) |

Always match the z-index of the closest sibling modal in the same category.

---

## Checklist before finishing

- [ ] CSS prefix matches component name (no class name collisions)
- [ ] Portal mounts to `document.getElementById("root") ?? document.body`
- [ ] Backdrop `onMouseDown` dismisses only when clicking the overlay, not the modal
- [ ] Modal `onMouseDown` calls `e.stopPropagation()`
- [ ] `autoFocus` on the first interactive input
- [ ] Escape key closes the modal
- [ ] Loading state disables the primary button and shows a text indicator
- [ ] Error state shows inline with the relevant field
- [ ] `onClose` and `onConfirm` are always called — never left dangling
- [ ] Visibility state lives in the parent, not inside the modal component
