import type { Metadata } from 'next'
import AdminLayoutClient from '@/components/AdminLayoutClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Tichučko Admin' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
