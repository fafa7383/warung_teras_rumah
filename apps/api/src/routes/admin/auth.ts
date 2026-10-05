import { adminLoginSchema, changePasswordSchema, type AdminMeDto } from '@wtr/shared';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import {
  SESSION_DAYS_DEFAULT,
  SESSION_DAYS_REMEMBER,
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from '../../lib/auth';
import { HttpError } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';
import { loginLimiter } from '../../lib/rate-limit';
import { getAdmin, requireAdmin } from '../../middleware/admin-auth';

export const authRouter = Router();

const BCRYPT_COST = 12;
// Hash pengganti agar waktu respons sama saat username tidak ada (mencegah tebak username).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('teras-rumah-dummy', BCRYPT_COST));

authRouter.post('/login', loginLimiter, async (req, res) => {
  const input = adminLoginSchema.parse(req.body);
  const admin = await prisma.adminUser.findUnique({ where: { username: input.username } });
  const valid = await bcrypt.compare(input.password, admin?.passwordHash ?? (await getDummyHash()));
  if (!admin || !valid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Username atau password salah');
  }

  const days = input.rememberMe ? SESSION_DAYS_REMEMBER : SESSION_DAYS_DEFAULT;
  setSessionCookie(res, signSession(admin.id, admin.tokenVersion, days), days);
  const body: AdminMeDto = { id: admin.id, username: admin.username };
  res.json(body);
});

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAdmin, (_req, res) => {
  const admin = getAdmin(res);
  const body: AdminMeDto = { id: admin.id, username: admin.username };
  res.json(body);
});

authRouter.patch('/password', requireAdmin, async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  const session = getAdmin(res);
  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: session.id } });
  if (!(await bcrypt.compare(input.currentPassword, admin.passwordHash))) {
    throw new HttpError(400, 'INVALID_PASSWORD', 'Password lama salah');
  }

  // token_version naik → semua sesi lain otomatis keluar; sesi ini diperbarui.
  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_COST), tokenVersion: { increment: 1 } },
  });
  setSessionCookie(res, signSession(updated.id, updated.tokenVersion, SESSION_DAYS_DEFAULT), SESSION_DAYS_DEFAULT);
  res.status(204).end();
});
