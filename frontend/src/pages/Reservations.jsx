import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Bookmark, Check, X, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Reservations() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [reservations, setReservations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ memberId: '', bookId: '' });
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const data = await api.get('/reservations', params);
      setReservations(data.reservations);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

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
    try { await api.post('/reservations', form); toast.success('Reservation placed'); setShowModal(false); fetchData(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleFulfill = async (id) => {
    try { await api.post(`/reservations/${id}/fulfill`); toast.success('Reservation fulfilled'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleCancel = async (id) => {
    try { await api.post(`/reservations/${id}/cancel`); toast.success('Reservation cancelled'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const statusColor = (s) => ({
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    FULFILLED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1><p className="text-gray-500 text-sm mt-1">{total} reservations</p></div>
        <button onClick={() => { setForm({ memberId: '', bookId: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Reservation</button>
      </div>

      <select className="input-field w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="FULFILLED">Fulfilled</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      {loading ? <SkeletonTable rows={5} /> : reservations.length === 0 ? (
        <EmptyState icon={Bookmark} title="No reservations" message="Place a reservation for books that are currently unavailable." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Reserved</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.book.title}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.member.user.firstName} {r.member.user.lastName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(r.reservedAt), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(r.expiresAt), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status === 'PENDING' && canManage && (
                            <button onClick={() => handleFulfill(r.id)} className="text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded flex items-center gap-1"><Check className="w-3 h-3" /> Fulfill</button>
                          )}
                          {r.status === 'PENDING' && (
                            <button onClick={() => handleCancel(r.id)} className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Reservation">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Member *</label>
            <select className="input-field" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} required>
              <option value="">Select member...</option>
              {members.filter(m => m.isActive).map(m => <option key={m.id} value={m.id}>{m.user.firstName} {m.user.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Book *</label>
            <select className="input-field" value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })} required>
              <option value="">Select book...</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} avail)</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Placing...' : 'Place Reservation'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
