import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import CookiePopup from "../../components/CookiePopup";
import ErrorLoggerInit from "../../components/ErrorLoggerInit";

// Import client configuration
import clientConfig from '../../client.config.js';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: clientConfig.site.name,
  description: clientConfig.site.description,
  keywords: clientConfig.site.keywords,
  authors: [{ name: clientConfig.site.author }],
  icons: {
    icon: [
      { url: clientConfig.branding.favicon.ico, sizes: 'any' },
      { url: clientConfig.branding.favicon.png, type: 'image/png', sizes: '32x32' },
      { url: clientConfig.branding.favicon.android192, type: 'image/png', sizes: '192x192' },
      { url: clientConfig.branding.favicon.android512, type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: clientConfig.branding.favicon.apple, sizes: '180x180', type: 'image/png' }
    ],
    shortcut: clientConfig.branding.favicon.ico,
    other: [
      {
        rel: 'mask-icon',
        url: clientConfig.branding.favicon.png,
        color: '#ffffff'
      }
    ]
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={clientConfig.site.language}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorLoggerInit />
        {children}
        <CookiePopup />
      </body>
    </html>
  );
}
