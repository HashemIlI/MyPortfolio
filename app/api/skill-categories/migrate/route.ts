import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import SkillCategory from '@/models/SkillCategory';
import { requireAuth } from '@/lib/apiAuth';
import { getApiErrorDetails } from '@/lib/api-error';

// Maps old hardcoded enum values → new slug values
const MIGRATION_MAP: Record<string, string> = {
  'Machine Learning': 'machine-learning',
  'Deep Learning': 'deep-learning',
  'Programming': 'data-analysis',
  'Data Visualisation': 'business-intelligence',
  'Tools & Platforms': 'tools',
  'Soft Skills': 'professional-skills',
};

// Default category definitions — used by the POST to ensure docs exist.
// $setOnInsert means these values only apply when the doc is being CREATED.
// If the doc already exists (matched by slug), nothing is overwritten.
const DEFAULT_CATEGORIES = [
  { slug: 'machine-learning',    nameEn: 'Machine Learning',    nameAr: 'تعلم الآلة',          descriptionEn: 'Predictive models, tuning, and evaluation workflows',     descriptionAr: 'نماذج تنبؤية وسير عمل الضبط والتقييم',                          icon: 'Brain',     sortOrder: 0, visible: true },
  { slug: 'deep-learning',       nameEn: 'Deep Learning',       nameAr: 'التعلم العميق',        descriptionEn: 'Neural networks, architectures, and training pipelines',   descriptionAr: 'الشبكات العصبية والبنى المعمارية ومسارات التدريب',               icon: 'Cpu',       sortOrder: 1, visible: true },
  { slug: 'data-analysis',       nameEn: 'Data Analysis',       nameAr: 'تحليل البيانات',       descriptionEn: 'Data wrangling, querying, and exploration',                descriptionAr: 'تنظيف البيانات والاستعلام والاستكشاف',                           icon: 'Database',  sortOrder: 2, visible: true },
  { slug: 'business-intelligence', nameEn: 'Business Intelligence', nameAr: 'ذكاء الأعمال',   descriptionEn: 'Reporting, dashboards, and decision support',               descriptionAr: 'التقارير ولوحات المعلومات ودعم القرار',                           icon: 'BarChart3', sortOrder: 3, visible: true },
  { slug: 'tools',               nameEn: 'Tools',               nameAr: 'الأدوات',              descriptionEn: 'Platforms and daily delivery tooling',                     descriptionAr: 'المنصات والأدوات المستخدمة يومياً',                              icon: 'Wrench',    sortOrder: 4, visible: true },
  { slug: 'professional-skills', nameEn: 'Professional Skills', nameAr: 'المهارات المهنية',     descriptionEn: 'Communication, ownership, and teamwork',                   descriptionAr: 'التواصل وتحمل المسؤولية والعمل الجماعي',                         icon: 'Briefcase', sortOrder: 5, visible: true },
];

// GET — orphan check (no auth required, read-only)
export async function GET() {
  try {
    await connectDB();
    const distinctCategories = (await Skill.distinct('category')) as string[];
    const skillCategories = await SkillCategory.find().select('slug').lean();
    const knownSlugs = new Set(skillCategories.map((c) => c.slug));

    const clean: string[] = [];
    const needsMigration: { current: string; target: string }[] = [];
    const orphans: string[] = [];

    for (const cat of distinctCategories) {
      if (knownSlugs.has(cat)) {
        clean.push(cat);
      } else if (MIGRATION_MAP[cat]) {
        needsMigration.push({ current: cat, target: MIGRATION_MAP[cat] });
      } else {
        orphans.push(cat);
      }
    }

    return NextResponse.json({
      distinctCategories,
      clean,
      needsMigration,
      orphans,
      ready: orphans.length === 0,
    });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to run orphan check.');
    return NextResponse.json({ success: false, message }, { status });
  }
}

// POST — upsert categories then remap skill.category values (admin-only, idempotent)
export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();

    // Step 1: Ensure all 6 SkillCategory docs exist.
    // Uses $setOnInsert so existing docs are NEVER modified — manual edits are preserved.
    const categoryResults: Array<{ slug: string; action: 'created' | 'existed' }> = [];
    for (const cat of DEFAULT_CATEGORIES) {
      const { slug, ...fields } = cat;
      const result = await SkillCategory.findOneAndUpdate(
        { slug },
        { $setOnInsert: fields },
        { upsert: true, new: false }
      );
      categoryResults.push({ slug, action: result === null ? 'created' : 'existed' });
    }

    // Step 2: Orphan check — abort if any skill.category value is unrecognised.
    const distinctCategories = (await Skill.distinct('category')) as string[];
    const allSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));

    const orphans = distinctCategories.filter(
      (cat) => !allSlugs.has(cat) && !MIGRATION_MAP[cat]
    );
    if (orphans.length > 0) {
      return NextResponse.json(
        { success: false, orphans, message: 'Orphaned skill categories found — migration aborted.' },
        { status: 409 }
      );
    }

    // Step 3: Remap old enum strings → slugs.
    const migrationResults: Array<{ from: string; to: string; count: number }> = [];
    for (const [from, to] of Object.entries(MIGRATION_MAP)) {
      if (distinctCategories.includes(from)) {
        const result = await Skill.updateMany({ category: from }, { $set: { category: to } });
        migrationResults.push({ from, to, count: result.modifiedCount });
      }
    }

    revalidatePath('/');
    return NextResponse.json({ success: true, categories: categoryResults, migration: migrationResults });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to run migration.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
