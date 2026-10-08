import {
  MAX_UPLOAD_BYTES,
  cartValidateSchema,
  createOrderSchema,
  orderLookupSchema,
  orderStatusBatchSchema,
  type CreateOrderResponse,
  type OrderLookupResponse,
  type OrderStatusBatchResponse,
} from '@wtr/shared';
import { Router } from 'express';
import multer from 'multer';
import { HttpError } from '../lib/http-error';
import { createOrderLimiter, lookupLimiter, proofUploadLimiter } from '../lib/rate-limit';
import { verifyTurnstile } from '../lib/turnstile';
import { toOrderSummaryDto, toPublicOrderDto } from '../serializers';
import { getHome, getPublicMenu } from '../services/menu';
import {
  cancelOrderByCustomer,
  createOrder,
  getOrderByToken,
  getOrdersByTokens,
  lookupOrder,
  uploadPaymentProof,
  validateCart,
} from '../services/orders';
import { getStoreSnapshot, toStoreDto } from '../services/store';

export const publicRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

// Data pesanan tidak boleh di-cache di mana pun (PRD 10.7).
const noStore = { 'Cache-Control': 'no-store' };

publicRouter.get('/store', async (_req, res) => {
  res.json(toStoreDto(await getStoreSnapshot()));
});

publicRouter.get('/home', async (_req, res) => {
  res.json(await getHome());
});

publicRouter.get('/menu', async (_req, res) => {
  res.json(await getPublicMenu());
});

publicRouter.post('/cart/validate', async (req, res) => {
  const { items } = cartValidateSchema.parse(req.body);
  res.json(await validateCart(items));
});

publicRouter.post('/orders', createOrderLimiter, async (req, res) => {
  const input = createOrderSchema.parse(req.body);
  await verifyTurnstile(input.turnstileToken, req.ip);
  const order = await createOrder(input, { ip: req.ip });
  const body: CreateOrderResponse = { code: order.code, token: order.accessToken };
  res.status(201).set(noStore).json(body);
});

publicRouter.post('/orders/status-batch', async (req, res) => {
  const { tokens } = orderStatusBatchSchema.parse(req.body);
  const orders = await getOrdersByTokens(tokens);
  const body: OrderStatusBatchResponse = { orders: orders.map(toOrderSummaryDto) };
  res.set(noStore).json(body);
});

publicRouter.post('/orders/lookup', lookupLimiter, async (req, res) => {
  const input = orderLookupSchema.parse(req.body);
  await verifyTurnstile(input.turnstileToken, req.ip);
  const order = await lookupOrder(input.code, input.customerPhone);
  const body: OrderLookupResponse = {
    token: order.accessToken,
    code: order.code,
    createdAt: order.createdAt.toISOString(),
  };
  res.set(noStore).json(body);
});

publicRouter.get('/orders/:token', async (req, res) => {
  const [order, store] = await Promise.all([getOrderByToken(req.params.token), getStoreSnapshot()]);
  res.set(noStore).json(toPublicOrderDto(order, store));
});

publicRouter.post(
  '/orders/:token/payment-proof',
  proofUploadLimiter,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) throw new HttpError(400, 'FILE_REQUIRED', 'Pilih foto bukti bayar dulu ya');
    // Dengan beberapa middleware, tipe params Express melebar; nilainya tetap string dari path.
    const order = await uploadPaymentProof(String(req.params.token), req.file.buffer);
    res.set(noStore).json(toPublicOrderDto(order, await getStoreSnapshot()));
  },
);

publicRouter.post('/orders/:token/cancel', async (req, res) => {
  const order = await cancelOrderByCustomer(req.params.token);
  res.set(noStore).json(toPublicOrderDto(order, await getStoreSnapshot()));
});
