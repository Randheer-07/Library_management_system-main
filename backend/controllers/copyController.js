const prisma = require('../config/db');

exports.createCopy = async (req, res, next) => {
  try {
    const { bookId, barcode, condition, shelfLocation } = req.body;
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const copy = await prisma.bookCopy.create({
      data: { bookId, barcode: barcode || `BC-${Date.now().toString(36).toUpperCase()}`, condition: condition || 'Good', shelfLocation },
    });

    await prisma.book.update({ where: { id: bookId }, data: { totalCopies: { increment: 1 }, availableCopies: { increment: 1 } } });

    res.status(201).json(copy);
  } catch (error) { next(error); }
};

exports.getCopies = async (req, res, next) => {
  try {
    const copies = await prisma.bookCopy.findMany({
      where: { bookId: req.params.bookId },
      include: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } }, include: { member: { include: { user: true } } } } },
      orderBy: { acquiredAt: 'desc' },
    });
    res.json(copies);
  } catch (error) { next(error); }
};

exports.updateCopy = async (req, res, next) => {
  try {
    const { condition, shelfLocation, status } = req.body;
    const copy = await prisma.bookCopy.update({
      where: { id: req.params.id },
      data: { condition, shelfLocation, status },
    });
    res.json(copy);
  } catch (error) { next(error); }
};

exports.deleteCopy = async (req, res, next) => {
  try {
    const copy = await prisma.bookCopy.findUnique({ where: { id: req.params.id }, include: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } });
    if (!copy) return res.status(404).json({ error: 'Copy not found' });
    if (copy.loans.length > 0) return res.status(400).json({ error: 'Cannot delete copy with active loans' });

    await prisma.bookCopy.delete({ where: { id: req.params.id } });
    await prisma.book.update({ where: { id: copy.bookId }, data: { totalCopies: { decrement: 1 }, availableCopies: { decrement: copy.status === 'AVAILABLE' ? 1 : 0 } } });

    res.json({ message: 'Copy deleted successfully' });
  } catch (error) { next(error); }
};
