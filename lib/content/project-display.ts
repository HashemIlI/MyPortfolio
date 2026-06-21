import type { ProjectData } from './project';
import type { CategoryGroupData, ProjectDisplayGroup } from './category-group';

const sortProjectsForDisplay = (projects: ProjectData[]) =>
  [...projects].sort((a, b) => {
    const featuredDelta = Number(b.featuredOnHomepage) - Number(a.featuredOnHomepage);
    if (featuredDelta !== 0) return featuredDelta;

    const homepageOrderDelta =
      (a.homepageCategoryOrder ?? 999) - (b.homepageCategoryOrder ?? 999);
    if (homepageOrderDelta !== 0) return homepageOrderDelta;

    const displayDelta = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    if (displayDelta !== 0) return displayDelta;

    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

export function buildProjectDisplayGroups(
  projects: ProjectData[],
  categoryGroups: CategoryGroupData[],
  options: { includeHidden?: boolean; includeEmpty?: boolean } = {}
): ProjectDisplayGroup[] {
  const { includeHidden = false, includeEmpty = false } = options;
  const configuredSlugs = new Set(categoryGroups.map((g) => g.slug));

  const activeGroups = [...categoryGroups]
    .filter((group) => includeHidden || group.visible)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const displayGroups: ProjectDisplayGroup[] = activeGroups
    .map((group) => ({
      id: String(group._id),
      name: group.name,
      slug: group.slug,
      description: group.description,
      sourceCategories: group.sourceCategories,
      visible: group.visible,
      sortOrder: group.sortOrder,
      fallback: false,
      projects: sortProjectsForDisplay(
        projects.filter((project) => project.category === group.slug)
      ),
    }))
    .filter((group) => includeEmpty || group.projects.length > 0);

  // Fallback: projects whose category slug doesn't match any configured group
  const ungrouped = projects.filter((p) => !configuredSlugs.has(p.category));
  if (ungrouped.length > 0) {
    const byCategory = new Map<string, ProjectData[]>();
    ungrouped.forEach((p) => {
      const key = p.category || 'uncategorised';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(p);
    });
    byCategory.forEach((items, key) => {
      if (!includeEmpty && items.length === 0) return;
      displayGroups.push({
        id: `fallback-${key}`,
        name: key,
        slug: key.toLowerCase().replace(/[\s_]+/g, '-'),
        description: '',
        sourceCategories: [],
        visible: true,
        sortOrder: 10000,
        fallback: true,
        projects: sortProjectsForDisplay(items),
      });
    });
  }

  return displayGroups;
}
