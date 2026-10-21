// src/components/seller/VariantsBuilder.tsx
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VariantAttribute {
  id: number;
  name: string;
  display_name: string;
  values: string[];
}

interface Variety {
  selectedAttrs: { attrId: number; value: string }[];
  price: string;
  stock: string;
  unlimited_stock: boolean;
  image: File | null;
}

const DEFAULT_VISIBLE_ATTRS = 3;

const VariantsBuilder = ({
  attributes,
  variants,
  setVariants,
  hideStock = false,   // ★ hides Stock/Unlimited input when true (not used now)
}: {
  attributes: VariantAttribute[];
  variants: any[];
  setVariants: (v: any[]) => void;
  hideStock?: boolean;
}) => {
  const initialSelectedAttrs = () => {
    const attrSlice = attributes.slice(0, DEFAULT_VISIBLE_ATTRS);
    return attrSlice.map(attr => ({ attrId: attr.id, value: '' }));
  };

  const defaultSelected = initialSelectedAttrs();

  const [varieties, setVarieties] = useState<Variety[]>(() => {
    if (variants && variants.length > 0) {
      return variants.map((v: any, idx: number) => {
        const selectedAttrs = v.selectedAttrs
          ? v.selectedAttrs
          : v.attributes
            ? Object.entries(v.attributes)
                .map(([attrName, value]) => {
                  const attr = attributes.find(a => a.name === attrName);
                  return { attrId: attr?.id || 0, value: value as string };
                })
                .filter(a => a.attrId !== 0)
            : defaultSelected;
        return {
          selectedAttrs,
          price: v.price || '',
          stock: v.stock || '',
          unlimited_stock: v.unlimited_stock || false,
          image: idx === 0 ? null : v.image || null,
        };
      });
    }
    return [{ selectedAttrs: defaultSelected, price: '', stock: '', unlimited_stock: false, image: null }];
  });

  const [customValues, setCustomValues] = useState<Record<string, string[]>>({});

  // Sync up to parent
  useEffect(() => {
    const simplified = varieties.map(v => {
      const attrs: Record<string, string> = {};
      v.selectedAttrs.forEach(s => {
        const attrDef = attributes.find(a => a.id === s.attrId);
        if (attrDef) attrs[attrDef.name] = s.value;
      });
      return {
        attributes: attrs,
        price: v.price,
        stock: v.unlimited_stock ? '' : v.stock,   // unlimited => empty string for stock
        unlimited_stock: v.unlimited_stock,
        image: v.image,
      };
    });
    setVariants(simplified);
  }, [varieties]);

  const updateParent = (newVarieties: Variety[]) => setVarieties(newVarieties);

  const addVariety = () => {
    const newVariety: Variety = {
      selectedAttrs: initialSelectedAttrs(),
      price: '',
      stock: '',
      unlimited_stock: false,
      image: null,
    };
    updateParent([...varieties, newVariety]);
  };

  const removeVariety = (index: number) => {
    if (index === 0) return;
    updateParent(varieties.filter((_, i) => i !== index));
  };

  const addSpecificAttribute = (varietyIdx: number, attrId: number) => {
    const updated = varieties.map((v, i) =>
      i === varietyIdx
        ? { ...v, selectedAttrs: [...v.selectedAttrs, { attrId, value: '' }] }
        : v
    );
    updateParent(updated);
  };

  const removeAttributeRow = (varietyIdx: number, attrId: number) => {
    const updated = varieties.map((v, i) =>
      i === varietyIdx
        ? { ...v, selectedAttrs: v.selectedAttrs.filter(s => s.attrId !== attrId) }
        : v
    );
    updateParent(updated);
  };

  const updateAttributeValue = (varietyIdx: number, attrId: number, value: string) => {
    const updated = varieties.map((v, i) =>
      i === varietyIdx
        ? { ...v, selectedAttrs: v.selectedAttrs.map(s =>
            s.attrId === attrId ? { ...s, value } : s
          )}
        : v
    );
    updateParent(updated);
  };

  const addCustomSuggestion = (attrName: string, value: string) => {
    if (!value.trim()) return;
    setCustomValues(prev => {
      const existing = prev[attrName] || [];
      return existing.includes(value.trim())
        ? prev
        : { ...prev, [attrName]: [...existing, value.trim()] };
    });
  };

  const getSuggestions = (attr: VariantAttribute): string[] => {
    const official = attr.values || [];
    const custom = customValues[attr.name] || [];
    return [...new Set([...official, ...custom])];
  };

  const updateField = (varietyIdx: number, field: 'price' | 'stock', value: string) => {
    const updated = varieties.map((v, i) =>
      i === varietyIdx ? { ...v, [field]: value } : v
    );
    updateParent(updated);
  };

  const toggleUnlimited = (varietyIdx: number, checked: boolean) => {
    const updated = varieties.map((v, i) =>
      i === varietyIdx ? { ...v, unlimited_stock: checked, stock: checked ? '' : v.stock } : v
    );
    updateParent(updated);
  };

  const handleImageChange = (varietyIdx: number, file: File | null) => {
    const updated = varieties.map((v, i) =>
      i === varietyIdx ? { ...v, image: file } : v
    );
    updateParent(updated);
  };

  return (
    <div className="space-y-4">
      {varieties.map((v, idx) => {
        const isDefault = idx === 0;
        const usedIds = v.selectedAttrs.map(s => s.attrId);
        const remainingAttrs = attributes.filter(a => !usedIds.includes(a.id));

        return (
          <div
            key={idx}
            className={`border rounded-lg p-4 shadow-sm ${
              isDefault ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-800">
                {isDefault ? 'Default Variant' : `Variety ${idx + 1}`}
              </span>
              {!isDefault && (
                <button
                  type="button"
                  onClick={() => removeVariety(idx)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove variety"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Attribute rows */}
            {v.selectedAttrs.map(sel => {
              const attrDef = attributes.find(a => a.id === sel.attrId);
              if (!attrDef) return null;
              const listId = `attr-${attrDef.id}-${idx}`;

              return (
                <div
                  key={sel.attrId}
                  className="flex items-center gap-2 mb-2 bg-white border border-gray-200 rounded-md px-3 py-2"
                >
                  <div className="w-1/3 text-xs font-semibold text-gray-700 capitalize">
                    {attrDef.display_name || attrDef.name}
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={sel.value}
                      onChange={e => updateAttributeValue(idx, sel.attrId, e.target.value)}
                      list={listId}
                      className="w-full h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                      placeholder={`Enter ${attrDef.display_name || attrDef.name}`}
                    />
                    <datalist id={listId}>
                      {getSuggestions(attrDef).map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={() => addCustomSuggestion(attrDef.name, sel.value)}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500"
                      title="Save this value for quick reuse"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttributeRow(idx, sel.attrId)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Remove this attribute"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Choose an attribute to add (dropdown) */}
            {remainingAttrs.length > 0 && (
              <div className="mb-3">
                <select
                  value=""
                  onChange={e => {
                    const newAttrId = parseInt(e.target.value, 10);
                    if (newAttrId) addSpecificAttribute(idx, newAttrId);
                    e.target.value = '';
                  }}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option value="" disabled>
                    + Add attribute
                  </option>
                  {remainingAttrs.map(attr => (
                    <option key={attr.id} value={attr.id}>
                      {attr.display_name || attr.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price & Stock (with Unlimited toggle) */}
            {!hideStock && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price (ETB)
                  </label>
                  <input
                    type="number"
                    value={v.price}
                    onChange={e => updateField(idx, 'price', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={v.unlimited_stock}
                      onChange={e => toggleUnlimited(idx, e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-brand"
                      id={`unlimited-${idx}`}
                    />
                    <label htmlFor={`unlimited-${idx}`} className="text-xs text-gray-700">
                      Unlimited
                    </label>
                    <input
                      type="number"
                      value={v.stock}
                      disabled={v.unlimited_stock}
                      onChange={e => updateField(idx, 'stock', e.target.value)}
                      className="w-24 h-10 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder={v.unlimited_stock ? '∞' : '0'}
                    />
                  </div>
                </div>
              </div>
            )}
            {hideStock && (
              <div className="mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price (ETB)
                  </label>
                  <input
                    type="number"
                    value={v.price}
                    onChange={e => updateField(idx, 'price', e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {/* Image upload – extra varieties only */}
            {!isDefault && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Variant Image
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      handleImageChange(idx, file);
                    }}
                    className="text-xs"
                  />
                  {v.image && (
                    <span className="text-xs text-gray-500 truncate">{v.image.name}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Variety button – bottom right */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addVariety}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Add Variety
        </button>
      </div>
    </div>
  );
};

export default VariantsBuilder;