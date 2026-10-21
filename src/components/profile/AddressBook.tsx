import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const AddressBook = () => {
  const queryClient = useQueryClient();
  const { data: addresses = [] } = useQuery('addresses', () => api.get('/addresses').then(r => r.data));
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ label: '', address: '', phone: '', delivery_notes: '' });

  const saveMutation = useMutation(
    (data: any) => editing?.id ? api.patch(`/addresses/${editing.id}`, { address: data }) : api.post('/addresses', { address: data }),
    { onSuccess: () => { queryClient.invalidateQueries('addresses'); setEditing(null); setForm({ label: '', address: '', phone: '', delivery_notes: '' }); } }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/addresses/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('addresses') }
  );

  const handleEdit = (addr: any) => {
    setEditing(addr);
    setForm({
      label: addr.label || '',
      address: addr.address_line || '',
      phone: addr.phone || '',
      delivery_notes: addr.delivery_notes || '',
    });
  };

  const handleSave = () => saveMutation.mutate({
    address_line: form.address,
    phone: form.phone,
    delivery_notes: form.delivery_notes,
  });

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">Address Book</h2>
      <div className="space-y-2">
        {addresses.map((addr: any) => (
          <div key={addr.id} className="flex justify-between items-center border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{addr.label || 'Address'}</p>
              <p className="text-sm text-gray-500">{addr.address_line}</p>
              <p className="text-sm text-gray-500">{addr.phone}</p>
              {addr.delivery_notes && (
                <p className="text-sm text-gray-400 italic">{addr.delivery_notes}</p>
              )}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => handleEdit(addr)} className="text-gray-500 hover:text-[var(--color-orange-500)]">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button onClick={() => deleteMutation.mutate(addr.id)} className="text-gray-500 hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!editing && (
        <button onClick={() => setEditing({})} className="mt-2 flex items-center gap-1 text-sm text-[var(--color-orange-500)] hover:underline">
          <PlusIcon className="w-4 h-4" /> Add New Address
        </button>
      )}

      {editing !== null && (
        <div className="mt-2 border rounded-lg p-3 space-y-2">
          <input type="text" placeholder="Label (e.g., Home)" value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg" />
          <input type="text" placeholder="Full address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg" />
          <input type="text" placeholder="Phone number" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg" />
          <textarea placeholder="Delivery notes (optional)" value={form.delivery_notes}
            onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg"
            rows={2} />
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-[var(--color-orange-500)] text-white px-3 py-2 rounded-lg text-sm">Save</button>
            <button onClick={() => setEditing(null)} className="border px-3 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressBook;