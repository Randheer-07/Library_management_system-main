import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderOpen, Edit2, Trash2, BookOpen } from 'lucide-react';
import Modal from '../components/Modal';
import { EmptyState } from '../components/UIComponents';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Collections() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editColl, setEditColl] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try { const data = await api.get('/collections'); setCollections(data.collections || []); }
    catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editColl) { await api.put(`/collections/${editColl.id}`, form); toast.success('Collection updated'); }
      else { await api.post('/collections', form); toast.success('Collection created'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/collections/${deleteTarget.id}`); toast.success('Collection deleted'); setDeleteTarget(null); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const colors = ['from-blue-100 to-blue-200', 'from-purple-100 to-purple-200', 'from-pink-100 to-pink-200', 'from-emerald-100 to-emerald-200', 'from-amber-100 to-amber-200'];
  const darkColors = ['from-blue-900/30 to-blue-800/30', 'from-purple-900/30 to-purple-800/30', 'from-pink-900/30 to-pink-800/30', 'from-emerald-900/30 to-emerald-800/30', 'from-amber-900/30 to-amber-800/30'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1><p className="text-gray-500 text-sm mt-1">{collections.length} collections</p></div>
        {canManage && <button onClick={() => { setEditColl(null); setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Collection</button>}
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> :
        collections.length === 0 ? <EmptyState icon={FolderOpen} title="No collections" message="Create curated book collections." /> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((c, i) => (
            <div key={c.id} className="card overflow-hidden hover:shadow-lg transition-all group">
              <div className={`h-24 bg-gradient-to-br ${colors[i % colors.length]} dark:${darkColors[i % darkColors.length]} flex items-center justify-center`}>
                <FolderOpen className="w-10 h-10 text-gray-600/40 dark:text-gray-300/40" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{c.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{c.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c._count?.books || 0} books</span>
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditColl(c); setForm({ name: c.name, description: c.description || '' }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 className="w-4 h-4 text-gray-400" /></button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editColl ? 'Edit Collection' : 'Add Collection'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Name *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input-field" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Collection" message={`Delete "${deleteTarget?.name}"?`} danger confirmLabel="Delete" />
    </div>
  );
}
