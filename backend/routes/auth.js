const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
], validate, auth.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, auth.login);

router.get('/profile', authenticate, auth.getProfile);
router.put('/profile', authenticate, auth.updateProfile);
router.put('/change-password', authenticate, auth.changePassword);

router.get('/users', authenticate, authorize('ADMIN'), auth.getAllUsers);
router.put('/users/:id/role', authenticate, authorize('ADMIN'), auth.updateUserRole);
router.put('/users/:id/toggle-active', authenticate, authorize('ADMIN'), auth.toggleUserActive);

module.exports = router;
