const router = require('express').Router();
const members = require('../controllers/memberController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), members.getAll);
router.get('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), members.getById);
router.get('/:id/stats', authenticate, authorize('ADMIN', 'LIBRARIAN'), members.getMemberStats);

router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), members.create);
router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), members.update);
router.delete('/:id', authenticate, authorize('ADMIN'), members.remove);

module.exports = router;
