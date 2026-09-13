import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Edit2, Trash2, Calendar, Globe, Hash, Users, Tag, Copy } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    api.get(`/books/${id}`).then(setBook).catch(err => { toast.error('Book not found'); navigate('/books'); }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      navigate('/books');
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!book) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link to="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Books
      </Link>

      <div className="card p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 h-64 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-12 h-12 text-primary-500" />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {book.authors?.map(a => `${a.author.firstName} ${a.author.lastName}`).join(', ') || 'Unknown Author'}
                </p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                book.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                book.status === 'BORROWED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>{book.status}</span>
            </div>

            {book.description && <p className="text-gray-600 dark:text-gray-400 mt-4">{book.description}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Hash className="w-4 h-4" /> {book.isbn || 'No ISBN'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Globe className="w-4 h-4" /> {book.language || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" /> {book.publishYear || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Copy className="w-4 h-4" /> {book.availableCopies}/{book.totalCopies} available
              </div>
            </div>

            {book.categories?.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400" />
                {book.categories.map(c => (
                  <span key={c.category.id} className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-full">{c.category.name}</span>
                ))}
              </div>
            )}

            {canManage && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link to="/books" className="btn-secondary text-sm">Edit (from list)</Link>
                <button onClick={() => setShowDelete(true)} className="btn-danger text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copies */}
      {book.copies?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Copies ({book.copies.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 font-medium">Barcode</th>
                <th className="pb-2 font-medium">Condition</th>
                <th className="pb-2 font-medium">Location</th>
                <th className="pb-2 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {book.copies.map(copy => (
                  <tr key={copy.id} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2.5 font-mono text-xs">{copy.barcode}</td>
                    <td className="py-2.5">{copy.condition}</td>
                    <td className="py-2.5 text-gray-500">{copy.shelfLocation || 'N/A'}</td>
                    <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${copy.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{copy.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Loans */}
      {book.loans?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Loans</h2>
          <div className="space-y-3">
            {book.loans.map(loan => (
              <div key={loan.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{loan.member.user.firstName} {loan.member.user.lastName}</p>
                  <p className="text-xs text-gray-500">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${loan.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{loan.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Book" message={`Delete "${book.title}"? This cannot be undone.`} danger confirmLabel="Delete" />
    </div>
  );
}
