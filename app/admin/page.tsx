import Link from 'next/link';
import {
  FolderKanban, Code2, Award, MessageSquare,
  GraduationCap, User, Briefcase,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Skill from '@/models/Skill';
import Certification from '@/models/Certification';
import Experience from '@/models/Experience';
import Education from '@/models/Education';
import Message from '@/models/Message';
import DashboardQuickActions from '@/components/admin/DashboardQuickActions';

export const dynamic = 'force-dynamic';

interface Stats {
  projects: number;
  skills: number;
  certifications: number;
  experience: number;
  education: number;
  messages: number;
  unreadMessages: number;
}

interface RecentMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

async function getDashboardData(): Promise<{
  stats: Stats;
  recentMessages: RecentMessage[];
}> {
  await connectDB();

  const [
    projects,
    skills,
    certifications,
    experience,
    education,
    messages,
    unreadMessages,
    recentMessagesRaw,
  ] = await Promise.all([
    Project.estimatedDocumentCount(),
    Skill.estimatedDocumentCount(),
    Certification.estimatedDocumentCount(),
    Experience.estimatedDocumentCount(),
    Education.estimatedDocumentCount(),
    Message.estimatedDocumentCount(),
    Message.countDocuments({ read: false }),
    Message.find({})
      .select({ name: 1, email: 1, message: 1, read: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    stats: {
      projects,
      skills,
      certifications,
      experience,
      education,
      messages,
      unreadMessages,
    },
    recentMessages: JSON.parse(JSON.stringify(recentMessagesRaw)),
  };
}

export default async function AdminDashboard() {
  const { stats, recentMessages } = await getDashboardData();

  const statCards = [
    { label: 'Projects', value: stats.projects, href: '/admin/projects', Icon: FolderKanban },
    { label: 'Skills', value: stats.skills, href: '/admin/skills', Icon: Code2 },
    { label: 'Certifications', value: stats.certifications, href: '/admin/certifications', Icon: Award },
    { label: 'Experience', value: stats.experience, href: '/admin/experience', Icon: Briefcase },
    { label: 'Education', value: stats.education, href: '/admin/education', Icon: GraduationCap },
    { label: 'Messages', value: stats.messages, href: '/admin/messages', Icon: MessageSquare },
    { label: 'Profile', value: '-', href: '/admin/profile', Icon: User },
  ];

  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Portfolio CMS overview</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.Icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="admin-card group rounded-2xl p-5"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {card.label}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-surface rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h2>
          <DashboardQuickActions />
        </div>

        <div className="admin-surface rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Messages</h2>
            <div className="ml-auto flex items-center gap-2">
              {stats.unreadMessages > 0 && (
                <span className="rounded-full border border-primary/20 bg-primary/12 px-2 py-0.5 text-xs text-primary">
                  {stats.unreadMessages} new
                </span>
              )}
              <Link href="/admin/messages" className="text-xs text-primary transition-colors hover:text-primary/80">
                View all
              </Link>
            </div>
          </div>
          {recentMessages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="space-y-2">
              {recentMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    msg.read
                      ? 'border-white/8 bg-white/[0.03]'
                      : 'border-primary/15 bg-primary/[0.06]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{msg.name}</span>
                      {!msg.read && (
                        <span className="shrink-0 rounded border border-primary/20 bg-primary/12 px-1.5 py-0.5 text-xs text-primary">
                          New
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
