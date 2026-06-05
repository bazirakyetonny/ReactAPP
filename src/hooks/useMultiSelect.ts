import { useState, useCallback } from "react";

export function useMultiSelect() {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [selectedCtaIds, setSelectedCtaIds] = useState<Set<string>>(new Set());

  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) {
        setSelectedTileIds(new Set());
        setSelectedCtaIds(new Set());
      }
      return !prev;
    });
  }, []);

  const exitMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedTileIds(new Set());
    setSelectedCtaIds(new Set());
  }, []);

  return {
    isMultiSelectMode,
    selectedTileIds,
    selectedCtaIds,
    toggleMultiSelectMode,
    exitMultiSelectMode,
    setSelectedTileIds,
    setSelectedCtaIds,
  };
}
