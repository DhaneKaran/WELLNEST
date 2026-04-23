/**
 * src/app/api/register/route.ts
 * ─────────────────────────────────────────────────────────────
 * Fixed: granular try-catch at every failure point so a broken
 * email, notify, or profile-create never kills the whole request.
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
    console.error('[register] bcrypt error:', hashError?.message || hashError)
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
    // Prisma unique constraint race condition (two simultaneous signups)
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
      // Rollback: delete the user so they can try again cleanly
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to save doctor profile. Please try again.' },
        { status: 500 }
      )
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
      // Rollback: delete the user so they can try again cleanly
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
    // Log but do NOT fail registration — notification is non-critical
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
            : '<p>You can now log in and book appointments, order medicines, and more.</p>'
          }
          <p>— Wellnest Team</p>
        </div>`,
    })
  } catch (emailError: any) {
    // Log but do NOT fail registration — email is non-critical
    console.warn('[register] Welcome email failed (non-fatal):', emailError?.message || emailError)
  }

  // ── 10. Success ────────────────────────────────────────────
  console.log(`[register] ✅ New ${role}: ${name} (${normalizedEmail}) — userId: ${user.id}`)

  return NextResponse.json(
    {
      success: true,
      message: isProfessional
        ? `Registration submitted. Your ${role.toLowerCase()} profile is pending admin approval.`
        : 'Registration successful. You can now log in.',
      userId: user.id,
    },
    { status: 201 }
  )
}