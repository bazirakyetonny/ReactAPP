import { useState } from "react";
import "./TemplateSidebar.css";
import { MultiSelect } from "./widgets/MultiSelect";
import type { MultiSelectOption } from "./widgets/MultiSelect";
import type { TrnPageTemplate } from "../types";
import { regenerateContentIds } from "../utils/contentTransforms";

const CATEGORY_OPTIONS: MultiSelectOption[] = [
  { value: "Basic", label: "Basic" },
  { value: "Standard", label: "Standard" },
  { value: "Advanced", label: "Advanced" },
];

const ALL_CATEGORIES = CATEGORY_OPTIONS.map((c) => c.value);

export function TemplateSidebar({
  templates,
  onApply,
}: {
  templates: TrnPageTemplate[];
  onApply: (content: any[]) => void;
}) {
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(ALL_CATEGORIES);

  const filtered =
    selectedCategories.length === 0
      ? templates
      : templates.filter((t) => selectedCategories.includes(t.TemplateCategory));

  function handleSelect(template: TrnPageTemplate) {
    try {
      const parsed = JSON.parse(template.TemplateContent);
      onApply(regenerateContentIds(parsed.InfoContent ?? []));
    } catch {
      // malformed TemplateContent — skip silently
    }
  }

  return (
    <aside className="template-sidebar">
      <div className="tmpl-header">
        <span className="tmpl-title">Templates</span>
        <span className="tmpl-subtitle">Click a template to apply it</span>
      </div>
      <div className="tmpl-filter">
        <MultiSelect
          options={CATEGORY_OPTIONS}
          value={selectedCategories}
          onChange={setSelectedCategories}
          placeholder="Filter by category…"
        />
      </div>
      <div className="tmpl-grid">
        {filtered.map((template) => (
          <button
            key={template.TemplateId}
            className="tmpl-card"
            onClick={() => handleSelect(template)}
            title={template.TemplateName}
          >
            <div
              className="tmpl-card-img"
              style={{
                backgroundImage: `url(${template.TemplateImage_GXI})`,
              }}
            />
            <span className="tmpl-card-name">{template.TemplateName}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="tmpl-empty">No templates in selected categories.</p>
        )}
      </div>
    </aside>
  );
}
