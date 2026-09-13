const prisma = require('../config/db');

exports.create = async (req, res, next) => {
  try {
    const { title, isbn, description, publisher, publishYear, language, pageCount, coverImage, authorIds, categoryIds } = req.body;

    const book = await prisma.book.create({
      data: {
        title,
        isbn,
        description,
        publisher,
        publishYear: publishYear ? parseInt(publishYear) : null,
        language,
        pageCount: pageCount ? parseInt(pageCount) : null,
        coverImage,
        totalCopies: parseInt(req.body.totalCopies) || 1,
        availableCopies: parseInt(req.body.totalCopies) || 1,
        authors: authorIds?.length ? { create: authorIds.map(id => ({ authorId: id })) } : undefined,
        categories: categoryIds?.length ? { create: categoryIds.map(id => ({ categoryId: id })) } : undefined,
      },
      include: { authors: { include: { author: true } }, categories: { include: { category: true } } },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'Book', entityId: book.id, details: `Created book: ${title}` },
    });

    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, author, category, status, sort = 'createdAt', order = 'desc' } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (author) where.authors = { some: { authorId: author } };
    if (category) where.categories = { some: { categoryId: category } };

    const orderBy = { [sort]: order };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          authors: { include: { author: true } },
          categories: { include: { category: true } },
          copies: true,
        },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy,
      }),
      prisma.book.count({ where }),
    ]);

    res.json({ books, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        copies: { include: { loans: { where: { status: 'ACTIVE' }, include: { member: { include: { user: true } } } } } },
        loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } }, include: { member: { include: { user: true } } }, orderBy: { loanDate: 'desc' }, take: 10 },
        reservations: { where: { status: 'PENDING' }, include: { member: { include: { user: true } } } },
      },
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { title, isbn, description, publisher, publishYear, language, pageCount, coverImage, authorIds, categoryIds, totalCopies } = req.body;

    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const updateData = {
      title, isbn, description, publisher, language, coverImage,
      publishYear: publishYear ? parseInt(publishYear) : null,
      pageCount: pageCount ? parseInt(pageCount) : null,
    };

    if (totalCopies !== undefined) {
      const diff = parseInt(totalCopies) - book.totalCopies;
      updateData.totalCopies = parseInt(totalCopies);
      updateData.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    const updated = await prisma.book.update({
      where: { id: req.params.id },
      data: updateData,
      include: { authors: { include: { author: true } }, categories: { include: { category: true } } },
    });

    if (authorIds) {
      await prisma.bookAuthor.deleteMany({ where: { bookId: book.id } });
      if (authorIds.length) {
        await prisma.bookAuthor.createMany({ data: authorIds.map(id => ({ bookId: book.id, authorId: id })) });
      }
    }

    if (categoryIds) {
      await prisma.bookCategory.deleteMany({ where: { bookId: book.id } });
      if (categoryIds.length) {
        await prisma.bookCategory.createMany({ data: categoryIds.map(id => ({ bookId: book.id, categoryId: id })) });
      }
    }

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Book', entityId: book.id, details: `Updated book: ${title || book.title}` },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id }, include: { loans: { where: { status: 'ACTIVE' } } } });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.loans.length > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active loans' });
    }

    await prisma.book.delete({ where: { id: req.params.id } });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'DELETE', entity: 'Book', entityId: book.id, details: `Deleted book: ${book.title}` },
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalBooks, availableBooks, borrowedBooks, totalCopies, availableCopies] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { status: 'AVAILABLE' } }),
      prisma.book.count({ where: { status: 'BORROWED' } }),
      prisma.bookCopy.count(),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
    ]);

    res.json({ totalBooks, availableBooks, borrowedBooks, totalCopies, availableCopies });
  } catch (error) {
    next(error);
  }
};
