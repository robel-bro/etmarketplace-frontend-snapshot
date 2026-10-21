import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';

const toast = {
  success: (msg: string) => alert('✅ ' + msg),
  error: (msg: string) => alert('❌ ' + msg),
};

interface LegalPage {
  id: number;
  key: string;
  title: string;
  body: string;
  version: number;
  published: boolean;
}

export default function LegalPagesPage() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<LegalPage>>({
    key: '',
    title: '',
    body: '',
    published: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/legal_pages');
      setPages(res.data);
    } catch (err) {
      toast.error('Failed to load legal pages');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSave = async () => {
    if (!form.key || !form.title || !form.body) {
      return toast.error('Key, title, and body are required');
    }
    try {
      const payload = { ...form };
      if (editingId) {
        await axios.put(`/admin/legal_pages/${editingId}`, payload);
        toast.success('Page updated');
      } else {
        await axios.post('/admin/legal_pages', payload);
        toast.success('Page created');
      }
      setEditingId(null);
      setForm({ key: '', title: '', body: '', published: false });
      fetchPages();
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const handleEdit = (page: LegalPage) => {
    setForm({
      key: page.key,
      title: page.title,
      body: page.body,
      published: page.published,
    });
    setEditingId(page.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this page?')) return;
    try {
      await axios.delete(`/admin/legal_pages/${id}`);
      toast.success('Page deleted');
      fetchPages();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Legal Pages</h1>

      {/* Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Key</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.key || ''}
            onChange={e => setForm({ ...form, key: e.target.value })}
            placeholder="e.g., terms, privacy"
            disabled={editingId !== null} // key is immutable after creation
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.title || ''}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Page Title"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Body (HTML)</label>
          <textarea
            className="w-full border rounded px-3 py-2 font-mono text-sm"
            rows={12}
            value={form.body || ''}
            onChange={e => setForm({ ...form, body: e.target.value })}
            placeholder="<h2>...</h2><p>...</p>"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published || false}
              onChange={e => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>
        </div>
        <div className="flex gap-2 justify-end col-span-2">
          <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ key: '', title: '', body: '', published: false });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Key</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-center">Version</th>
              <th className="p-2 text-center">Published</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono text-sm">{p.key}</td>
                <td className="p-2">{p.title}</td>
                <td className="p-2 text-center">{p.version}</td>
                <td className="p-2 text-center">{p.published ? 'Yes' : 'No'}</td>
                <td className="p-2 text-center space-x-2">
                  <Button size="sm" onClick={() => handleEdit(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}