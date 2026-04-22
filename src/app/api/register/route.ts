/**
 * src/app/api/register/route.ts  (REPLACE existing file)
 * ────────────────────────────────────────────────────────
 * Extends registration to capture professional credentials
 * for DOCTOR and PHARMACIST roles, stored with PENDING approval.
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, email, password, phone, dob, address, role = 'PATIENT',
      // Doctor fields
      specialization, qualifications, experience, licenseNumber, degreeDetails,
      // Pharmacist fields
      pharmacyName, certificateNumber,
    } = body

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }
    if (!['PATIENT', 'DOCTOR', 'PHARMACIST'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)

    // DOCTOR and PHARMACIST register as PATIENT until approved
    const assignedRole = role === 'PATIENT' ? 'PATIENT' : 'PATIENT'

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone ?? null,
        dob: dob ? new Date(dob) : null,
        address: address ?? null,
        role: assignedRole, // always starts as PATIENT
      },
    })

    // Create professional profile (pending approval)
    if (role === 'DOCTOR') {
      if (!specialization || !qualifications || !licenseNumber || !degreeDetails) {
        await prisma.user.delete({ where: { id: user.id } })
        return NextResponse.json({ error: 'Doctor details are required (specialization, qualifications, licenseNumber, degreeDetails)' }, { status: 400 })
      }
      await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          specialization,
          qualifications,
          experience: parseInt(experience) || 0,
          licenseNumber,
          degreeDetails,
          approvalStatus: 'PENDING',
        },
      })
    }

    if (role === 'PHARMACIST') {
      if (!certificateNumber || !licenseNumber) {
        await prisma.user.delete({ where: { id: user.id } })
        return NextResponse.json({ error: 'Pharmacist certificate number and license number are required' }, { status: 400 })
      }
      await prisma.pharmacistProfile.create({
        data: {
          userId: user.id,
          pharmacyName: pharmacyName || '',
          qualifications: qualifications || '',
          experience: parseInt(experience) || 0,
          licenseNumber,
          certificateNumber,
          approvalStatus: 'PENDING',
        },
      })
    }

    // Notify admin (hardcoded admin user ID — or fetch admin user from DB)
    // For now, log it; in production find admin users and notify them
    console.log(`[register] New ${role} registration: ${name} (${email}) — pending approval`)

    // Welcome email to registrant
    const isProfessional = role === 'DOCTOR' || role === 'PHARMACIST'
    await sendEmail({
      to: email,
      subject: 'Welcome to Wellnest!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#2563eb">Welcome to Wellnest, ${name}! 🏥</h2>
          <p>Your account has been created successfully.</p>
          ${isProfessional
            ? `<p>Your <strong>${role}</strong> registration is <strong>pending admin approval</strong>. 
               You'll receive a notification once reviewed. Until then, you can use your account as a patient.</p>`
            : '<p>You can now log in and book appointments, order medicines, and more.</p>'}
          <p>— Wellnest Team</p>
        </div>`,
    })

    return NextResponse.json({
      success: true,
      message: isProfessional
        ? `Registration submitted. Your ${role.toLowerCase()} profile is pending admin approval.`
        : 'Registration successful.',
      userId: user.id,
    }, { status: 201 })

  } catch (error: any) {
    console.error('[register]', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
