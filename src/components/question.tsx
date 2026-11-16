"use client";
import { Chip, ChipGroup } from "./ui";
import { options as optionsOf, question, type Option } from "@/lib/registry";

type Props = {
  id: string;
  value: string | string[] | null;
  onChange: (v: string | string[] | null) => void;
  /** Hide options (for example "skip", which the screen offers as its own button). */
  hide?: string[];
  order?: string[];
  optionFilter?: (o: Option) => boolean;
  showPrompt?: boolean;
};

/**
 * Renders a single- or multi-choice question straight from the registry JSON, so wording and
 * options always match the plan. Exclusive options (None, Not sure) clear the others.
 */
export function QuestionField({ id, value, onChange, hide = [], order, optionFilter, showPrompt = true }: Props) {
  const q = question(id);
  let opts = optionsOf(id).filter((o) => !hide.includes(o.value) && (!optionFilter || optionFilter(o)));
  if (order) opts = [...opts].sort((a, b) => (order.indexOf(a.value) + 1 || 99) - (order.indexOf(b.value) + 1 || 99));
  const multi = q.input.type === "multi";
  const max = typeof q.input.max === "number" ? q.input.max : Infinity;
  const selected = multi ? ((value as string[] | null) ?? []) : [];
  const labelId = `q-${id}`;

  function toggle(o: Option) {
    if (!multi) return onChange(value === o.value ? null : o.value);
    if (selected.includes(o.value)) {
      const next = selected.filter((v) => v !== o.value);
      return onChange(next.length ? next : null);
    }
    if (o.exclusive) return onChange([o.value]);
    const exclusive = new Set(optionsOf(id).filter((x) => x.exclusive).map((x) => x.value));
    const next = [...selected.filter((v) => !exclusive.has(v)), o.value];
    if (next.length > max) return;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {showPrompt && <p id={labelId} className="t-body-strong">{q.prompt}</p>}
      <ChipGroup labelledBy={showPrompt ? labelId : undefined} label={showPrompt ? undefined : q.prompt}>
        {opts.map((o) => (
          <Chip key={o.value} role={multi ? "checkbox" : "radio"} selected={multi ? selected.includes(o.value) : value === o.value} onClick={() => toggle(o)}>
            {o.label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
}
