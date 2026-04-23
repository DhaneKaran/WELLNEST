
/**
 * POST /api/seed
 * One-shot data seeder — populates the entire database with realistic demo data.
 *
 * SECURITY: Protected by SEED_SECRET env var.
 * Call with:  POST /api/seed  +  header  x-seed-secret: <SEED_SECRET>
 *
 * What it creates:
 *  • 6 Hospitals  (with services, coordinates, ratings)
 *  • 12 Doctors   (linked to hospitals, with DoctorProfile + Doctor row)
 *  • 10 Patients  (with PatientProfile + Membership)
 *  • 4  Pharmacists (with PharmacistProfile)
 *  • 20 Medicines
 *  • 120 Appointments (spread over past 3 months + next month)
 *  • Prescriptions  (for every COMPLETED appointment)
 *  • Bills          (one per appointment + one per order)
 *  • 40 Orders      (medicine orders with bills)
 *  • Notifications  (3-6 per patient, 3 per doctor)
 *
 * Safe to re-run — skips already-existing rows instead of duplicating.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ─── helpers ──────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000)

const TIME_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM',
]

const SYMPTOM_SETS = [
  'Persistent headache and dizziness',
  'Chest pain and shortness of breath',
  'Fever, cough, and sore throat',
  'Lower back pain radiating to legs',
  'Abdominal pain and nausea',
  'Joint pain and morning stiffness',
  'Skin rash and itching',
  'Vision blurring and eye pain',
  'Fatigue and unexplained weight loss',
  'Frequent urination and excessive thirst',
  'Palpitations and irregular heartbeat',
  'Numbness in hands and feet',
  'Ear pain and hearing difficulty',
  'Anxiety, insomnia, and mood swings',
]

const DIAGNOSES = [
  'Hypertension Stage 1',
  'Type 2 Diabetes Mellitus',
  'Community Acquired Pneumonia',
  'Lumbar Disc Herniation',
  'Acute Gastroenteritis',
  'Rheumatoid Arthritis',
  'Allergic Dermatitis',
  'Migraine without Aura',
  'Anxiety Disorder',
  'Iron Deficiency Anemia',
  'Urinary Tract Infection',
  'Hypothyroidism',
]

const MED_COMBOS = [
  [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' }],
  [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '60 days' }, { name: 'Glimepiride', dosage: '1mg', frequency: 'Once daily before breakfast', duration: '60 days' }],
  [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' }, { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: '5 days' }],
  [{ name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily before meals', duration: '14 days' }, { name: 'Ondansetron', dosage: '4mg', frequency: 'Twice daily', duration: '5 days' }],
  [{ name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily at night', duration: '10 days' }],
  [{ name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at night', duration: '90 days' }, { name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', duration: '90 days' }],
  [{ name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: '5 days' }],
  [{ name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily on empty stomach', duration: '90 days' }],
  [{ name: 'Escitalopram', dosage: '10mg', frequency: 'Once daily', duration: '30 days' }, { name: 'Clonazepam', dosage: '0.25mg', frequency: 'At bedtime', duration: '14 days' }],
  [{ name: 'Paracetamol', dosage: '500mg', frequency: 'Three times daily', duration: '3 days' }, { name: 'Vitamin C', dosage: '500mg', frequency: 'Once daily', duration: '7 days' }],
]

const INSTRUCTIONS = [
  'Take medications after meals. Drink plenty of water. Avoid spicy food.',
  'Rest adequately. Avoid strenuous activity for 1 week. Follow-up in 2 weeks.',
  'Complete the full course of antibiotics even if symptoms improve.',
  'Monitor blood pressure daily. Reduce salt intake. Regular 30-minute walks recommended.',
  'Monitor blood sugar levels twice daily. Maintain a strict diabetic diet.',
  'Avoid alcohol while on medication. Report any side effects immediately.',
  'Take thyroid medication 30 minutes before breakfast. Avoid calcium supplements within 4 hours.',
]

// ─── route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret   = req.headers.get('x-seed-secret')
  const expected = process.env.SEED_SECRET

  if (!expected) {
    return NextResponse.json({ error: 'SEED_SECRET env var not set on server' }, { status: 500 })
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Forbidden — wrong seed secret' }, { status: 403 })
  }

  const log: string[] = []
  const pw = await bcrypt.hash('Demo@1234', 10)

  try {
    // ── 1. HOSPITALS ──────────────────────────────────────────────────────────
    const hospitalDefs = [
      { name: 'Ratnagiri District Hospital',  address: 'Station Road, Ratnagiri, Maharashtra',    contact: '02352-222456', coordinates: [16.9902, 73.3120], services: ['Emergency Care','Surgery','Trauma Center','Pediatrics','Cardiology','Radiology','ICU'],                     rating: '4.6/5' },
      { name: 'Sai Multispecialty Hospital',  address: 'Ganpatipule Road, Ratnagiri, Maharashtra', contact: '02352-967654', coordinates: [16.9850, 73.3080], services: ['Consulting','Maternity Care','Women\'s Health','Orthopedics','Laboratory Services','Blood Bank'],           rating: '4.5/5' },
      { name: 'Ratnagiri Medical Center',     address: 'Marine Drive, Ratnagiri, Maharashtra',     contact: '02352-466709', coordinates: [16.9950, 73.3150], services: ['Physiotherapy','Rehabilitation','Nutrition Counseling','Pain Management','Neurology','Spine Care'],        rating: '4.7/5' },
      { name: 'Konkan Health Care',           address: 'Pune-Mumbai Highway, Ratnagiri',           contact: '02352-224567', coordinates: [16.9840, 73.3200], services: ['Community Health','Geriatrics','Chronic Disease Management','Wellness Programs','Dentistry','Ophthalmology'], rating: '4.3/5' },
      { name: 'Ratnagiri City Hospital',      address: 'Market Area, Ratnagiri, Maharashtra',      contact: '02352-876543', coordinates: [16.9950, 73.3050], services: ['Psychiatry','Mental Health','Dermatology','ENT','Ophthalmology','Sleep Center','Allergy Clinic'],           rating: '4.8/5' },
      { name: 'Parshuram Multispecialty',     address: 'Nachane Road, Ratnagiri, Maharashtra',     contact: '02352-334455', coordinates: [16.9870, 73.3100], services: ['Oncology','Dialysis','Endocrinology','Gastroenterology','Urology','Nephrology','Transplant Unit'],         rating: '4.4/5' },
    ]

    const hospitals: any[] = []
    for (const h of hospitalDefs) {
      const existing = await prisma.hospital.findFirst({ where: { name: h.name } })
      if (existing) { hospitals.push(existing); continue }
      hospitals.push(await prisma.hospital.create({ data: h }))
    }
    log.push(`✅ Hospitals: ${hospitals.length}`)

    // ── 2. DOCTORS ────────────────────────────────────────────────────────────
    const doctorDefs = [
      { name: 'Dr. Rajesh Kulkarni',  email: 'rajesh.kulkarni@demo.com',  spec: 'Cardiology',        qual: 'MBBS, MD (Cardiology), DM',      exp: 14, lic: 'MCI-2010-CARD-001',  hi: 0, desc: 'Senior cardiologist with 14 years in interventional cardiology and cardiac imaging.' },
      { name: 'Dr. Priya Sharma',     email: 'priya.sharma@demo.com',     spec: 'Pediatrics',        qual: 'MBBS, MD (Pediatrics)',          exp: 9,  lic: 'MCI-2015-PED-002',   hi: 0, desc: 'Experienced pediatrician specializing in child nutrition and developmental disorders.' },
      { name: 'Dr. Amit Joshi',       email: 'amit.joshi@demo.com',       spec: 'Orthopedics',       qual: 'MBBS, MS (Ortho), Fellowship',  exp: 11, lic: 'MCI-2013-ORT-003',   hi: 1, desc: 'Orthopedic surgeon specializing in joint replacement and sports injuries.' },
      { name: 'Dr. Sunita Patil',     email: 'sunita.patil@demo.com',     spec: 'Gynecology',        qual: 'MBBS, MS (Obs & Gyn)',          exp: 16, lic: 'MCI-2008-OBG-004',   hi: 1, desc: 'Expert obstetrician & gynecologist with focus on high-risk pregnancies.' },
      { name: 'Dr. Manoj Desai',      email: 'manoj.desai@demo.com',      spec: 'Neurology',         qual: 'MBBS, MD (Neurology), DM',      exp: 12, lic: 'MCI-2012-NEURO-005', hi: 2, desc: 'Neurologist specializing in stroke management, epilepsy, and movement disorders.' },
      { name: 'Dr. Deepika Rane',     email: 'deepika.rane@demo.com',     spec: 'Dermatology',       qual: 'MBBS, DVD, MD (Dermatology)',   exp: 7,  lic: 'MCI-2017-DERM-006',  hi: 4, desc: 'Dermatologist with expertise in cosmetic procedures and chronic skin disorders.' },
      { name: 'Dr. Sanjay Gaikwad',   email: 'sanjay.gaikwad@demo.com',   spec: 'General Medicine',  qual: 'MBBS, MD (General Medicine)',   exp: 18, lic: 'MCI-2006-GM-007',    hi: 3, desc: 'General physician with extensive experience in internal medicine and chronic disease.' },
      { name: 'Dr. Kavita Naik',      email: 'kavita.naik@demo.com',      spec: 'Endocrinology',     qual: 'MBBS, MD, DM (Endocrinology)', exp: 10, lic: 'MCI-2014-ENDO-008',  hi: 5, desc: 'Endocrinologist managing diabetes, thyroid, and hormonal imbalance conditions.' },
      { name: 'Dr. Rohit Sawant',     email: 'rohit.sawant@demo.com',     spec: 'Psychiatry',        qual: 'MBBS, MD (Psychiatry)',         exp: 8,  lic: 'MCI-2016-PSY-009',   hi: 4, desc: 'Psychiatrist specializing in mood disorders, anxiety, and addiction medicine.' },
      { name: 'Dr. Anita Marathe',    email: 'anita.marathe@demo.com',    spec: 'Ophthalmology',     qual: 'MBBS, MS (Ophthalmology)',      exp: 13, lic: 'MCI-2011-OPTH-010',  hi: 2, desc: 'Eye specialist offering comprehensive ophthalmology and cataract surgery services.' },
      { name: 'Dr. Vikram Chavan',    email: 'vikram.chavan@demo.com',    spec: 'Gastroenterology',  qual: 'MBBS, MD, DM (Gastro)',         exp: 15, lic: 'MCI-2009-GASTRO-011',hi: 5, desc: 'Gastroenterologist with expertise in endoscopy, hepatology, and IBD management.' },
      { name: 'Dr. Meera Bhosle',     email: 'meera.bhosle@demo.com',     spec: 'Pulmonology',       qual: 'MBBS, MD (Respiratory)',        exp: 9,  lic: 'MCI-2015-PULM-012',  hi: 0, desc: 'Pulmonologist treating asthma, COPD, ILD, and respiratory infections.' },
    ]

    const doctorUsers: any[] = []
    const doctorRows: any[] = []

    for (const d of doctorDefs) {
      let user = await prisma.user.findUnique({ where: { email: d.email } })
      if (!user) {
        user = await prisma.user.create({
          data: { name: d.name, email: d.email, password: pw, role: 'DOCTOR', phone: `98${randInt(10000000,99999999)}` }
        })
        await prisma.doctorProfile.create({
          data: {
            userId: user.id, specialization: d.spec, qualifications: d.qual,
            experience: d.exp, licenseNumber: d.lic, approvalStatus: 'APPROVED',
            degreeDetails: `${d.qual} — Government Medical College, Maharashtra`
          }
        })
      }
      doctorUsers.push(user)

      let row = await prisma.doctor.findFirst({ where: { userId: user.id } })
      if (!row) {
        row = await prisma.doctor.create({
          data: {
            userId: user.id, name: d.name, specialization: d.spec,
            description: d.desc, experience: d.exp, qualifications: d.qual,
            hospitalId: hospitals[d.hi].id,
            availability: {
              mon: ['09:00','13:00'], tue: ['09:00','13:00'],
              wed: ['14:00','18:00'], thu: ['09:00','13:00'], fri: ['09:00','13:00'],
            }
          }
        })
      }
      doctorRows.push(row)
    }
    log.push(`✅ Doctors: ${doctorRows.length}`)

    // ── 3. PATIENTS ───────────────────────────────────────────────────────────
    const patientDefs = [
      { name: 'Aarav Mehta',    email: 'aarav.mehta@demo.com',    phone: '9812345678', dob: new Date('1990-03-15'), gender: 'Male',   blood: 'O+',  history: 'Hypertension, mild diabetes',                tier: 'PREMIUM' },
      { name: 'Priti Joshi',    email: 'priti.joshi@demo.com',    phone: '9823456789', dob: new Date('1985-07-22'), gender: 'Female', blood: 'A+',  history: 'Asthma, seasonal allergies',                  tier: 'BASIC'   },
      { name: 'Karan Pawar',    email: 'karan.pawar@demo.com',    phone: '9834567890', dob: new Date('1998-11-05'), gender: 'Male',   blood: 'B+',  history: 'No known conditions',                         tier: 'FREE'    },
      { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@demo.com', phone: '9845678901', dob: new Date('1992-01-30'), gender: 'Female', blood: 'AB+', history: 'Thyroid disorder',                            tier: 'PREMIUM' },
      { name: 'Rohan Desai',    email: 'rohan.desai@demo.com',    phone: '9856789012', dob: new Date('1975-09-18'), gender: 'Male',   blood: 'O-',  history: 'Back pain, obesity, hypertension',            tier: 'BASIC'   },
      { name: 'Anjali Patil',   email: 'anjali.patil@demo.com',   phone: '9867890123', dob: new Date('2000-05-12'), gender: 'Female', blood: 'A-',  history: 'No known conditions',                         tier: 'FREE'    },
      { name: 'Suresh Sawant',  email: 'suresh.sawant@demo.com',  phone: '9878901234', dob: new Date('1968-12-03'), gender: 'Male',   blood: 'B-',  history: 'Type 2 diabetes, cardiac history, CKD Stage 2', tier: 'PREMIUM' },
      { name: 'Pallavi Naik',   email: 'pallavi.naik@demo.com',   phone: '9889012345', dob: new Date('1983-08-27'), gender: 'Female', blood: 'O+',  history: 'Polycystic ovarian syndrome',                 tier: 'BASIC'   },
      { name: 'Nikhil Rane',    email: 'nikhil.rane@demo.com',    phone: '9890123456', dob: new Date('1995-04-09'), gender: 'Male',   blood: 'A+',  history: 'Sports injury — knee ligament tear',          tier: 'FREE'    },
      { name: 'Divya Gaikwad',  email: 'divya.gaikwad@demo.com',  phone: '9801234567', dob: new Date('1988-06-14'), gender: 'Female', blood: 'AB-', history: 'Migraine, anxiety disorder',                  tier: 'PREMIUM' },
    ]

    const patients: any[] = []
    for (const p of patientDefs) {
      let user = await prisma.user.findUnique({ where: { email: p.email } })
      if (!user) {
        user = await prisma.user.create({
          data: { name: p.name, email: p.email, password: pw, role: 'PATIENT', phone: p.phone, dob: p.dob, address: 'Ratnagiri, Maharashtra' }
        })
        await prisma.patientProfile.create({
          data: { userId: user.id, dateOfBirth: p.dob, gender: p.gender, bloodGroup: p.blood, medicalHistory: p.history, insurancePlan: p.tier !== 'FREE' ? `HealthPlan ${p.tier}` : null }
        })
        await prisma.membership.create({
          data: { userId: user.id, tier: p.tier, status: 'ACTIVE', expiresAt: p.tier !== 'FREE' ? daysAhead(365) : null }
        })
      }
      patients.push(user)
    }
    log.push(`✅ Patients: ${patients.length}`)

    // ── 4. PHARMACISTS ────────────────────────────────────────────────────────
    const pharmDefs = [
      { name: 'Rahul Kamble',    email: 'rahul.kamble@demo.com',   pharmacy: 'MedPlus Ratnagiri',  qual: 'B.Pharm, M.Pharm', exp: 8, lic: 'PH-MH-2016-001', cert: 'RPHARM-001' },
      { name: 'Smita Bhosle',    email: 'smita.bhosle@demo.com',   pharmacy: 'Apollo Pharmacy',    qual: 'D.Pharm, B.Pharm', exp: 5, lic: 'PH-MH-2019-002', cert: 'RPHARM-002' },
      { name: 'Ganesh Waghmare', email: 'ganesh.waghmare@demo.com', pharmacy: 'Jan Aushadhi Store', qual: 'B.Pharm',          exp: 6, lic: 'PH-MH-2018-003', cert: 'RPHARM-003' },
      { name: 'Pooja Shirke',    email: 'pooja.shirke@demo.com',   pharmacy: 'Konkan Medicals',    qual: 'B.Pharm, MBA',     exp: 4, lic: 'PH-MH-2020-004', cert: 'RPHARM-004' },
    ]

    const pharmacists: any[] = []
    for (const ph of pharmDefs) {
      let user = await prisma.user.findUnique({ where: { email: ph.email } })
      if (!user) {
        user = await prisma.user.create({
          data: { name: ph.name, email: ph.email, password: pw, role: 'PHARMACIST', phone: `98${randInt(10000000,99999999)}` }
        })
        await prisma.pharmacistProfile.create({
          data: { userId: user.id, pharmacyName: ph.pharmacy, qualifications: ph.qual, experience: ph.exp, licenseNumber: ph.lic, certificateNumber: ph.cert, approvalStatus: 'APPROVED' }
        })
      }
      pharmacists.push(user)
    }
    log.push(`✅ Pharmacists: ${pharmacists.length}`)

    // ── 5. MEDICINES ──────────────────────────────────────────────────────────
    const medDefs = [
      { name: 'Paracetamol 500mg',      use: 'Fever and mild pain',                    dosageForm: 'Tablet',  manufacturer: 'Cipla',          price: 12.50,  stock: 500, category: 'Analgesic',    prescription: false },
      { name: 'Amoxicillin 500mg',      use: 'Bacterial infections',                   dosageForm: 'Capsule', manufacturer: 'Sun Pharma',     price: 85.00,  stock: 200, category: 'Antibiotic',   prescription: true  },
      { name: 'Metformin 500mg',        use: 'Type 2 Diabetes management',             dosageForm: 'Tablet',  manufacturer: 'USV Pvt Ltd',    price: 45.00,  stock: 300, category: 'Antidiabetic', prescription: true  },
      { name: 'Amlodipine 5mg',         use: 'Hypertension and angina',                dosageForm: 'Tablet',  manufacturer: 'Torrent Pharma', price: 38.00,  stock: 250, category: 'Cardiac',      prescription: true  },
      { name: 'Atorvastatin 20mg',      use: 'High cholesterol management',            dosageForm: 'Tablet',  manufacturer: 'Ranbaxy',        price: 62.00,  stock: 180, category: 'Cardiac',      prescription: true  },
      { name: 'Pantoprazole 40mg',      use: 'Acidity and GERD',                       dosageForm: 'Tablet',  manufacturer: 'Zydus',          price: 55.00,  stock: 400, category: 'Gastro',       prescription: false },
      { name: 'Cetirizine 10mg',        use: 'Allergy and urticaria',                  dosageForm: 'Tablet',  manufacturer: 'Cipla',          price: 18.00,  stock: 350, category: 'Antihistamine',prescription: false },
      { name: 'Azithromycin 500mg',     use: 'Respiratory and skin infections',        dosageForm: 'Tablet',  manufacturer: 'Dr Reddys',      price: 92.00,  stock: 150, category: 'Antibiotic',   prescription: true  },
      { name: 'Ibuprofen 400mg',        use: 'Pain and inflammation',                  dosageForm: 'Tablet',  manufacturer: 'Abbott India',   price: 22.00,  stock: 300, category: 'NSAID',        prescription: false },
      { name: 'Levothyroxine 50mcg',    use: 'Hypothyroidism',                         dosageForm: 'Tablet',  manufacturer: 'GSK',            price: 48.00,  stock: 200, category: 'Hormonal',     prescription: true  },
      { name: 'Omeprazole 20mg',        use: 'Peptic ulcer and acid reflux',           dosageForm: 'Capsule', manufacturer: 'Cipla',          price: 35.00,  stock: 320, category: 'Gastro',       prescription: false },
      { name: 'Losartan 50mg',          use: 'Hypertension',                           dosageForm: 'Tablet',  manufacturer: 'Sun Pharma',     price: 55.00,  stock: 200, category: 'Cardiac',      prescription: true  },
      { name: 'Dolo 650',               use: 'Fever and moderate pain',                dosageForm: 'Tablet',  manufacturer: 'Micro Labs',     price: 28.00,  stock: 600, category: 'Analgesic',    prescription: false },
      { name: 'Vitamin D3 60000 IU',    use: 'Vitamin D deficiency',                   dosageForm: 'Capsule', manufacturer: 'Pfizer',         price: 75.00,  stock: 250, category: 'Supplement',   prescription: false },
      { name: 'Montelukast 10mg',       use: 'Asthma and allergic rhinitis',           dosageForm: 'Tablet',  manufacturer: 'Cipla',          price: 120.00, stock: 150, category: 'Respiratory',  prescription: true  },
      { name: 'Metoprolol 50mg',        use: 'Hypertension and heart failure',         dosageForm: 'Tablet',  manufacturer: 'Sun Pharma',     price: 68.00,  stock: 180, category: 'Cardiac',      prescription: true  },
      { name: 'Escitalopram 10mg',      use: 'Depression and anxiety',                 dosageForm: 'Tablet',  manufacturer: 'Torrent Pharma', price: 85.00,  stock: 120, category: 'Psychiatric',  prescription: true  },
      { name: 'Ondansetron 4mg',        use: 'Nausea and vomiting',                    dosageForm: 'Tablet',  manufacturer: 'Zydus',          price: 42.00,  stock: 200, category: 'Gastro',       prescription: false },
      { name: 'Calcium + Vit D Tablet', use: 'Bone health and calcium deficiency',     dosageForm: 'Tablet',  manufacturer: 'Pfizer',         price: 95.00,  stock: 300, category: 'Supplement',   prescription: false },
      { name: 'Clopidogrel 75mg',       use: 'Prevention of blood clots post-cardiac', dosageForm: 'Tablet',  manufacturer: 'Sanofi',         price: 105.00, stock: 140, category: 'Antiplatelet', prescription: true  },
    ]

    const medicines: any[] = []
    for (const m of medDefs) {
      let med = await prisma.medicine.findFirst({ where: { name: m.name } })
      if (!med) { med = await prisma.medicine.create({ data: m }) }
      medicines.push(med)
    }
    log.push(`✅ Medicines: ${medicines.length}`)

    // ── 6. APPOINTMENTS (120) ─────────────────────────────────────────────────
    // Distribution: ~40% past/completed, ~30% upcoming, ~20% confirmed, ~10% cancelled
    const apptStatuses   = ['COMPLETED','COMPLETED','COMPLETED','COMPLETED','BOOKED','BOOKED','BOOKED','CONFIRMED','CONFIRMED','CANCELLED']
    const amounts        = [300, 400, 500, 500, 600, 800, 1000, 1200, 1500]

    const createdAppts: any[] = []
    let apptCount = 0

    for (let i = 0; i < 120; i++) {
      const patient  = pick(patients)
      const doctor   = pick(doctorRows)
      const hospital = hospitals.find((h: any) => h.id === doctor.hospitalId) ?? hospitals[0]
      const status   = pick(apptStatuses)
      const isPast   = ['COMPLETED','CANCELLED'].includes(status)
      const daysOff  = isPast ? -randInt(1, 90) : randInt(1, 28)
      const apptDate = new Date(Date.now() + daysOff * 86_400_000)
      const amount   = pick(amounts)

      try {
        const appt = await prisma.appointment.create({
          data: {
            patientId:     patient.id,
            doctorId:      doctor.id,
            hospitalId:    hospital.id,
            date:          apptDate,
            time:          pick(TIME_SLOTS),
            status,
            symptoms:      pick(SYMPTOM_SETS),
            medicalHistory: pick(['No prior history','Hypertension','Diabetes','Asthma','Previous surgery','Family cardiac history']),
            paymentStatus: status === 'COMPLETED' ? 'PAID' : (Math.random() > 0.6 ? 'PAID' : 'PENDING'),
            amount,
          }
        })
        createdAppts.push(appt)
        apptCount++
      } catch { /* skip */ }
    }
    log.push(`✅ Appointments: ${apptCount}`)

    // ── 7. BILLS (per appointment) ────────────────────────────────────────────
    let billCount = 0
    for (const appt of createdAppts) {
      try {
        await prisma.bill.create({
          data: {
            appointmentId: appt.id,
            patientId:     appt.patientId,
            amount:        appt.amount,
            type:          'HOSPITAL',
            description:   `Consultation fee — Appointment #${appt.id}`,
            status:        appt.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
            paidAt:        appt.paymentStatus === 'PAID' ? new Date() : null,
          }
        })
        billCount++
      } catch { /* skip */ }
    }
    log.push(`✅ Appointment Bills: ${billCount}`)

    // ── 8. PRESCRIPTIONS (COMPLETED appointments) ─────────────────────────────
    const completedAppts = createdAppts.filter(a => a.status === 'COMPLETED')
    let rxCount = 0
    for (const appt of completedAppts) {
      try {
        await prisma.prescription.create({
          data: {
            appointmentId: appt.id,
            patientId:     appt.patientId,
            doctorId:      appt.doctorId,
            diagnosis:     pick(DIAGNOSES),
            medications:   pick(MED_COMBOS),
            instructions:  pick(INSTRUCTIONS),
            status:        'ACTIVE',
          }
        })
        rxCount++
      } catch { /* skip */ }
    }
    log.push(`✅ Prescriptions: ${rxCount}`)

    // ── 9. MEDICINE ORDERS + BILLS ────────────────────────────────────────────
    const otcMeds   = medicines.filter((m: any) => !m.prescription)
    const oStatuses = ['PLACED','PLACED','PROCESSING','SHIPPED','DELIVERED','DELIVERED']
    let orderCount  = 0

    for (let i = 0; i < 40; i++) {
      const patient  = pick(patients)
      const medicine = pick(otcMeds)
      const qty      = randInt(1, 5)
      const oStatus  = pick(oStatuses)

      try {
        const order = await prisma.order.create({
          data: {
            patientId:     patient.id,
            medicineId:    medicine.id,
            quantity:      qty,
            totalAmount:   Math.round(medicine.price * qty * 100) / 100,
            paymentMethod: pick(['ONLINE','CASH_ON_DELIVERY','UPI']),
            paymentStatus: oStatus === 'DELIVERED' ? 'PAID' : 'PENDING',
            status:        oStatus,
          }
        })
        await prisma.bill.create({
          data: {
            orderId:     order.id,
            patientId:   patient.id,
            amount:      order.totalAmount,
            type:        'PHARMACY',
            description: `Medicine order — ${medicine.name} × ${qty}`,
            status:      oStatus === 'DELIVERED' ? 'PAID' : 'UNPAID',
            paidAt:      oStatus === 'DELIVERED' ? new Date() : null,
          }
        })
        orderCount++
      } catch { /* skip */ }
    }
    log.push(`✅ Orders: ${orderCount} (+ bills)`)

    // ── 10. NOTIFICATIONS ─────────────────────────────────────────────────────
    const notifPool = [
      { type: 'APPOINTMENT', title: 'Appointment Confirmed',     message: 'Your appointment has been confirmed. Please arrive 10 minutes early with your documents.' },
      { type: 'APPOINTMENT', title: 'Appointment Reminder',      message: 'Reminder: You have an appointment tomorrow. Don\'t forget to carry your previous reports.' },
      { type: 'APPOINTMENT', title: 'Appointment Completed',     message: 'Your appointment is marked complete. Your prescription has been added to your portal.' },
      { type: 'ORDER',       title: 'Order Placed Successfully', message: 'Your medicine order has been placed. You will receive a confirmation once dispatched.' },
      { type: 'ORDER',       title: 'Order Dispatched',          message: 'Your medicine order has been dispatched and will arrive within 2–3 business days.' },
      { type: 'ORDER',       title: 'Order Delivered',           message: 'Your medicine order has been delivered. Please check and confirm receipt.' },
      { type: 'REMINDER',    title: 'Take Your Medication',      message: 'Time to take your prescribed medication. Consistency is essential for recovery.' },
      { type: 'REMINDER',    title: 'Follow-up Appointment Due', message: 'Your follow-up is due this week. Book a slot at your earliest convenience.' },
      { type: 'ALERT',       title: 'Lab Report Ready',          message: 'Your laboratory test report is now available. Visit the hospital portal to view it.' },
      { type: 'ALERT',       title: 'Bill Payment Pending',      message: 'You have a pending bill. Please complete the payment to avoid any inconvenience.' },
    ]

    let notifCount = 0
    for (const patient of patients) {
      const count = randInt(4, 7)
      for (let i = 0; i < count; i++) {
        const n = pick(notifPool)
        try {
          await prisma.notification.create({
            data: { userId: patient.id, type: n.type, title: n.title, message: n.message, read: Math.random() > 0.4 }
          })
          notifCount++
        } catch { /* skip */ }
      }
    }
    for (const docUser of doctorUsers) {
      for (let i = 0; i < randInt(2, 4); i++) {
        try {
          await prisma.notification.create({
            data: { userId: docUser.id, type: 'APPOINTMENT', title: 'New Appointment Booked', message: 'A patient has booked an appointment with you. Check your schedule for details.', read: false }
          })
          notifCount++
        } catch { /* skip */ }
      }
    }
    log.push(`✅ Notifications: ${notifCount}`)

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      summary: {
        hospitals:     hospitals.length,
        doctors:       doctorRows.length,
        patients:      patients.length,
        pharmacists:   pharmacists.length,
        medicines:     medicines.length,
        appointments:  apptCount,
        prescriptions: rxCount,
        bills:         billCount + orderCount,
        orders:        orderCount,
        notifications: notifCount,
      },
      log,
      testCredentials: {
        password: 'Demo@1234',
        patients:    patientDefs.map(p => ({ name: p.name, email: p.email, tier: p.tier })),
        doctors:     doctorDefs.slice(0, 4).map(d => ({ name: d.name, email: d.email, spec: d.spec })),
        pharmacists: pharmDefs.map(p => ({ name: p.name, email: p.email, pharmacy: p.pharmacy })),
      }
    })

  } catch (error: any) {
    console.error('[/api/seed]', error)
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 })
  }
}