#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 10 });
    const medicines = await prisma.medicine.findMany({ take: 10 });
    const hospitals = await prisma.hospital.findMany({ take: 10 });

    console.log(JSON.stringify({ users, medicines, hospitals }, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
