import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const MAX_CHARS = 1000;

interface QuillEditorModalProps {
  initialHtml: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}

export function QuillEditorModal({
  initialHtml,
  onSave,
  onCancel,
}: QuillEditorModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    const q = new Quill(containerRef.current, {
      theme: "snow",
      modules: {
        toolbar: [
          ["bold", "italic", "underline"],
          ["link"],
          [{ list: "ordered" }, { list: "bullet" }],
        ],
      },
    });
    if (initialHtml) q.clipboard.dangerouslyPasteHTML(initialHtml);
    setCharCount(Math.max(0, q.getLength() - 1));
    setTimeout(() => q.focus(), 0);
    q.on("text-change", () => {
      const len = Math.max(0, q.getLength() - 1);
      if (len > MAX_CHARS) q.deleteText(MAX_CHARS, len - MAX_CHARS);
      setCharCount(Math.max(0, q.getLength() - 1));
    });
    quillRef.current = q;
    return () => {
      quillRef.current = null;
    };
  }, []);

  function handleSave() {
    const q = quillRef.current;
    if (!q) return;
    const html = q.root.innerHTML === "<p><br></p>" ? "" : q.root.innerHTML;
    onSave(html);
  }

  const isOver = charCount > MAX_CHARS;

  return ReactDOM.createPortal(
    <div className="desc-modal-overlay" onMouseDown={onCancel}>
      <div className="desc-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="desc-modal-header">
          <span>Edit Content</span>
          <button
            type="button"
            className="desc-modal-close"
            aria-label="Close"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} className="desc-modal-editor" />
        <div className="desc-modal-footer">
          <span
            className={isOver ? "desc-char-count--over" : "desc-char-count"}
          >
            {charCount}/{MAX_CHARS}
          </span>
          <button
            type="button"
            className="desc-modal-cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="desc-modal-save-btn"
            onClick={handleSave}
            disabled={isOver}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("root") ?? document.body,
  );
}
