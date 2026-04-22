'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { fetchJson } from '@/lib/http';

const quickActions = [
  { label: 'Add Project', href: '/admin/projects' },
  { label: 'Add Experience', href: '/admin/experience' },
  { label: 'Add Skill', href: '/admin/skills' },
  { label: 'Add Certification', href: '/admin/certifications' },
  { label: 'Edit Profile', href: '/admin/profile' },
  {
    label: 'Seed Database',
    href: '#',
    action: async () => {
      if (!confirm('This will overwrite all data. Continue?')) return;
      try {
        const d = await fetchJson<{ message?: string }>('/api/seed', { method: 'POST' });
        alert(d.message || 'Done');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Seed failed');
      }
    },
  },
];

export default function DashboardQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {quickActions.map((action) =>
        action.action ? (
          <button
            key={action.label}
            onClick={action.action}
            className="admin-secondary-btn flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            {action.label}
          </button>
        ) : (
          <Link
            key={action.label}
            href={action.href}
            className="admin-secondary-btn flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}
