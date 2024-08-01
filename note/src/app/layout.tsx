// src/app/layout.tsx
import '../styles/globals.css';
import 'tailwindcss/tailwind.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simple Web App',
  description: 'A simple web app using Next.js, Tailwind CSS, and Firebase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
