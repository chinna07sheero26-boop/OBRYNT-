import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  CreditCard,
  Banknote,
  QrCode,
  Lock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { CartItem, OrderDetails } from '../types';
import {
  getRazorpayPublicConfig,
  openRazorpayCheckout,
  RazorpayPublicConfig,
} from '../services/paymentService';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  grandTotal: number;
  onOrderPlaced: (order: OrderDetails) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount,
  deliveryFee,
  grandTotal,
  onOrderPlaced,
  onClearCart,
}) => {
  const [formData, setFormData] = useState({
    fullName: 'Aarav Patel',
    phone: '9876543210',
    email: 'aarav.patel@example.com',
    address: '42, Boulevard Towers, 5th Main, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [placedOrder, setPlacedOrder] = useState<OrderDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [rzpConfig, setRzpConfig] = useState<RazorpayPublicConfig | null>(null);
  const [supabaseSyncNote, setSupabaseSyncNote] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCheckoutError(null);
      setCheckoutNotice(null);
      getRazorpayPublicConfig().then(setRzpConfig).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (checkoutError) setCheckoutError(null);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setCheckoutNotice(null);

    // Validate phone number
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setCheckoutError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderId = `OB-${randomSuffix}`;
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const paymentLabel =
      paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : paymentMethod === 'upi'
        ? 'Razorpay UPI Instant'
        : 'Razorpay Cards / NetBanking';

    const baseOrder: OrderDetails = {
      orderId,
      date: dateFormatted,
      customer: { ...formData },
      items: [...items],
      subtotal,
      discount,
      shipping: deliveryFee,
      tax: Math.round(subtotal * 0.05),
      total: grandTotal,
      paymentMethod: paymentLabel,
      status: paymentMethod === 'cod' ? 'Confirmed' : 'Processing',
      paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
    };

    // Case 1: Cash on Delivery (No online gateway needed)
    if (paymentMethod === 'cod') {
      const finalOrder: OrderDetails = {
        ...baseOrder,
        status: 'Confirmed',
        paymentStatus: 'cod_pending',
        paymentGatewayRef: `COD-${orderId.replace(/^OB-/, '')}`,
      };
      onOrderPlaced(finalOrder);
      onClearCart();
      setPlacedOrder(finalOrder);
      return;
    }

    // Case 2: Online Payment via Razorpay (UPI or Cards)
    setIsProcessing(true);

    await openRazorpayCheckout({
      orderDetails: baseOrder,
      onSuccess: ({ paymentId, orderId: rzpOrderId, supabaseSynced, supabaseMessage }) => {
        setIsProcessing(false);
        const finalOrder: OrderDetails = {
          ...baseOrder,
          status: 'Confirmed',
          paymentStatus: 'captured',
          paymentId,
          paymentGatewayRef: paymentId,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: paymentId,
        };

        if (supabaseSynced) {
          setSupabaseSyncNote('✓ Order and payment verified & synced to Supabase database.');
        } else if (supabaseMessage) {
          setSupabaseSyncNote(supabaseMessage);
        }

        onOrderPlaced(finalOrder);
        onClearCart();
        setPlacedOrder(finalOrder);
      },
      onFailure: (reason: string) => {
        setIsProcessing(false);
        setCheckoutError(reason || 'Payment could not be completed. Please try again or choose COD.');
      },
      onDismiss: () => {
        setIsProcessing(false);
        setCheckoutNotice(
          'Payment window was closed. Your bag items and shipping details have been saved so you can retry when ready.'
        );
      },
    });
  };

  const handleFinish = () => {
    setPlacedOrder(null);
    setSupabaseSyncNote(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4e1da]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#e4e1da] flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-600 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#111111] tracking-tight">
                  {placedOrder ? 'OBRYNT Order Confirmed' : 'OBRYNT Express Checkout'}
                </h2>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                {placedOrder
                  ? 'Your bespoke order has been authenticated & sent to atelier'
                  : 'Encrypted checkout · Verified authentic merchandise'}
              </p>
            </div>
          </div>

          <button
            onClick={placedOrder ? handleFinish : onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {placedOrder ? (
            /* Order Confirmation & Payment Receipt Screen */
            <div className="text-center py-4 space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-700 bg-black shadow-xl">
                  <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT Confirmed" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-stone-600 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {placedOrder.paymentStatus === 'captured'
                      ? 'Payment Captured · OBRYNT Order Authenticated'
                      : 'Cash on Delivery Order Confirmed'}
                  </span>
                </span>
                <h3 className="text-2xl font-black text-[#111111] mt-1 font-serif tracking-wider">
                  Order ID: {placedOrder.orderId}
                </h3>
                {placedOrder.paymentGatewayRef && (
                  <p className="text-xs text-stone-500 mt-1 font-mono">
                    Gateway Ref: <strong className="text-stone-800">{placedOrder.paymentGatewayRef}</strong> · Amount: ₹{placedOrder.total.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* Supabase Status Note */}
              {supabaseSyncNote && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 text-left">
                  <div className="font-bold text-stone-900 mb-0.5">Database Status:</div>
                  <div className="text-[11px] text-stone-600">{supabaseSyncNote}</div>
                </div>
              )}

              {/* Order Receipt Details */}
              <div className="p-4 rounded-2xl bg-[#f7f6f2] border border-[#e4e1da] text-left text-xs space-y-2.5">
                <div className="flex justify-between font-bold text-stone-800">
                  <span>Delivering to:</span>
                  <span>{placedOrder.customer.fullName} ({placedOrder.customer.pincode})</span>
                </div>
                <div className="text-stone-500 text-[11px] leading-relaxed">
                  {placedOrder.customer.address}, {placedOrder.customer.city}, {placedOrder.customer.state}
                </div>
                <div className="flex justify-between text-stone-600 pt-2 border-t border-stone-200">
                  <span>Mobile & Email:</span>
                  <span className="font-bold text-[#111111]">{placedOrder.customer.phone} · {placedOrder.customer.email}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Payment Method:</span>
                  <span className="font-bold text-[#111111]">{placedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Estimated Dispatch:</span>
                  <span className="font-bold text-[#7a8e12]">Within 24–48 Hours</span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-[#d7ff3f] font-black text-xs sm:text-sm rounded-full transition-transform active:scale-98 cursor-pointer uppercase tracking-wider shadow-md"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Gateway Status Badge */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-[#e4e1da] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-stone-800">Razorpay Payment Gateway</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#111111] text-[#d7ff3f]">
                  {rzpConfig?.isTestMode ? 'Test Mode' : 'Live Mode'}
                </span>
              </div>

              {/* Notice / Error banners */}
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Payment Error</strong>
                    <span>{checkoutError}</span>
                  </div>
                </div>
              )}

              {checkoutNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Payment Window Closed</strong>
                    <span>{checkoutNotice}</span>
                  </div>
                </div>
              )}

              {/* Customer Contact */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  1. Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111111] outline-hidden focus:border-black"
                  />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit Mobile Number"
                    className="w-full bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111111] outline-hidden focus:border-black"
                  />
                </div>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full mt-2.5 bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111111] outline-hidden focus:border-black"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  2. Shipping Address
                </h3>
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House/Flat No., Building, Street Name"
                  className="w-full bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111111] outline-hidden focus:border-black mb-2.5"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] outline-hidden focus:border-black"
                  />
                  <input
                    type="text"
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] outline-hidden focus:border-black"
                  />
                  <input
                    type="text"
                    required
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    className="w-full bg-[#fafafa] border border-[#e4e1da] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-700">
                    3. Select Payment Method
                  </h3>
                  <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#7a8e12]" />
                    <span>256-bit SSL Encrypted</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'upi'
                        ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                        : 'border-[#e4e1da] bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[11px] font-bold">UPI / QR</span>
                    <span className="text-[9px] text-stone-400 font-medium">Google Pay / PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                        : 'border-[#e4e1da] bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Card / NetBanking</span>
                    <span className="text-[9px] text-stone-400 font-medium">Visa, MC, Rupay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'cod'
                        ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                        : 'border-[#e4e1da] bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Cash on Delivery</span>
                    <span className="text-[9px] text-stone-400 font-medium">Pay on Delivery</span>
                  </button>
                </div>
              </div>

              {/* Order Summary Pill */}
              <div className="p-3.5 rounded-xl bg-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-600 font-bold">
                  {items.length} item(s) in bag
                </span>
                <span className="text-sm font-black text-[#111111] tabular-nums">
                  Total: ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-[#d7ff3f] font-black text-xs sm:text-sm rounded-full transition-transform active:scale-98 cursor-pointer shadow-md uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#d7ff3f]" />
                    <span>LAUNCHING SECURE RAZORPAY CHECKOUT...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'cod'
                        ? `CONFIRM COD ORDER · ₹${grandTotal.toLocaleString('en-IN')}`
                        : `PAY VIA RAZORPAY TEST MODE · ₹${grandTotal.toLocaleString('en-IN')}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
