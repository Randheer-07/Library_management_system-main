import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Users, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function Authors() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [authors, setAuthors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAuthor, setEditAuthor] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', biography: '', nationality: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      const data = await api.get('/authors', params);
      setAuthors(data.authors);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editAuthor) { await api.put(`/authors/${editAuthor.id}`, form); toast.success('Author updated'); }
      else { await api.post('/authors', form); toast.success('Author created'); }
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/authors/${deleteTarget.id}`); toast.success('Author deleted'); setDeleteTarget(null); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const openCreate = () => { setEditAuthor(null); setForm({ firstName: '', lastName: '', biography: '', nationality: '' }); setShowModal(true); };
  const openEdit = (a) => { setEditAuthor(a); setForm({ firstName: a.firstName, lastName: a.lastName, biography: a.biography || '', nationality: a.nationality || '' }); setShowModal(true); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Authors</h1><p className="text-gray-500 text-sm mt-1">{total} authors</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Author</button>}
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input-field pl-10" placeholder="Search authors..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>

      {loading ? <SkeletonTable rows={5} /> : authors.length === 0 ? (
        <EmptyState icon={Users} title="No authors found" message="Add your first author." action={canManage && <button onClick={openCreate} className="btn-primary">Add Author</button>} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {authors.map(a => (
              <div key={a.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{a.firstName[0]}{a.lastName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{a.firstName} {a.lastName}</h3>
                    <p className="text-xs text-gray-500">{a.nationality || 'N/A'} &middot; {a._count?.books || 0} books</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => openEdit(a)} className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                    <button onClick={() => setDeleteTarget(a)} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editAuthor ? 'Edit Author' : 'Add Author'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name *</label><input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div><label className="label">Last Name *</label><input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          <div><label className="label">Nationality</label><input className="input-field" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
          <div><label className="label">Biography</label><textarea className="input-field" rows="3" value={form.biography} onChange={e => setForm({ ...form, biography: e.target.value })} /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Author" message={`Delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"?`} danger confirmLabel="Delete" />
    </div>
  );
}
