'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PROJECT_CATEGORIES } from '@/lib/content/project';
import type { ProjectData } from '@/lib/content/project';
import { slugify } from '@/lib/utils';
import { fetchJson } from '@/lib/http';
import FileUploadField from '@/components/admin/FileUploadField';

type FormData = Partial<ProjectData> & { toolsRaw?: string; metaKeywordsRaw?: string };

const EMPTY: FormData = {
  titleEn: '', titleAr: '', slug: '', shortSummaryEn: '', shortSummaryAr: '',
  executiveSummaryEn: '', executiveSummaryAr: '', category: 'Machine Learning',
  problemStatementEn: '', problemStatementAr: '', businessObjectiveEn: '', businessObjectiveAr: '',
  datasetOverviewEn: '', datasetOverviewAr: '', technicalApproachEn: '', technicalApproachAr: '',
  modelUsed: '', evaluationMetrics: '', resultsEn: '', resultsAr: '', toolsRaw: '',
  metaTitle: '', metaDescription: '', metaKeywordsRaw: '', ogImage: '',
  githubLink: '', liveDemoLink: '', kaggleLink: '', thumbnail: '', featured: false, featuredOnHomepage: false,
  homepageCategoryOrder: 999,
  visible: true, displayOrder: 0,
};

const FORM_TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'details', label: 'Details' },
  { id: 'links', label: 'Links & Media' },
  { id: 'seo', label: 'SEO' },
];

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ProjectData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [formTab, setFormTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchJson<ProjectData[]>('/api/projects?admin=true');
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setProjects([]);
      toast({
        title: error instanceof Error ? error.message : 'Failed to load projects',
        variant: 'destructive',
      });
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setFormTab('basic');
    setModal(true);
  }

  function openEdit(p: ProjectData) {
    setEditing(p);
    setForm({
      ...p,
      toolsRaw: p.tools?.join(', ') || '',
      metaKeywordsRaw: p.metaKeywords?.join(', ') || '',
    });
    setFormTab('basic');
    setModal(true);
  }

  async function handleSave() {
    if (!form.titleEn) return;
    setSaving(true);
    const { toolsRaw: _raw, metaKeywordsRaw: _metaKeywordsRaw, ...rest } = form;
    const payload = {
      ...rest,
      slug: form.slug || slugify(form.titleEn || ''),
      tools: (_raw ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      metaKeywords: (_metaKeywordsRaw ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      await fetchJson<ProjectData>(
        editing ? `/api/projects/${editing._id}` : '/api/projects',
        { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      toast({ title: editing ? 'Project updated!' : 'Project added!', variant: 'success' });
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
      await fetchJson<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      toast({ title: 'Project deleted', variant: 'default' });
      load();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Delete failed',
        variant: 'destructive',
      });
    }
  }

  const s = (k: keyof FormData) => (form[k] as string) ?? '';
  const set = (k: keyof FormData, v: string | boolean | number) => setForm((f) => ({ ...f, [k]: v }));
  const homepageSelectionsByCategory = projects.reduce<Record<string, number>>((acc, project) => {
    if (!project.featuredOnHomepage) return acc;
    acc[project.category] = (acc[project.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Projects</h1>
          <p className="mt-0.5 text-sm text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECT_CATEGORIES.filter((category) => homepageSelectionsByCategory[category] || projects.some((project) => project.category === category)).map((category) => (
          <div key={category} className="admin-card rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{category}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Homepage picks: {Math.min(homepageSelectionsByCategory[category] || 0, 3)} / 3
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Top 3 by order
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101310]">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No projects yet.
            <button onClick={openAdd} className="mx-auto mt-2 block text-sm text-emerald-400 hover:underline">Add your first project</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Project</th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-400 md:table-cell">Category</th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-400 xl:table-cell">Homepage</th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-400 lg:table-cell">Tools</th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">Flags</th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {projects.map((p) => (
                <tr key={String(p._id)} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.titleEn} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-gray-500">No image</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="max-w-[220px] truncate font-medium text-gray-100">{p.titleEn}</div>
                        {p.titleAr && <div className="truncate text-xs text-gray-500">{p.titleAr}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{p.category}</span>
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    {p.featuredOnHomepage ? (
                      <div className="flex flex-col gap-1">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Homepage
                        </span>
                        <span className="text-xs text-gray-500">
                          Order #{p.homepageCategoryOrder ?? 999}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not shown</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.tools?.slice(0, 3).map((tool) => (
                        <span key={tool} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-gray-400">{tool}</span>
                      ))}
                      {(p.tools?.length ?? 0) > 3 && <span className="text-xs text-gray-500">+{(p.tools?.length ?? 0) - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {p.featured && <Star className="h-3.5 w-3.5 fill-current text-emerald-300" />}
                      {p.featuredOnHomepage && <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">Home</span>}
                      {p.visible ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="mr-3 inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-emerald-400">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(String(p._id))} className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-4 w-full max-w-3xl rounded-xl border border-white/10 bg-[#101310] shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-100">{editing ? 'Edit Project' : 'Add Project'}</h2>
              <button onClick={() => setModal(false)} className="text-xl leading-none text-gray-500 transition-colors hover:text-gray-300">×</button>
            </div>

            <div className="flex flex-wrap gap-1 p-4 pb-0">
              {FORM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFormTab(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${formTab === tab.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {formTab === 'basic' && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <F label="Title (EN) *" val={s('titleEn')} set={(v) => { set('titleEn', v); if (!editing) set('slug', slugify(v)); }} />
                    <F label="Title (AR)" val={s('titleAr')} set={(v) => set('titleAr', v)} dir="rtl" />
                  </div>
                  <F label="Slug" val={s('slug')} set={(v) => set('slug', v)} placeholder="auto-generated" />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Category</label>
                    <select value={s('category')} onChange={(e) => set('category', e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none">
                      {PROJECT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <T label="Short Summary (EN)" val={s('shortSummaryEn')} set={(v) => set('shortSummaryEn', v)} rows={2} />
                  <T label="Short Summary (AR)" val={s('shortSummaryAr')} set={(v) => set('shortSummaryAr', v)} rows={2} dir="rtl" />
                  <T label="Executive Summary (EN)" val={s('executiveSummaryEn')} set={(v) => set('executiveSummaryEn', v)} rows={3} />
                  <T label="Executive Summary (AR)" val={s('executiveSummaryAr')} set={(v) => set('executiveSummaryAr', v)} rows={3} dir="rtl" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <CheckF label="Featured" checked={Boolean(form.featured)} set={(v) => set('featured', v)} />
                    <CheckF label="Show on Homepage" checked={Boolean(form.featuredOnHomepage)} set={(v) => set('featuredOnHomepage', v)} />
                    <CheckF label="Visible" checked={Boolean(form.visible)} set={(v) => set('visible', v)} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
                    <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                      Homepage shows the top 3 projects in each category sorted by Homepage Order.
                    </div>
                    <F label="Homepage Order" val={String(form.homepageCategoryOrder ?? 999)} set={(v) => set('homepageCategoryOrder', Number(v))} type="number" />
                    <F label="Display Order" val={String(form.displayOrder ?? 0)} set={(v) => set('displayOrder', Number(v))} type="number" />
                  </div>
                </>
              )}

              {formTab === 'details' && (
                <>
                  <T label="Problem Statement (EN)" val={s('problemStatementEn')} set={(v) => set('problemStatementEn', v)} rows={2} />
                  <T label="Problem Statement (AR)" val={s('problemStatementAr')} set={(v) => set('problemStatementAr', v)} rows={2} dir="rtl" />
                  <T label="Business Objective (EN)" val={s('businessObjectiveEn')} set={(v) => set('businessObjectiveEn', v)} rows={2} />
                  <T label="Business Objective (AR)" val={s('businessObjectiveAr')} set={(v) => set('businessObjectiveAr', v)} rows={2} dir="rtl" />
                  <T label="Dataset Overview (EN)" val={s('datasetOverviewEn')} set={(v) => set('datasetOverviewEn', v)} rows={2} />
                  <T label="Dataset Overview (AR)" val={s('datasetOverviewAr')} set={(v) => set('datasetOverviewAr', v)} rows={2} dir="rtl" />
                  <T label="Technical Approach (EN)" val={s('technicalApproachEn')} set={(v) => set('technicalApproachEn', v)} rows={3} />
                  <T label="Technical Approach (AR)" val={s('technicalApproachAr')} set={(v) => set('technicalApproachAr', v)} rows={3} dir="rtl" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <F label="Model Used" val={s('modelUsed')} set={(v) => set('modelUsed', v)} />
                    <F label="Evaluation Metrics" val={s('evaluationMetrics')} set={(v) => set('evaluationMetrics', v)} />
                  </div>
                  <T label="Results (EN)" val={s('resultsEn')} set={(v) => set('resultsEn', v)} rows={2} />
                  <T label="Results (AR)" val={s('resultsAr')} set={(v) => set('resultsAr', v)} rows={2} dir="rtl" />
                  <F label="Tools (comma-separated)" val={s('toolsRaw')} set={(v) => set('toolsRaw', v)} placeholder="Python, TensorFlow, Pandas" />
                </>
              )}

              {formTab === 'links' && (
                <>
                  <F label="GitHub Link" val={s('githubLink')} set={(v) => set('githubLink', v)} placeholder="https://github.com/..." />
                  <F label="Live Demo Link" val={s('liveDemoLink')} set={(v) => set('liveDemoLink', v)} />
                  <F label="Kaggle Link" val={s('kaggleLink')} set={(v) => set('kaggleLink', v)} placeholder="https://kaggle.com/..." />
                  <FileUploadField
                    label="Project Thumbnail"
                    value={s('thumbnail')}
                    onChange={(v) => set('thumbnail', v)}
                    accept="image/*"
                    subdir="projects"
                    placeholder="https://... or upload an image"
                  />
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-400">Thumbnail Preview</p>
                    {s('thumbnail') ? (
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        <img src={s('thumbnail')} alt="Thumbnail preview" className="aspect-video w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/10 text-sm text-gray-500">
                        No project image selected
                      </div>
                    )}
                  </div>
                </>
              )}

              {formTab === 'seo' && (
                <>
                  <F label="Meta Title" val={s('metaTitle')} set={(v) => set('metaTitle', v)} placeholder="Overrides global title for this project page" />
                  <T label="Meta Description" val={s('metaDescription')} set={(v) => set('metaDescription', v)} rows={3} />
                  <F label="Meta Keywords (comma-separated)" val={s('metaKeywordsRaw')} set={(v) => set('metaKeywordsRaw', v)} placeholder="machine learning, forecasting, analytics" />
                  <FileUploadField
                    label="OG Image"
                    value={s('ogImage')}
                    onChange={(v) => set('ogImage', v)}
                    accept="image/*"
                    subdir="projects"
                    placeholder="https://... or upload an image"
                  />
                </>
              )}
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 p-4 pt-4 sm:flex-row sm:p-6 sm:pt-4">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.titleEn} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#101310] p-6 shadow-2xl">
            <h3 className="mb-2 font-bold text-gray-100">Delete Project?</h3>
            <p className="mb-5 text-sm text-gray-400">This action cannot be undone.</p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, val, set, type = 'text', placeholder = '', dir }: {
  label: string; val: string; set: (v: string) => void;
  type?: string; placeholder?: string; dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} dir={dir} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none" />
    </div>
  );
}

function T({ label, val, set, rows = 3, dir }: {
  label: string; val: string; set: (v: string) => void; rows?: number; dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <textarea rows={rows} value={val} onChange={(e) => set(e.target.value)} dir={dir} className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none" />
    </div>
  );
}

function CheckF({ label, checked, set }: { label: string; checked: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}
