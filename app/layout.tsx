import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Strategy Trainer',
  description: 'Breakout and reversal recognition trainer'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
