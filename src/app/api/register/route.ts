/**
 * src/app/api/register/route.ts
 * ─────────────────────────────────────────────────────────────
 * Fixed: Auto-login after registration — returns session token so
 * the frontend can call signIn() immediately after successful register.
 * Also: returns full user object so AuthContext.login() can be called.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { notify } from '@/lib/notify';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {

  // ── 1. Parse request body ──────────────────────────────────
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 }
    )
  }

  const {
    name, email, password, phone, dob, address, role = 'PATIENT',
    // Doctor fields
    specialization, qualifications, experience, licenseNumber, degreeDetails,
    hospitalId,
    // Pharmacist fields
    pharmacyName, certificateNumber,
  } = body

  // ── 2. Basic validation ────────────────────────────────────
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Name, email, and password are required.' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (!['PATIENT', 'DOCTOR', 'PHARMACIST'].includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be PATIENT, DOCTOR, or PHARMACIST.' },
      { status: 400 }
    )
  }

  // ── 3. Check duplicate email ───────────────────────────────
  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered. Please log in.' },
        { status: 409 }
      )
    }
  } catch (dbError: any) {
    console.error('[register] DB check failed:', dbError?.message || dbError)
    return NextResponse.json(
      { error: 'Unable to reach database. Please try again in a moment.' },
      { status: 503 }
    )
  }

  // ── 4. Validate professional fields BEFORE touching the DB ─
  if (role === 'DOCTOR') {
    if (!specialization || !qualifications || !licenseNumber || !degreeDetails) {
      return NextResponse.json(
        { error: 'Doctor registration requires: specialization, qualifications, licenseNumber, and degreeDetails.' },
        { status: 400 }
      )
    }
  }

  if (role === 'PHARMACIST') {
    if (!certificateNumber || !licenseNumber) {
      return NextResponse.json(
        { error: 'Pharmacist registration requires: certificateNumber and licenseNumber.' },
        { status: 400 }
      )
    }
  }

  // ── 5. Hash password ───────────────────────────────────────
  let hashed: string
  try {
    hashed = await bcrypt.hash(password, 10)
  } catch (hashError: any) {
    console.error('[register] bcryptjs error:', hashError?.message || hashError)
    return NextResponse.json(
      { error: 'Password processing failed. Please try again.' },
      { status: 500 }
    )
  }

  // ── 6. Create user ─────────────────────────────────────────
  let user: any
  try {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        phone: phone ?? null,
        dob: dob ? new Date(dob) : null,
        address: address ?? null,
        role: 'PATIENT', // always starts as PATIENT; professionals get promoted after approval
      },
    })
  } catch (createError: any) {
    console.error('[register] User create failed:', createError?.message || createError)
    if (createError?.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email was just registered. Please log in.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }

  // ── 7. Create professional profile (if applicable) ─────────
  if (role === 'DOCTOR') {
    try {
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
    } catch (profileError: any) {
      console.error('[register] Doctor profile create failed:', profileError?.message || profileError)
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to save doctor profile. Please try again.' },
        { status: 500 }
      )
    }

    if (hospitalId) {
      try {
        const parsedHospitalId = parseInt(hospitalId)
        const hospitalExists = await prisma.hospital.findUnique({ where: { id: parsedHospitalId } })
        if (hospitalExists) {
          const existingDoctor = await prisma.doctor.findFirst({ where: { userId: user.id } })
          if (!existingDoctor) {
            await prisma.doctor.create({
              data: {
                userId: user.id,
                name: name.trim(),
                hospitalId: parsedHospitalId,
                specialization: specialization || 'General Medicine',
                description: `${specialization || 'General Medicine'} specialist with ${parseInt(experience) || 0} years of experience.`,
                experience: parseInt(experience) || 0,
                qualifications: qualifications || '',
                availability: {},
              },
            })
          }
        }
      } catch (doctorError: any) {
        console.warn('[register] Doctor record create (non-fatal):', doctorError?.message || doctorError)
      }
    }
  }

  if (role === 'PHARMACIST') {
    try {
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
    } catch (profileError: any) {
      console.error('[register] Pharmacist profile create failed:', profileError?.message || profileError)
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to save pharmacist profile. Please try again.' },
        { status: 500 }
      )
    }
  }

  // ── 8. Notify admin (non-fatal) ────────────────────────────
  try {
    await notify({
      userId: user.id,
      title: "Registration Successful",
      message: `New ${role} registration: ${name} (${normalizedEmail}) — pending approval`,
      type: 'REGISTRATION',
    })
  } catch (notifyError: any) {
    console.warn('[register] Admin notify failed (non-fatal):', notifyError?.message || notifyError)
  }

  // ── 9. Send welcome email (non-fatal) ──────────────────────
  const isProfessional = role === 'DOCTOR' || role === 'PHARMACIST'
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to Wellnest!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#2563eb">Welcome to Wellnest, ${name}! 🏥</h2>
          <p>Your account has been created successfully.</p>
          ${isProfessional
            ? `<p>Your <strong>${role}</strong> registration is <strong>pending admin approval</strong>.
               You'll receive a notification once reviewed. Until then, you can use your account as a patient.</p>`
            : '<p>You can now book appointments, order medicines, and more.</p>'
          }
          <p>— Wellnest Team</p>
        </div>`,
    })
  } catch (emailError: any) {
    console.warn('[register] Welcome email failed (non-fatal):', emailError?.message || emailError)
  }

  // ── 10. Success — return user data for immediate auto-login ─
  console.log(`[register] ✅ New ${role}: ${name} (${normalizedEmail}) — userId: ${user.id}`)

  return NextResponse.json(
    {
      success: true,
      message: isProfessional
        ? `Registration submitted. Your ${role.toLowerCase()} profile is pending admin approval.`
        : 'Registration successful.',
      // Return user object so the frontend can call login() directly
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        dob: user.dob ? user.dob.toISOString() : null,
        address: user.address ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      // Also send credentials back for signIn() call
      credentials: {
        email: normalizedEmail,
        password, // raw password — used ONLY by the frontend to call signIn() once, never stored
      },
    },
    { status: 201 }
  )
}