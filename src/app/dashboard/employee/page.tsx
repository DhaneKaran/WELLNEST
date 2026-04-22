import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).role !== "EMPLOYEE") {
    redirect("/dashboard/patient");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/appointments" className="card">
          <h2 className="h2">Manage Appointments</h2>
          <p className="text-secondary">Schedule and manage patient appointments</p>
        </Link>
        <Link href="/bills" className="card">
          <h2 className="h2">Manage Bills</h2>
          <p className="text-secondary">Generate and manage patient bills</p>
        </Link>
        <Link href="/hospitals" className="card">
          <h2 className="h2">Hospital Information</h2>
          <p className="text-secondary">View hospital details and contact info</p>
        </Link>
      </div>
    </div>
  );
} 