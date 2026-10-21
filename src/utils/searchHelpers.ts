// et_marketplace_frontend/src/utils/searchHelpers.ts

export const normalizeTokens = (str: string) =>
  str
    .toLowerCase()
    .replace(/[''’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export const scoreCategory = (catName: string, queryTokens: string[]) => {
  const catTokens = normalizeTokens(catName);
  return queryTokens.filter(qt => catTokens.some(ct => ct.includes(qt) || qt.includes(ct))).length;
};