import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mavyx Intelligence',
  description: 'AI-powered Forex market intelligence platform',
  icons: {
    icon: '/brand/Mavyx GOLD VERSION.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: '#0A0A0F' }}>
        {children}
      </body>
    </html>
  );
}
