import { adminOrdersQuerySchema, rejectOrderSchema, type SignedUrlResponse } from '@wtr/shared';
import { Router } from 'express';
import { HttpError } from '../../lib/http-error';
import { uuidParam } from '../../lib/params';
import { createPrivateSignedUrl } from '../../lib/storage';
import { toAdminOrderDto } from '../../serializers';
import { listAdminOrders } from '../../services/admin-orders';
import { advanceOrder, confirmOrder, getOrderById, rejectOrder } from '../../services/orders';

export const ordersRouter = Router();

const PROOF_URL_TTL_SECONDS = 5 * 60;

ordersRouter.get('/', async (req, res) => {
  const { tab, date } = adminOrdersQuerySchema.parse(req.query);
  res.json(await listAdminOrders(tab, date));
});

ordersRouter.get('/:id', async (req, res) => {
  res.json(toAdminOrderDto(await getOrderById(uuidParam(req.params.id))));
});

/** Signed URL bukti bayar dari bucket privat, berlaku 5 menit. */
ordersRouter.get('/:id/proof', async (req, res) => {
  const order = await getOrderById(uuidParam(req.params.id));
  if (!order.paymentProofPath) throw new HttpError(404, 'PROOF_NOT_FOUND', 'Bukti bayar tidak ada');
  const body: SignedUrlResponse = {
    url: await createPrivateSignedUrl(order.paymentProofPath, PROOF_URL_TTL_SECONDS),
    expiresAt: new Date(Date.now() + PROOF_URL_TTL_SECONDS * 1000).toISOString(),
  };
  res.set('Cache-Control', 'no-store').json(body);
});

ordersRouter.post('/:id/confirm', async (req, res) => {
  res.json(toAdminOrderDto(await confirmOrder(uuidParam(req.params.id))));
});

ordersRouter.post('/:id/reject', async (req, res) => {
  const { reason } = rejectOrderSchema.parse(req.body);
  res.json(toAdminOrderDto(await rejectOrder(uuidParam(req.params.id), reason)));
});

ordersRouter.post('/:id/advance', async (req, res) => {
  res.json(toAdminOrderDto(await advanceOrder(uuidParam(req.params.id))));
});
