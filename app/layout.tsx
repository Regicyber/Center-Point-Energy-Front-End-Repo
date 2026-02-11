import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CenterPoint Energy Chat',
  description: 'Chat with CenterPoint Energy Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
