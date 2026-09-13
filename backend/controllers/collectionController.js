const prisma = require('../config/db');

exports.create = async (req, res, next) => {
  try {
    const { name, description, isPublic, coverImage, bookIds } = req.body;
    const collection = await prisma.collection.create({
      data: {
        name, description, isPublic: isPublic !== false, coverImage,
        books: bookIds?.length ? { create: bookIds.map(id => ({ bookId: id })) } : undefined,
      },
      include: { books: { include: { book: true } } },
    });
    res.status(201).json(collection);
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: { _count: { select: { books: true } } },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.collection.count({ where }),
    ]);
    res.json({ collections, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: req.params.id },
      include: { books: { include: { book: { include: { authors: { include: { author: true } }, categories: { include: { category: true } } } } } } },
    });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json(collection);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description, isPublic, coverImage, bookIds } = req.body;
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: { name, description, isPublic, coverImage },
    });
    if (bookIds) {
      await prisma.bookCollection.deleteMany({ where: { collectionId: collection.id } });
      if (bookIds.length) {
        await prisma.bookCollection.createMany({ data: bookIds.map(id => ({ collectionId: collection.id, bookId: id })) });
      }
    }
    res.json(collection);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.collection.delete({ where: { id: req.params.id } });
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) { next(error); }
};
