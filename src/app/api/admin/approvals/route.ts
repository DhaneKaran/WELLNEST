/**
 * src/app/api/admin/approvals/route.ts
 *
 * FIX SUMMARY
 * ───────────
 * Bug 1 – getToken() reads a raw cookie whose name changes between HTTP
 *          (next-auth.session-token) and HTTPS (__Secure-next-auth.session-token).
 *          In any environment that doesn't match what next-auth wrote, getToken()
 *          returns null → isAdmin() → false → 403 every time.
 *          Fix: use getServerSession(authOptions), which is the same mechanism
 *          every other working admin route (/users, /memberships) already uses.
 *
 * Bug 2 – The old check only tested token?.role === 'ADMIN' and ignored the
 *          roles[] array that authorize() seeds and the session callback exposes.
 *          Fix: mirror the ensureAdmin() pattern from /api/admin/users/route.ts
 *          and test BOTH session.user.role and session.user.roles.
 *
 * Bug 3 – Missing `export const dynamic = 'force-dynamic'` meant Next.js 14
 *          could cache the handler and never evaluate cookies at all.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Required in Next.js 14 App Router so the runtime always reads
// live cookies/headers instead of a cached static response.
export const dynamic = 'force-dynamic';

/**
 * Returns true when the session belongs to an ADMIN.
 * Checks both the primary `role` field and the `roles` array so that
 * hardcoded admins (role='ADMIN') and array-based role assignments
 * (roles=['ADMIN']) are both handled correctly.
 */
function isAdminSession(session: any): boolean {
  if (!session?.user) return false;
  const primary: string = (session.user as any).role ?? '';
  const roles: string[] = (session.user as any).roles ?? [];
  return primary === 'ADMIN' || roles.includes('ADMIN');
}

// ─── GET /api/admin/approvals ─────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    // getServerSession correctly resolves cookie names across HTTP and HTTPS.
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [doctors, pharmacists] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: { approvalStatus: 'PENDING' },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pharmacistProfile.findMany({
        where: { approvalStatus: 'PENDING' },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ doctors, pharmacists });
  } catch (error) {
    console.error('GET /api/admin/approvals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH /api/admin/approvals ───────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { type, profileId, action, reason } = body;

    if (!type || !profileId || !action) {
      return NextResponse.json(
        { error: 'type, profileId, and action are required' },
        { status: 400 },
      );
    }
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be APPROVE or REJECT' },
        { status: 400 },
      );
    }

    const approved = action === 'APPROVE';

    if (type === 'DOCTOR') {
      const profile = await prisma.doctorProfile.findUnique({
        where: { id: Number(profileId) },
        include: { user: true },
      });
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      await prisma.doctorProfile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          ...(reason ? { rejectionReason: reason } : {}),
        },
      });

      if (approved) {
        await prisma.user.update({
          where: { id: profile.userId },
          data: { role: 'DOCTOR' },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'PHARMACIST') {
      const profile = await prisma.pharmacistProfile.findUnique({
        where: { id: Number(profileId) },
        include: { user: true },
      });
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      await prisma.pharmacistProfile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          ...(reason ? { rejectionReason: reason } : {}),
        },
      });

      if (approved) {
        await prisma.user.update({
          where: { id: profile.userId },
          data: { role: 'PHARMACIST' },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/admin/approvals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}