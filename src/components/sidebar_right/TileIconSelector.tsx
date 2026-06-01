import { useState, useMemo } from "react";
import type { ThemeIcon } from "../../types";
import "./TileIconSelector.css";

function SearchIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <line
        x1="7.8"
        y1="7.8"
        x2="10.5"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="1.5"
        y1="1.5"
        x2="8.5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="8.5"
        y1="1.5"
        x2="1.5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownSmIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TileIconSelectorProps {
  themeIcons: ThemeIcon[];
  selectedTile: any;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
}

export function TileIconSelector({
  themeIcons,
  selectedTile,
  onEditTile,
}: TileIconSelectorProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(themeIcons.map((i) => i.IconCategory))).sort(),
    [themeIcons],
  );

  const activeCategory = categories.includes(category)
    ? category
    : (categories[0] ?? "");

  const visibleIcons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (isSearching && term) {
      return themeIcons.filter((i) => i.IconName.toLowerCase().includes(term));
    }
    return themeIcons.filter(
      (i) => !activeCategory || i.IconCategory === activeCategory,
    );
  }, [themeIcons, activeCategory, search, isSearching]);

  function openSearch() {
    setIsSearching(true);
  }
  function closeSearch() {
    setIsSearching(false);
    setSearch("");
  }

  return (
    <>
      <div className="sr-category-row">
        <div className="sr-category-wrap">
          {isSearching ? (
            <input
              className="sr-category-field"
              type="text"
              placeholder="Search icons…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          ) : (
            <select
              className="sr-category-field"
              value={activeCategory}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Icon category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          <div className="sr-category-actions">
            {!isSearching && (
              <span className="sr-category-arrow">
                <ChevronDownSmIcon />
              </span>
            )}
            {isSearching ? (
              <button
                className="sr-category-btn"
                type="button"
                title="Close search"
                onClick={closeSearch}
              >
                <XIcon />
              </button>
            ) : (
              <button
                className="sr-category-btn"
                type="button"
                title="Search icons"
                onClick={openSearch}
              >
                <SearchIcon />
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        className={`sr-icon-grid${visibleIcons.length === 1 ? " sr-icon-grid--single" : ""}`}
      >
        {visibleIcons.map((icon) => {
          const legacyMatch =
            selectedTile?.Icon &&
            (icon.IconCodeName?.toLowerCase() ===
              (selectedTile.Icon as string).toLowerCase() ||
              icon.IconName?.toLowerCase() ===
                (selectedTile.Icon as string).toLowerCase());
          const isActive = !!(
            selectedTile &&
            (selectedTile.IconId === icon.IconId || legacyMatch)
          );
          return (
            <button
              key={icon.IconId}
              className={`sr-icon-cell${isActive ? " sr-icon-cell--active" : ""}`}
              type="button"
              title={icon.IconName}
              onClick={() =>
                selectedTile &&
                onEditTile?.(selectedTile.Id, {
                  Icon: icon.IconName,
                  IconSVG: icon.IconSVG,
                  IconId: icon.IconId,
                })
              }
            >
              <span
                className="sr-icon-wrap"
                dangerouslySetInnerHTML={{ __html: icon.IconSVG }}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
