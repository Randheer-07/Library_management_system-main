import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Tags, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { EmptyState } from '../components/UIComponents';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Categories() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try { const data = await api.get('/categories'); setCategories(data); }
    catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editCat) { await api.put(`/categories/${editCat.id}`, form); toast.success('Category updated'); }
      else { await api.post('/categories', form); toast.success('Category created'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/categories/${deleteTarget.id}`); toast.success('Category deleted'); setDeleteTarget(null); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1><p className="text-gray-500 text-sm mt-1">{categories.length} categories</p></div>
        {canManage && <button onClick={() => { setEditCat(null); setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</button>}
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> :
        categories.length === 0 ? <EmptyState icon={Tags} title="No categories" message="Create your first category." /> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-2">{c._count?.books || 0} books &middot; {c._count?.children || 0} subcategories</p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditCat(c); setForm({ name: c.name, description: c.description || '' }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 className="w-4 h-4 text-gray-400" /></button>
                    <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      }

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editCat ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input-field" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Category" message={`Delete "${deleteTarget?.name}"?`} danger confirmLabel="Delete" />
    </div>
  );
}
