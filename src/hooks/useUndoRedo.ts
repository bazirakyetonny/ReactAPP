import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface Snapshot {
  infoContent: any[];
  navContents: Record<string, any[]>;
  navStack: string[];
  themeId: string;
}

interface Props {
  infoContentRef: React.MutableRefObject<any[]>;
  navContentsRef: React.MutableRefObject<Record<string, any[]>>;
  navStackRef: React.MutableRefObject<string[]>;
  themeIdRef: React.MutableRefObject<string>;
  setInfoContent: React.Dispatch<React.SetStateAction<any[]>>;
  setNavContents: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setNavStack: React.Dispatch<React.SetStateAction<string[]>>;
  onRestoreTheme: (themeId: string) => void;
}

export function useUndoRedo({
  infoContentRef, navContentsRef, navStackRef, themeIdRef,
  setInfoContent, setNavContents, setNavStack, onRestoreTheme,
}: Props) {
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);
  const isResizingRef = useRef(false);
  const undoStackRef = useRef<Snapshot[]>([]);
  const redoStackRef = useRef<Snapshot[]>([]);

  useLayoutEffect(() => { undoStackRef.current = undoStack; });
  useLayoutEffect(() => { redoStackRef.current = redoStack; });

  function snap(): Snapshot {
    return {
      infoContent: infoContentRef.current,
      navContents: navContentsRef.current,
      navStack: navStackRef.current,
      themeId: themeIdRef.current,
    };
  }

  function pushSnapshot() {
    setUndoStack(prev => [...prev, snap()]);
    setRedoStack([]);
  }

  function clearHistory() {
    setUndoStack([]);
    setRedoStack([]);
  }

  function restore(s: Snapshot) {
    setInfoContent(s.infoContent);
    setNavContents(s.navContents);
    setNavStack(s.navStack);
    if (s.themeId !== themeIdRef.current) onRestoreTheme(s.themeId);
  }

  function handleUndo() {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    const s = stack[stack.length - 1];
    setUndoStack(u => u.slice(0, -1));
    setRedoStack(r => [...r, snap()]);
    restore(s);
  }

  function handleRedo() {
    const stack = redoStackRef.current;
    if (!stack.length) return;
    const s = stack[stack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setUndoStack(u => [...u, snap()]);
    restore(s);
  }

  const undoRef = useRef(handleUndo);
  const redoRef = useRef(handleRedo);
  useLayoutEffect(() => { undoRef.current = handleUndo; });
  useLayoutEffect(() => { redoRef.current = handleRedo; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoRef.current(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redoRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { undoStack, redoStack, pushSnapshot, clearHistory, handleUndo, handleRedo, isResizingRef };
}
