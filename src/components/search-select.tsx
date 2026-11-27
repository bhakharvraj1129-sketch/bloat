"use client";
import { useId, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./shadcn/command";
import { cx, inputClass } from "./ui";

export type SearchOption = { value: string; label: string };

/**
 * A searchable picker (shadcn/ui Command in a Popover). It slides and fades open (250ms), the list
 * filters as you type (by name, or by ID for time zones), and the chosen item shows a tick.
 */
export function SearchSelect({ label, value, onChange, groups, searchLabel, emptyText = "Nothing matches. Try another spelling." }: {
  label: string; value: string; onChange: (value: string) => void; groups: Array<{ heading?: string; options: SearchOption[] }>;
  searchLabel: string; emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const current = groups.flatMap((g) => g.options).find((o) => o.value === value);
  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="t-body-strong">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-labelledby={`${id}-label ${id}-value`} className={cx(inputClass, "flex items-center justify-between gap-2 text-left")}>
            <span id={`${id}-value`} className={value ? "truncate" : "truncate text-ink-muted"}>{current?.label ?? "Not chosen"}</span>
            <ChevronsUpDown size={18} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 gap-0 p-1.5">
          <Command>
            <CommandInput placeholder={searchLabel} aria-label={searchLabel} />
            <CommandList className="max-h-72">
              <CommandEmpty className="px-3 py-5 text-center t-caption">{emptyText}</CommandEmpty>
              {groups.map((g, i) => (
                <CommandGroup key={g.heading ?? i} heading={g.heading}>
                  {g.options.map((o) => (
                    <CommandItem key={o.value || "none"} value={`${o.label} ${o.value}`} data-checked={o.value === value} onSelect={() => { onChange(o.value); setOpen(false); }}>
                      {o.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
