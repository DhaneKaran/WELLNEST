import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    // For now, we'll use a simple approach without session validation
    // In a production app, you'd want proper session management
    const { userId, name, phone, dob, address } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    // Update user information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        dob: dob ? new Date(dob) : null,
        address: address || null,
      },
    });

    // Return updated user data (excluding password)
    const { password, ...userData } = updatedUser;
    
    return NextResponse.json({
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 