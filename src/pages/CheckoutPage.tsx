import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import api from '../lib/axios';
import {
  MapPinIcon,
  XMarkIcon,
  TruckIcon,
  CreditCardIcon,
  PencilIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  // ── state ──
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [addressDetected, setAddressDetected] = useState(false);

  // ── Manual address fields ──
  const [showManualFields, setShowManualFields] = useState(false);
  const [manualStreet, setManualStreet] = useState('');
  const [manualSubCity, setManualSubCity] = useState('');
  const [manualWoreda, setManualWoreda] = useState('');
  const [manualCity, setManualCity] = useState('Addis Ababa');
  const [manualBusiness, setManualBusiness] = useState('');
  const [manualRegionId, setManualRegionId] = useState<number>(14);
  const [manualZoneId, setManualZoneId] = useState<number | undefined>(undefined);
  const [manualWoredaId, setManualWoredaId] = useState<number | undefined>(undefined);
  const [manualPhone, setManualPhone] = useState(user?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // ── Detected address ──
  const [detectedAddressFull, setDetectedAddressFull] = useState('');

  // ★ Geocoding / manual coords state
  const [addressSearch, setAddressSearch] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<any>(null);
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLngInput, setManualLngInput] = useState('');
  const [structured, setStructured] = useState<any>({});

  // ★ Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // ★ Backend summary state
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // ── Load addresses and payment methods ──
  useEffect(() => {
    (async () => {
      try {
        setAddressLoading(true);
        const res = await api.get('/addresses');
        const list = res.data || [];
        setAddresses(list);
        if (list.length > 0) {
          setSelectedAddressId(list[0].id);
          fetchShippingOptions(list[0].id);
        }
      } catch {
        setPageError('Failed to load addresses');
      } finally {
        setAddressLoading(false);
      }
    })();
    fetchPaymentGateways();
  }, []);

  // ★ Fetch backend summary when address/partner/coupon changes
  useEffect(() => {
    if (!selectedAddressId || !selectedRate) return;
    fetchSummary();
  }, [selectedAddressId, selectedRate, appliedCouponCode]);

  const fetchShippingOptions = async (addressId: number) => {
    setLoadingShipping(true);
    try {
      const res = await api.post('/checkout/shipping_options', { address_id: addressId });
      const options = res.data || [];
      setShippingOptions(options);
      if (options.length > 0 && !selectedRate) setSelectedRate(options[0]);
    } catch (e) {
      setPageError('Failed to load delivery options');
    } finally {
      setLoadingShipping(false);
    }
  };

  const fetchPaymentGateways = async () => {
    setLoadingPayment(true);
    try {
      const res = await api.get('/checkout/payment_options');
      const gateways = res.data || [];
      setPaymentGateways(gateways);
      if (gateways.length > 0 && !selectedMethod) setSelectedMethod(gateways[0].provider);
    } catch (e) {
      setPageError('Failed to load payment methods');
    } finally {
      setLoadingPayment(false);
    }
  };

  const fetchSummary = async () => {
    if (!selectedAddressId || !selectedRate) return;
    setLoadingSummary(true);
    try {
      const res = await api.post('/checkout/summary', {
        address_id: selectedAddressId,
        partner_id: selectedRate.partner_id,
        coupon_code: appliedCouponCode || null,
      });
      setSummary(res.data);
    } catch (e: any) {
      setPageError(e.response?.data?.error || 'Failed to load order summary');
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSelectAddress = (id: number) => {
    setSelectedAddressId(id);
    setShowManualFields(false);
    setGeocodeResult(null);
    fetchShippingOptions(id);
  };

  // ★ Address validation via backend (null‑safe)
  const handleVerifyAddress = async (text?: string) => {
    const query = (text || addressSearch).trim();
    if (!query) return;
    setIsValidating(true);
    setPageError(null);
    try {
      const { data } = await api.post('/geocode/validate_place', { address: query });
      const struct = data?.structured ?? {};
      if (data?.lat && data?.lng && Object.keys(struct).length > 0) {
        setGeocodeResult(data);
        setStructured(struct);
        if (!manualCoords) {
          setManualCoords({ lat: data.lat, lng: data.lng });
          setManualLatInput(data.lat.toString());
          setManualLngInput(data.lng.toString());
        }
        setManualCity(struct.city || 'Addis Ababa');
        setManualSubCity(struct.sub_city || '');
        setManualWoreda(struct.woreda || '');
        setManualStreet(struct.street || '');
        setManualBusiness(struct.landmark || '');
        setManualRegionId(14);
        setDetectedAddressFull(data.formatted_address || query);
        setAddressDetected(true);
        setShowManualFields(true);
      } else {
        setPageError('Address found but no structured data returned.');
      }
    } catch (err: any) {
      setPageError('Address not found. Please enter coordinates manually.');
    } finally {
      setIsValidating(false);
    }
  };

  const fetchSuggestions = (val: string) => {
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { data } = await api.get('/geocode/suggest', { params: { query: val } });
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSuggestionClick = (s: any) => {
    setAddressSearch(s.label);
    setShowSuggestions(false);
    handleVerifyAddress(s.label);
  };

  const handleLatChange = (val: string) => {
    setManualLatInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && manualCoords) {
      setManualCoords({ lat: num, lng: manualCoords.lng });
    } else if (!isNaN(num)) {
      setManualCoords({ lat: num, lng: manualCoords?.lng || 0 });
    }
  };

  const handleLngChange = (val: string) => {
    setManualLngInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && manualCoords) {
      setManualCoords({ lat: manualCoords.lat, lng: num });
    } else if (!isNaN(num)) {
      setManualCoords({ lat: manualCoords?.lat || 0, lng: num });
    }
  };

  const handleAutoFillAddress = async () => {
    if (addressDetected) return;
    if (!navigator.geolocation) {
      setPageError('Geolocation not supported by your browser.');
      return;
    }
    setAutoFilling(true);
    setPageError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const { latitude, longitude } = position.coords;
      const geoRes = await api.get('/geocode/reverse', { params: { lat: latitude, lon: longitude } });
      const addressLine = geoRes?.data?.address ?? 'Unknown location';
      const struct = geoRes?.data?.structured ?? {};

      setDetectedAddressFull(addressLine);
      setAddressDetected(true);
      setShowManualFields(true);

      setStructured(struct);
      setManualCity(struct.city || 'Addis Ababa');
      setManualSubCity(struct.sub_city || '');
      setManualWoreda(struct.woreda || '');
      setManualStreet(struct.street || '');
      setManualBusiness(struct.landmark || '');
      setManualRegionId(struct.region_id || 14);
      setManualCoords({ lat: latitude, lng: longitude });
      setManualLatInput(latitude.toString());
      setManualLngInput(longitude.toString());
      setManualPhone(user?.phone || '');
    } catch (err: any) {
      setPageError(err?.message || 'Could not detect location. Please enter manually.');
    } finally {
      setAutoFilling(false);
    }
  };

  // ── Coupon handlers ──
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.post('/validate_coupon', { coupon_code: code });
      if (res.data.valid) {
        setAppliedCouponCode(code);
        setCouponError(null);
      } else {
        setCouponError(res.data.error || 'Invalid coupon');
        setAppliedCouponCode(null);
      }
    } catch (e: any) {
      setCouponError(e.response?.data?.error || 'Failed to validate coupon');
      setAppliedCouponCode(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // ── Place order ──
  const placeOrder = async () => {
    if (!selectedAddressId && !showManualFields) {
      setPageError('Please select or fill an address.');
      return;
    }
    if (!selectedRate || !selectedMethod) {
      setPageError('Please complete delivery & payment.');
      return;
    }
    if (!summary) {
      setPageError('Order summary not loaded. Please wait.');
      return;
    }

    setIsPlacing(true);
    setPageError(null);
    try {
      let addressIdToUse = selectedAddressId;

      if (showManualFields) {
        const parts = [manualStreet, manualSubCity, manualWoreda, manualCity].filter(Boolean);
        let addrLine = parts.join(', ');
        if (manualBusiness.trim()) {
          addrLine += ` (near ${manualBusiness.trim()})`;
        }

        const manualPayload = {
          address: {
            address_line: addrLine || 'Manual Address',
            region_id: manualRegionId,
            zone_id: manualZoneId || undefined,
            woreda_id: manualWoredaId || undefined,
            phone: manualPhone || user?.phone || '',
            is_default: false,
            latitude: manualCoords?.lat,
            longitude: manualCoords?.lng,
            delivery_notes: deliveryNotes,
            sub_city: manualSubCity || undefined,
            street: manualStreet || undefined,
            city: manualCity || undefined,
            woreda_text: manualWoreda || undefined,
            landmark: manualBusiness || undefined,
            source: manualCoords && !geocodeResult ? 'manual' : 'auto',
          },
        };
        const newAddr = await api.post('/addresses', manualPayload).then(r => r.data);
        addressIdToUse = newAddr.id;
      }

      const idempotencyKey = crypto.randomUUID();
      const res = await api.post('/checkout', {
        address_id: addressIdToUse,
        partner_id: selectedRate.partner_id,
        payment_method: selectedMethod,
        coupon_code: appliedCouponCode || null,
        idempotency_key: idempotencyKey,
        delivery_speed: selectedRate.delivery_speed || 0,
      });
      const data = res.data;

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      if (data.orders) {
        navigate(`/order-tracking/${data.orders[0].id}`);
        refreshCart();
      } else if (data.successful?.length) {
        navigate(`/order-tracking/${data.successful[0].id}`);
        refreshCart();
      } else {
        setPageError('Order placement failed.');
      }
    } catch (err: any) {
      setPageError(err.response?.data?.error || 'Order failed');
    } finally {
      setIsPlacing(false);
    }
  };

  const formatPrice = (v: number | string | undefined | null) =>
    Number(v || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const estimatedDeliveryDate = useMemo(() => {
    if (summary?.delivery?.estimated_delivery_label) return summary.delivery.estimated_delivery_label;
    if (selectedRate?.estimated_delivery_label) return selectedRate.estimated_delivery_label;
    if (selectedRate?.estimated_days) {
      const days = parseInt(selectedRate.estimated_days, 10);
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return null;
  }, [selectedRate, summary]);

  // Determine items to display
  const summaryItems = summary?.items || [];
  const displayItems = summaryItems.length > 0 ? summaryItems : cart?.items || [];
  const displayAddress = summary?.address || null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-900">
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
        <div className="w-10" />
      </header>

      {pageError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 flex items-start gap-3">
            <XMarkIcon className="w-5 h-5 mt-0.5 cursor-pointer" onClick={() => setPageError(null)} />
            <p className="text-sm">{pageError}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1">
          <div className="bg-white shadow-sm border border-gray-200 p-6 space-y-8">
            {/* Delivery Address */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-orange-600" />
                Delivery Address
              </h2>

              {/* Address search */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search your address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={addressSearch}
                      onChange={e => {
                        setAddressSearch(e.target.value);
                        fetchSuggestions(e.target.value);
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyAddress()}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="e.g., Bole, near Edna Mall, Woreda 03"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto shadow-lg">
                        {suggestions.map((s, idx) => (
                          <li
                            key={idx}
                            onMouseDown={() => handleSuggestionClick(s)}
                            className="px-3 py-2 text-sm hover:bg-orange-100 cursor-pointer"
                          >
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => handleVerifyAddress()}
                    disabled={isValidating}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition disabled:opacity-50"
                  >
                    {isValidating ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </div>

              {/* Manual coords */}
              {showManualFields && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Coordinates (optional fine‑tuning)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={manualLatInput}
                        onChange={e => handleLatChange(e.target.value)}
                        placeholder="9.0243"
                        className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={manualLngInput}
                        onChange={e => handleLngChange(e.target.value)}
                        placeholder="38.7468"
                        className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 mt-3 rounded">
                    <div><span className="font-medium">City:</span> {structured.city || manualCity || '—'}</div>
                    <div><span className="font-medium">Subcity:</span> {structured.sub_city || manualSubCity || '—'}</div>
                    <div><span className="font-medium">Woreda:</span> {structured.woreda || manualWoreda || '—'}</div>
                    <div><span className="font-medium">Neighborhood:</span> {structured.neighborhood || '—'}</div>
                    <div><span className="font-medium">Street:</span> {structured.street || manualStreet || '—'}</div>
                    <div className="col-span-2"><span className="font-medium">Landmark:</span> {structured.landmark || manualBusiness || '—'}</div>
                  </div>
                </div>
              )}

              {/* Existing addresses */}
              {!showManualFields && !addressLoading && addresses.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {addresses.map((addr: any) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition ${
                        selectedAddressId === addr.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => handleSelectAddress(addr.id)}
                        className="mt-1 h-4 w-4 text-orange-500 border-gray-400 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-900">{addr.full_address}</span>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowManualFields(!showManualFields)}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 mb-4"
              >
                <PencilIcon className="w-4 h-4" />
                {showManualFields ? 'Hide manual fields' : 'Or fill address manually'}
              </button>

              {showManualFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Street / Road</label>
                    <input
                      type="text"
                      value={manualStreet}
                      onChange={e => setManualStreet(e.target.value)}
                      placeholder="e.g. Cameroon Street"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Sub‑City / Area</label>
                    <input
                      type="text"
                      value={manualSubCity}
                      onChange={e => setManualSubCity(e.target.value)}
                      placeholder="e.g. Bole"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Woreda</label>
                    <input
                      type="text"
                      value={manualWoreda}
                      onChange={e => setManualWoreda(e.target.value)}
                      placeholder="e.g. Woreda 03"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">City</label>
                    <input
                      type="text"
                      value={manualCity}
                      onChange={e => setManualCity(e.target.value)}
                      placeholder="Addis Ababa"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Nearby Business / Landmark</label>
                    <input
                      type="text"
                      value={manualBusiness}
                      onChange={e => setManualBusiness(e.target.value)}
                      placeholder="e.g. Edna Mall"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={e => setManualPhone(e.target.value)}
                      placeholder="+251..."
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {!addressDetected && (
                <button
                  onClick={handleAutoFillAddress}
                  disabled={autoFilling}
                  className="mb-4 w-full sm:w-auto flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 transition disabled:opacity-50"
                >
                  <MapPinIcon className="w-4 h-4" />
                  {autoFilling ? 'Detecting location…' : 'Use my current location'}
                </button>
              )}

              {addressDetected && detectedAddressFull && !addressSearch && (
                <div className="mb-4 bg-orange-50 border border-orange-200 p-3 text-sm text-gray-900 flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{detectedAddressFull}</span>
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Delivery Instructions</label>
                <textarea
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Blue gate, second floor, near the church"
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={2}
                />
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Delivery Method */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-orange-600" />
                Delivery Method
              </h2>
              {loadingShipping ? (
                <p className="text-sm text-gray-500">Loading options…</p>
              ) : shippingOptions.length === 0 ? (
                <p className="text-sm text-gray-500">Select an address to see delivery options.</p>
              ) : (
                <div className="space-y-2">
                  {shippingOptions.map((opt: any) => (
                    <label
                      key={opt.partner_id}
                      className={`flex items-center justify-between p-3 border cursor-pointer transition ${
                        selectedRate?.partner_id === opt.partner_id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={opt.partner_id}
                          checked={selectedRate?.partner_id === opt.partner_id}
                          onChange={() => setSelectedRate(opt)}
                          className="h-4 w-4 text-orange-500 border-gray-400 focus:ring-orange-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{opt.delivery_label}</p>
                          <p className="text-xs text-gray-500">
                            {opt.partner_name && `${opt.partner_name} · `}
                            {opt.estimated_delivery_label || `${opt.estimated_days} day(s)`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">ETB {formatPrice(opt.charge)}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <hr className="border-gray-100" />

            {/* Payment Method */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-orange-600" />
                Payment Method
              </h2>
              {loadingPayment ? (
                <p className="text-sm text-gray-500">Loading payment options…</p>
              ) : (
                <div className="space-y-2">
                  {paymentGateways.map((gw: any) => (
                    <label
                      key={gw.provider}
                      className={`flex items-center justify-between p-3 border cursor-pointer transition ${
                        selectedMethod === gw.provider
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value={gw.provider}
                          checked={selectedMethod === gw.provider}
                          onChange={() => setSelectedMethod(gw.provider)}
                          className="h-4 w-4 text-orange-500 border-gray-400 focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{gw.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <hr className="border-gray-100" />

            {/* Coupon */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Coupon Code</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Enter coupon"
                  className="flex-1 border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {applyingCoupon ? 'Applying…' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}
              {appliedCouponCode && (
                <p className="text-xs text-green-600 mt-1">Coupon applied: {appliedCouponCode}</p>
              )}
            </section>
          </div>
        </div>

        {/* RIGHT – Order Summary */}
        <div className="w-full lg:w-96">
          <div className="bg-white shadow-sm border border-gray-200 p-5 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>

            {displayItems.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {displayItems.map((item: any) => {
                  const price = Number(item.price || 0);
                  const basePrice = Number(item.base_price ?? item.original_price ?? item.price);
                  const qty = Number(item.quantity || 1);
                  const hasDiscount = basePrice > price;
                  const itemTotalDiscounted = price * qty;
                  const itemTotalOriginal = basePrice * qty;
                  const vendorName = item.vendor_name || '';
                  const variantAttrs = item.variant_attributes || item.variant || {};
                  return (
                    <div key={item.cart_item_id || item.id || item.product_id || item.package_id} className="flex gap-3 items-start pb-3 border-b border-gray-200 last:border-0">
                      {item.image_url || item.image ? (
                        <img src={item.image_url || item.image} className="w-12 h-12 object-cover border border-gray-200" alt="" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {vendorName && (
                          <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                            <BuildingStorefrontIcon className="w-3 h-3" />
                            {vendorName}
                          </p>
                        )}
                        {Object.keys(variantAttrs).length > 0 && (
                          <p className="text-xs text-gray-400 truncate">
                            {Object.entries(variantAttrs).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                        <div className="flex justify-between items-baseline text-xs mt-1">
                          <div>
                            <span className="font-medium">ETB {formatPrice(price)}</span>
                            {hasDiscount && (
                              <span className="text-gray-400 line-through ml-1">ETB {formatPrice(basePrice)}</span>
                            )}
                            <span className="text-gray-500"> × {qty}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-gray-900">ETB {formatPrice(itemTotalDiscounted)}</span>
                            {hasDiscount && (
                              <span className="block text-red-600 text-xs">-ETB {formatPrice(itemTotalOriginal - itemTotalDiscounted)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Your cart is empty.</p>
            )}

            {displayAddress && (
              <div className="bg-orange-50 border border-orange-200 p-3 text-xs space-y-1">
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5 text-orange-600" />
                  Delivering to:
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {displayAddress.full_address || [displayAddress.street, displayAddress.sub_city, displayAddress.woreda, displayAddress.city].filter(Boolean).join(', ')}
                </p>
                {displayAddress.landmark && (
                  <p className="text-gray-600">Landmark: {displayAddress.landmark}</p>
                )}
                {displayAddress.neighborhood && (
                  <p className="text-gray-600">Neighborhood: {displayAddress.neighborhood}</p>
                )}
                {displayAddress.phone && (
                  <p className="text-gray-600">Phone: {displayAddress.phone}</p>
                )}
                {displayAddress.delivery_notes && (
                  <p className="text-gray-500 italic">📝 {displayAddress.delivery_notes}</p>
                )}
              </div>
            )}

            {selectedRate && (
              <div className="text-xs text-gray-700 space-y-1 border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-medium">Delivery:</span> {summary?.delivery?.delivery_label || selectedRate.delivery_label}
                  {summary?.delivery?.estimated_delivery_label && ` (${summary.delivery.estimated_delivery_label})`}
                </div>
                {estimatedDeliveryDate && (
                  <div className="flex items-center gap-2 ml-5">
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>Est. delivery: {estimatedDeliveryDate}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-medium">Payment:</span>{' '}
                  {paymentGateways.find(g => g.provider === selectedMethod)?.name || selectedMethod}
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm border-t border-gray-200 pt-3">
              {loadingSummary && <p className="text-xs text-gray-400 text-right">Updating totals…</p>}

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">ETB {formatPrice(summary?.subtotal)}</span>
              </div>

              {summary?.raw_carrier_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery (raw)</span>
                  <span className="font-medium text-gray-900">ETB {formatPrice(summary.raw_carrier_cost)}</span>
                </div>
              )}
              {summary?.seller_subsidy > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Seller Delivery Subsidy</span>
                  <span>-ETB {formatPrice(summary.seller_subsidy)}</span>
                </div>
              )}
              {summary?.platform_markup > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>ETB {formatPrice(summary.platform_markup)}</span>
                </div>
              )}

              {summary?.service_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span>ETB {formatPrice(summary.service_fee)}</span>
                </div>
              )}
              {summary?.vat > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT</span>
                  <span>ETB {formatPrice(summary.vat)}</span>
                </div>
              )}
              {summary?.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Coupon Discount</span>
                  <span>-ETB {formatPrice(summary.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Final Delivery</span>
                <span className="font-medium text-gray-900">ETB {formatPrice(summary?.shipping)}</span>
              </div>

              <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">ETB {formatPrice(summary?.total)}</span>
              </div>
              <p className="text-xs text-gray-500 italic">Includes delivery and applicable taxes</p>
            </div>

            <button
              onClick={placeOrder}
              disabled={isPlacing || cart?.items?.length === 0 || !summary || loadingSummary}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacing ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;