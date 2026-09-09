import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import { formatDateLong } from "@/app/dashboard/_lib/format";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { getCompanySettings, getTeamMembers } from "./_lib/queries";
import { updateCompanySettings, createTeamMember, deleteTeamMember } from "./actions";
import CompanySettingsForm from "./_components/CompanySettingsForm";
import TeamForm from "./_components/TeamForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await verifySession();
  const [settings, teamMembers] = await Promise.all([
    getCompanySettings(),
    getTeamMembers(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your business details, used as the letterhead on invoices.
        </p>
      </div>

      <CompanySettingsForm action={updateCompanySettings} defaultValues={settings} />

      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Team
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everyone here can sign in and see all business data — there are no
            separate roles yet. New accounts are only created here, not through
            a public signup page.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {teamMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                    {member.name}
                    {member.id === session.userId && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {member.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Joined {formatDateLong(member.createdAt)}
                  </span>
                  {member.id !== session.userId && (
                    <DeleteButton
                      action={deleteTeamMember.bind(null, member.id)}
                      confirmMessage={`Remove ${member.name}'s account? They won't be able to sign in anymore.`}
                      label="Remove"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <TeamForm action={createTeamMember} />
        </div>
      </div>
    </div>
  );
}
