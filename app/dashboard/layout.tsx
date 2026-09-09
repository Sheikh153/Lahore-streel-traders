import type { Metadata } from "next";
import { getCurrentUser, verifySession } from "@/app/lib/dal";
import { getNotifications } from "./_lib/notifications";
import DashboardChrome from "./_components/DashboardChrome";

export const metadata: Metadata = {
  title: {
    template: "%s — Scrap Business CRM",
    default: "Dashboard — Scrap Business CRM",
  },
};

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  await verifySession(); // redirects to /login if there's no session
  const [user, notifications] = await Promise.all([
    getCurrentUser(),
    getNotifications(),
  ]);

  return (
    <DashboardChrome user={user} notifications={notifications}>
      {children}
    </DashboardChrome>
  );
}
