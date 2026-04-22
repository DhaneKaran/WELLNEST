'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function NavbarGate() {
  const pathname = usePathname() || ''
  const isAdmin = pathname.startsWith('/dashboard/admin')
  if (isAdmin) return null
  return <Navbar />
}





