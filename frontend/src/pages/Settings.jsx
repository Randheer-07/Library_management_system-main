import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Settings as SettingsIcon, Users, Activity } from 'lucide-react';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    Promise.all([
      api.get('/auth/users', { limit: 50 }),
      api.get('/dashboard/activity', { limit: 30 }),
    ]).then(([u, a]) => {
      setUsers(u.users || []);
      setActivity(a.logs || []);
    }).catch(err => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try { await api.put(`/auth/users/${userId}/role`, { role: newRole }); toast.success('Role updated'); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u)); }
    catch (err) { toast.error(err.message); }
  };

  const handleToggleActive = async (userId) => {
    try { const updated = await api.put(`/auth/users/${userId}/toggle-active`); toast.success('User updated'); setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: updated.isActive } : u)); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage users and view activity</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Users</button>
        <button onClick={() => setTab('activity')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'activity' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Activity Log</button>
      </div>

      {loading ? <SkeletonTable rows={5} /> : (
        <>
          {tab === 'users' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                            <option value="ADMIN">Admin</option>
                            <option value="LIBRARIAN">Librarian</option>
                            <option value="MEMBER">Member</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleActive(u.id)} className={`text-xs px-2 py-1 rounded ${u.isActive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div className="card p-6">
              {activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.map(log => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                      <Activity className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{log.user.firstName} {log.user.lastName}</span>
                          {' '}<span className="text-gray-500">{log.action.toLowerCase()}</span>{' '}
                          <span className="text-primary-600">{log.entity}</span>
                          {log.details && <span className="text-gray-500"> - {log.details}</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Activity} title="No activity yet" message="Activity will appear here." />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
