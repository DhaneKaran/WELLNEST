'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface Profile {
  id: number;
  user: { name: string; email: string };
  licenseNumber: string;
  approvalStatus?: string;
}

interface PendingData {
  doctors: Profile[];
  pharmacists: Profile[];
}

export default function AdminApprovalsPage() {
  const { data: session, status } = useSession();
  const [pending, setPending] = useState<PendingData>({ doctors: [], pharmacists: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ type: string; id: number } | null>(null);

  // Redirect unauthenticated or non‑admin users
  if (status === 'unauthenticated') redirect('/login');
  if (session?.user && !(session.user as any)?.roles?.includes('ADMIN')) redirect('/dashboard/patient');

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/approvals');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API responded with ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setPending(data);
    } catch (err: any) {
      console.error('Failed to load approvals:', err);
      setError(err.message || 'Could not load pending approvals. Make sure you are logged in as Admin.');
    } finally {
      setLoading(false);
    }
  };

  const act = async (type: string, profileId: number, action: string) => {
    setActionLoading({ type, id: profileId });
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, profileId, action }), // action must be 'APPROVE' or 'REJECT'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Action failed: ${res.status} ${text}`);
      }
      // Refresh the list after successful action
      await fetchPending();
    } catch (err: any) {
      console.error('Action error:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPending();
    }
  }, [status]);

  if (loading) return <div className="p-6">Loading approvals...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Approvals</h1>

      {/* Doctors section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Doctor Profiles</h2>
        {pending.doctors.length === 0 ? (
          <p className="text-gray-500">No pending doctor approvals.</p>
        ) : (
          <ul className="space-y-2">
            {pending.doctors.map((d) => (
              <li key={d.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.user?.name}</div>
                  <div className="text-sm text-gray-500">License: {d.licenseNumber}</div>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => act('DOCTOR', d.id, 'APPROVE')}
                    disabled={actionLoading?.type === 'DOCTOR' && actionLoading?.id === d.id}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act('DOCTOR', d.id, 'REJECT')}
                    disabled={actionLoading?.type === 'DOCTOR' && actionLoading?.id === d.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pharmacists section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Pharmacist Profiles</h2>
        {pending.pharmacists.length === 0 ? (
          <p className="text-gray-500">No pending pharmacist approvals.</p>
        ) : (
          <ul className="space-y-2">
            {pending.pharmacists.map((p) => (
              <li key={p.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.user?.name}</div>
                  <div className="text-sm text-gray-500">License: {p.licenseNumber}</div>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => act('PHARMACIST', p.id, 'APPROVE')}
                    disabled={actionLoading?.type === 'PHARMACIST' && actionLoading?.id === p.id}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act('PHARMACIST', p.id, 'REJECT')}
                    disabled={actionLoading?.type === 'PHARMACIST' && actionLoading?.id === p.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}