import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import TopNavbar from '@/components/TopNavbar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Route 53 - Scaler Labs Assignment',
  description: 'High-fidelity AWS Route53 Clone with FastAPI, SQLite, and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f2f3f3] dark:bg-slate-950 text-gray-900 dark:text-gray-100 antialiased">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <TopNavbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
