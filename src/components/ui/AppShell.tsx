import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, topbar, bottomNav, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-theme-beige flex w-full">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        {topbar}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7 xl:p-8 pb-24 lg:pb-8 animate-fade-in">
          {children}
        </main>
      </div>
      {bottomNav}
    </div>
  );
}
