import '../styles/globals.css';
import 'tailwindcss/tailwind.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FRIDGE',
  description: 'React,TypeScript,Next.js,Tailwind CSS,Firebaseを使用した、メモを保存、編集、削除、コピー、コピーして作成することができるメモアプリです。',
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
