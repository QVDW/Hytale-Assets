import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/database';

const defaultLegalSettings = {
  disclaimer: '',
  privacyPolicy: ''
};

export async function GET() {
  try {
    let settings = await prisma.legalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.legalSettings.create({
        data: defaultLegalSettings
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching legal settings:', error);
    return NextResponse.json(
      { message: 'Error fetching legal settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    let settings = await prisma.legalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.legalSettings.create({
        data: body
      });
    } else {
      settings = await prisma.legalSettings.update({
        where: { id: settings.id },
        data: body
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error saving legal settings:', error);
    return NextResponse.json(
      { message: 'Error saving legal settings' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    let settings = await prisma.legalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.legalSettings.create({
        data: defaultLegalSettings
      });
    } else {
      settings = await prisma.legalSettings.update({
        where: { id: settings.id },
        data: defaultLegalSettings
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error resetting legal settings:', error);
    return NextResponse.json(
      { message: 'Error resetting legal settings' },
      { status: 500 }
    );
  }
} 