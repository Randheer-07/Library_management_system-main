import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { BookOpen, Users, ArrowRightLeft, AlertTriangle, DollarSign, Bookmark, TrendingUp } from 'lucide-react';
import { SkeletonCard } from '../components/UIComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid gap-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="card p-6"><SkeletonCard /></div>)}</div></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load dashboard</div>;

  const stats = [
    { label: 'Total Books', value: data.stats.totalBooks, icon: BookOpen, color: 'bg-blue-500', link: '/books' },
    { label: 'Active Members', value: data.stats.totalMembers, icon: Users, color: 'bg-emerald-500', link: '/members' },
    { label: 'Active Loans', value: data.stats.activeLoans, icon: ArrowRightLeft, color: 'bg-purple-500', link: '/loans' },
    { label: 'Overdue', value: data.stats.overdueLoans, icon: AlertTriangle, color: 'bg-red-500', link: '/loans' },
    { label: 'Pending Reservations', value: data.stats.pendingReservations, icon: Bookmark, color: 'bg-amber-500', link: '/reservations' },
    { label: 'Unpaid Fines', value: `$${data.stats.unpaidFinesAmount.toFixed(2)}`, icon: DollarSign, color: 'bg-rose-500', link: '/fines' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of your library</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <Link key={i} to={s.link} className="card p-4 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Books by Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Books by Status</h3>
          {data.booksByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.booksByStatus.map(b => ({ name: b.status, value: b._count }))} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.booksByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm">No data</p>}
        </div>

        {/* Top Books */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Borrowed Books</h3>
          {data.topBooks.length > 0 ? (
            <div className="space-y-3">
              {data.topBooks.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-full">{b.loanCount} loans</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No loan data yet</p>}
        </div>

        {/* Recent Loans */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Loans</h3>
            <Link to="/loans" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {data.recentLoans.length > 0 ? (
            <div className="space-y-3">
              {data.recentLoans.slice(0, 5).map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{l.book.title}</p>
                    <p className="text-xs text-gray-500">{l.member.user.firstName} {l.member.user.lastName}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    l.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    l.status === 'OVERDUE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No loans yet</p>}
        </div>

        {/* Overdue Books */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overdue Books</h3>
            <Link to="/loans" className="text-sm text-red-600 hover:text-red-700">View all</Link>
          </div>
          {data.overdueList.length > 0 ? (
            <div className="space-y-3">
              {data.overdueList.slice(0, 5).map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{l.book.title}</p>
                    <p className="text-xs text-gray-500">{l.member.user.firstName} {l.member.user.lastName}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium">Due {new Date(l.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No overdue books!</p>}
        </div>
      </div>
    </div>
  );
}
