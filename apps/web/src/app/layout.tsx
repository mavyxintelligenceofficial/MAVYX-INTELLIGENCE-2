import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mavyx Intelligence',
  description: 'AI-assisted Forex market intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
