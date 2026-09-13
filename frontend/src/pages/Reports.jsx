import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SkeletonCard } from '../components/UIComponents';
import toast from 'react-hot-toast';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/reports').then(setData).catch(err => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6">{Array.from({length:3}).map((_,i)=><div key={i} className="card p-6"><SkeletonCard /></div>)}</div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load reports</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Library analytics and insights</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Loans', value: data.overview.totalLoans, icon: TrendingUp, color: 'bg-purple-500' },
          { label: 'Total Revenue', value: `$${data.overview.totalRevenue.toFixed(2)}`, icon: BarChart3, color: 'bg-green-500' },
          { label: 'Members', value: data.overview.totalMembers, icon: Users, color: 'bg-blue-500' },
          { label: 'Books', value: data.overview.totalBooks, icon: BookOpen, color: 'bg-amber-500' },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}><s.icon className="w-6 h-6 text-white" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Books */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Popular Books</h3>
          {data.popularBooks.length > 0 ? (
            <div className="space-y-3">
              {data.popularBooks.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.title}</p>
                    <p className="text-xs text-gray-500">{b.authors?.map(a => `${a.author.firstName} ${a.author.lastName}`).join(', ')}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">{b.loanCount} loans</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No data yet</p>}
        </div>

        {/* Active Members */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Active Members</h3>
          {data.activeMembers.length > 0 ? (
            <div className="space-y-3">
              {data.activeMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6">{i + 1}</span>
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">{m.member?.user.firstName?.[0]}{m.member?.user.lastName?.[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{m.member?.user.firstName} {m.member?.user.lastName}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">{m.loanCount} loans</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No data yet</p>}
        </div>
      </div>
    </div>
  );
}
