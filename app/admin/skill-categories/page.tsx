'use client';

import { useEffect, useState } from 'react';
import {
  Brain,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchJson } from '@/lib/http';
import { slugify } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ICON_MAP, ICON_NAMES } from '@/lib/icon-map';
import type { SkillCategoryData } from '@/lib/content/skill-category';

type FormData = {
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  visible: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormData = {
  nameEn: '',
  nameAr: '',
  slug: '',
  descriptionEn: '',
  descriptionAr: '',
  icon: 'Brain',
  visible: true,
  sortOrder: 0,
};

export default function SkillCategoriesAdminPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<SkillCategoryData[]>([]);
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>({});
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<SkillCategoryData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  async function load() {
    try {
      const [catData, skillData] = await Promise.all([
        fetchJson<{ categories: SkillCategoryData[] }>('/api/skill-categories?admin=true'),
        fetchJson<{ category: string }[]>('/api/skills?admin=true'),
      ]);
      setCategories(catData.categories || []);
      const counts: Record<string, number> = {};
      for (const skill of Array.isArray(skillData) ? skillData : []) {
        counts[skill.category] = (counts[skill.category] || 0) + 1;
      }
      setSkillCounts(counts);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to load', variant: 'destructive' });
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: categories.length });
    setModal(true);
  }

  function openEdit(cat: SkillCategoryData) {
    setEditing(cat);
    setForm({
      nameEn: cat.nameEn,
      nameAr: cat.nameAr || '',
      slug: cat.slug,
      descriptionEn: cat.descriptionEn || '',
      descriptionAr: cat.descriptionAr || '',
      icon: cat.icon || 'Brain',
      visible: cat.visible,
      sortOrder: cat.sortOrder ?? 0,
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.nameEn.trim()) return;
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.nameEn) };
    try {
      await fetchJson<SkillCategoryData>(
        editing ? `/api/skill-categories/${editing._id}` : '/api/skill-categories',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      toast({ title: editing ? 'Category updated' : 'Category created', variant: 'success' });
      setModal(false);
      load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetchJson<{ success: boolean }>(`/api/skill-categories/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      toast({ title: 'Category deleted' });
      load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Delete failed', variant: 'destructive' });
    }
  }

  async function persistOrder(next: SkillCategoryData[]) {
    try {
      const data = await fetchJson<{ success: boolean; categories: SkillCategoryData[] }>(
        '/api/skill-categories/reorder',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: next.map((c) => c._id) }),
        }
      );
      setCategories(data.categories || next);
      toast({ title: 'Order saved', variant: 'success' });
    } catch {
      toast({ title: 'Order save failed', variant: 'destructive' });
      load();
    }
  }

  function moveDragged(overId: string) {
    if (!draggedId || draggedId === overId) return;
    setCategories((current) => {
      const from = current.findIndex((c) => c._id === draggedId);
      const to = current.findIndex((c) => c._id === overId);
      if (from === -1 || to === -1) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((c, i) => ({ ...c, sortOrder: i }));
    });
  }

  const SelectedIcon = ICON_MAP[form.icon] ?? Brain;

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Skill Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage how skills are grouped, ordered, and displayed on the portfolio.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="admin-primary-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="space-y-3">
        {categories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
            No skill categories yet. Add one to get started.
          </div>
        )}
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? Brain;
          const count = skillCounts[cat.slug] ?? 0;
          return (
            <div
              key={cat._id}
              draggable
              onDragStart={() => setDraggedId(cat._id)}
              onDragEnter={() => moveDragged(cat._id)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => {
                const ordered = categories.map((c, i) => ({ ...c, sortOrder: i }));
                setDraggedId(null);
                persistOrder(ordered);
              }}
              className={`admin-card rounded-2xl p-4 transition-all ${
                draggedId === cat._id ? 'border-primary/40 bg-primary/5' : ''
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    className="shrink-0 cursor-grab rounded-xl border border-border/60 bg-background/40 p-2 text-muted-foreground active:cursor-grabbing"
                    aria-label={`Drag ${cat.nameEn}`}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{cat.nameEn}</span>
                      {cat.nameAr && (
                        <span className="text-sm text-muted-foreground" dir="rtl">{cat.nameAr}</span>
                      )}
                      {cat.visible ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          <Eye className="h-3 w-3" /> Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-xs text-muted-foreground">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">/{cat.slug}</p>
                    {cat.descriptionEn && (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{cat.descriptionEn}</p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                  <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-0.5 text-xs text-muted-foreground">
                    {count} skill{count !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => openEdit(cat)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-foreground"
                    aria-label={`Edit ${cat.nameEn}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cat._id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-red-300 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-200"
                    aria-label={`Delete ${cat.nameEn}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="admin-surface my-4 w-full max-w-lg rounded-2xl bg-card shadow-2xl shadow-black/40 sm:my-8">
            <div className="flex items-center justify-between border-b border-border/70 p-5">
              <h2 className="font-semibold text-foreground">
                {editing ? 'Edit Skill Category' : 'Add Skill Category'}
              </h2>
              <button onClick={() => setModal(false)} className="text-muted-foreground transition-colors hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Names */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name (EN) *" val={form.nameEn} set={(v) => setForm((f) => ({
                  ...f,
                  nameEn: v,
                  slug: editing ? f.slug : slugify(v),
                }))} />
                <Field label="Name (AR)" val={form.nameAr} set={(v) => setForm((f) => ({ ...f, nameAr: v }))} dir="rtl" />
              </div>

              {/* Slug */}
              <Field
                label="Slug"
                val={form.slug}
                set={(v) => setForm((f) => ({ ...f, slug: slugify(v) }))}
              />

              {/* Descriptions */}
              <Field label="Description (EN)" val={form.descriptionEn} set={(v) => setForm((f) => ({ ...f, descriptionEn: v }))} />
              <Field label="Description (AR)" val={form.descriptionAr} set={(v) => setForm((f) => ({ ...f, descriptionAr: v }))} dir="rtl" />

              {/* Icon picker */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Icon</label>
                <button
                  type="button"
                  onClick={() => setIconPickerOpen((o) => !o)}
                  className="admin-control flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:border-primary/40"
                >
                  <SelectedIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 text-left text-foreground">{form.icon}</span>
                  <span className="text-xs text-muted-foreground">{iconPickerOpen ? 'Close' : 'Change'}</span>
                </button>

                {iconPickerOpen && (
                  <div className="mt-2 rounded-xl border border-border/70 bg-background/50 p-3">
                    <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
                      {ICON_NAMES.map((name) => {
                        const Ic = ICON_MAP[name];
                        const active = form.icon === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            title={name}
                            onClick={() => {
                              setForm((f) => ({ ...f, icon: name }));
                              setIconPickerOpen(false);
                            }}
                            className={`flex h-9 w-full items-center justify-center rounded-lg border transition-all ${
                              active
                                ? 'border-primary/50 bg-primary/20 text-primary'
                                : 'border-border/50 bg-background/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-foreground'
                            }`}
                          >
                            <Ic className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Visible */}
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-foreground">Visible on public website</span>
              </label>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-border/70 p-4 sm:flex-row sm:p-5">
              <button
                onClick={() => setModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nameEn.trim()}
                className="admin-primary-btn rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="admin-surface w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl shadow-black/40">
            <h3 className="mb-2 font-semibold text-foreground">Delete Skill Category?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Skills in this category will no longer appear on the public site until reassigned. This cannot be undone.
            </p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
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
  dir,
}: {
  label: string;
  val: string;
  set: (v: string) => void;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={val}
        onChange={(e) => set(e.target.value)}
        dir={dir}
        className="admin-control w-full rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}
