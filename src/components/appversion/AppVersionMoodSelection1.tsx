import { useMemo, useState } from "react";
import "./css/AppVersionMoodSelection1.css";
import type {
  AppVersion,
  ThemeColors,
  ThemeIcon,
  Mood,
  Theme,
} from "../../types";
import { dataStore } from "../../data/datastore";
import { ModalPhonePreview } from "./ModalPhonePreview";
import { MoodSelect } from "./MoodSelect";

interface AppVersionConfigStepProps {
  template: AppVersion | null;
  baseThemeColors: ThemeColors | undefined;
  themeIcons: ThemeIcon[];
  selectedMoodId: string | null;
  onMoodChange: (moodId: string) => void;
}

export function AppVersionMoodSelection1({
  template,
  baseThemeColors,
  themeIcons,
  selectedMoodId,
  onMoodChange,
}: AppVersionConfigStepProps) {
  const moods: Mood[] = dataStore.get("Moods") ?? [];
  const themes: Theme[] = dataStore.get("themes") ?? [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [moodSelectOpen, setMoodSelectOpen] = useState(false);

  const pages = useMemo(() => {
    const raw = (template?.Pages ?? []).filter((p) => p.PageType === "Information");
    const homeIdx = raw.findIndex((p) => p.PageName?.toLowerCase() === "home");
    if (homeIdx <= 0) return raw;
    return [raw[homeIdx], ...raw.filter((_, i) => i !== homeIdx)];
  }, [template]);
  const currentPage = pages[currentPageIndex];
  const templateTheme = themes.find((t) => t.ThemeId === template?.ThemeId);
  const templateThemeColors = templateTheme?.ThemeColors as unknown as
    | Record<string, string>
    | undefined;

  const previewColors = useMemo((): ThemeColors | undefined => {
    const base = templateTheme?.ThemeColors;
    if (!base) return undefined;

    const originalMood = moods.find((m) => m.MoodId === template?.MoodId) ?? moods[0];
    let originalNames: string[] = [];
    try { originalNames = JSON.parse(originalMood?.MoodColorNames ?? "[]"); } catch { /* */ }

    const selectedMood = moods.find((m) => m.MoodId === selectedMoodId);
    let selectedNames: string[] = [];
    try { selectedNames = JSON.parse(selectedMood?.MoodColorNames ?? "[]"); } catch { /* */ }

    // Use the selected mood's own theme so the preview shows that mood's actual colors.
    const selectedMoodTheme = themes.find((t) => t.ThemeId === selectedMood?.ThemeId);
    const moodColors = (selectedMoodTheme?.ThemeColors ?? base) as unknown as Record<string, string>;

    const result = { ...(base as unknown as Record<string, string>) };

    for (let i = 0; i < originalNames.length; i++) {
      const oldKey = originalNames[i];
      const newKey = selectedNames[i];
      if (oldKey && newKey) {
        result[oldKey] = moodColors[newKey] ?? result[oldKey];
      }
    }

    return result as unknown as ThemeColors;
  }, [selectedMoodId, moods, themes, template, templateTheme]);

  return (
    <div className="acs-container">
      {/* Left — phone preview */}
      <ModalPhonePreview
        currentPage={currentPage}
        previewColors={previewColors}
        themeIcons={themeIcons}
        onBack={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
      />

      {/* Centre — info + page navigation */}
      <div className="acs-info-col">
        <div className="acs-nav-row">
          <button
            className="acs-nav-btn"
            type="button"
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((i) => i - 1)}
          >
          </button>
          <span className="acs-page-indicator">
            {currentPageIndex + 1} / {pages.length || 1}
          </span>
          <button
            className="acs-nav-btn"
            type="button"
            disabled={currentPageIndex >= pages.length - 1}
            onClick={() => setCurrentPageIndex((i) => i + 1)}
          >
          </button>
        </div>
        <div className="acs-template-name">
          {template?.AppVersionName ?? "Blank Version"}
        </div>
        {template?.AppVersionDescription && (
          <div className="acs-template-desc">
            {template.AppVersionDescription}
          </div>
        )}
        {pages.length > 0 && (
          <div className="acs-page-name">
            {(currentPage as any)?.PageName ?? ""}
          </div>
        )}
      </div>

      {/* Right — mood picker */}
      <div className="acs-mood-col">
        <MoodSelect
          selectedMoodId={selectedMoodId}
          onChange={onMoodChange}
          open={moodSelectOpen}
          onToggle={() => setMoodSelectOpen((v) => !v)}
          onClose={() => setMoodSelectOpen(false)}
          baseThemeColors={templateThemeColors}
        />
      </div>
    </div>
  );
}
