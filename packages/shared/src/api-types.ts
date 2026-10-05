// Bentuk response API yang dipakai bersama oleh apps/api (serializer) dan apps/web (tampilan).
// Semua waktu dikirim sebagai string ISO (UTC); semua uang integer rupiah.
import type {
  BannerTargetType,
  OptionGroupType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  StatusActor,
} from './enums';
import type { AdminOrderTab } from './order-status';
import type { OptionSnapshot } from './pricing';
import type { StoreStatus } from './store-hours';

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

// ---------- Publik ----------

export interface OperatingHourDto {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface StoreDto {
  name: string;
  address: string;
  whatsapp: string;
  logoUrl: string | null;
  hours: OperatingHourDto[];
  status: StoreStatus;
  serverTime: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

export interface OptionDto {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface OptionGroupDto {
  id: string;
  name: string;
  type: OptionGroupType;
  isRequired: boolean;
  maxSelect: number | null;
  options: OptionDto[];
}

export interface MenuItemDto {
  id: string;
  categoryId: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isBestSeller: boolean;
  isSpicy: boolean;
  optionGroups: OptionGroupDto[];
}

export interface MenuResponse {
  categories: CategoryDto[];
  items: MenuItemDto[];
}

export interface BannerDto {
  id: string;
  title: string;
  imageUrl: string;
  targetType: BannerTargetType;
  /** Slug kategori atau menu tujuan saat banner di-tap. */
  targetSlug: string | null;
}

export interface HomeResponse {
  categories: CategoryDto[];
  banners: BannerDto[];
  bestSellers: MenuItemDto[];
  recommended: MenuItemDto[];
  drinks: MenuItemDto[];
}

export type CartLineStatus = 'OK' | 'UNAVAILABLE' | 'NOT_FOUND' | 'INVALID_OPTIONS';

export interface ValidatedCartLine {
  index: number;
  menuItemId: string;
  status: CartLineStatus;
  name: string | null;
  slug: string | null;
  imageUrl: string | null;
  unitPrice: number | null;
  options: OptionSnapshot[];
}

export interface CartValidateResponse {
  lines: ValidatedCartLine[];
  storeOpen: boolean;
}

export interface CreateOrderResponse {
  code: string;
  token: string;
}

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  options: OptionSnapshot[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusLogDto {
  status: OrderStatus;
  actor: StatusActor;
  note: string | null;
  at: string;
}

export interface OrderStoreInfoDto {
  name: string;
  address: string;
  whatsapp: string;
  logoUrl: string | null;
}

export interface PublicOrderDto {
  code: string;
  token: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  address: string | null;
  landmark: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentDeadline: string | null;
  hasPaymentProof: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  statusLogs: OrderStatusLogDto[];
  /** Hanya terisi saat QRIS menunggu pembayaran. */
  payment: { qrisImageUrl: string | null; qrisMerchantName: string | null } | null;
  store: OrderStoreInfoDto;
  serverTime: string;
}

export interface OrderSummaryDto {
  token: string;
  code: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
  /** "Bakso Urat + 2 lainnya" */
  itemSummary: string;
  itemCount: number;
}

export interface OrderStatusBatchResponse {
  orders: OrderSummaryDto[];
}

export interface OrderLookupResponse {
  token: string;
  code: string;
  createdAt: string;
}

// ---------- Admin ----------

export interface AdminMeDto {
  id: string;
  username: string;
}

export interface AdminOrderListItemDto {
  id: string;
  code: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  customerName: string;
  total: number;
  createdAt: string;
  paymentDeadline: string | null;
  hasPaymentProof: boolean;
  itemSummary: string;
  itemCount: number;
}

export interface AdminOrdersSummary {
  ordersToday: number;
  revenueToday: number;
  needsAction: number;
}

export interface AdminOrdersResponse {
  tab: AdminOrderTab;
  orders: AdminOrderListItemDto[];
  summary: AdminOrdersSummary;
  serverTime: string;
}

export interface AdminOrderDto {
  id: string;
  code: string;
  token: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  address: string | null;
  landmark: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentDeadline: string | null;
  hasPaymentProof: boolean;
  paymentProofUploadedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  statusLogs: OrderStatusLogDto[];
  serverTime: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
}

export interface AdminMenuItemDto extends MenuItemDto {
  isFavorite: boolean;
  isRecommended: boolean;
  sortOrder: number;
}

export interface AdminCategoryDto extends CategoryDto {
  isActive: boolean;
  itemCount: number;
}

export interface AdminMenuResponse {
  categories: AdminCategoryDto[];
  items: AdminMenuItemDto[];
}

export interface AdminBannerDto {
  id: string;
  title: string;
  imageUrl: string;
  targetType: BannerTargetType;
  targetId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminSettingsDto {
  name: string;
  address: string;
  whatsapp: string;
  logoUrl: string | null;
  qrisImageUrl: string | null;
  qrisMerchantName: string | null;
  isManuallyClosed: boolean;
  closedUntil: string | null;
  closedMessage: string | null;
  soundRepeat: boolean;
  hours: OperatingHourDto[];
  status: StoreStatus;
  /** Fase 2: true bila WA_GATEWAY_TOKEN diisi di server. */
  waGatewayEnabled: boolean;
}

export interface ReportBreakdown {
  count: number;
  revenue: number;
}

export interface ReportResponse {
  from: string;
  to: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  byPaymentMethod: Record<PaymentMethod, ReportBreakdown>;
  byOrderType: Record<OrderType, ReportBreakdown>;
  daily: { date: string; count: number; revenue: number }[];
  topItems: { menuItemId: string; name: string; quantity: number; revenue: number }[];
}

export interface UploadImageResponse {
  url: string;
}

export interface PushPublicKeyResponse {
  publicKey: string;
}

export interface AdminEvent {
  type: 'order.created' | 'order.updated';
  order: { id: string; code: string; status: OrderStatus; total: number };
}
