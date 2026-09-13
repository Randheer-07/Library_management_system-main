import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { DollarSign, CheckCircle, XCircle } from 'lucide-react';
import Pagination from '../components/Pagination';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const [finesData, statsData] = await Promise.all([api.get('/fines', params), api.get('/fines/stats')]);
      setFines(finesData.fines);
      setTotal(finesData.total);
      setTotalPages(finesData.totalPages);
      setStats(statsData);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async (id) => {
    try { await api.post(`/fines/${id}/pay`); toast.success('Fine marked as paid'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleWaive = async (id) => {
    try { await api.post(`/fines/${id}/waive`); toast.success('Fine waived'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const statusColor = (s) => ({
    UNPAID: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    WAIVED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }[s]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fines</h1>
        <p className="text-gray-500 text-sm mt-1">Manage fines and payments</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Fines', value: `$${stats.total.amount.toFixed(2)}`, count: stats.total.count, color: 'bg-gray-500' },
            { label: 'Unpaid', value: `$${stats.unpaid.amount.toFixed(2)}`, count: stats.unpaid.count, color: 'bg-red-500' },
            { label: 'Paid', value: `$${stats.paid.amount.toFixed(2)}`, count: stats.paid.count, color: 'bg-green-500' },
            { label: 'Waived', value: `$${stats.waived.amount.toFixed(2)}`, count: stats.waived.count, color: 'bg-gray-400' },
          ].map((s, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}><DollarSign className="w-5 h-5 text-white" /></div>
                <div><p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500">{s.label} ({s.count})</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <select className="input-field w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
        <option value="">All Status</option>
        <option value="UNPAID">Unpaid</option>
        <option value="PAID">Paid</option>
        <option value="WAIVED">Waived</option>
      </select>

      {loading ? <SkeletonTable rows={5} /> : fines.length === 0 ? (
        <EmptyState icon={DollarSign} title="No fines" message="No fines recorded yet." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {fines.map(f => (
                    <tr key={f.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{f.member.user.firstName} {f.member.user.lastName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{f.loan?.book?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{f.reason}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${f.amount.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(f.status)}`}>{f.status}</span></td>
                      <td className="px-4 py-3">
                        {f.status === 'UNPAID' && (
                          <div className="flex gap-1">
                            <button onClick={() => handlePay(f.id)} className="text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Pay</button>
                            <button onClick={() => handleWaive(f.id)} className="text-xs text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-1"><XCircle className="w-3 h-3" /> Waive</button>
                          </div>
                        )}
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
    </div>
  );
}
