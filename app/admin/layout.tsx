import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireAdminProfile } from '@/lib/auth/guards'
import { LogoLink } from '@/components/brand'

export const dynamic='force-dynamic'
export default async function AdminLayout({children}:{children:ReactNode}){const {profile}=await requireAdminProfile();return <div className="admin-shell"><header className="admin-header"><div><LogoLink href="/dashboard" /><span className="admin-label">Administration</span></div><nav><Link href="/admin">Overview</Link><Link href="/admin/verification">Verification queue</Link><Link href="/dashboard">Member dashboard</Link></nav><span>{profile.full_name}</span></header><main className="admin-main">{children}</main></div>}
