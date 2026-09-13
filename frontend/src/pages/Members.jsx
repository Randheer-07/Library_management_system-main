import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Search, Plus, UserCheck, Edit2, Mail, Phone } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import toast from 'react-hot-toast';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: '', address: '', maxLoans: '5' });
  const [users, setUsers] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/members', { page, limit: 12, search });
      setMembers(data.members);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/auth/users', { limit: 100 });
      setUsers(data.users?.filter(u => u.role === 'MEMBER') || []);
    } catch (e) {}
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/members', form);
      toast.success('Member created');
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Members</h1><p className="text-gray-500 text-sm mt-1">{total} members</p></div>
        <button onClick={() => { setForm({ userId: '', address: '', maxLoans: '5' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Member</button>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input-field pl-10" placeholder="Search members..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>

      {loading ? <SkeletonTable rows={5} /> : members.length === 0 ? (
        <EmptyState icon={UserCheck} title="No members found" message="Add your first member." action={<button onClick={() => setShowModal(true)} className="btn-primary">Add Member</button>} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Member #</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Loans</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">{m.user.firstName[0]}{m.user.lastName[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{m.user.firstName} {m.user.lastName}</p>
                            <p className="text-xs text-gray-500">{m.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{m.memberNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{m.user.phone || '-'}</td>
                      <td className="px-4 py-3"><span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{m._count?.loans || 0}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${m.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Member">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Select User *</label>
            <select className="input-field" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} required>
              <option value="">Choose a user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
            </select>
          </div>
          <div><label className="label">Address</label><input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">Max Loans</label><input type="number" className="input-field" value={form.maxLoans} onChange={e => setForm({ ...form, maxLoans: e.target.value })} min="1" /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
