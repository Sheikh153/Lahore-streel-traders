type IconProps = {
  className?: string;
};

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="9" cy="8" r="3.25" />
      <path d="M18.5 19v-1.5a3.5 3.5 0 0 0-2.5-3.36" />
      <path d="M14 4.7a3.25 3.25 0 0 1 0 6.1" />
    </svg>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 8v8L12 20l8.5-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

export function ReceiptIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 20.5v-17Z" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11a1.5 1.5 0 0 1 1.5 1.5V8" />
      <path d="M3.5 7.5v10A2.5 2.5 0 0 0 6 20h12.5A1.5 1.5 0 0 0 20 18.5V9a1.5 1.5 0 0 0-1.5-1.5H6a2.5 2.5 0 0 1-2.5-2Z" />
      <circle cx="16.25" cy="13.5" r="1.25" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19.5h16" />
      <rect x="6" y="12" width="2.6" height="6" rx="0.6" />
      <rect x="10.7" y="8" width="2.6" height="10" rx="0.6" />
      <rect x="15.4" y="14.5" width="2.6" height="3.5" rx="0.6" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.8-1.4-2-3.4-2.1.7a7.5 7.5 0 0 0-2.6-1.5L14.1 2h-4.2l-.4 2.2a7.5 7.5 0 0 0-2.6 1.5l-2.1-.7-2 3.4L4.6 10a7.6 7.6 0 0 0 0 3l-1.8 1.5 2 3.4 2.1-.7c.76.66 1.64 1.17 2.6 1.5l.4 2.2h4.2l.4-2.2a7.5 7.5 0 0 0 2.6-1.5l2.1.7 2-3.4-1.8-1.5Z" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" />
      <path d="M14 15.5 19 12l-5-3.5" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 14 6-6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 10 6 6 6-6" />
    </svg>
  );
}

export function SalesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 18.5 9 12l4 3 7.5-8.5" />
      <path d="M15.5 6.5h5v5" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.25" r="3.25" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function ExpenseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 15c0 1.1 1.1 2 2.5 2s2.5-.7 2.5-1.8-1.1-1.7-2.5-2-2.5-.9-2.5-2S10.6 9.4 12 9.4s2.5.7 2.5 1.8" />
      <path d="M12 7.5v1.9M12 15v1.6" />
    </svg>
  );
}

export function InvestmentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19.5v-6M9.5 19.5v-10M15 19.5v-4M20 19.5v-13" />
      <path d="m4 10.5 5.5-4.5 5.5 2.5 5-6" />
      <path d="M16.5 2.5H20v3.5" />
    </svg>
  );
}

export function TableIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15" />
    </svg>
  );
}
