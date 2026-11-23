import { Suspense } from 'react'
import { FlashNotice } from '@/components/flash-notice'
import type { ReactNode } from 'react'
import { isAdminRole } from '@/lib/auth/access'
import { requireStaffConsole } from '@/lib/auth/guards'
import { DashboardNav } from '@/components/dashboard-nav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, capabilities, unread } = await requireStaffConsole()
  const role = profile.system_role
  const can = (capability: string) => capabilities.has(capability)
  const groups = [
    { label: 'Activity', links: [
      { href: '/admin/insights', label: 'Insights', show: true },
      { href: '/admin/reports', label: 'Reports', show: can('reports') },
      { href: '/admin/assistant', label: 'AI agent', show: role === 'super_admin' },
      { href: '/dashboard/notifications', label: 'Notifications', show: true, badge: unread },
    ] },
    { label: 'Members and Support', links: [
      { href: '/admin/verification', label: 'Verification queue', show: can('verification') },
      { href: '/admin/users', label: 'Members', show: can('users') },
      { href: '/admin/membership-ids', label: 'Membership IDs', show: can('membership_ids') },
      { href: '/admin/support', label: 'Support', show: can('support') },
      { href: '/admin/emails', label: 'Email queue', show: isAdminRole(role) },
    ] },
    { label: 'Marketplace', links: [
      { href: '/admin/opportunities', label: 'Opportunities', show: can('opportunities') },
      { href: '/admin/deals', label: 'Deals', show: can('opportunities') || can('verification') },
      { href: '/admin/matching', label: 'Matching', show: can('matching') },
      { href: '/admin/introductions', label: 'Match Requests', show: can('introductions') || can('verification') },
    ] },
    { label: 'Finance', links: [
      { href: '/admin/deals-finance', label: 'Deals & Finance', show: can('finance') || can('opportunities') || can('verification') },
      { href: '/admin/subscriptions', label: 'Subscriptions', show: can('finance') },
      { href: '/admin/payments', label: 'Payments', show: can('finance') },
    ] },
    { label: 'Governance', links: [
      { href: '/admin/super', label: 'Super admin', show: role === 'super_admin' },
      { href: '/admin/audit', label: 'Audit log', show: isAdminRole(role) },
      { href: '/admin/security-monitor', label: 'Security Monitor', show: isAdminRole(role) },
      { href: '/admin/backups', label: 'Backup & Restore', show: isAdminRole(role) },
    ] },
    { label: 'Account', links: [
      { href: '/dashboard/security', label: 'Password and security', show: true },
      { href: '/dashboard/settings', label: 'Settings', show: true },
    ] },
  ].map(group => ({ label: group.label, links: group.links.filter(link => link.show) }))

  return <div className="admin-shell dashboard-shell staff-console-shell">
    <DashboardNav profile={profile} unreadCount={unread} consoleGroups={groups} />
    <main className="admin-main">{children}</main>
    <Suspense fallback={null}><FlashNotice /></Suspense>
  </div>
}
