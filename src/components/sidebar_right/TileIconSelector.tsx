import { useState, useMemo, useEffect, useRef } from "react";
import type { ThemeIcon } from "../../types";
import "./TileIconSelector.css";
import { i18n } from "../../i18n/i18n";

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

const CATEGORY_I18N_KEY: Record<string, string> = {
  general:                            "sidebar.icon_category.general",
  real_estate_rental:                 "sidebar.icon_category.real_estate_rental",
  community_connection:               "sidebar.icon_category.community_connection",
  building_furnishing:                "sidebar.icon_category.building_furnishing",
  services_hospitality:               "sidebar.icon_category.services_hospitality",
  mobility_transport:                 "sidebar.icon_category.mobility_transport",
  care_wellbeing:                     "sidebar.icon_category.care_wellbeing",
  communication_media:                "sidebar.icon_category.communication_media",
  "Technical Services & Support":     "sidebar.icon_category.general",
  "Real Estate & Rental":             "sidebar.icon_category.real_estate_rental",
  "Community & Connection":           "sidebar.icon_category.community_connection",
  "Building & Furnishing":            "sidebar.icon_category.building_furnishing",
  "Services & Hospitality":           "sidebar.icon_category.services_hospitality",
  "Mobility & Transport":             "sidebar.icon_category.mobility_transport",
  "Care & Wellbeing":                 "sidebar.icon_category.care_wellbeing",
  "Communication & Media":            "sidebar.icon_category.communication_media",
};

function translateCategory(cat: string): string {
  const key = CATEGORY_I18N_KEY[cat];
  return key ? i18n.t(key) : cat;
}

export function TileIconSelector({
  themeIcons,
  selectedTile,
  onEditTile,
}: TileIconSelectorProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isSearching) return;
    const iconId = selectedTile?.IconId;
    const iconName = selectedTile?.Icon as string | undefined;
    const match = themeIcons.find(
      (i) =>
        (iconId && i.IconId === iconId) ||
        (iconName &&
          (i.IconCodeName?.toLowerCase() === iconName.toLowerCase() ||
            i.IconName?.toLowerCase() === iconName.toLowerCase())),
    );
    if (match) setCategory(match.IconCategory);
  }, [selectedTile?.IconId, selectedTile?.Icon]);

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

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedTile?.IconId, selectedTile?.Icon, visibleIcons]);

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
              placeholder={i18n.t("sidebar.search_icons")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          ) : (
            <select
              className="sr-category-field"
              value={activeCategory}
              onChange={(e) => setCategory(e.target.value)}
              aria-label={i18n.t("sidebar.icon_category_label")}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {translateCategory(cat)}
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
                title={i18n.t("sidebar.close_search")}
                onClick={closeSearch}
              >
                <XIcon />
              </button>
            ) : (
              <button
                className="sr-category-btn"
                type="button"
                title={i18n.t("sidebar.search_icons")}
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
              ref={isActive ? activeButtonRef : null}
              className={`sr-icon-cell${isActive ? " sr-icon-cell--active" : ""}`}
              type="button"
              title={icon.IconName}
              onClick={() =>
                selectedTile &&
                onEditTile?.(selectedTile.Id, {
                  Icon: icon.IconCodeName,
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
