const router = require('express').Router();
const dashboard = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, dashboard.getDashboard);
router.get('/reports', authenticate, authorize('ADMIN', 'LIBRARIAN'), dashboard.getReports);
router.get('/activity', authenticate, authorize('ADMIN'), dashboard.getActivityLog);

module.exports = router;
