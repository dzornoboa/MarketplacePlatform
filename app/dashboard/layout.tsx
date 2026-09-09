import type { ReactNode } from 'react'
import { requireUserProfile } from '@/lib/auth/guards'
import { DashboardNav } from '@/components/dashboard-nav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireUserProfile()
  return <div className="dashboard-shell"><DashboardNav profile={profile} /><main className="dashboard-main">{children}</main></div>
}
