import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gte: new Date() } } });
    if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
} 