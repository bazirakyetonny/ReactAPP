import { useState } from "react";
import type { Mood } from "../../types";
import { dataStore } from "../../data/datastore";
import "./ColorPalette.css";

// ── Icons ─────────────────────────────────────────────────────────────────────

function MoodToggleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 14 14"
    >
      <path
        id="Group_4623-converted"
        data-name="Group 4623-converted"
        d="M.733.021A.742.742,0,0,0,.4.236C.256.407.263.273.269,2.96L.275,5.4l.073.113a.686.686,0,0,0,.306.266,17.252,17.252,0,0,0,2.414.044c1.66.005,2.374,0,2.48-.018a.619.619,0,0,0,.159-1.178L5.6,4.575H2.347l.117-.126c.285-.309.771-.792.919-.913A5.254,5.254,0,0,1,5.63,2.484,5.858,5.858,0,0,1,7.143,2.42a5.179,5.179,0,0,1,2.79,1.217,4.929,4.929,0,0,1,1.2,1.546c.149.287.257.406.423.468a.592.592,0,0,0,.658-.141.642.642,0,0,0,.072-.828A6.383,6.383,0,0,0,9.269,1.733a6.033,6.033,0,0,0-1.561-.489A6.348,6.348,0,0,0,2.635,2.533c-.125.1-.427.385-.672.633l-.444.451L1.512,2.056A15.3,15.3,0,0,0,1.476.408.712.712,0,0,0,1.321.2.584.584,0,0,0,.733.021M9.874,9.147,7.531,9.16l-.113.072a.574.574,0,0,0-.292.532.622.622,0,0,0,.373.57,7.011,7.011,0,0,0,1.724.046h1.626l-.129.138c-.337.361-.764.784-.923.912a5.2,5.2,0,0,1-2.649,1.105,6.609,6.609,0,0,1-1.176-.011A5.074,5.074,0,0,1,2.077,9.8c-.224-.429-.35-.531-.659-.531a.491.491,0,0,0-.274.052A.593.593,0,0,0,.862,9.6.5.5,0,0,0,.8,9.878c0,.167,0,.173.161.49a7.147,7.147,0,0,0,.7,1.09,7.211,7.211,0,0,0,1.494,1.337,6.344,6.344,0,0,0,6.358.3,6.1,6.1,0,0,0,1.717-1.309l.445-.452.006,1.561.007,1.562.051.114a.623.623,0,0,0,1.039.164c.162-.184.154-.021.147-2.743L12.92,9.554l-.073-.113a.592.592,0,0,0-.5-.3c-.072,0-1.185,0-2.473,0"
        transform="translate(-0.266 -0.001)"
        fill-rule="evenodd"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ColorPalette({
  selectedTile,
  activeBgHex,
  onEditTile,
  moodId,
}: {
  selectedTile: any;
  activeBgHex?: string;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  moodId?: string;
}) {
  const moods: Mood[] = dataStore.get("Moods") ?? [];
  const themes: any[] = dataStore.get("themes") ?? [];

  const activeColorName = selectedTile?.BGColor;

  const activeMood = moodId
    ? moods.find((m) => m.MoodId === moodId)
    : undefined;
  const themeId = activeMood?.ThemeId ?? dataStore.get("CurrentThemeId");
  const theme = themes.find((t) => t.ThemeId === themeId);
  const moodColorNames = JSON.parse(
    activeMood?.MoodColorNames ?? "[]",
  ) as string[];
  const moodColors = moodColorNames.map((n) => {
    return {
      ColorId: n,
      ColorName: n,
      ColorCode: theme.ThemeColors[n],
    };
  });

  const themeColors = Object.entries(theme?.ThemeColors ?? {}).map(([k, v]) => {
    return {
      ColorId: k,
      ColorName: k,
      ColorCode: v,
    };
  });

  const activeMoodName = activeMood?.MoodName;
  const [showMoods, setShowMoods] = useState(!!activeMoodName);

  return (
    <>
      {/* Palette header: label + toggle */}
      {activeMoodName && (
        <div className="sr-palette-header">
          <span className="sr-palette-label">{activeMoodName}</span>
          <button
            className={`sr-icon-btn${showMoods ? " sr-icon-btn-active" : ""}`}
            type="button"
            title={showMoods ? "Show theme colors" : "Show moods"}
            onClick={() => setShowMoods((v) => !v)}
          >
            <MoodToggleIcon />
          </button>
        </div>
      )}
      {/* Color chips / mood chips */}
      <div className="sr-palette-row">
        <div className="sr-palette">
          {showMoods ? (
            moods.length === 0 ? (
              <span className="sr-zoom-label">No moods</span>
            ) : (
              moodColors.map((mc) => (
                <button
                  key={mc.ColorId}
                  className={`sr-palette-chip${activeColorName === mc.ColorName ? " sr-palette-chip--active" : ""}`}
                  style={{ background: mc.ColorCode }}
                  title={mc.ColorName}
                  type="button"
                  aria-label={`Apply colour ${mc.ColorCode}`}
                  onClick={() =>
                    selectedTile &&
                    onEditTile?.(selectedTile.Id, {
                      BGColor: mc.ColorName,
                      BGImageUrl: null,
                      OriginalImageUrl: null,
                      Opacity: null,
                    })
                  }
                />
              ))
            )
          ) : (
            themeColors.map((mc) => (
              <button
                key={mc.ColorId}
                className={`sr-palette-chip${activeColorName === mc.ColorName ? " sr-palette-chip--active" : ""}`}
                style={{ background: mc.ColorCode }}
                title={mc.ColorName}
                type="button"
                aria-label={`Apply colour ${mc.ColorCode}`}
                onClick={() =>
                  selectedTile &&
                  onEditTile?.(selectedTile.Id, {
                    BGColor: mc.ColorName,
                    BGImageUrl: null,
                    OriginalImageUrl: null,
                    Opacity: null,
                  })
                }
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
