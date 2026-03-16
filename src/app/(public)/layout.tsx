import { Providers } from '@/components/shared/providers';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
