const prisma = require('../config/db');
const { calculateDueDate, generateBarcode } = require('../utils/helpers');
const { loanDurationDays, maxRenewals, finePerDay } = require('../config');

exports.createLoan = async (req, res, next) => {
  try {
    const { memberId, bookId, copyId, loanDays } = req.body;

    const member = await prisma.member.findUnique({ where: { id: memberId }, include: { _count: { select: { loans: { where: { status: 'ACTIVE' } } } } } });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (!member.isActive) return res.status(400).json({ error: 'Member account is inactive' });
    if (member._count.loans >= member.maxLoans) {
      return res.status(400).json({ error: `Member has reached maximum loans (${member.maxLoans})` });
    }

    const unpaidFines = await prisma.fine.aggregate({ where: { memberId, status: 'UNPAID' }, _sum: { amount: true } });
    if (unpaidFines._sum.amount > 0) {
      return res.status(400).json({ error: `Member has unpaid fines of $${unpaidFines._sum.amount.toFixed(2)}` });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.availableCopies <= 0) return res.status(400).json({ error: 'No copies available' });

    let copy;
    if (copyId) {
      copy = await prisma.bookCopy.findUnique({ where: { id: copyId } });
      if (!copy || copy.status !== 'AVAILABLE') {
        return res.status(400).json({ error: 'Selected copy is not available' });
      }
    } else {
      copy = await prisma.bookCopy.findFirst({ where: { bookId, status: 'AVAILABLE' } });
      if (!copy) return res.status(400).json({ error: 'No available copies found' });
    }

    const loanDate = new Date();
    const days = parseInt(loanDays) || loanDurationDays;
    const dueDate = calculateDueDate(loanDate, days);

    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          memberId, bookId, copyId: copy.id, loanDate, dueDate,
          maxRenewals: maxRenewals,
        },
        include: { book: true, member: { include: { user: true } }, copy: true },
      }),
      prisma.bookCopy.update({ where: { id: copy.id }, data: { status: 'BORROWED' } }),
      prisma.book.update({ where: { id: bookId }, data: { availableCopies: { decrement: 1 } } }),
    ]);

    if (book.availableCopies - 1 === 0) {
      await prisma.book.update({ where: { id: bookId }, data: { status: 'BORROWED' } });
    }

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'Loan', entityId: loan.id, details: `Loaned "${book.title}" to member` },
    });

    res.status(201).json(loan);
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, memberId, bookId, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (bookId) where.bookId = bookId;
    if (search) {
      where.OR = [
        { book: { title: { contains: search, mode: 'insensitive' } } },
        { member: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { member: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { member: { memberNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          book: true,
          member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          copy: true,
          fine: true,
        },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { loanDate: 'desc' },
      }),
      prisma.loan.count({ where }),
    ]);
    res.json({ loans, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: {
        book: { include: { authors: { include: { author: true } } } },
        member: { include: { user: true } },
        copy: true,
        fine: true,
      },
    });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (error) { next(error); }
};

exports.renewLoan = async (req, res, next) => {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') {
      return res.status(400).json({ error: 'Loan cannot be renewed' });
    }
    if (loan.renewCount >= loan.maxRenewals) {
      return res.status(400).json({ error: 'Maximum renewals reached' });
    }

    const hasReservations = await prisma.reservation.count({ where: { bookId: loan.bookId, status: 'PENDING' } });
    if (hasReservations > 0) {
      return res.status(400).json({ error: 'Cannot renew - book has pending reservations' });
    }

    const newDueDate = calculateDueDate(new Date(), loanDurationDays);
    const updated = await prisma.loan.update({
      where: { id: req.params.id },
      data: { dueDate: newDueDate, renewCount: { increment: 1 }, status: 'RENEWED' },
      include: { book: true, member: { include: { user: true } }, copy: true },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Loan', entityId: loan.id, details: `Renewed loan for "${updated.book.title}"` },
    });

    res.json(updated);
  } catch (error) { next(error); }
};

exports.returnBook = async (req, res, next) => {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id }, include: { book: true, copy: true } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status === 'RETURNED') return res.status(400).json({ error: 'Book already returned' });

    const returnDate = new Date();
    let fine = null;

    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: req.params.id },
        data: { returnDate, status: 'RETURNED' },
      }),
      prisma.bookCopy.update({ where: { id: loan.copyId }, data: { status: 'AVAILABLE' } }),
      prisma.book.update({ where: { id: loan.bookId }, data: { availableCopies: { increment: 1 } } }),
    ]);

    if (returnDate > loan.dueDate) {
      const diffTime = returnDate.getTime() - loan.dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const amount = diffDays * finePerDay;

      fine = await prisma.fine.create({
        data: {
          memberId: loan.memberId, loanId: loan.id, amount,
          reason: `Late return - ${diffDays} day(s) overdue ($${finePerDay}/day)`,
        },
      });
    }

    if (loan.book.status === 'BORROWED') {
      await prisma.book.update({ where: { id: loan.bookId }, data: { status: 'AVAILABLE' } });
    }

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Loan', entityId: loan.id, details: `Returned "${loan.book.title}"` },
    });

    res.json({ loan: updatedLoan, fine });
  } catch (error) { next(error); }
};

exports.getOverdue = async (req, res, next) => {
  try {
    const now = new Date();
    const loans = await prisma.loan.findMany({
      where: { status: { in: ['ACTIVE', 'OVERDUE', 'RENEWED'] }, dueDate: { lt: now } },
      include: {
        book: true,
        member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        copy: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    await prisma.loan.updateMany({
      where: { status: { in: ['ACTIVE', 'RENEWED'] }, dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    });

    res.json(loans);
  } catch (error) { next(error); }
};
