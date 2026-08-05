import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProviders } from '../providers';

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <AuthProvider>{children}</AuthProvider>
    </AuthProviders>
  );
}

