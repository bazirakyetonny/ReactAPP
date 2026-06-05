import { useState, useCallback } from "react";

export function useMultiSelect() {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [selectedCtaIds, setSelectedCtaIds] = useState<Set<string>>(new Set());
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [selectedDescriptionIds, setSelectedDescriptionIds] = useState<Set<string>>(new Set());

  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) {
        setSelectedTileIds(new Set());
        setSelectedCtaIds(new Set());
        setSelectedImageIds(new Set());
        setSelectedDescriptionIds(new Set());
      }
      return !prev;
    });
  }, []);

  const exitMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedTileIds(new Set());
    setSelectedCtaIds(new Set());
    setSelectedImageIds(new Set());
    setSelectedDescriptionIds(new Set());
  }, []);

  return {
    isMultiSelectMode,
    selectedTileIds,
    selectedCtaIds,
    selectedImageIds,
    selectedDescriptionIds,
    toggleMultiSelectMode,
    exitMultiSelectMode,
    setSelectedTileIds,
    setSelectedCtaIds,
    setSelectedImageIds,
    setSelectedDescriptionIds,
  };
}
