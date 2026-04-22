/**
 * src/app/api/appointments/route.ts  (REPLACE existing file)
 * ────────────────────────────────────────────────────────────
 * POST — book an appointment → notifies doctor + patient
 * GET  — unchanged (fetch appointments)
 *
 * Also update the PATCH /api/appointments/[id]/route.ts similarly
 * (see comment at bottom of this file)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { templates, sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  try {
    let appointments

    if (role === 'PATIENT') {
      appointments = await prisma.appointment.findMany({
        where: { patientId: userId },
        include: {
          doctor: { select: { id: true, name: true, specialization: true } },
          hospital: { select: { id: true, name: true, address: true } },
        },
        orderBy: { date: 'desc' },
      })
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({ where: { userId } })
      if (!doctor) return NextResponse.json([])
      appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: { select: { id: true, name: true, email: true, phone: true } },
          hospital: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      })
    } else if (role === 'ADMIN') {
      appointments = await prisma.appointment.findMany({
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
          hospital: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('[appointments GET]', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const patientId = parseInt((session.user as any).id)

  try {
    const { doctorId, hospitalId, date, time, symptoms, medicalHistory } = await req.json()

    if (!doctorId || !hospitalId || !date || !time) {
      return NextResponse.json({ error: 'doctorId, hospitalId, date, time are required' }, { status: 400 })
    }

    const [doctor, hospital, patient] = await Promise.all([
      prisma.doctor.findUnique({ where: { id: Number(doctorId) } }),
      prisma.hospital.findUnique({ where: { id: Number(hospitalId) } }),
      prisma.user.findUnique({ where: { id: patientId } }),
    ])

    if (!doctor || !hospital || !patient) {
      return NextResponse.json({ error: 'Doctor, hospital, or patient not found' }, { status: 404 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: doctor.id,
        hospitalId: hospital.id,
        date: new Date(date),
        time,
        symptoms: symptoms ?? null,
        medicalHistory: medicalHistory ?? null,
        status: 'BOOKED',
        amount: 20.0, // consultation fee
      },
    })

    const formattedDate = new Date(date).toLocaleDateString('en-IN')

    // ── Notify Patient ───────────────────────────────────────
    await notify({
      userId: patientId,
      type: 'APPOINTMENT',
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${doctor.name} at ${hospital.name} on ${formattedDate} at ${time} is booked and awaiting confirmation.`,
      metadata: { appointmentId: appointment.id },
      email: patient.email,
    })

    // Email to patient
    await sendEmail({
      to: patient.email,
      subject: 'Wellnest — Appointment Booked',
      html: templates.appointmentBooked(patient.name, doctor.name, formattedDate, time),
    })

    // ── Notify Doctor (if linked to a User account) ──────────
    if (doctor.userId) {
      await notify({
        userId: doctor.userId,
        type: 'APPOINTMENT',
        title: 'New Appointment Request',
        message: `${patient.name} has booked an appointment on ${formattedDate} at ${time} — ${hospital.name}`,
        metadata: { appointmentId: appointment.id },
      })
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('[appointments POST]', error)
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 })
  }
}

/**
 * ── NOTE FOR appointments/[id]/route.ts PATCH ─────────────────────────────
 * When updating appointment status (CONFIRMED / CANCELLED / RESCHEDULED),
 * add this after saving:
 *
 *   import { notify } from '@/lib/notify'
 *
 *   const statusMessages = {
 *     CONFIRMED: { title: 'Appointment Confirmed ✅', msg: `Your appointment with Dr. ${doctor.name} on ${date} has been confirmed.` },
 *     CANCELLED:  { title: 'Appointment Cancelled',   msg: `Your appointment with Dr. ${doctor.name} on ${date} was cancelled.` },
 *     RESCHEDULED: { title: 'Appointment Rescheduled', msg: `Your appointment was rescheduled to ${newDate} at ${newTime}.` },
 *   }
 *   const notif = statusMessages[newStatus]
 *   if (notif) {
 *     await notify({ userId: appointment.patientId, type: 'APPOINTMENT', ...notif })
 *   }
 * ────────────────────────────────────────────────────────────────────────────
 */
