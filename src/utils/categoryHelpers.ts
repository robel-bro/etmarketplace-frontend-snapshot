export interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  ancestry?: string;
  image?: string;
  children?: Category[];
}

export function buildCategoryTree(categories: Category[]): Category[] {
  // Safety check – prevent crash when categories is undefined or not an array
  if (!Array.isArray(categories) || categories.length === 0) return [];

  // If already nested, return as is
  if (categories[0]?.children !== undefined) return categories;

  const map = new Map<number, Category>();
  const roots: Category[] = [];

  // First pass: create map with empty children
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: assign children based on ancestry
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    let parentId: number | null = null;
    if (cat.ancestry) {
      const parts = cat.ancestry.split('/');
      const last = parts[parts.length - 1];
      if (last) parentId = parseInt(last, 10);
    } else if (cat.parent_id) {
      parentId = cat.parent_id;
    }
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}