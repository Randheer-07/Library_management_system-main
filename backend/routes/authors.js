const router = require('express').Router();
const { body } = require('express-validator');
const authors = require('../controllers/authorController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.get('/', authenticate, authors.getAll);
router.get('/:id', authenticate, authors.getById);

router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
], validate, authors.create);

router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), authors.update);
router.delete('/:id', authenticate, authorize('ADMIN'), authors.remove);

module.exports = router;
