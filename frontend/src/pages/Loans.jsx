import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, ArrowRightLeft, RotateCcw, CornerDownLeft, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

export default function Loans() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ memberId: '', bookId: '', loanDays: '14' });
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.get('/loans', params);
      setLoans(data.loans);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchMeta = async () => {
    try {
      const [m, b] = await Promise.all([api.get('/members', { limit: 100 }), api.get('/books', { limit: 100 })]);
      setMembers(m.members || []);
      setBooks(b.books || []);
    } catch (e) {}
  };

  useEffect(() => { fetchMeta(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/loans', form);
      toast.success('Loan created');
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleReturn = async (loanId) => {
    try { await api.post(`/loans/${loanId}/return`); toast.success('Book returned'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleRenew = async (loanId) => {
    try { await api.post(`/loans/${loanId}/renew`); toast.success('Loan renewed'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const statusColor = (s) => ({
    ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    RETURNED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    RENEWED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loans</h1><p className="text-gray-500 text-sm mt-1">{total} loans</p></div>
        {canManage && <button onClick={() => { setForm({ memberId: '', bookId: '', loanDays: '14' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Loan</button>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input-field pl-10" placeholder="Search loans..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <select className="input-field w-full sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="OVERDUE">Overdue</option>
          <option value="RETURNED">Returned</option>
          <option value="RENEWED">Renewed</option>
        </select>
      </div>

      {loading ? <SkeletonTable rows={5} /> : loans.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No loans found" message="Create your first loan." action={canManage && <button onClick={() => setShowModal(true)} className="btn-primary">New Loan</button>} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Loan Date</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
                </tr></thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.book.title}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{l.member.user.firstName} {l.member.user.lastName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(l.loanDate), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${isPast(new Date(l.dueDate)) && l.status !== 'RETURNED' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {format(new Date(l.dueDate), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(l.status)}`}>{l.status}</span></td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {(l.status === 'ACTIVE' || l.status === 'OVERDUE' || l.status === 'RENEWED') && (
                              <>
                                <button onClick={() => handleReturn(l.id)} className="text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded flex items-center gap-1" title="Return"><CornerDownLeft className="w-3 h-3" /> Return</button>
                                {l.renewCount < l.maxRenewals && (
                                  <button onClick={() => handleRenew(l.id)} className="text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded flex items-center gap-1" title="Renew"><RotateCcw className="w-3 h-3" /> Renew</button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Loan">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Member *</label>
            <select className="input-field" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} required>
              <option value="">Select member...</option>
              {members.filter(m => m.isActive).map(m => <option key={m.id} value={m.id}>{m.user.firstName} {m.user.lastName} ({m.memberNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Book *</label>
            <select className="input-field" value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })} required>
              <option value="">Select book...</option>
              {books.filter(b => b.availableCopies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} avail)</option>)}
            </select>
          </div>
          <div>
            <label className="label">Loan Duration (days)</label>
            <input type="number" className="input-field" value={form.loanDays} onChange={e => setForm({ ...form, loanDays: e.target.value })} min="1" max="60" />
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Creating...' : 'Create Loan'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
