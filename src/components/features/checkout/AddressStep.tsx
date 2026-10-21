import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';

const addressSchema = z.object({
  address_id: z.string().optional(),
  region_id: z.string().min(1, 'Region is required'),
  zone_id: z.string().optional(),
  woreda_id: z.string().optional(),
  address_line: z.string().min(5, 'Detailed address is required'),
  landmark: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  delivery_notes: z.string().optional(),   // ← new
  is_default: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressStepProps {
  onNext: (data: { address_id?: string } & Partial<AddressFormData>) => void;
  defaultAddresses: any[];
}

const AddressStep = ({ onNext, defaultAddresses }: AddressStepProps) => {
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const watchRegion = watch('region_id');
  const watchZone = watch('zone_id');

  useEffect(() => {
    api.get('/regions').then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    if (watchRegion) {
      api.get(`/regions/${watchRegion}/zones`).then(res => setZones(res.data));
      setSelectedRegion(watchRegion);
    }
  }, [watchRegion]);

  useEffect(() => {
    if (watchZone) {
      api.get(`/zones/${watchZone}/woredas`).then(res => setWoredas(res.data));
      setSelectedZone(watchZone);
    }
  }, [watchZone]);

  const onSubmit = (data: AddressFormData) => {
    if (useNewAddress) {
      // delivery_notes is already part of data, sent as { address: data }
      api.post('/addresses', { address: data }).then(res => {
        onNext({ address_id: res.data.id });
      });
    } else {
      onNext({ address_id: data.address_id });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block mb-2 font-medium">Choose an address</label>
        <div className="space-y-2">
          {defaultAddresses.map((addr) => (
            <label key={addr.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                {...register('address_id')}
                value={addr.id}
                onChange={() => setUseNewAddress(false)}
              />
              <span className="flex-1">{addr.full_address}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="address_option"
              checked={useNewAddress}
              onChange={() => setUseNewAddress(true)}
            />
            <span>Add a new address</span>
          </label>
        </div>
      </div>

      {useNewAddress && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block mb-1">Region</label>
            <select
              {...register('region_id')}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Region</option>
              {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errors.region_id && <p className="text-red-500 text-sm">{errors.region_id.message}</p>}
          </div>

          {selectedRegion && (
            <div>
              <label className="block mb-1">Zone/Subcity</label>
              <select
                {...register('zone_id')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Zone</option>
                {zones.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          )}

          {selectedZone && (
            <div>
              <label className="block mb-1">Woreda</label>
              <select
                {...register('woreda_id')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Woreda</option>
                {woredas.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block mb-1">Detailed address</label>
            <input
              {...register('address_line')}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Street, house number, etc."
            />
            {errors.address_line && <p className="text-red-500 text-sm">{errors.address_line.message}</p>}
          </div>

          <div>
            <label className="block mb-1">Landmark (optional)</label>
            <input
              {...register('landmark')}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Near ..."
            />
          </div>

          <div>
            <label className="block mb-1">Phone number *</label>
            <input
              {...register('phone')}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="09xxxxxxxx"
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block mb-1">Delivery Notes (optional)</label>
            <textarea
              {...register('delivery_notes')}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Blue gate, 2nd floor"
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_default')} />
            <span>Set as default address</span>
          </label>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700"
      >
        Continue to Delivery
      </button>
    </form>
  );
};

export default AddressStep;