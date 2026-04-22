const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

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
    skipDuplicates: true,
  });

  await prisma.hospital.createMany({
    data: [
      {
        name: 'City General Hospital',
        address: '123 Main St, Metropolis',
        contact: '123-456-7890',
      },
      {
        name: 'Sunrise Medical Center',
        address: '456 Elm St, Springfield',
        contact: '987-654-3210',
      },
      {
        name: 'Lakeside Hospital',
        address: '789 Lake Ave, Lakeview',
        contact: '555-123-4567',
      },
    ],
    skipDuplicates: true,
  });

  // Seed medicines
  await prisma.medicine.createMany({
    data: [
      {
        name: 'Paracetamol 500mg',
        manufacturer: 'MediCure Labs',
        price: 20.0,
        stock: 100,
      },
      {
        name: 'Amoxicillin 250mg',
        manufacturer: 'HealthGen Pharma',
        price: 50.0,
        stock: 80,
      },
      {
        name: 'Cetirizine 10mg',
        manufacturer: 'AllergyFree Inc.',
        price: 15.0,
        stock: 120,
      },
    ],
    skipDuplicates: true,
  });

  // Seed bills for first appointment of each user (if any)
  const users = await prisma.user.findMany({ include: { appointments: true } });
  for (const user of users) {
    if (user.appointments.length > 0) {
      const appointment = user.appointments[0];
      await prisma.bill.upsert({
        where: { appointmentId: appointment.id },
        update: {},
        create: {
          appointmentId: appointment.id,
          patientId: user.id,
          amount: 500.0,
          status: "UNPAID",
        },
      });
    }
  }

  console.log('Seeded users and hospitals!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 