'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  LayoutDashboard, FolderKanban, Briefcase, Code2, Award,
  GraduationCap, User, Settings, Github, MessageSquare,
  ExternalLink, LogOut, ImageIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/profile', label: 'Profile', icon: User },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/experience', label: 'Experience', icon: Briefcase },
      { href: '/admin/skills', label: 'Skills', icon: Code2 },
      { href: '/admin/certifications', label: 'Certifications', icon: Award },
      { href: '/admin/education', label: 'Education', icon: GraduationCap },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { href: '/admin/github', label: 'GitHub Import', icon: Github },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { href: '/admin/media', label: 'Media Library', icon: ImageIcon },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    onNavigate?.();
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className={`admin-surface flex h-full w-60 shrink-0 flex-col border-r border-white/10 bg-[#0b0d0b]/95 ${mobile ? 'shadow-2xl shadow-black/40' : 'min-h-screen'}`}>
      <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-bold text-foreground">Portfolio CMS</p>
          <p className="mt-0.5 text-xs text-muted-foreground/90">Ahmed Fouad Hashem</p>
        </div>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="admin-secondary-btn inline-flex h-9 w-9 items-center justify-center rounded-xl"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/85">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-all ${
                        active
                          ? 'border-primary/25 bg-primary/12 text-primary shadow-sm shadow-primary/10'
                          : 'border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 px-3 py-3">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition-all hover:border-white/10 hover:bg-white/5 hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View Portfolio
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
