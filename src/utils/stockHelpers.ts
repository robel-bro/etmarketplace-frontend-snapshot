// src/utils/stockHelpers.ts

export const parseVariantStock = (v: any): number | null => {
  if (v && v.stock === null) return null;        // unlimited
  if (v && typeof v.stock === 'number') return v.stock;
  if (v && typeof v.stock === 'string') {
    const parsed = parseInt(v.stock, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return undefined; // field not present
};

export const hasAnyVariantStock = (variants: any[]): boolean => {
  if (!variants || !Array.isArray(variants)) return false;
  return variants.some(v => v && 'stock' in v);
};

export const sumVariantStock = (variants: any[]): number | null => {
  let total = 0;
  for (const v of variants) {
    const parsed = parseVariantStock(v);
    if (parsed === null) return null;   // unlimited variant
    if (typeof parsed === 'number') total += parsed;
  }
  return total;
};

/**
 * Compute a human‑readable stock string.
 * @param product               – product object (must have stock, bulk_enabled, variants, stock_display, etc.)
 * @param selectedVariantAttrs  – optional map of the selected variant’s attributes.
 *                                If provided, the stock of the matching variant is used.
 *                                Otherwise, the total variant stock or product stock_display is used.
 */
export const computeStockDisplay = (
  product: any,
  selectedVariantAttrs?: Record<string, any>
): string => {
  // If the product has variants and we know which one is selected
  if (selectedVariantAttrs && product.variants && Array.isArray(product.variants)) {
    const matched = product.variants.find((v: any) =>
      v.attributes &&
      Object.entries(selectedVariantAttrs).every(
        ([key, val]) => v.attributes[key] === val
      )
    );
    if (matched) {
      if ('stock' in matched) {
        const parsed = parseVariantStock(matched);
        return parsed != null
          ? `Stock: ${parsed}`
          : product.bulk_enabled
          ? 'Unlimited'
          : (product.stock_display || '0');
      }
      // matched but no stock field → fallback to product stock_display
      return product.stock_display || '0';
    }
    // If no match found, fallback to total (shouldn’t happen)
  }

  // Fallback logic when no variant is selected or not a variant product
  if (product.bulk_enabled && product.stock === null) return 'Unlimited';
  const variants = product.variants;
  if (variants && Array.isArray(variants) && variants.length > 0) {
    if (hasAnyVariantStock(variants)) {
      const total = sumVariantStock(variants);
      return total === null ? 'Multiple' : `Stock: ${total}`;
    }
    return product.stock_display || '0';
  }
  return product.stock_display || '0';
};