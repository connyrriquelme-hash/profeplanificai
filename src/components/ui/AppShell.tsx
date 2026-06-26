import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        {topbar}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
