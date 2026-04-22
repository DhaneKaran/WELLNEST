const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Seed doctors for existing hospitals
  const hospitals = await prisma.hospital.findMany()
  
  for (const hospital of hospitals) {
    await prisma.doctor.createMany({
      data: [
        {
          name: `Dr. ${hospital.name.split(' ')[0]} Specialist`,
          specialization: 'General Medicine',
          description: 'Experienced general physician with expertise in common ailments',
          experience: 8,
          qualifications: 'MBBS, MD - General Medicine',
          hospitalId: hospital.id,
          availability: {
            monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
            tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
            wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
            thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
            friday: ['09:00', '10:00', '11:00', '14:00', '15:00']
          }
        },
        {
          name: `Dr. ${hospital.name.split(' ')[0]} Cardiologist`,
          specialization: 'Cardiology',
          description: 'Specialized cardiologist with 10+ years of experience',
          experience: 12,
          qualifications: 'MBBS, MD - Cardiology',
          hospitalId: hospital.id,
          availability: {
            monday: ['10:00', '11:00', '15:00', '16:00'],
            tuesday: ['10:00', '11:00', '15:00', '16:00'],
            wednesday: ['10:00', '11:00', '15:00', '16:00'],
            thursday: ['10:00', '11:00', '15:00', '16:00'],
            friday: ['10:00', '11:00', '15:00', '16:00']
          }
        }
      ]
    })
  }

  console.log('Seeded doctors!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 