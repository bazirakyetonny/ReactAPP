import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const MAX_CHARS = 1000;

interface Props {
  initialHtml: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}

export function InlineDescriptionEditor({ initialHtml, onSave, onCancel }: Props) {
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

  function handleBlurContainer(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      handleSave();
    }
  }

  return (
    <div className="ts-desc-editor" onBlur={handleBlurContainer}>
      <div ref={containerRef} className="ts-desc-editor-quill" />
      <div className="ts-desc-editor-footer">
        <span className={isOver ? "ts-desc-char--over" : "ts-desc-char"}>
          {charCount}/{MAX_CHARS}
        </span>
        <button type="button" className="ts-desc-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="ts-desc-save-btn"
          onClick={handleSave}
          disabled={isOver}
        >
          Save
        </button>
      </div>
    </div>
  );
}
