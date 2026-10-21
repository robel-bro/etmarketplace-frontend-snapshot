// src/components/checkout/AddressStep.tsx
import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import MapPinPicker from './MapPinPicker';

interface Address {
  id: number;
  full_address: string;
  latitude?: number;
  longitude?: number;
}

interface Region {
  id: number;
  name: string;
}

interface GeocodedData {
  lat: number;
  lng: number;
  formatted_address?: string;
  structured: {
    city?: string;
    sub_city?: string;
    woreda?: string;
    street?: string;
    landmark?: string;
    confidence?: number;
    source?: string;
  };
}

interface AddressStepProps {
  onNext: () => void;
  selectedAddress: number | null;
  setSelectedAddress: (id: number | null) => void;
  addresses: Address[];
  setAddresses: (addrs: Address[]) => void;
  loading?: boolean;
}

const AddressStep = ({
  onNext,
  selectedAddress,
  setSelectedAddress,
  addresses,
  setAddresses,
  loading = false,
}: AddressStepProps) => {
  // ─── address‑list state (unchanged) ────────────────
  const [showNewForm, setShowNewForm] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(14); // default Addis Ababa
  const [phone, setPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── new geocoding / map state ─────────────────────
  const [addressSearch, setAddressSearch] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<GeocodedData | null>(null);
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [structured, setStructured] = useState<GeocodedData['structured']>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.get('/regions').then(res => setRegions(res.data)).catch(console.error);
  }, []);

  // ─── address list helpers (unchanged) ──────────────
  const uniqueAddresses = useMemo(() => {
    const seen = new Set<string>();
    const deduped: Address[] = [];
    for (const addr of addresses) {
      const key = addr.full_address.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(addr);
      }
    }
    if (deduped.length !== addresses.length) {
      Promise.resolve().then(() => setAddresses(deduped));
    }
    return deduped;
  }, [addresses, setAddresses]);

  const addUniqueAddress = (newAddr: Address) => {
    const exists = uniqueAddresses.some(
      a => a.full_address.toLowerCase().trim() === newAddr.full_address.toLowerCase().trim()
    );
    if (!exists) {
      setAddresses([...uniqueAddresses, newAddr]);
    }
    setSelectedAddress(newAddr.id);
  };

  // ─── geocoding & map actions ───────────────────────
  const handleVerifyAddress = async () => {
    if (!addressSearch.trim()) return;
    setIsValidating(true);
    setFormError('');
    try {
      const { data } = await api.post('/geocode/validate_place', { address: addressSearch });
      if (data?.structured) {
        setGeocodeResult(data);
        setStructured(data.structured);
        // if user hasn’t manually placed a pin yet, use the detected coordinates
        if (!manualCoords) {
          setManualCoords({ lat: data.lat, lng: data.lng });
        }
        // pre‑fill region if city matches Addis
        const cityName = data.structured.city?.toLowerCase();
        if (cityName === 'addis ababa' || cityName === 'addis abeba') {
          setSelectedRegionId(14); // Addis Ababa region id (adjust if needed)
        }
      }
    } catch (err: any) {
      setFormError('Address not found. Please drop a pin manually.');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePinChange = (lat: number, lng: number) => {
    setManualCoords({ lat, lng });
    // option: reverse geocode to update structured fields
    api.get('/geocode/reverse', { params: { lat, lon: lng } })
      .then(res => {
        if (res.data?.structured) {
          setStructured(prev => ({ ...prev, ...res.data.structured }));
        }
      })
      .catch(() => {});
  };

  // ─── save new address ──────────────────────────────
  const handleAddNew = async () => {
    if (!phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }
    if (!manualCoords?.lat || !manualCoords?.lng) {
      setFormError('Please set a delivery location on the map.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        address: {
          // use the selected region (or default 14 if missing)
          region_id: selectedRegionId || 14,
          address_line: addressSearch.trim() || structured.street || 'Manual pin',
          sub_city: structured.sub_city || '',
          city: structured.city || '',
          woreda_text: structured.woreda || '',
          street: structured.street || '',
          landmark: structured.landmark || '',
          phone: phone.trim(),
          delivery_notes: deliveryNotes.trim(),
          latitude: manualCoords.lat,
          longitude: manualCoords.lng,
          source: geocodeResult ? 'auto' : 'manual',
          is_default: true,
        },
      };
      const res = await api.post('/addresses', payload);
      const newAddr = res.data;
      addUniqueAddress({ id: newAddr.id, full_address: newAddr.full_address });
      // reset form
      setShowNewForm(false);
      setAddressSearch('');
      setGeocodeResult(null);
      setManualCoords(null);
      setStructured({});
      setPhone('');
      setDeliveryNotes('');
      setFormError('');
    } catch (err: any) {
      setFormError(err.response?.data?.errors?.join(', ') || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  // ─── UI ────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Select Delivery Address</h2>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading addresses…</p>
      ) : uniqueAddresses.length === 0 && !showNewForm ? (
        <p className="text-sm text-[var(--text-muted)]">No saved addresses. Add a new one below.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {uniqueAddresses.map(addr => (
            <button
              key={addr.id}
              onClick={() => setSelectedAddress(addr.id)}
              className={`flex-shrink-0 max-w-[280px] px-4 py-3 text-left border-2 rounded-xl transition-colors
                ${selectedAddress === addr.id
                  ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-sm'
                  : 'border-[var(--border-light)] bg-white hover:border-[var(--brand)]'
                }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${selectedAddress === addr.id
                      ? 'border-[var(--brand)] bg-[var(--brand)]'
                      : 'border-[var(--border-light)] bg-white'
                    }`}
                >
                  {selectedAddress === addr.id && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <p className="text-sm text-[var(--text-primary)] line-clamp-2 leading-snug">
                  {addr.full_address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          className="text-[var(--brand)] hover:underline text-sm mt-2"
        >
          + Enter new address
        </button>
      ) : (
        <div className="border border-[var(--border-light)] rounded-xl p-4 space-y-3 bg-[var(--surface-hover)]">
          <h3 className="font-medium text-sm text-[var(--text-primary)]">New Address</h3>

          {/* region dropdown (pre‑filled from geocoding if Addis) */}
          <select
            value={selectedRegionId || 14}
            onChange={e => setSelectedRegionId(Number(e.target.value) || null)}
            className="w-full border border-[var(--border-light)] rounded-lg px-3 py-2 text-[var(--text-primary)] bg-white"
          >
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* address search + verify */}
          <div className="flex gap-2">
            <input
              type="text"
              value={addressSearch}
              onChange={e => setAddressSearch(e.target.value)}
              placeholder="e.g., Bole, near Edna Mall, Woreda 03"
              className="flex-1 px-3 py-2 border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              onKeyDown={e => e.key === 'Enter' && handleVerifyAddress()}
            />
            <button
              onClick={handleVerifyAddress}
              disabled={isValidating}
              className="px-4 py-2 bg-[var(--brand)] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {isValidating ? 'Verifying…' : 'Verify'}
            </button>
          </div>

          {/* map (always shown when form is open) */}
          <MapPinPicker
            center={
              manualCoords
                ? [manualCoords.lat, manualCoords.lng]
                : [9.0243, 38.7468]
            }
            onPinChange={handlePinChange}
            editable={true}
            height="250px"
          />
          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          {/* preview structured fields */}
          <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
            <div><span className="font-medium">City:</span> {structured.city || '—'}</div>
            <div><span className="font-medium">Subcity:</span> {structured.sub_city || '—'}</div>
            <div><span className="font-medium">Woreda:</span> {structured.woreda || '—'}</div>
            <div><span className="font-medium">Street:</span> {structured.street || '—'}</div>
            <div className="col-span-2"><span className="font-medium">Landmark:</span> {structured.landmark || '—'}</div>
          </div>

          <input
            type="text"
            placeholder="Phone number *"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />

          <textarea
            placeholder="Delivery notes (e.g., blue gate, 2nd floor)"
            value={deliveryNotes}
            onChange={e => setDeliveryNotes(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            rows={2}
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddNew}
              disabled={saving}
              className="btn-cta px-4 py-2 rounded-lg"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="btn-secondary px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!selectedAddress}
          className="btn-cta px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Continue to Delivery
        </button>
      </div>
    </div>
  );
};

export default AddressStep;