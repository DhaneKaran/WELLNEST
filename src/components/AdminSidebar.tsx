'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname?.startsWith(href)

  const item = (href: string, label: string) => (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm ${
        isActive(href) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <aside className="w-64 shrink-0 border-r bg-white h-full p-3 space-y-1">
      <div className="px-2 py-3 text-xs font-semibold text-gray-500">Dashboard</div>
      {item('/dashboard/admin', 'Overview')}

      <div className="px-2 pt-4 text-xs font-semibold text-gray-500">Facilities</div>
      {item('/dashboard/admin/hospitals', 'Hospitals')}

      <div className="px-2 pt-4 text-xs font-semibold text-gray-500">User Management</div>
      {item('/dashboard/admin/users', 'Users & Roles')}

      <div className="px-2 pt-4 text-xs font-semibold text-gray-500">Approvals</div>
      {item('/dashboard/admin/approvals', 'Doctor/Pharmacist Approvals')}

      <div className="px-2 pt-4 text-xs font-semibold text-gray-500">Reports & Analytics</div>
      {item('/dashboard/admin/reports', 'System Reports')}

      <div className="px-2 pt-4 text-xs font-semibold text-gray-500">Campaigns & Memberships</div>
      {item('/dashboard/admin/memberships', 'Membership Plans')}
      {item('/dashboard/admin/campaigns', 'Campaigns')}

      <div className="px-2 pt-4 text-xs font-semibold text-gray-500">Audit</div>
      {item('/dashboard/admin/logs', 'Audit Logs')}
    </aside>
  )
}



