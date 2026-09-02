import { AppProviders } from '../../providers';

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>{children}</AppProviders>
  );
}
