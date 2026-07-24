import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mavyx Intelligence',
  description: 'Enterprise Trading Intelligence Platform',
  icons: {
    icon: '/brand/Mavyx GOLD VERSION.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
