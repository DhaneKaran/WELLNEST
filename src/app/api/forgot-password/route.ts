import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: true }); // Don't reveal user existence
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });
    return NextResponse.json({ success: true, token }); // Return token for demo
  } catch (e) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
} 