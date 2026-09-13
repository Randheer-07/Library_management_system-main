const prisma = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalBooks, totalMembers, activeLoans, overdueLoans,
      pendingReservations, unpaidFines, totalAuthors, totalCategories,
      recentLoans, recentMembers, overdueList,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.member.count({ where: { isActive: true } }),
      prisma.loan.count({ where: { status: { in: ['ACTIVE', 'RENEWED', 'OVERDUE'] } } }),
      prisma.loan.count({ where: { status: 'OVERDUE' } }),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.fine.aggregate({ where: { status: 'UNPAID' }, _sum: { amount: true }, _count: true }),
      prisma.author.count(),
      prisma.category.count(),
      prisma.loan.findMany({
        include: { book: true, member: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { loanDate: 'desc' }, take: 10,
      }),
      prisma.member.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' }, take: 5,
      }),
      prisma.loan.findMany({
        where: { status: { in: ['ACTIVE', 'OVERDUE', 'RENEWED'] }, dueDate: { lt: sevenDaysFromNow } },
        include: { book: true, member: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
        orderBy: { dueDate: 'asc' }, take: 10,
      }),
    ]);

    const booksByStatus = await prisma.book.groupBy({ by: ['status'], _count: true });

    const monthlyLoans = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "loanDate") as month, COUNT(*)::int as count
      FROM loans
      WHERE "loanDate" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('month', "loanDate")
      ORDER BY month DESC
      LIMIT 6
    `;

    const topBooks = await prisma.loan.groupBy({
      by: ['bookId'],
      _count: true,
      orderBy: { _count: { bookId: 'desc' } },
      take: 5,
    });

    const topBookDetails = await Promise.all(
      topBooks.map(async (t) => {
        const book = await prisma.book.findUnique({ where: { id: t.bookId }, select: { id: true, title: true, coverImage: true } });
        return { ...book, loanCount: t._count };
      })
    );

    res.json({
      stats: {
        totalBooks, totalMembers, activeLoans, overdueLoans,
        pendingReservations, unpaidFinesAmount: unpaidFines._sum.amount || 0,
        unpaidFinesCount: unpaidFines._count || 0,
        totalAuthors, totalCategories,
      },
      recentLoans,
      recentMembers,
      overdueList,
      booksByStatus,
      monthlyLoans,
      topBooks: topBookDetails,
    });
  } catch (error) { next(error); }
};

exports.getReports = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [loanStats, fineStats, memberStats, bookStats] = await Promise.all([
      prisma.loan.aggregate({ _count: true }),
      prisma.fine.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'PAID' } }),
      prisma.member.count(),
      prisma.book.count(),
    ]);

    const popularBooks = await prisma.loan.groupBy({
      by: ['bookId'], _count: true,
      orderBy: { _count: { bookId: 'desc' } }, take: 10,
    });

    const popularBookDetails = await Promise.all(
      popularBooks.map(async (t) => {
        const book = await prisma.book.findUnique({ where: { id: t.bookId } });
        return { ...book, loanCount: t._count };
      })
    );

    const activeMembers = await prisma.loan.groupBy({
      by: ['memberId'], _count: true,
      orderBy: { _count: { memberId: 'desc' } }, take: 10,
    });

    const activeMemberDetails = await Promise.all(
      activeMembers.map(async (t) => {
        const member = await prisma.member.findUnique({ where: { id: t.memberId }, include: { user: { select: { firstName: true, lastName: true } } } });
        return { member, loanCount: t._count };
      })
    );

    res.json({
      overview: {
        totalLoans: loanStats._count,
        totalRevenue: fineStats._sum.amount || 0,
        totalMembers: memberStats,
        totalBooks: bookStats,
      },
      popularBooks: popularBookDetails,
      activeMembers: activeMemberDetails,
    });
  } catch (error) { next(error); }
};

exports.getActivityLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        include: { user: { select: { firstName: true, lastName: true } } },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count(),
    ]);
    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};
