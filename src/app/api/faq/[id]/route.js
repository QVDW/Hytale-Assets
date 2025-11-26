import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import { logServerError } from "../../../../utils/serverErrorLogger";

// Get a specific FAQ by ID
export async function GET(request, context) {
  try {
    const { params } = context;
    const { id } = await params;
    
    const faq = await prisma.faq.findUnique({
      where: { id }
    });
    
    if (!faq) {
      return NextResponse.json(
        { message: "FAQ not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    await logServerError(error, request, 'faq-get');
    return NextResponse.json(
      { message: "Error fetching FAQ", error: error.toString() },
      { status: 500 }
    );
  }
}

// Update a FAQ
export async function PUT(request, context) {
  try {
    const { params } = context;
    const { id } = await params;
    const { question, answer, isActive } = await request.json();
    
    const faq = await prisma.faq.findUnique({
      where: { id }
    });
    
    if (!faq) {
      return NextResponse.json(
        { message: "FAQ not found" },
        { status: 404 }
      );
    }
    
    const updatedFAQ = await prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        isActive: isActive !== undefined ? isActive : faq.isActive,
      }
    });
    
    return NextResponse.json({ 
      message: "FAQ updated successfully", 
      faq: updatedFAQ 
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    await logServerError(error, request, 'faq-put');
    return NextResponse.json(
      { message: "Error updating FAQ", error: error.toString() },
      { status: 500 }
    );
  }
} 