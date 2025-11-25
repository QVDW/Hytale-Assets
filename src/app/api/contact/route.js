import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { title, message, contactDetails } = await request.json();
    
    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { message: "Title and message are required." },
        { status: 400 }
      );
    }
    
    // Setup email transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Format date for the email
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create email content
    const emailContent = {
      from: `"Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT,
      subject: `Contact Form: ${title}`,
      text: `
Title: ${title}

Message:
${message}

${contactDetails ? `Contact Details: ${contactDetails}` : "No contact details provided."}

Sent on: ${formattedDate}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe Website Contact Form</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #007bff;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 0 0 5px 5px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .message-box {
      background-color: #ffffff;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #888;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    h2 {
      font-size: 18px;
      margin-top: 0;
      color: #007bff;
    }
    .label {
      font-weight: bold;
      margin-bottom: 5px;
      color: #555;
    }
    .contact-info {
      background-color: #fffaf0;
      padding: 10px 15px;
      border-radius: 5px;
      border-left: 4px solid #ffa500;
      margin-bottom: 20px;
    }
    .timestamp {
      font-style: italic;
      color: #888;
      font-size: 12px;
      text-align: right;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nieuwe Contact Formulier Verzending</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      
      <p class="label">Bericht:</p>
      <div class="message-box">
        ${message.replace(/\n/g, "<br>")}
      </div>
      
      ${contactDetails ? `
      <div class="contact-info">
        <p class="label">Contact Gegevens:</p>
        <p>${contactDetails}</p>
      </div>
      ` : `
      <div class="contact-info">
        <p class="label">Contact Gegevens:</p>
        <p><em>Geen contact gegevens gevonden.</em></p>
      </div>
      `}
      
      <div class="timestamp">
        Verzonden op ${formattedDate}
      </div>
    </div>
    <div class="footer">
      <p>Dit is een automatisch bericht van de contactformulier van de website.</p>
    </div>
  </div>
</body>
</html>
      `,
    };
    
    // Send email
    console.log('Attempting to send email to:', process.env.EMAIL_RECIPIENT);
    await transporter.sendMail(emailContent);
    console.log('Email sent successfully');
    
    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
} 