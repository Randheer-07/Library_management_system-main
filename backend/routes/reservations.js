const router = require('express').Router();
const reservations = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, reservations.getAll);

router.post('/', authenticate, reservations.create);
router.post('/:id/fulfill', authenticate, authorize('ADMIN', 'LIBRARIAN'), reservations.fulfill);
router.post('/:id/cancel', authenticate, reservations.cancel);

module.exports = router;
