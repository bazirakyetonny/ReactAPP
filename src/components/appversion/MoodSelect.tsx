import { useEffect, useRef } from "react";
import "./css/MoodSelect.css";
import type { Mood, Theme } from "../../types";
import { dataStore } from "../../data/datastore";

interface MoodSelectProps {
  selectedMoodId: string | null;
  onChange: (moodId: string) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  baseThemeColors?: Record<string, string>;
}

function getSwatches(
  mood: Mood,
  themes: Theme[],
  baseThemeColors?: Record<string, string>,
): string[] {
  let colorNames: string[] = [];
  try {
    colorNames = JSON.parse(mood.MoodColorNames ?? "[]");
  } catch {
    /* */
  }
  const source =
    baseThemeColors ??
    (themes.find((t) => t.ThemeId === mood.ThemeId)?.ThemeColors as unknown as
      | Record<string, string>
      | undefined);
  const mc = mood.MoodColors ?? [];
  return colorNames.slice(0, 4).map((name, i) => mc[i]?.MoodColorCode || source?.[name] || "#ccc");
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      style={{
        transform: up ? "rotate(180deg)" : "none",
        transition: "transform 0.15s",
      }}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoodSelect({
  selectedMoodId,
  onChange,
  open,
  onToggle,
  onClose,
  baseThemeColors,
}: MoodSelectProps) {
  const moods: Mood[] = dataStore.get("Moods") ?? [];
  const themes: Theme[] = dataStore.get("themes") ?? [];
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedMood = moods.find((m) => m.MoodId === selectedMoodId) ?? null;
  const triggerSwatches = selectedMood
    ? getSwatches(selectedMood, themes, baseThemeColors)
    : [];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div className="mds-wrap" ref={wrapRef}>
      {/* Trigger */}
      <button className="mds-trigger" type="button" onClick={onToggle}>
        <span className="mds-trigger-swatches">
          {triggerSwatches.map((color, i) => (
            <span
              key={i}
              className="mds-swatch"
              style={{ background: color }}
            />
          ))}
        </span>
        <ChevronIcon up={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mds-dropdown">
          <div className="mds-grid">
            {moods.map((mood) => {
              const swatches = getSwatches(mood, themes, baseThemeColors);
              const isActive = mood.MoodId === selectedMoodId;
              return (
                <label
                  key={mood.MoodId}
                  className={`mds-item${isActive ? " mds-item--active" : ""}`}
                >
                  <input
                    type="radio"
                    name="mds-mood"
                    value={mood.MoodId}
                    checked={isActive}
                    onChange={() => {
                      onChange(mood.MoodId);
                      onClose();
                    }}
                  />
                  <span className="mds-item-name">{mood.MoodName}</span>
                  <span className="mds-item-swatches">
                    {swatches.map((color, i) => (
                      <span
                        key={i}
                        className="mds-swatch"
                        style={{ background: color }}
                      />
                    ))}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
