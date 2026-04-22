import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectData } from './project';
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
  const configuredCategories = new Set<ProjectCategory>();
  categoryGroups.forEach((group) => {
    group.sourceCategories.forEach((category) => configuredCategories.add(category));
  });

  const activeGroups = [...categoryGroups]
    .filter((group) => includeHidden || group.visible)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const displayGroups: ProjectDisplayGroup[] = activeGroups
    .map((group) => {
      const sourceCategories = new Set(group.sourceCategories);
      const items = sortProjectsForDisplay(
        projects.filter((project) => sourceCategories.has(project.category))
      );

      return {
        id: String(group._id),
        name: group.name,
        slug: group.slug,
        description: group.description,
        sourceCategories: group.sourceCategories,
        visible: group.visible,
        sortOrder: group.sortOrder,
        fallback: false,
        projects: items,
      };
    })
    .filter((group) => includeEmpty || group.projects.length > 0);

  const projectCategories = new Set(projects.map((project) => project.category));
  PROJECT_CATEGORIES.forEach((category, index) => {
    if (configuredCategories.has(category) || !projectCategories.has(category)) return;

    const items = sortProjectsForDisplay(projects.filter((project) => project.category === category));
    if (!includeEmpty && items.length === 0) return;

    displayGroups.push({
      id: `fallback-${category}`,
      name: category,
      slug: category.toLowerCase().replace(/[\s_]+/g, '-'),
      description: '',
      sourceCategories: [category],
      visible: true,
      sortOrder: 10000 + index,
      fallback: true,
      projects: items,
    });
  });

  return displayGroups;
}
