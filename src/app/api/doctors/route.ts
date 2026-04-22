import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

// GET all doctors, or doctors filtered by hospitalId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const hospital = searchParams.get('hospital')
    const hospitalId = searchParams.get('hospitalId')
    const userId = searchParams.get('userId') // fetch doctor record for a specific user

    if (userId) {
      // Return the Doctor record linked to this user
      const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
      if (!user) return NextResponse.json(null)

      // Try by name match
      let doctor = await prisma.doctor.findFirst({
        where: { name: { contains: user.name, mode: 'insensitive' } }
      })
      if (!doctor) {
        doctor = await prisma.doctor.findFirst({
          where: { name: { contains: user.name, mode: 'insensitive' } },
          include: { hospital: true } as any
        })
      } else {
        doctor = await prisma.doctor.findFirst({
          where: { id: doctor.id },
          include: { hospital: true } as any
        }) as any
      }
      return NextResponse.json(doctor)
    }

    if (hospitalId) {
      const doctors = await prisma.doctor.findMany({
        where: { hospitalId: parseInt(hospitalId) },
        include: { hospital: true },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(doctors)
    }

    if (hospital) {
      const doctors = await prisma.doctor.findMany({
        where: {
          hospital: { name: { contains: hospital, mode: 'insensitive' } }
        },
        include: { hospital: true },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(doctors)
    }

    // Return all doctors
    const doctors = await prisma.doctor.findMany({
      include: { hospital: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(doctors)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
  }
}

// PATCH - doctor updates their hospital assignment
// This creates a Doctor record if one doesn't exist, or updates the hospitalId
export async function PATCH(req: Request) {
  try {
    const { userId, hospitalId, specialization, description, experience, qualifications, availability } = await req.json()

    if (!userId || !hospitalId) {
      return NextResponse.json({ error: 'userId and hospitalId are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const hospital = await prisma.hospital.findUnique({ where: { id: parseInt(hospitalId) } })
    if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })

    // Check if a Doctor record already exists for this userId
    let doctor = await prisma.doctor.findFirst({ where: { name: { contains: user.name, mode: 'insensitive' } } })

    if (!doctor) {
      // Try to find by name (for seeded doctors not yet linked to a user)
      const byName = await prisma.doctor.findFirst({
        where: { name: { contains: user.name, mode: 'insensitive' } }
      })

      if (byName) {
        // Link this seeded doctor to the user and update hospital
        doctor = await (prisma.doctor as any).update({
          where: { id: byName.id },
          data: {
            userId: parseInt(userId),
            hospitalId: parseInt(hospitalId),
            ...(specialization && { specialization }),
            ...(description && { description }),
            ...(experience !== undefined && { experience: parseInt(experience) }),
            ...(qualifications && { qualifications }),
            ...(availability && { availability }),
          }
        })
      } else {
        // Create a new Doctor record
        doctor = await prisma.doctor.create({
          data: {
            userId: parseInt(userId),
            name: user.name,
            hospitalId: parseInt(hospitalId),
            specialization: specialization || 'General Medicine',
            description: description || '',
            experience: parseInt(experience) || 0,
            qualifications: qualifications || '',
            availability: availability || {}
          }
        })
      }
    } else {
      // Update existing Doctor record
      doctor = await (prisma.doctor as any).update({
        where: { id: doctor.id },
        data: {
          hospitalId: parseInt(hospitalId),
          ...(specialization && { specialization }),
          ...(description && { description }),
          ...(experience !== undefined && { experience: parseInt(experience) }),
          ...(qualifications && { qualifications }),
          ...(availability && { availability }),
        }
      })
    }

    return NextResponse.json({ success: true, doctor, hospital })
  } catch (error) {
    console.error('Error updating doctor hospital:', error)
    return NextResponse.json({ error: 'Failed to update doctor hospital assignment' }, { status: 500 })
  }
}