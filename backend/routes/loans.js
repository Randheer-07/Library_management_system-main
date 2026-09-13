const router = require('express').Router();
const loans = require('../controllers/loanController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, loans.getAll);
router.get('/overdue', authenticate, loans.getOverdue);
router.get('/:id', authenticate, loans.getById);

router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), loans.createLoan);
router.post('/:id/renew', authenticate, authorize('ADMIN', 'LIBRARIAN'), loans.renewLoan);
router.post('/:id/return', authenticate, authorize('ADMIN', 'LIBRARIAN'), loans.returnBook);

module.exports = router;
