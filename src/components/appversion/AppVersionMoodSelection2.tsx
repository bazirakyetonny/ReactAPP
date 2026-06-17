import "./css/AppVersionMoodSelection2.css";
import type { Mood, Theme } from "../../types";
import { CheckboxSpan } from '../widgets/CheckboxSpan';
import { dataStore } from "../../data/datastore";
import { i18n } from "../../i18n/i18n";

interface AppVersionMoodSelection2Props {
  selectedMoodId: string | null;
  onMoodChange: (moodId: string) => void;
  noMood: boolean;
  onNoMoodChange: (val: boolean) => void;
  hideNoMood?: boolean;
}

export function AppVersionMoodSelection2({
  selectedMoodId,
  onMoodChange,
  noMood,
  onNoMoodChange,
  hideNoMood = false,
}: AppVersionMoodSelection2Props) {
  const moods: Mood[] = dataStore.get("Moods") ?? [];
  const themes: Theme[] = dataStore.get("themes") ?? [];

  return (
    <div className="ms2-wrap">
      <p className="ms2-heading">
        {i18n.t('mood_heading')}{" "}
        {!hideNoMood && <span style={{ fontWeight: 400, fontSize: 14 }}>{i18n.t('optional_hint')}</span>}
      </p>
      <p className="ms2-subheading">{i18n.t('mood_subheading')}</p>

      <div className={`ms2-grid${noMood ? " ms2-grid--disabled" : ""}`}>
        {moods.map((mood) => {
          const isActive = !noMood && mood.MoodId === selectedMoodId;
          const moodTheme = themes.find((t) => t.ThemeId === mood.ThemeId);
          let colorNames: string[] = [];
          try { colorNames = JSON.parse(mood.MoodColorNames ?? "[]"); } catch { /* */ }

          return (
            <label
              key={mood.MoodId}
              className={`ms2-card${isActive ? " ms2-card--active" : ""}`}
            >
              <div className="ms2-card-header">
                <input
                  type="radio"
                  name="ms2-mood"
                  value={mood.MoodId}
                  checked={isActive}
                  onChange={() => onMoodChange(mood.MoodId)}
                />
                <span className="ms2-name">{mood.MoodName}</span>
              </div>
              <div className="ms2-swatches">
                {colorNames.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    className="ms2-swatch"
                    style={{
                      background:
                        (moodTheme?.ThemeColors as unknown as Record<string, string> | undefined)?.[name] ?? "#ccc",
                    }}
                  />
                ))}
              </div>
            </label>
          );
        })}
      </div>

      {!hideNoMood && (
        <div className="ms2-no-mood" onClick={() => onNoMoodChange(!noMood)}>
          <CheckboxSpan checked={noMood} onChange={() => onNoMoodChange(!noMood)} ariaLabel={i18n.t('no_color_moods')} />
          {i18n.t('no_color_moods')}
        </div>
      )}
    </div>
  );
}
