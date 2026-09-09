export const COMPANY_EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "salaries",
  "transport",
  "maintenance",
  "office",
  "other",
] as const;

export type CompanyExpenseCategory = (typeof COMPANY_EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<CompanyExpenseCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  salaries: "Salaries",
  transport: "Transport",
  maintenance: "Maintenance",
  office: "Office supplies",
  other: "Other",
};

export function isCompanyExpenseCategory(value: string): value is CompanyExpenseCategory {
  return (COMPANY_EXPENSE_CATEGORIES as readonly string[]).includes(value);
}
