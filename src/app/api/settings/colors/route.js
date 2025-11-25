import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const colors = await req.json();
    
    const scssContent = `// Theme colors
$primary: ${colors.primary};
$secondary: ${colors.secondary};
$accent: ${colors.accent};
$text: ${colors.text};
$background: ${colors.background};

$dark: #1b1b1b;
$light: #f3f3f3;

:root {
  --primary: #{$primary};
  --secondary: #{$secondary};
  --accent: #{$accent};
  --text: #{$text};
  --background: #{$background};
}`;

    const filePath = path.join(process.cwd(), 'src/styles/variables.scss');
    await fs.writeFile(filePath, scssContent, 'utf-8');

    return NextResponse.json({ message: 'Colors updated successfully' });
  } catch (error) {
    console.error('Error updating colors:', error);
    return NextResponse.json(
      { message: 'Error updating colors' }, 
      { status: 500 }
    );
  }
}