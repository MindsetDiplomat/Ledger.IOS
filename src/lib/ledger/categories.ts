export type CategoryGroup = "personal" | "business" | "income";

export type Category = { name: string; group: CategoryGroup; color: string };

export const CATEGORIES: Category[] = [
  // Personal
  { name: "Food", group: "personal", color: "#e8823d" },
  { name: "Groceries", group: "personal", color: "#5fa96a" },
  { name: "Transport", group: "personal", color: "#4f8ff0" },
  { name: "Health", group: "personal", color: "#e15b6b" },
  { name: "Entertainment", group: "personal", color: "#a56be0" },
  { name: "Travel", group: "personal", color: "#2fb6b0" },
  // Business
  { name: "Software", group: "business", color: "#0d6ba6" },
  { name: "Office", group: "business", color: "#8a6d3b" },
  { name: "Utilities", group: "business", color: "#6b7a8f" },
  { name: "Rent", group: "business", color: "#b67b22" },
  { name: "Marketing", group: "business", color: "#c94f7c" },
  // Income
  { name: "Salary", group: "income", color: "#3ba55d" },
  { name: "Dividends", group: "income", color: "#2f9e6f" },
  { name: "Refunds", group: "income", color: "#6bbf8e" },
  // Fallback
  { name: "Transfer", group: "personal", color: "#8f97a3" },
  { name: "Other", group: "personal", color: "#9aa0a8" },
];

export const AI_CATEGORY_NAMES = [
  "Food",
  "Groceries",
  "Transport",
  "Travel",
  "Software",
  "Office",
  "Utilities",
  "Rent",
  "Entertainment",
  "Health",
  "Income",
  "Transfer",
  "Other",
];

export function categoryColor(name: string): string {
  return CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase())?.color ?? "#9aa0a8";
}

export function categoriesForGroup(group: CategoryGroup): Category[] {
  return CATEGORIES.filter((c) => c.group === group);
}
