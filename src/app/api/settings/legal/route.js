import { NextResponse } from 'next/server';
import connectMongoDB from '../../../../../libs/mongodb';
import mongoose from 'mongoose';

const legalSchema = new mongoose.Schema({
  disclaimer: { type: String, default: '' },
  privacyPolicy: { type: String, default: '' }
});

const defaultLegalSettings = {
  disclaimer: '',
  privacyPolicy: ''
};

let LegalSettings;

try {
  LegalSettings = mongoose.model('LegalSettings');
} catch {
  LegalSettings = mongoose.model('LegalSettings', legalSchema);
}

export async function GET() {
  try {
    await connectMongoDB();
    
    let settings = await LegalSettings.findOne();
    
    if (!settings) {
      settings = await LegalSettings.create(defaultLegalSettings);
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
    await connectMongoDB();
    const body = await request.json();
    
    let settings = await LegalSettings.findOne();
    
    if (!settings) {
      settings = await LegalSettings.create(body);
    } else {
      settings = await LegalSettings.findOneAndUpdate(
        {},
        body,
        { new: true }
      );
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
    await connectMongoDB();
    
    let settings = await LegalSettings.findOne();
    
    if (!settings) {
      settings = await LegalSettings.create(defaultLegalSettings);
    } else {
      settings = await LegalSettings.findOneAndUpdate(
        {},
        defaultLegalSettings,
        { new: true }
      );
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