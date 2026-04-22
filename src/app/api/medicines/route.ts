import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(medicines)
  } catch (error) {
    console.error('Error fetching medicines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { name, manufacturer, price, stock, use, dosageForm } = await req.json();
    if (!name || !manufacturer || !price || !stock || !use || !dosageForm) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const medicine = await prisma.medicine.create({
      data: { 
        name, 
        manufacturer, 
        price: parseFloat(price), 
        stock: parseInt(stock),
        use,
        dosageForm
      },
    });
    return NextResponse.json(medicine);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create medicine" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, manufacturer, price, stock, use, dosageForm } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const medicine = await prisma.medicine.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        manufacturer, 
        price: parseFloat(price), 
        stock: parseInt(stock),
        use,
        dosageForm
      },
    });
    return NextResponse.json(medicine);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update medicine" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.medicine.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete medicine" }, { status: 500 });
  }
} 