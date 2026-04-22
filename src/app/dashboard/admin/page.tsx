import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/dashboard/patient");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/admin/hospitals" className="card">
          <h2 className="h2">Hospitals</h2>
          <p className="text-secondary">Manage hospitals and services</p>
        </Link>
        <Link href="/dashboard/admin/users" className="card">
          <h2 className="h2">User Management</h2>
          <p className="text-secondary">List users and assign roles</p>
        </Link>
        <Link href="/dashboard/admin/approvals" className="card">
          <h2 className="h2">Approvals</h2>
          <p className="text-secondary">Approve doctor/pharmacist registrations</p>
        </Link>
        <Link href="/dashboard/admin/reports" className="card">
          <h2 className="h2">Reports & Analytics</h2>
          <p className="text-secondary">Appointments, prescriptions, sales</p>
        </Link>
        <Link href="/dashboard/admin/memberships" className="card">
          <h2 className="h2">Memberships</h2>
          <p className="text-secondary">Manage premium tiers</p>
        </Link>
        <Link href="/dashboard/admin/campaigns" className="card">
          <h2 className="h2">Campaigns</h2>
          <p className="text-secondary">Create and manage campaigns</p>
        </Link>
        <Link href="/dashboard/admin/logs" className="card">
          <h2 className="h2">Audit Logs</h2>
          <p className="text-secondary">Monitor system actions</p>
        </Link>
      </div>
    </div>
  );
} 