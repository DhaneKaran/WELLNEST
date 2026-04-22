import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const hospitals = [
  {
    name: "Ratnagiri District Hospital",
    address: "Station Road, Ratnagiri, Maharashtra",
    contact: "02352 222-4567"
  },
  {
    name: "Sai Hospital",
    address: "Ganpatipule Road, Ratnagiri, Maharashtra", 
    contact: "02352 967-6543"
  },
  {
    name: "Ratnagiri Medical Center",
    address: "Marine Drive, Ratnagiri, Maharashtra",
    contact: "02352 466-7090"
  },
  {
    name: "Konkan Health Care",
    address: "Pune-Mumbai Highway, Ratnagiri, Maharashtra",
    contact: "02352 224-5678"
  },
  {
    name: "Ratnagiri City Hospital",
    address: "Market Area, Ratnagiri, Maharashtra",
    contact: "02352 876-5432"
  }
]

// Doctor templates - will be populated with actual hospital IDs
const createDoctorTemplates = (hospitalIds: { [key: string]: number }) => [
  // Ratnagiri District Hospital Doctors
  {
    name: "Dr. Rajeev Kapoor",
    specialization: "Cardiologist",
    description: "Specializes in heart diseases and hypertension",
    experience: 15,
    qualifications: "MBBS, MD (Cardiology)",
    hospitalId: hospitalIds["Ratnagiri District Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Manish Verma",
    specialization: "Pediatrician",
    description: "Treats children and adolescents",
    experience: 18,
    qualifications: "MBBS, MD (Pediatrics)",
    hospitalId: hospitalIds["Ratnagiri District Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00", "16:00"]
    }
  },

  // Sai Hospital Doctors
  {
    name: "Dr. Priya Nair",
    specialization: "Gynecologist",
    description: "Focuses on women's reproductive health and childbirth",
    experience: 20,
    qualifications: "MBBS, MD (Gynecology)",
    hospitalId: hospitalIds["Sai Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Ashok Patil",
    specialization: "Orthopedic Surgeon",
    description: "Deals with bone and joint problems",
    experience: 16,
    qualifications: "MBBS, MS (Orthopedics)",
    hospitalId: hospitalIds["Sai Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00", "16:00"]
    }
  },
  {
    name: "Dr. Neha Joshi",
    specialization: "Dermatologist",
    description: "Treats skin, hair, and nail disorders",
    experience: 14,
    qualifications: "MBBS, MD (Dermatology)",
    hospitalId: hospitalIds["Sai Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },

  // Ratnagiri Medical Center Doctors
  {
    name: "Dr. Seema Raghavan",
    specialization: "ENT Specialist",
    description: "Treats ear, nose, and throat disorders",
    experience: 12,
    qualifications: "MBBS, MS (ENT)",
    hospitalId: hospitalIds["Ratnagiri Medical Center"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Vikas Sharma",
    specialization: "Neurologist",
    description: "Treats brain and nervous system issues",
    experience: 19,
    qualifications: "MBBS, MD (Neurology)",
    hospitalId: hospitalIds["Ratnagiri Medical Center"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00", "16:00"]
    }
  },
  {
    name: "Dr. Kavita Rao",
    specialization: "Psychiatrist",
    description: "Treats mental health conditions",
    experience: 14,
    qualifications: "MBBS, MD (Psychiatry)",
    hospitalId: hospitalIds["Ratnagiri Medical Center"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },

  // Konkan Health Care Doctors
  {
    name: "Dr. Arvind Kulkarni",
    specialization: "Urologist",
    description: "Specializes in urinary tract and male reproductive issues",
    experience: 22,
    qualifications: "MBBS, MS (Urology)",
    hospitalId: hospitalIds["Konkan Health Care"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Iqbal Hussain",
    specialization: "Pulmonologist",
    description: "Treats lung and respiratory disorders",
    experience: 16,
    qualifications: "MBBS, MD (Pulmonology)",
    hospitalId: hospitalIds["Konkan Health Care"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00", "16:00"]
    }
  },
  {
    name: "Dr. Shalini Deshpande",
    specialization: "Endocrinologist",
    description: "Treats hormonal disorders like diabetes, thyroid, PCOS",
    experience: 18,
    qualifications: "MBBS, MD (Endocrinology)",
    hospitalId: hospitalIds["Konkan Health Care"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },

  // Ratnagiri City Hospital Doctors
  {
    name: "Dr. Nitin Saxena",
    specialization: "Gastroenterologist",
    description: "Focuses on digestive system diseases",
    experience: 20,
    qualifications: "MBBS, MD (Gastroenterology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00", "16:00"]
    }
  },
  {
    name: "Dr. Reema Banerjee",
    specialization: "Oncologist",
    description: "Diagnoses and treats cancers",
    experience: 25,
    qualifications: "MBBS, MD (Oncology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Prakash Iyer",
    specialization: "Nephrologist",
    description: "Specializes in kidney-related care",
    experience: 17,
    qualifications: "MBBS, MD (Nephrology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Meena Jain",
    specialization: "Ophthalmologist",
    description: "Treats eye diseases and performs eye surgeries",
    experience: 15,
    qualifications: "MBBS, MS (Ophthalmology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00", "16:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00", "16:00"]
    }
  },
  {
    name: "Dr. Karan Malhotra",
    specialization: "Dentist",
    description: "Provides dental care and oral surgery",
    experience: 13,
    qualifications: "BDS, MDS",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Nivedita Shah",
    specialization: "Rheumatologist",
    description: "Treats arthritis and autoimmune disorders",
    experience: 16,
    qualifications: "MBBS, MD (Rheumatology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Mohan S. Reddy",
    specialization: "Anesthesiologist",
    description: "Manages anesthesia during surgery and pain relief",
    experience: 21,
    qualifications: "MBBS, MD (Anesthesiology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Zoya Khan",
    specialization: "Pathologist",
    description: "Diagnoses diseases via lab tests and tissue analysis",
    experience: 14,
    qualifications: "MBBS, MD (Pathology)",
    hospitalId: hospitalIds["Ratnagiri City Hospital"],
    availability: {
      "monday": ["10:00", "11:00", "14:00", "15:00"],
      "tuesday": ["10:00", "11:00", "14:00", "15:00"],
      "wednesday": ["10:00", "11:00", "14:00", "15:00"],
      "thursday": ["10:00", "11:00", "14:00", "15:00"],
      "friday": ["10:00", "11:00", "14:00", "15:00"]
    }
  }
]

async function main() {
  console.log('Seeding hospitals and doctors...')
  
  // First, delete existing data
  await prisma.bill.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.hospital.deleteMany()
  
  // Create hospitals first and store their IDs
  console.log('Creating hospitals...')
  const hospitalIds: { [key: string]: number } = {}
  
  for (const hospital of hospitals) {
    try {
      const createdHospital = await prisma.hospital.create({
        data: hospital,
      })
      hospitalIds[createdHospital.name] = createdHospital.id
      console.log(`Created hospital: ${createdHospital.name} with ID ${createdHospital.id}`)
    } catch (error) {
      console.log(`Error creating hospital ${hospital.name}:`, error)
    }
  }
  
  // Create doctors using the actual hospital IDs
  console.log('Creating doctors...')
  const doctors = createDoctorTemplates(hospitalIds)
  
  for (const doctor of doctors) {
    try {
      const createdDoctor = await prisma.doctor.create({
        data: doctor,
      })
      console.log(`Created doctor: ${createdDoctor.name} at hospital ID ${createdDoctor.hospitalId}`)
    } catch (error) {
      console.log(`Error creating doctor ${doctor.name}:`, error)
    }
  }
  
  console.log('Hospitals and doctors seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 