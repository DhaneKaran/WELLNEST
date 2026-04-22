import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()
    const { status, symptoms, medicalHistory } = body

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(symptoms && { symptoms }),
        ...(medicalHistory && { medicalHistory }),
      },
      include: {
        hospital: true,
        doctor: true,
        patient: { select: { id: true, name: true, email: true, phone: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        hospital: true,
        doctor: true,
        patient: { select: { id: true, name: true, email: true, phone: true } },
        prescriptions: true
      }
    })
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json(appointment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
  }
}