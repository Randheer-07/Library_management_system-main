const prisma = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, memberId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;

    const [fines, total] = await Promise.all([
      prisma.fine.findMany({
        where,
        include: {
          member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          loan: { include: { book: true } },
        },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fine.count({ where }),
    ]);
    res.json({ fines, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};

exports.pay = async (req, res, next) => {
  try {
    const fine = await prisma.fine.findUnique({ where: { id: req.params.id } });
    if (!fine) return res.status(404).json({ error: 'Fine not found' });
    if (fine.status === 'PAID') return res.status(400).json({ error: 'Fine already paid' });

    const updated = await prisma.fine.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { member: { include: { user: true } }, loan: { include: { book: true } } },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Fine', entityId: fine.id, details: `Fine of $${fine.amount.toFixed(2)} paid` },
    });

    res.json(updated);
  } catch (error) { next(error); }
};

exports.waive = async (req, res, next) => {
  try {
    const fine = await prisma.fine.findUnique({ where: { id: req.params.id } });
    if (!fine) return res.status(404).json({ error: 'Fine not found' });
    if (fine.status === 'WAIVED') return res.status(400).json({ error: 'Fine already waived' });

    const updated = await prisma.fine.update({
      where: { id: req.params.id },
      data: { status: 'WAIVED', waivedAt: new Date(), waivedBy: req.user.id },
      include: { member: { include: { user: true } }, loan: { include: { book: true } } },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE', entity: 'Fine', entityId: fine.id, details: `Fine of $${fine.amount.toFixed(2)} waived` },
    });

    res.json(updated);
  } catch (error) { next(error); }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalFines, unpaidFines, paidFines, waivedFines] = await Promise.all([
      prisma.fine.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.fine.aggregate({ where: { status: 'UNPAID' }, _sum: { amount: true }, _count: true }),
      prisma.fine.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: true }),
      prisma.fine.aggregate({ where: { status: 'WAIVED' }, _sum: { amount: true }, _count: true }),
    ]);

    res.json({
      total: { count: totalFines._count, amount: totalFines._sum.amount || 0 },
      unpaid: { count: unpaidFines._count, amount: unpaidFines._sum.amount || 0 },
      paid: { count: paidFines._count, amount: paidFines._sum.amount || 0 },
      waived: { count: waivedFines._count, amount: waivedFines._sum.amount || 0 },
    });
  } catch (error) { next(error); }
};
