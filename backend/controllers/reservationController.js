const prisma = require('../config/db');
const { reservationDurationDays } = require('../config');

exports.create = async (req, res, next) => {
  try {
    const { memberId, bookId, notes } = req.body;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (book.availableCopies > 0) {
      return res.status(400).json({ error: 'Book is currently available - borrow it directly instead' });
    }

    const existing = await prisma.reservation.findFirst({
      where: { memberId, bookId, status: 'PENDING' },
    });
    if (existing) return res.status(409).json({ error: 'You already have a pending reservation for this book' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reservationDurationDays);

    const reservation = await prisma.reservation.create({
      data: { memberId, bookId, expiresAt, notes },
      include: { book: true, member: { include: { user: true } } },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'Reservation', entityId: reservation.id, details: `Reserved "${book.title}"` },
    });

    res.status(201).json(reservation);
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, memberId, bookId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (bookId) where.bookId = bookId;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          book: true,
          member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { reservedAt: 'desc' },
      }),
      prisma.reservation.count({ where }),
    ]);
    res.json({ reservations, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};

exports.fulfill = async (req, res, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (reservation.status !== 'PENDING') return res.status(400).json({ error: 'Reservation is not pending' });

    const book = await prisma.book.findUnique({ where: { id: reservation.bookId } });
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ error: 'No copies available to fulfill reservation' });
    }

    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: 'FULFILLED', fulfilledAt: new Date() },
      include: { book: true, member: { include: { user: true } } },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Reservation', entityId: reservation.id, details: `Fulfilled reservation for "${book.title}"` },
    });

    res.json(updated);
  } catch (error) { next(error); }
};

exports.cancel = async (req, res, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (reservation.status !== 'PENDING') return res.status(400).json({ error: 'Reservation is not pending' });

    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { book: true },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Reservation', entityId: reservation.id, details: `Cancelled reservation for "${updated.book.title}"` },
    });

    res.json(updated);
  } catch (error) { next(error); }
};
