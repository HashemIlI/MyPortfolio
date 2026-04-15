'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Brain,
  Briefcase,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SKILL_CATEGORIES } from '@/lib/content/skill';
import type { SkillData, SkillCategory, SkillLevel } from '@/lib/content/skill';

type FormData = {
  nameEn: string;
  nameAr: string;
  category: SkillCategory;
  level: SkillLevel;
  visible: boolean;
  order: number;
};

const EMPTY: FormData = {
  nameEn: '',
  nameAr: '',
  category: 'Programming',
  level: 'Advanced',
  visible: true,
  order: 0,
};

const CATEGORY_META: Record<
  SkillCategory,
  {
    icon: typeof Brain;
    title: string;
    titleAr: string;
    subtitle: string;
  }
> = {
  'Machine Learning': {
    icon: Brain,
    title: 'Machine Learning',
    titleAr: 'تعلم الآلة',
    subtitle: 'Models, evaluation, and predictive workflows',
  },
  'Deep Learning': {
    icon: Cpu,
    title: 'Deep Learning',
    titleAr: 'التعلم العميق',
    subtitle: 'Neural networks, architectures, and training pipelines',
  },
  Programming: {
    icon: Database,
    title: 'Data Analysis',
    titleAr: 'تحليل البيانات',
    subtitle: 'Data wrangling, querying, and exploratory work',
  },
  'Data Visualisation': {
    icon: BarChart3,
    title: 'Business Intelligence',
    titleAr: 'ذكاء الأعمال',
    subtitle: 'Dashboards, reporting, and decision support',
  },
  'Tools & Platforms': {
    icon: Wrench,
    title: 'Tools',
    titleAr: 'الأدوات',
    subtitle: 'Platforms and delivery tooling',
  },
  'Soft Skills': {
    icon: Briefcase,
    title: 'Professional Skills',
    titleAr: 'المهارات المهنية',
    subtitle: 'Communication, ownership, and collaboration',
  },
};

export default function SkillsAdminPage() {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<SkillData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<'All' | SkillCategory>('All');

  async function load() {
    const data = await fetch('/api/skills?admin=true').then((r) => r.json());
    setSkills(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd(category?: SkillCategory) {
    setEditing(null);
    setForm({
      ...EMPTY,
      category: category ?? EMPTY.category,
      order: skills.filter((skill) => skill.category === (category ?? EMPTY.category)).length,
    });
    setModal(true);
  }

  function openEdit(skill: SkillData) {
    setEditing(skill);
    setForm({
      nameEn: skill.nameEn,
      nameAr: skill.nameAr || '',
      category: skill.category,
      level: skill.level,
      visible: skill.visible,
      order: skill.order,
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.nameEn) return;
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/skills/${editing._id}` : '/api/skills', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast({ title: editing ? 'Skill updated!' : 'Skill added!', variant: 'success' });
      setModal(false);
      load();
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/skills/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    toast({ title: 'Skill deleted' });
    load();
  }

  const groupedCategories = SKILL_CATEGORIES.filter((category) =>
    filterCat === 'All' ? true : category === filterCat
  ).map((category) => ({
    category,
    meta: CATEGORY_META[category],
    items: skills
      .filter((skill) => skill.category === category)
      .sort((a, b) => a.order - b.order || a.nameEn.localeCompare(b.nameEn)),
  }));

  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage grouped skill categories exactly as they appear on the portfolio.
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="admin-primary-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['All', ...SKILL_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              filterCat === cat
                ? 'border-primary/35 bg-primary/15 text-primary shadow-sm shadow-primary/10'
                : 'admin-control text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'All' ? 'All Categories' : CATEGORY_META[cat].title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groupedCategories.map(({ category, meta, items }) => {
          const Icon = meta.icon;

          return (
            <section key={category} className="admin-card flex h-full min-w-0 flex-col rounded-2xl p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">{meta.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => openAdd(category)}
                  className="admin-secondary-btn inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-medium"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Add
                </button>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-center text-xs text-muted-foreground">
                  No skills in this category yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((skill) => (
                    <div
                      key={String(skill._id)}
                      className="group flex min-w-0 flex-col gap-2 rounded-2xl border border-primary/18 bg-primary/[0.06] px-3 py-2.5 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors duration-200 hover:border-primary/30 hover:bg-primary/[0.10] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="max-w-full truncate text-foreground/82 dark:text-emerald-50/85">
                          {skill.nameEn}
                        </span>
                        {skill.nameAr && (
                          <span className="max-w-full truncate text-muted-foreground/85" dir="rtl">
                            {skill.nameAr}
                          </span>
                        )}
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:ml-auto sm:w-auto">
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ${
                            skill.visible
                              ? 'border-primary/20 bg-primary/10 text-primary'
                              : 'border-border/70 bg-background/40 text-muted-foreground'
                          }`}
                          title={skill.visible ? 'Visible on portfolio' : 'Hidden from portfolio'}
                        >
                          {skill.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </span>
                        <button
                          onClick={() => openEdit(skill)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-foreground"
                          aria-label={`Edit ${skill.nameEn}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(String(skill._id))}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-red-300 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-200"
                          aria-label={`Delete ${skill.nameEn}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="admin-surface w-full max-w-md rounded-2xl bg-card shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-border/70 p-5">
              <h2 className="font-semibold text-foreground">{editing ? 'Edit Skill' : 'Add Skill'}</h2>
              <button onClick={() => setModal(false)} className="text-muted-foreground transition-colors hover:text-foreground">
                X
              </button>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name (EN) *" val={form.nameEn} set={(value) => setForm({ ...form, nameEn: value })} />
                <Field label="Name (AR)" val={form.nameAr} set={(value) => setForm({ ...form, nameAr: value })} dir="rtl" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as SkillCategory })}
                  className="admin-control w-full rounded-xl px-3 py-2 text-sm"
                >
                  {SKILL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_META[category].title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                <Field
                  label="Order"
                  val={String(form.order)}
                  set={(value) => setForm({ ...form, order: Number(value) })}
                  type="number"
                />
                <label className="flex cursor-pointer items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span className="text-sm text-foreground">Visible</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 p-4 pt-0 sm:flex-row sm:p-5 sm:pt-0">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nameEn}
                className="admin-primary-btn rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="admin-surface w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl shadow-black/40">
            <h3 className="mb-2 font-semibold text-foreground">Delete Skill?</h3>
            <p className="mb-5 text-sm text-muted-foreground">This cannot be undone.</p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-xl border border-red-500/25 bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  val,
  set,
  type = 'text',
  dir,
}: {
  label: string;
  val: string;
  set: (value: string) => void;
  type?: string;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => set(e.target.value)}
        dir={dir}
        className="admin-control w-full rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}
