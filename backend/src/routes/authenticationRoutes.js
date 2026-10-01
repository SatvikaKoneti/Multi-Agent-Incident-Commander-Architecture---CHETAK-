import { Router } from 'express';
import { asyncHandler, AppError } from '../utils/index.js';
import { createUser, verifyPassword, signToken, publicUser, findOrCreateDemoUsers } from '../services/userAuthenticationService.js';
import { requireAuth } from '../middleware/jwtAuthenticationMiddleware.js';
import { get } from '../db/index.js';
import { audit } from '../services/incidentAuditLoggerService.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) throw new AppError(400, 'name, email and password are required.');
    const user = await createUser({ name, email, password, role: 'citizen' });
    audit({ userId: user.id, role: user.role, action: 'register', entityType: 'user', entityId: user.id, ip: req.ip });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError(400, 'email and password are required.');
    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new AppError(401, 'Invalid email or password.');
    }
    audit({ userId: user.id, role: user.role, action: 'login', entityType: 'user', entityId: user.id, ip: req.ip });
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = get('SELECT * FROM users WHERE id = ?', [req.user.uid]);
    if (!user) throw new AppError(404, 'User not found.');
    res.json({ user: publicUser(user) });
  }),
);

router.get(
  '/demo-users',
  asyncHandler(async (req, res) => {
    // Only reports the demo login hints (no secrets).
    res.json({
      citizens: [{ email: 'citizen@hyd.city', password: 'demo1234' }],
      planners: [{ email: 'planner@hyd.city', password: 'demo1234' }],
      authorities: [{ email: 'authority@hyd.city', password: 'demo1234' }],
    });
  }),
);

export default router;