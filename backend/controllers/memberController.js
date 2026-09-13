const prisma = require('../config/db');

exports.create = async (req, res, next) => {
  try {
    const { userId, address, dateOfBirth, maxLoans } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.member.findUnique({ where: { userId } });
    if (existing) return res.status(409).json({ error: 'User already has a member profile' });

    const member = await prisma.member.create({
      data: {
        userId,
        memberNumber: `MEM-${Date.now().toString(36).toUpperCase()}`,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        maxLoans: maxLoans || 5,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
    });
    res.status(201).json(member);
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { memberNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true } },
          _count: { select: { loans: true, reservations: true, fines: true } },
        },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where }),
    ]);
    res.json({ members, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, createdAt: true } },
        loans: { include: { book: true }, orderBy: { loanDate: 'desc' }, take: 20 },
        reservations: { include: { book: true }, orderBy: { reservedAt: 'desc' }, take: 10 },
        fines: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { address, dateOfBirth, maxLoans, isActive } = req.body;
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: {
        address, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        maxLoans: maxLoans ? parseInt(maxLoans) : undefined, isActive,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
    });
    res.json(member);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id }, include: { _count: { select: { loans: { where: { status: 'ACTIVE' } } } } } });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member._count.loans > 0) {
      return res.status(400).json({ error: 'Cannot delete member with active loans' });
    }
    await prisma.member.delete({ where: { id: req.params.id } });
    res.json({ message: 'Member deleted successfully' });
  } catch (error) { next(error); }
};

exports.getMemberStats = async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const [activeLoans, totalLoans, unpaidFines, reservations] = await Promise.all([
      prisma.loan.count({ where: { memberId: member.id, status: 'ACTIVE' } }),
      prisma.loan.count({ where: { memberId: member.id } }),
      prisma.fine.aggregate({ where: { memberId: member.id, status: 'UNPAID' }, _sum: { amount: true } }),
      prisma.reservation.count({ where: { memberId: member.id, status: 'PENDING' } }),
    ]);

    res.json({ activeLoans, totalLoans, unpaidFines: unpaidFines._sum.amount || 0, reservations, maxLoans: member.maxLoans });
  } catch (error) { next(error); }
};
