import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);
  const { role, ...profileData } = await req.json();

  try {
    let result;
    switch (role) {
      case "PATIENT":
        result = await prisma.patientProfile.upsert({
          where: { userId },
          update: profileData,
          create: { ...profileData, userId }
        });
        break;
      case "DOCTOR":
        result = await prisma.doctorProfile.upsert({
          where: { userId },
          update: profileData,
          create: { ...profileData, userId }
        });
        break;
      case "PHARMACIST":
        result = await prisma.pharmacistProfile.upsert({
          where: { userId },
          update: profileData,
          create: { ...profileData, userId }
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error saving profile:", e);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);
  const role = (session.user as any).role;

  try {
    let profile;
    switch (role) {
      case "PATIENT":
        profile = await prisma.patientProfile.findUnique({ where: { userId } });
        break;
      case "DOCTOR":
        profile = await prisma.doctorProfile.findUnique({ where: { userId } });
        break;
      case "PHARMACIST":
        profile = await prisma.pharmacistProfile.findUnique({ where: { userId } });
        break;
      default:
        return NextResponse.json({ error: "Role not set" }, { status: 400 });
    }

    return NextResponse.json(profile || {});
  } catch (e) {
    console.error("Error fetching profile:", e);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
} 