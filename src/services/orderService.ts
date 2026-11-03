import { OrderDetails, TransactionRecord, CustomDesign } from '../types';

export const ORDER_STORAGE_KEY = 'obrynt_orders';
export const TRANSACTION_STORAGE_KEY = 'obrynt_transactions';
export const SAVED_DESIGNS_KEY = 'obrynt_saved_designs';

export const INITIAL_ORDERS: OrderDetails[] = [
  {
    orderId: 'OB-982142',
    date: '31 Oct 2026',
    customer: {
      fullName: 'Aarav Patel',
      phone: '9876543210',
      email: 'aarav.patel@example.com',
      address: '42, Boulevard Towers, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        id: 'item-1',
        size: 'L',
        quantity: 1,
        product: {
          sku: 'OB-001',
          name: 'Classic Everyday T-Shirt',
          category: 'T-Shirts',
          price: 499,
          sizes: ['S', 'M', 'L', 'XL'],
          color: '#171717',
          colorName: 'Pitch Black',
          type: 'shirt',
          tag: 'BESTSELLER',
          description: '100% organic heavyweight combed cotton tailored with a refined ribbed neckline.',
          stock: 75,
          imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
        },
      },
      {
        id: 'item-2',
        size: 'L',
        quantity: 1,
        product: {
          sku: 'OB-016',
          name: 'Custom Design T-Shirt — CREATE YOUR OWN PATH',
          category: 'Custom Design',
          price: 799,
          sizes: ['S', 'M', 'L', 'XL'],
          color: '#171717',
          colorName: 'Pitch Black',
          type: 'shirt',
          tag: 'MAKE IT YOURS',
          description: 'Bespoke custom print t-shirt created in OBRYNT Studio.',
          stock: 999,
          imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
        },
        customDesign: {
          text: 'CREATE YOUR OWN PATH',
          side: 'Front',
          size: 'L',
          colorHex: '#171717',
          colorName: 'Black',
          textColor: '#ffffff',
          fontFamily: 'Outfit',
        },
      },
    ],
    subtotal: 1298,
    discount: 0,
    shipping: 0,
    tax: 65,
    total: 1298,
    paymentMethod: 'UPI (Google Pay)',
    status: 'Confirmed',
  },
];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TX-982142',
    orderId: 'OB-982142',
    amount: 1298,
    method: 'UPI · Instant Payment',
    status: 'Completed',
    date: '31 Oct 2026',
  },
];

export const INITIAL_SAVED_DESIGNS: CustomDesign[] = [
  {
    id: 'design-1',
    text: 'WEAR YOUR IDENTITY',
    side: 'Front',
    size: 'L',
    colorHex: '#171717',
    colorName: 'Black',
    textColor: '#d7ff3f',
    fontFamily: 'Outfit',
    dateCreated: '31 Oct 2026',
  },
  {
    id: 'design-2',
    text: 'OBRYNT // ORIGINALS',
    side: 'Back',
    size: 'XL',
    colorHex: '#243c6b',
    colorName: 'Navy',
    textColor: '#ffffff',
    fontFamily: 'Space Grotesk',
    dateCreated: '30 Oct 2026',
  },
];

/** Retrieve orders */
export function getStoredOrders(): OrderDetails[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return INITIAL_ORDERS;
  }
}

/** Save order */
export function saveOrderToStorage(order: OrderDetails): OrderDetails[] {
  try {
    const current = getStoredOrders();
    const updated = [order, ...current.filter((o) => o.orderId !== order.orderId)];
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updated));

    // Also record transaction
    const txId = order.paymentGatewayRef || `TX-${order.orderId.replace(/^OB-/, '')}`;
    const txStatus =
      order.paymentStatus === 'captured'
        ? 'Captured (Razorpay)'
        : order.paymentStatus === 'cod_pending'
        ? 'Pending COD'
        : 'Confirmed';

    recordTransaction({
      id: txId,
      orderId: order.orderId,
      amount: order.total,
      method: order.paymentMethod,
      status: txStatus,
      date: order.date,
      gatewayRef: order.paymentGatewayRef,
      gateway: order.paymentMethod.includes('Razorpay') ? 'Razorpay' : 'Standard',
    });

    return updated;
  } catch (err) {
    console.error('Failed to save order:', err);
    return [];
  }
}

/** Retrieve transactions */
export function getStoredTransactions(): TransactionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function recordTransaction(tx: TransactionRecord): TransactionRecord[] {
  try {
    const current = getStoredTransactions();
    const updated = [tx, ...current.filter((t) => t.id !== tx.id)];
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save transaction:', err);
    return [];
  }
}

/** Saved custom designs */
export function getStoredSavedDesigns(): CustomDesign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_DESIGNS_KEY);
    if (!raw) {
      localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(INITIAL_SAVED_DESIGNS));
      return INITIAL_SAVED_DESIGNS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return INITIAL_SAVED_DESIGNS;
  }
}

export function saveDesignToStorage(design: CustomDesign): CustomDesign[] {
  try {
    const current = getStoredSavedDesigns();
    const withId = {
      ...design,
      id: design.id || `design-${Date.now()}`,
      dateCreated: design.dateCreated || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    const updated = [withId, ...current];
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save custom design:', err);
    return [];
  }
}

export function deleteSavedDesign(id: string): CustomDesign[] {
  try {
    const current = getStoredSavedDesigns();
    const updated = current.filter((d) => d.id !== id);
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
