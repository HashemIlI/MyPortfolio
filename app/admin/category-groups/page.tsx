'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchJson } from '@/lib/http';
import { slugify } from '@/lib/utils';
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectData } from '@/lib/content/project';
import type { CategoryGroupData } from '@/lib/content/category-group';
import { buildProjectDisplayGroups } from '@/lib/content/project-display';

type CategoryGroupResponse = {
  groups: CategoryGroupData[];
  sourceCategories: ProjectCategory[];
  allSourceCategories: ProjectCategory[];
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  sourceCategories: ProjectCategory[];
  visible: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormData = {
  name: '',
  slug: '',
  description: '',
  sourceCategories: [],
  visible: true,
  sortOrder: 0,
};

export default function CategoryGroupsAdminPage() {
  const [groups, setGroups] = useState<CategoryGroupData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [allSourceCategories, setAllSourceCategories] = useState<ProjectCategory[]>(PROJECT_CATEGORIES);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CategoryGroupData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    try {
      const [groupData, projectData] = await Promise.all([
        fetchJson<CategoryGroupResponse>('/api/category-groups?admin=true'),
        fetchJson<ProjectData[]>('/api/projects?admin=true'),
      ]);
      setGroups(groupData.groups || []);
      setAllSourceCategories(groupData.allSourceCategories || PROJECT_CATEGORIES);
      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to load category groups',
        variant: 'destructive',
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const previewGroups = useMemo(
    () => buildProjectDisplayGroups(projects, groups, { includeHidden: true, includeEmpty: true }),
    [projects, groups]
  );

  const projectCountsByCategory = useMemo(
    () =>
      projects.reduce<Record<string, number>>((acc, project) => {
        acc[project.category] = (acc[project.category] || 0) + 1;
        return acc;
      }, {}),
    [projects]
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder: groups.length,
    });
    setModal(true);
  }

  function openEdit(group: CategoryGroupData) {
    setEditing(group);
    setForm({
      name: group.name,
      slug: group.slug,
      description: group.description || '',
      sourceCategories: group.sourceCategories || [],
      visible: group.visible,
      sortOrder: group.sortOrder ?? 0,
    });
    setModal(true);
  }

  function setSourceCategory(category: ProjectCategory, checked: boolean) {
    setForm((current) => ({
      ...current,
      sourceCategories: checked
        ? [...new Set([...current.sourceCategories, category])]
        : current.sourceCategories.filter((item) => item !== category),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
    };

    try {
      await fetchJson<CategoryGroupData>(
        editing ? `/api/category-groups/${editing._id}` : '/api/category-groups',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      toast({ title: editing ? 'Category group updated' : 'Category group created', variant: 'success' });
      setModal(false);
      load();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Save failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetchJson<{ success: boolean }>(`/api/category-groups/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      toast({ title: 'Category group deleted' });
      load();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Delete failed',
        variant: 'destructive',
      });
    }
  }

  async function persistOrder(nextGroups: CategoryGroupData[]) {
    try {
      const data = await fetchJson<{ success: boolean; groups: CategoryGroupData[] }>(
        '/api/category-groups/reorder',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: nextGroups.map((group) => group._id) }),
        }
      );
      setGroups(data.groups || nextGroups);
      toast({ title: 'Category order saved', variant: 'success' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Order save failed',
        variant: 'destructive',
      });
      load();
    }
  }

  function moveDraggedGroup(overId: string) {
    if (!draggedId || draggedId === overId) return;

    setGroups((current) => {
      const from = current.findIndex((group) => group._id === draggedId);
      const to = current.findIndex((group) => group._id === overId);
      if (from === -1 || to === -1) return current;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((group, index) => ({ ...group, sortOrder: index }));
    });
  }

  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Category Groups</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Control public project grouping, naming, visibility, and order.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" /> Add Group
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {groups.map((group) => {
            const preview = previewGroups.find((item) => item.id === String(group._id));
            return (
              <div
                key={group._id}
                draggable
                onDragStart={() => setDraggedId(group._id)}
                onDragEnter={() => moveDraggedGroup(group._id)}
                onDragOver={(event) => event.preventDefault()}
                onDragEnd={() => {
                  const orderedGroups = groups.map((item, index) => ({ ...item, sortOrder: index }));
                  setDraggedId(null);
                  persistOrder(orderedGroups);
                }}
                className={`admin-card rounded-2xl p-4 transition-all ${
                  draggedId === group._id ? 'border-emerald-400/40 bg-emerald-500/5' : ''
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <button
                      type="button"
                      className="mt-0.5 cursor-grab rounded-lg border border-white/10 bg-black/20 p-2 text-gray-400 active:cursor-grabbing"
                      aria-label={`Drag ${group.name}`}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-gray-100">{group.name}</h2>
                        {group.visible ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                            <Eye className="h-3 w-3" /> Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">/{group.slug}</p>
                      {group.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-400">{group.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {group.sourceCategories.length > 0 ? (
                          group.sourceCategories.map((category) => (
                            <span
                              key={category}
                              className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {category} ({projectCountsByCategory[category] || 0})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-amber-300">No source categories selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-gray-400">
                      {preview?.projects.length ?? 0} public project{(preview?.projects.length ?? 0) === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={() => openEdit(group)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-emerald-400"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(group._id)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="admin-card h-fit rounded-2xl p-4">
          <h2 className="font-semibold text-gray-100">Public Preview</h2>
          <p className="mt-1 text-xs leading-5 text-gray-400">
            This mirrors the homepage grouping. Hidden groups are listed here only for admin review.
          </p>
          <div className="mt-4 space-y-3">
            {previewGroups.map((group) => (
              <div key={group.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-100">{group.name}</p>
                  <span className="text-xs text-gray-500">{group.projects.length}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {group.sourceCategories.join(' + ') || 'No categories'}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-4 w-full max-w-2xl rounded-xl border border-white/10 bg-[#101310] shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-100">
                {editing ? 'Edit Category Group' : 'Add Category Group'}
              </h2>
              <button onClick={() => setModal(false)} className="text-xl leading-none text-gray-500 transition-colors hover:text-gray-300">
                x
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <F
                label="Display Name *"
                val={form.name}
                set={(value) =>
                  setForm((current) => ({
                    ...current,
                    name: value,
                    slug: editing ? current.slug : slugify(value),
                  }))
                }
              />
              <F label="Slug" val={form.slug} set={(value) => setForm((current) => ({ ...current, slug: slugify(value) }))} />
              <T
                label="Description"
                val={form.description}
                set={(value) => setForm((current) => ({ ...current, description: value }))}
                rows={3}
              />
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(event) => setForm((current) => ({ ...current, visible: event.target.checked }))}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-gray-300">Visible on public website</span>
              </label>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-400">Source Categories</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {allSourceCategories.map((category) => (
                    <label
                      key={category}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <span className="text-sm text-gray-300">{category}</span>
                      <input
                        type="checkbox"
                        checked={form.sourceCategories.includes(category)}
                        onChange={(event) => setSourceCategory(category, event.target.checked)}
                        className="h-4 w-4 rounded accent-emerald-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 p-4 pt-4 sm:flex-row sm:p-6 sm:pt-4">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#101310] p-6 shadow-2xl">
            <h3 className="mb-2 font-bold text-gray-100">Delete Category Group?</h3>
            <p className="mb-5 text-sm text-gray-400">
              Projects keep their original category. Deleted group categories fall back to standalone public sections.
            </p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-400">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
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

function F({ label, val, set, type = 'text' }: {
  label: string;
  val: string;
  set: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(event) => set(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}

function T({ label, val, set, rows = 3 }: {
  label: string;
  val: string;
  set: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <textarea
        rows={rows}
        value={val}
        onChange={(event) => set(event.target.value)}
        className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}
