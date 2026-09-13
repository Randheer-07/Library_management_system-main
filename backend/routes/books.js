const router = require('express').Router();
const { body } = require('express-validator');
const books = require('../controllers/bookController');
const copies = require('../controllers/copyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.get('/stats', authenticate, books.getStats);

router.get('/', authenticate, books.getAll);
router.get('/:id', authenticate, books.getById);

router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), [
  body('title').trim().notEmpty(),
], validate, books.create);

router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), books.update);
router.delete('/:id', authenticate, authorize('ADMIN'), books.remove);

router.get('/:bookId/copies', authenticate, copies.getCopies);
router.post('/:bookId/copies', authenticate, authorize('ADMIN', 'LIBRARIAN'), copies.createCopy);
router.put('/copies/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), copies.updateCopy);
router.delete('/copies/:id', authenticate, authorize('ADMIN'), copies.deleteCopy);

module.exports = router;
