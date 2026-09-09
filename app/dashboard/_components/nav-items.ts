import {
  BoxIcon,
  ChartIcon,
  ExpenseIcon,
  GearIcon,
  HomeIcon,
  InvestmentIcon,
  ReceiptIcon,
  SalesIcon,
  UsersIcon,
  WalletIcon,
} from "./icons";

export const navItems = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/dashboard/contacts", label: "Contacts", icon: UsersIcon },
  { href: "/dashboard/inventory", label: "Inventory", icon: BoxIcon },
  { href: "/dashboard/purchases", label: "Purchases", icon: ReceiptIcon },
  { href: "/dashboard/sales", label: "Sales", icon: SalesIcon },
  { href: "/dashboard/expenses", label: "Expenses", icon: ExpenseIcon },
  { href: "/dashboard/investments", label: "Investments", icon: InvestmentIcon },
  { href: "/dashboard/payments", label: "Payments", icon: WalletIcon },
  { href: "/dashboard/records", label: "Records", icon: ChartIcon },
  { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
] as const;
