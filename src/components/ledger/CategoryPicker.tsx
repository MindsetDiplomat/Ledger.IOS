import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CATEGORIES, categoriesForGroup } from "@/lib/ledger/categories";

const OTHER = "__other__";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  const known = CATEGORIES.some((c) => c.name === value);
  const [customMode, setCustomMode] = useState(!known && value !== "");

  if (customMode) {
    return (
      <Input
        autoFocus
        value={value}
        placeholder="New category name"
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (!value.trim()) setCustomMode(false);
        }}
      />
    );
  }

  return (
    <Select
      value={known ? value : ""}
      onValueChange={(v) => {
        if (v === OTHER) {
          setCustomMode(true);
          onChange("");
        } else {
          onChange(v);
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Personal</SelectLabel>
          {categoriesForGroup("personal").map((c) => (
            <SelectItem key={c.name} value={c.name}>
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Business</SelectLabel>
          {categoriesForGroup("business").map((c) => (
            <SelectItem key={c.name} value={c.name}>
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Income</SelectLabel>
          {categoriesForGroup("income").map((c) => (
            <SelectItem key={c.name} value={c.name}>
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectItem value={OTHER}>Other / new category…</SelectItem>
      </SelectContent>
    </Select>
  );
}
