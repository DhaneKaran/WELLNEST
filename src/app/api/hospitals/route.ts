import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const name = url.searchParams.get('name');
    
    // Build query conditions
    const where: any = {};
    
    if (id) {
      where.id = parseInt(id);
    }
    
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }
    
    // Fetch hospitals based on conditions
    const hospitals = await prisma.hospital.findMany({
      where,
      include: {
        doctors: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        }
      }
    });
    
    // Map the hospital data to the format expected by the frontend
    const enhancedHospitals = hospitals.map(hospital => {
      return {
        ...hospital,
        position: hospital.coordinates && hospital.coordinates.length === 2 
          ? [hospital.coordinates[0], hospital.coordinates[1]] as [number, number]
          : [16.9902, 73.3120] as [number, number], // Default position if not found
        rating: hospital.rating || "4.0/5", // Default rating if not found
        services: hospital.services || ["General Medical Services"], // Default services if not found
        phone: hospital.contact // Map contact to phone for compatibility with existing code
      };
    });
    
    return NextResponse.json(enhancedHospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, address, contact, coordinates, services, rating } = await request.json();

    // Validate required fields
    if (!name || !address || !contact || !coordinates || !services) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create hospital
    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        contact,
        coordinates: coordinates as number[],
        services: services as string[],
        rating: rating || null
      }
    });

    return NextResponse.json(hospital, { status: 201 });
  } catch (error: any) {
    console.error('Error creating hospital:', error);
    return NextResponse.json(
      { error: 'Failed to create hospital' },
      { status: 500 }
    );
  }
}