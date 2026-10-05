import { Router } from 'express';
import { subscribeAdminEvents } from '../../lib/events';
import { requireAdmin, requireSameOrigin } from '../../middleware/admin-auth';
import { authRouter } from './auth';
import { bannersRouter, categoriesRouter } from './catalog';
import { menuRouter } from './menu';
import { pushRouter, reportsRouter, uploadsRouter } from './misc';
import { ordersRouter } from './orders';
import { settingsRouter } from './settings';

export const adminRouter = Router();

adminRouter.use(requireSameOrigin);
// Endpoint login/logout tidak butuh sesi; sisanya wajib cookie sesi admin.
adminRouter.use('/auth', authRouter);
adminRouter.use(requireAdmin);

adminRouter.get('/events', (req, res) => subscribeAdminEvents(req, res));
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/menu', menuRouter);
adminRouter.use('/categories', categoriesRouter);
adminRouter.use('/banners', bannersRouter);
adminRouter.use('/reports', reportsRouter);
adminRouter.use('/push', pushRouter);
adminRouter.use('/uploads', uploadsRouter);
adminRouter.use(settingsRouter);
