/**
 * OBRYNT International Fashion Marketplace — Razorpay Client-Side Payment Service
 * 
 * Provides secure communication with backend payment endpoints:
 * - /api/payment/razorpay/config
 * - /api/payment/razorpay/create-order
 * - /api/payment/razorpay/verify-payment
 * 
 * Security Guardrail: Key Secret is NEVER sent to or stored in frontend code.
 * Only the public Razorpay Key ID (e.g. rzp_test_...) is used to mount Razorpay Checkout.
 */

import { OrderDetails } from '../types';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayPublicConfig {
  enabled: boolean;
  keyId: string | null;
  isConfigured: boolean;
  isTestMode: boolean;
  currency: string;
  status: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  keyId?: string;
  isTestMode?: boolean;
  mode?: 'live_razorpay' | 'test_sandbox';
  requiresEnvKeys?: boolean;
  notice?: string;
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  verified: boolean;
  paymentId?: string;
  orderId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  supabaseSynced?: boolean;
  supabaseMessage?: string;
  message?: string;
  error?: string;
}

/**
 * Fetch public Razorpay status and key ID from secure backend
 */
export async function getRazorpayPublicConfig(): Promise<RazorpayPublicConfig> {
  try {
    const res = await fetch('/api/payment/razorpay/config');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[OBRYNT] Could not fetch Razorpay config from backend:', err);
    return {
      enabled: true,
      keyId: null,
      isConfigured: false,
      isTestMode: true,
      currency: 'INR',
      status: 'Fallback mode active',
    };
  }
}

/**
 * Load the official Razorpay Checkout SDK if not already loaded in DOM
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[OBRYNT] Failed to load Razorpay checkout.js script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Create a backend Razorpay order
 */
export async function createBackendPaymentOrder(
  amount: number,
  orderCode: string,
  customer: { fullName: string; phone: string; email: string },
  currency: string = 'INR'
): Promise<CreateOrderResponse> {
  const res = await fetch('/api/payment/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency,
      orderCode,
      customer,
    }),
  });

  return res.json();
}

/**
 * Verify Razorpay payment signature server-side
 */
export async function verifyBackendPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderDetails: OrderDetails;
  isSandboxDemo?: boolean;
}): Promise<PaymentVerificationResponse> {
  const res = await fetch('/api/payment/razorpay/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export interface CheckoutOptions {
  orderDetails: OrderDetails;
  onSuccess: (verifiedPayment: {
    paymentId: string;
    orderId: string;
    supabaseSynced: boolean;
    supabaseMessage: string;
  }) => void;
  onFailure: (reason: string) => void;
  onDismiss: () => void;
}

/**
 * Mount and launch Razorpay Checkout modal
 */
export async function openRazorpayCheckout({
  orderDetails,
  onSuccess,
  onFailure,
  onDismiss,
}: CheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();

  // 1. Create order on backend
  let orderResponse: CreateOrderResponse;
  try {
    orderResponse = await createBackendPaymentOrder(
      orderDetails.total,
      orderDetails.orderId,
      orderDetails.customer,
      'INR'
    );
  } catch (err: any) {
    onFailure(err?.message || 'Failed to initiate secure payment session.');
    return;
  }

  if (!orderResponse.success || !orderResponse.order) {
    onFailure(orderResponse.error || 'Server could not prepare payment order.');
    return;
  }

  const { order, keyId, mode } = orderResponse;

  // 2. If Razorpay SDK is loaded and we have a valid key ID
  if (isLoaded && window.Razorpay && keyId && keyId.startsWith('rzp_')) {
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'OBRYNT',
      description: `Order ${orderDetails.orderId} · Luxury Apparel & Bespoke`,
      order_id: order.id,
      prefill: {
        name: orderDetails.customer.fullName,
        email: orderDetails.customer.email,
        contact: orderDetails.customer.phone,
      },
      notes: {
        orderId: orderDetails.orderId,
        address: `${orderDetails.customer.address}, ${orderDetails.customer.city} - ${orderDetails.customer.pincode}`,
      },
      theme: {
        color: '#111111',
      },
      modal: {
        ondismiss: () => {
          onDismiss();
        },
        escape: true,
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // Verify signature on backend
          const verification = await verifyBackendPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderDetails,
          });

          if (verification.success && verification.verified) {
            onSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              supabaseSynced: Boolean(verification.supabaseSynced),
              supabaseMessage: verification.supabaseMessage || '',
            });
          } else {
            onFailure(verification.error || 'Payment signature rejected by security gateway.');
          }
        } catch (err: any) {
          onFailure(err?.message || 'Error communicating with verification gateway.');
        }
      },
    };

    try {
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', (failResponse: any) => {
        const errorDesc =
          failResponse?.error?.description ||
          failResponse?.error?.reason ||
          'Payment transaction was declined by bank or UPI provider.';
        onFailure(errorDesc);
      });

      rzpInstance.open();
      return;
    } catch (err) {
      console.warn('[OBRYNT Razorpay] Standard checkout modal open error:', err);
    }
  }

  // 3. Fallback Test Mode Simulator (If keys not yet configured or SDK blocked)
  // This lets the user safely complete test payments and verifies the backend flow
  try {
    const simPaymentId = `pay_test_${Math.random().toString(36).slice(2, 10)}`;
    const verification = await verifyBackendPayment({
      razorpay_order_id: order.id,
      razorpay_payment_id: simPaymentId,
      razorpay_signature: `sim_sig_${Date.now()}`,
      orderDetails,
      isSandboxDemo: true,
    });

    if (verification.success) {
      onSuccess({
        paymentId: simPaymentId,
        orderId: order.id,
        supabaseSynced: Boolean(verification.supabaseSynced),
        supabaseMessage: verification.supabaseMessage || '',
      });
    } else {
      onFailure('Payment could not be verified in test mode.');
    }
  } catch (err: any) {
    onFailure(err?.message || 'Test payment flow error');
  }
}
