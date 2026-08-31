import { AuthProvider } from '@/contexts/AuthContext';
import { AppProviders } from '../../providers';

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AuthProvider>{children}</AuthProvider>
    </AppProviders>
  );
}
