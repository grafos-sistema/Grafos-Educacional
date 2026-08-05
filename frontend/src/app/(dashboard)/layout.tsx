import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProviders } from '../providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <AuthProvider>
        <div className="flex h-screen overflow-hidden bg-secondary-50">
          <Sidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto">
              <div className="py-6">{children}</div>
            </main>
          </div>
        </div>
      </AuthProvider>
    </AppProviders>
  );
}
