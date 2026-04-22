'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === '/admin/login') {
    return (
      <div className="admin-theme min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_28%),#090b09] text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="admin-theme flex min-h-screen bg-[#090b09] text-foreground">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar mobile onNavigate={() => setSidebarOpen(false)} />
      </div>

      <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.07),transparent_24%),#0b0d0b]">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0b0d0b]/92 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="admin-secondary-btn inline-flex h-10 w-10 items-center justify-center rounded-xl"
            aria-label="Open admin sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-foreground">Portfolio CMS</p>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
