const router = require('express').Router();
const collections = require('../controllers/collectionController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, collections.getAll);
router.get('/:id', authenticate, collections.getById);

router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), collections.create);
router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), collections.update);
router.delete('/:id', authenticate, authorize('ADMIN'), collections.remove);

module.exports = router;
