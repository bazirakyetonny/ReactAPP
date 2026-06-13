import './CheckboxSpan.css';

export function CheckboxSpan({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
  title,
  className = '',
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
}) {
  const icon = indeterminate ? 'fa-square-minus' : checked ? 'fa-square-check' : 'fa-square';
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      tabIndex={0}
      title={title ?? ariaLabel}
      className={`fa-regular ${icon} cb-span ${className}`.trim()}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange();
        }
      }}
    />
  );
}
