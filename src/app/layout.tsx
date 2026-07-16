import type { Metadata } from 'next';
import { Lora, DM_Sans } from 'next/font/google';
import './globals.css';

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hippos — Planificación Dietaria',
  description: 'Sistema de planificación dietaria basado en intercambios de alimentos',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.png',
  },
  openGraph: {
    images: ['/assets/logo-stacked-1080.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${lora.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
