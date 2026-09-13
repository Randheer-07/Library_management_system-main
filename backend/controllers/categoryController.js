const prisma = require('../config/db');

exports.create = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;
    const category = await prisma.category.create({
      data: { name, description, parentId: parentId || null },
    });
    res.status(201).json(category);
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { books: true, children: true } }, parent: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { books: { include: { book: { include: { authors: { include: { author: true } } } } } }, children: true, parent: true },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, parentId: parentId || null },
    });
    res.json(category);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id }, include: { _count: { select: { books: true, children: true } } } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (category._count.books > 0) {
      return res.status(400).json({ error: 'Cannot delete category with associated books' });
    }
    if (category._count.children > 0) {
      return res.status(400).json({ error: 'Cannot delete category with subcategories' });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) { next(error); }
};
