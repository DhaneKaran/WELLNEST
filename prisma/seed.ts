import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('Pass@123', 10);

  await prisma.user.createMany({
    data: [
      {
        name: 'Alice Patient',
        email: 'alice@patient.com',
        password,
        role: 'PATIENT',
      },
      {
        name: 'Bob Pharmacist',
        email: 'bob@pharma.com',
        password,
        role: 'PHARMACIST',
      },
      {
        name: 'Eve Employee',
        email: 'eve@employee.com',
        password,
        role: 'EMPLOYEE',
      },
      {
        name: 'Adam Admin',
        email: 'adam@admin.com',
        password,
        role: 'ADMIN',
      },
    ],
  });

  // Ensure requested Admin user exists with given credentials
  await prisma.user.upsert({
    where: { email: 'karandhane0808@gmail.com' },
    update: { role: 'ADMIN', password: adminPassword, name: 'Dhane Karan Ashok' },
    create: { name: 'Dhane Karan Ashok', email: 'karandhane0808@gmail.com', password: adminPassword, role: 'ADMIN' },
  });

  // Seed hospitals
  await prisma.hospital.createMany({
    data: [
      {
        name: 'Ratnagiri District Hospital',
        address: 'Station Road, Ratnagiri, Maharashtra',
        contact: '02352 222-4567',
        coordinates: [16.9902, 73.3120],
        services: ["Emergency Care", "Surgery Facilities", "Trauma Center", "Pediatrics", "Cardiology", "Radiology"],
        rating: "4.6/5"
      },
      {
        name: 'Sai Hospital',
        address: 'Ganpatipule Road, Ratnagiri, Maharashtra',
        contact: '02352 967-6543',
        coordinates: [16.9850, 73.3080],
        services: ["Consulting", "Maternity Care", "Women's Health", "Orthopedics", "Laboratory Services"],
        rating: "4.5/5"
      },
      {
        name: 'Ratnagiri Medical Center',
        address: 'Marine Drive, Ratnagiri, Maharashtra',
        contact: '02352 466-7090',
        coordinates: [16.9950, 73.3150],
        services: ["Therapy Services", "Health Evaluation", "Rehabilitation", "Nutrition Counseling", "Pain Management"],
        rating: "4.7/5"
      },
      {
        name: 'Konkan Health Care',
        address: 'Pune-Mumbai Highway, Ratnagiri, Maharashtra',
        contact: '02352 224-5678',
        coordinates: [16.9850, 73.3200],
        services: ["Community Health", "Geriatrics", "Chronic Disease Management", "Nutrition", "Wellness Programs"],
        rating: "4.3/5"
      },
      {
        name: 'Ratnagiri City Hospital',
        address: 'Market Area, Ratnagiri, Maharashtra',
        contact: '02352 876-5432',
        coordinates: [16.9950, 73.3050],
        services: ["Psychiatry", "Physical Therapy", "Mental Health Services", "Neurology", "Sleep Center"],
        rating: "4.8/5"
      },
    ],
  });

  console.log('Seeded users!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
