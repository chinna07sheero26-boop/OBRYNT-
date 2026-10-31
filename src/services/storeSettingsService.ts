import { StoreSettings, PromoCode, OrderDetails } from '../types';
import { getStoredOrders, ORDER_STORAGE_KEY } from './orderService';

export const STORE_SETTINGS_KEY = 'obrynt_store_settings';
export const PROMO_CODES_KEY = 'obrynt_promo_codes';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'OBRYNT',
  tagline: 'Wear Your Identity · Fashion Without Limits',
  announcementText: 'INTRODUCING OBRYNT · FASHION WITHOUT LIMITS · DESIGN IT YOUR WAY',
  freeDeliveryThreshold: 999,
  standardDeliveryFee: 99,
  currencySymbol: '₹',
  contactEmail: 'owner@obrynt.example',
  contactPhone: '+91 98765 43210',
  enableCod: true,
  enableUpi: true,
  enableCards: true,
};

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    code: 'OBRYNT10',
    discountPercent: 10,
    flatDiscount: 0,
    minSpend: 0,
    usageCount: 42,
    active: true,
  },
  {
    code: 'WELCOME100',
    discountPercent: 0,
    flatDiscount: 100,
    minSpend: 599,
    usageCount: 28,
    active: true,
  },
  {
    code: 'FREESHIP',
    discountPercent: 0,
    flatDiscount: 0,
    minSpend: 0,
    usageCount: 65,
    active: true,
  },
  {
    code: 'VIP20',
    discountPercent: 20,
    flatDiscount: 0,
    minSpend: 1999,
    usageCount: 14,
    active: true,
  },
];

export function getStoredStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(DEFAULT_STORE_SETTINGS));
      return DEFAULT_STORE_SETTINGS;
    }
    return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function saveStoreSettings(settings: StoreSettings): StoreSettings {
  try {
    localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  } catch (err) {
    console.error('Failed to save store settings:', err);
    return settings;
  }
}

export function getStoredPromoCodes(): PromoCode[] {
  if (typeof window === 'undefined') return DEFAULT_PROMO_CODES;
  try {
    const raw = localStorage.getItem(PROMO_CODES_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_CODES_KEY, JSON.stringify(DEFAULT_PROMO_CODES));
      return DEFAULT_PROMO_CODES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROMO_CODES;
  } catch {
    return DEFAULT_PROMO_CODES;
  }
}

export function savePromoCodes(codes: PromoCode[]): PromoCode[] {
  try {
    localStorage.setItem(PROMO_CODES_KEY, JSON.stringify(codes));
    return codes;
  } catch (err) {
    console.error('Failed to save promo codes:', err);
    return codes;
  }
}

export function updateOrderStatusInStorage(orderId: string, newStatus: string): OrderDetails[] {
  try {
    const orders = getStoredOrders();
    const updated = orders.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o));
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update order status:', err);
    return [];
  }
}
