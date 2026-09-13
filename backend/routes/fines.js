const router = require('express').Router();
const fines = require('../controllers/fineController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), fines.getAll);
router.get('/stats', authenticate, authorize('ADMIN', 'LIBRARIAN'), fines.getStats);

router.post('/:id/pay', authenticate, authorize('ADMIN', 'LIBRARIAN'), fines.pay);
router.post('/:id/waive', authenticate, authorize('ADMIN'), fines.waive);

module.exports = router;
