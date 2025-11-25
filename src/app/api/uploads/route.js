import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return new NextResponse('No file specified', { status: 400 });
    }
    
    // Sanitize the file name to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    
    // Look for the file in uploads directory
    const filePath = path.join(process.cwd(), 'public', 'uploads', sanitizedFileName);
    
    // Check if file exists before trying to read it
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${sanitizedFileName} at path: ${filePath}`);
      
      // Try to serve a placeholder image instead of returning 404
      const placeholderPath = path.join(process.cwd(), 'public', 'placeholder.svg');
      if (fs.existsSync(placeholderPath)) {
        const placeholderBuffer = fs.readFileSync(placeholderPath);
        return new NextResponse(placeholderBuffer, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour only
          }
        });
      }
      
      return new NextResponse('File not found', { status: 404 });
    }
    
    try {
      // Use synchronous file reading
      const fileBuffer = fs.readFileSync(filePath);
      
      // Determine content type based on file extension
      const extension = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (extension) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
      }
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    } catch (error) {
      console.error(`Error reading file ${sanitizedFileName}:`, error.message);
      return new NextResponse('Error reading file', { status: 500 });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}
