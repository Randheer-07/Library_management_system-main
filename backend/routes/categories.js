const router = require('express').Router();
const { body } = require('express-validator');
const categories = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.get('/', authenticate, categories.getAll);
router.get('/:id', authenticate, categories.getById);

router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), [
  body('name').trim().notEmpty(),
], validate, categories.create);

router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), categories.update);
router.delete('/:id', authenticate, authorize('ADMIN'), categories.remove);

module.exports = router;
