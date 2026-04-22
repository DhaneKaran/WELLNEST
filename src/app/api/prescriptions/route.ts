import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic';

// GET prescriptions - by patientId or doctorUserId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const doctorUserId = searchParams.get('doctorUserId')

    if (patientId) {
      const prescriptions = await prisma.prescription.findMany({
        where: { patientId: parseInt(patientId) },
        include: {
          doctor: true,
          appointment: { include: { hospital: true } },
          patient: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(prescriptions)
    }

    if (doctorUserId) {
      const doctorRecord = await prisma.doctor.findUnique({
        where: { userId: parseInt(doctorUserId) }
      })

      if (!doctorRecord) {
        // Fallback: match by name
        const user = await prisma.user.findUnique({ where: { id: parseInt(doctorUserId) } })
        if (!user) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

        const prescriptions = await prisma.prescription.findMany({
          where: { doctor: { name: { contains: user.name, mode: 'insensitive' } } },
          include: {
            doctor: true,
            appointment: { include: { hospital: true } },
            patient: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(prescriptions)
      }

      const prescriptions = await prisma.prescription.findMany({
        where: { doctorId: doctorRecord.id },
        include: {
          doctor: true,
          appointment: { include: { hospital: true } },
          patient: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(prescriptions)
    }

    // All prescriptions (for pharmacist)
    const prescriptions = await prisma.prescription.findMany({
      include: {
        doctor: true,
        appointment: { include: { hospital: true } },
        patient: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(prescriptions)

  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
  }
}

// POST - doctor creates a prescription
export async function POST(req: Request) {
  try {
    const { appointmentId, patientId, doctorUserId, diagnosis, medications, instructions } = await req.json()

    if (!appointmentId || !patientId || !doctorUserId || !diagnosis || !medications) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the Doctor record linked to this logged-in user
    let doctorRecord = await prisma.doctor.findUnique({
      where: { userId: parseInt(doctorUserId) }
    })

    if (!doctorRecord) {
      // Fallback: match by name
      const user = await prisma.user.findUnique({ where: { id: parseInt(doctorUserId) } })
      if (!user) return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 })

      doctorRecord = await prisma.doctor.findFirst({
        where: { name: { contains: user.name, mode: 'insensitive' } }
      })
      if (!doctorRecord) return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 })
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: parseInt(appointmentId),
        patientId: parseInt(patientId),
        doctorId: doctorRecord.id,
        diagnosis,
        medications,
        instructions: instructions || null,
        status: 'ACTIVE'
      },
      include: {
        doctor: true,
        patient: { select: { id: true, name: true, email: true } },
        appointment: true
      }
    })

    // Mark the appointment as COMPLETED
    await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: { status: 'COMPLETED' }
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
  }
}