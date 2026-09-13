const prisma = require('../config/db');

exports.create = async (req, res, next) => {
  try {
    const { firstName, lastName, biography, birthDate, deathDate, nationality, avatar } = req.body;
    const author = await prisma.author.create({
      data: { firstName, lastName, biography, birthDate: birthDate ? new Date(birthDate) : null, deathDate: deathDate ? new Date(deathDate) : null, nationality, avatar },
    });
    res.status(201).json(author);
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [authors, total] = await Promise.all([
      prisma.author.findMany({
        where,
        include: { _count: { select: { books: true } } },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { lastName: 'asc' },
      }),
      prisma.author.count({ where }),
    ]);
    res.json({ authors, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const author = await prisma.author.findUnique({
      where: { id: req.params.id },
      include: { books: { include: { book: { include: { categories: { include: { category: true } } } } } } },
    });
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { firstName, lastName, biography, birthDate, deathDate, nationality, avatar } = req.body;
    const author = await prisma.author.update({
      where: { id: req.params.id },
      data: { firstName, lastName, biography, birthDate: birthDate ? new Date(birthDate) : undefined, deathDate: deathDate ? new Date(deathDate) : undefined, nationality, avatar },
    });
    res.json(author);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const author = await prisma.author.findUnique({ where: { id: req.params.id }, include: { _count: { select: { books: true } } } });
    if (!author) return res.status(404).json({ error: 'Author not found' });
    if (author._count.books > 0) {
      return res.status(400).json({ error: 'Cannot delete author with associated books' });
    }
    await prisma.author.delete({ where: { id: req.params.id } });
    res.json({ message: 'Author deleted successfully' });
  } catch (error) { next(error); }
};
