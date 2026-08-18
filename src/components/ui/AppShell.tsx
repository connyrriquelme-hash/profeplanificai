import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, topbar, bottomNav, children }: AppShellProps) {
  return (
    <div className="theme-calida min-h-screen bg-[var(--bg)] flex w-full">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        {topbar}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 animate-fade-in">
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-7 xl:py-8">
            {children}
          </div>
        </main>
      </div>
      {bottomNav}
    </div>
  );
}
