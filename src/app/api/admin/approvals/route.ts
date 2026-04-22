/**
 * src/app/api/admin/approvals/route.ts  (REPLACE existing file)
 * ──────────────────────────────────────────────────────────────
 * GET   — list PENDING doctor/pharmacist profiles
 * PATCH — approve or reject with reason → notifies the user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { templates, sendEmail } from '@/lib/email'

function ensureAdmin(session: any) {
  const role = (session?.user as any)?.role
  const roles: string[] = (session?.user as any)?.roles ?? []
  if (role !== 'ADMIN' && !roles.includes('ADMIN')) throw new Error('FORBIDDEN')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)

    const [doctors, pharmacists] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pharmacistProfile.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Also return counts for the dashboard
    const [totalUsers, totalDoctors, totalPharmacists, pendingApprovals] = await Promise.all([
      prisma.user.count(),
      prisma.doctorProfile.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.pharmacistProfile.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.doctorProfile.count({ where: { approvalStatus: 'PENDING' } })
        .then(d => prisma.pharmacistProfile.count({ where: { approvalStatus: 'PENDING' } }).then(p => d + p)),
    ])

    return NextResponse.json({ doctors, pharmacists, stats: { totalUsers, totalDoctors, totalPharmacists, pendingApprovals } })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[admin/approvals GET]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)

    const { type, profileId, action, reason } = await req.json()
    // action: 'APPROVE' | 'REJECT'
    if (!type || !profileId || !action) {
      return NextResponse.json({ error: 'type, profileId, action required' }, { status: 400 })
    }
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'action must be APPROVE or REJECT' }, { status: 400 })
    }

    const approved = action === 'APPROVE'

    if (type === 'DOCTOR') {
      const profile = await prisma.doctorProfile.findUnique({
        where: { id: Number(profileId) },
        include: { user: true },
      })
      if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

      // Update profile status
      await prisma.doctorProfile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          ...(reason ? { rejectionReason: reason } : {}),
        },
      })

      // Grant role if approved
      if (approved) {
        await prisma.user.update({ where: { id: profile.userId }, data: { role: 'DOCTOR' } })
      }

      // Notify the doctor via in-app + email
      await notify({
        userId: profile.userId,
        type: 'APPROVAL',
        title: approved ? 'Registration Approved 🎉' : 'Registration Rejected',
        message: approved
          ? 'Your registration as a Doctor has been approved. You can now access the full doctor dashboard.'
          : `Your doctor registration was rejected. ${reason ? 'Reason: ' + reason : 'Please contact support for details.'}`,
        metadata: { action, type: 'DOCTOR' },
        email: profile.user.email,
      })

      // Also send proper email template
      await sendEmail({
        to: profile.user.email,
        subject: approved ? 'Wellnest — Registration Approved' : 'Wellnest — Registration Update',
        html: templates.approvalResult(profile.user.name, 'Doctor', approved, reason),
      })

      return NextResponse.json({ success: true })
    }

    if (type === 'PHARMACIST') {
      const profile = await prisma.pharmacistProfile.findUnique({
        where: { id: Number(profileId) },
        include: { user: true },
      })
      if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

      await prisma.pharmacistProfile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          ...(reason ? { rejectionReason: reason } : {}),
        },
      })

      if (approved) {
        await prisma.user.update({ where: { id: profile.userId }, data: { role: 'PHARMACIST' } })
      }

      await notify({
        userId: profile.userId,
        type: 'APPROVAL',
        title: approved ? 'Registration Approved 🎉' : 'Registration Rejected',
        message: approved
          ? 'Your registration as a Pharmacist has been approved. You now have full dashboard access.'
          : `Your pharmacist registration was rejected. ${reason ? 'Reason: ' + reason : ''}`,
        metadata: { action, type: 'PHARMACIST' },
        email: profile.user.email,
      })

      await sendEmail({
        to: profile.user.email,
        subject: approved ? 'Wellnest — Registration Approved' : 'Wellnest — Registration Update',
        html: templates.approvalResult(profile.user.name, 'Pharmacist', approved, reason),
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[admin/approvals PATCH]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
