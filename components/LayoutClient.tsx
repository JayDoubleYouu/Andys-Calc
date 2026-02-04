'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <>
      {!isAuthPage && <Header />}
      <main className={isAuthPage ? '' : 'min-h-screen bg-orange-50'}>
        {children}
      </main>
    </>
  );
}
