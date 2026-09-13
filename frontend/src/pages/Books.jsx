import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Filter, BookOpen, Edit2, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { SkeletonTable, EmptyState } from '../components/UIComponents';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Books() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'LIBRARIAN'].includes(user?.role);
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState({ title: '', isbn: '', description: '', publisher: '', publishYear: '', language: 'English', pageCount: '', totalCopies: '1' });
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.get('/books', params);
      setBooks(data.books);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const fetchMeta = async () => {
    try {
      const [a, c] = await Promise.all([api.get('/authors', { limit: 100 }), api.get('/categories', { limit: 100 })]);
      setAuthors(a.authors || []);
      setCategories(c || []);
    } catch (e) {}
  };

  useEffect(() => { fetchMeta(); }, []);

  const openCreate = () => {
    setEditBook(null);
    setForm({ title: '', isbn: '', description: '', publisher: '', publishYear: '', language: 'English', pageCount: '', totalCopies: '1' });
    setSelectedAuthors([]);
    setSelectedCategories([]);
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({
      title: book.title, isbn: book.isbn || '', description: book.description || '',
      publisher: book.publisher || '', publishYear: book.publishYear || '', language: book.language || 'English',
      pageCount: book.pageCount || '', totalCopies: book.totalCopies || '1',
    });
    setSelectedAuthors(book.authors?.map(a => a.author.id) || []);
    setSelectedCategories(book.categories?.map(c => c.category.id) || []);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, authorIds: selectedAuthors, categoryIds: selectedCategories };
      if (editBook) {
        await api.put(`/books/${editBook.id}`, body);
        toast.success('Book updated');
      } else {
        await api.post('/books', body);
        toast.success('Book created');
      }
      setShowModal(false);
      fetchBooks();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/books/${deleteTarget.id}`);
      toast.success('Book deleted');
      setDeleteTarget(null);
      fetchBooks();
    } catch (err) { toast.error(err.message); }
  };

  const toggleAuthor = (id) => setSelectedAuthors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleCategory = (id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Books</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} books in collection</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search books..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-full sm:w-48" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BORROWED">Borrowed</option>
          <option value="RESERVED">Reserved</option>
        </select>
      </div>

      {/* Book Grid */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : books.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books found" message="Add your first book to get started." action={canManage && <button onClick={openCreate} className="btn-primary">Add Book</button>} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map(book => (
              <Link key={book.id} to={`/books/${book.id}`} className="card p-4 hover:shadow-md transition-all group">
                <div className="flex gap-3">
                  <div className="w-14 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{book.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.authors?.map(a => `${a.author.firstName} ${a.author.lastName}`).join(', ') || 'Unknown Author'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        book.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        book.status === 'BORROWED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>{book.availableCopies}/{book.totalCopies} avail</span>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={(e) => { e.preventDefault(); openEdit(book); }} className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                    <button onClick={(e) => { e.preventDefault(); setDeleteTarget(book); }} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editBook ? 'Edit Book' : 'Add New Book'} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">ISBN</label>
              <input className="input-field" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
            </div>
            <div>
              <label className="label">Publisher</label>
              <input className="input-field" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} />
            </div>
            <div>
              <label className="label">Publish Year</label>
              <input type="number" className="input-field" value={form.publishYear} onChange={e => setForm({ ...form, publishYear: e.target.value })} />
            </div>
            <div>
              <label className="label">Language</label>
              <input className="input-field" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} />
            </div>
            <div>
              <label className="label">Pages</label>
              <input type="number" className="input-field" value={form.pageCount} onChange={e => setForm({ ...form, pageCount: e.target.value })} />
            </div>
            <div>
              <label className="label">Total Copies</label>
              <input type="number" className="input-field" value={form.totalCopies} onChange={e => setForm({ ...form, totalCopies: e.target.value })} min="1" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Authors</label>
            <div className="flex flex-wrap gap-2">
              {authors.map(a => (
                <button key={a.id} type="button" onClick={() => toggleAuthor(a.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedAuthors.includes(a.id) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'}`}>
                  {a.firstName} {a.lastName}
                </button>
              ))}
              {authors.length === 0 && <p className="text-sm text-gray-400">No authors available</p>}
            </div>
          </div>

          <div>
            <label className="label">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCategories.includes(c.id) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : editBook ? 'Update Book' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Book" message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`} danger confirmLabel="Delete" />
    </div>
  );
}
