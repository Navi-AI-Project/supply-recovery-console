import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://supply-recovery-console.kkrr555666.chatgpt.site'),
  title: 'Supply Recovery Console',
  description: 'A human-agent control room for resolving supply chain disruptions with WebMCP.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Supply Recovery Console',
    description: 'A human-agent control room for resolving supply chain disruptions with WebMCP.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 750, alt: 'Supply Recovery Console network workspace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supply Recovery Console',
    description: 'A human-agent control room for resolving supply chain disruptions with WebMCP.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
