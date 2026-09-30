import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../utils/index.js';
import { get, run } from '../db/index.js';
import { nowIso } from '../utils/index.js';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { uid: user.id, email: user.email, role: user.role, authority_code: user.authority_code || null },
    config.auth.secret,
    { expiresIn: config.auth.expiresIn },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.auth.secret);
  } catch {
    throw new AppError(401, 'Invalid or expired session. Please sign in again.');
  }
}

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    authority_code: u.authority_code || null,
  };
}

export async function createUser({ name, email, password, role, authorityCode }) {
  const existing = get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) throw new AppError(409, 'An account with this email already exists.');
  const hash = await hashPassword(password);
  run(
    `INSERT INTO users (name, email, password_hash, role, authority_code)
     VALUES ($name, $email, $hash, $role, $authority)`,
    {
      $name: name,
      $email: email,
      $hash: hash,
      $role: role,
      $authority: authorityCode || null,
    },
  );
  const id = get('SELECT last_insert_rowid() AS id').id;
  return get('SELECT * FROM users WHERE id = ?', [id]);
}

export async function findOrCreateDemoUsers() {
  const demoUsers = [
    { name: 'Citizen Demo', email: 'citizen@hyd.city', password: 'demo1234', role: 'citizen' },
    { name: 'Planner Demo', email: 'planner@hyd.city', password: 'demo1234', role: 'planner' },
    { name: 'Authority Demo (TSSPDCL)', email: 'authority@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'TSSPDCL' },
    { name: 'TSSPDCL Power Distribution', email: 'authority.tsspdcl@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'TSSPDCL' },
    { name: 'GHMC Municipal Infrastructure', email: 'authority.ghmc@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'GHMC' },
    { name: 'Hyderabad Traffic Police (HTP)', email: 'authority.htp@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'HTP' },
    { name: 'Telangana Pollution Control Board (TSPCB)', email: 'authority.tspcb@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'TSPCB' },
    { name: 'HMWSSB Water Supply & Sewerage', email: 'authority.hmwssb@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'HMWSSB' },
    { name: 'GHMC Solid Waste Management', email: 'authority.swm@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'GHMC-SWM' },
    { name: 'TSRTC Public Transport', email: 'authority.tsrtc@hyd.city', password: 'demo1234', role: 'authority', authorityCode: 'TSRTC' },
  ];
  const created = [];
  for (const u of demoUsers) {
    const existing = get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing) continue;
    created.push(await createUser({ ...u, authorityCode: u.authorityCode }));
  }
  return created.length;
}