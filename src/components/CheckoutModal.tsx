import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, ArrowRight, CreditCard, Banknote, QrCode } from 'lucide-react';
import { CartItem, OrderDetails } from '../types';

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

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('upi');
  const [placedOrder, setPlacedOrder] = useState<OrderDetails | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        ? 'UPI Instant (Google Pay/PhonePe)'
        : 'Credit / Debit Card';

    const newOrder: OrderDetails = {
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
      status: 'Confirmed',
    };

    onOrderPlaced(newOrder);
    onClearCart();
    setPlacedOrder(newOrder);
  };

  const handleFinish = () => {
    setPlacedOrder(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4e1da]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#e4e1da] flex items-center justify-between bg-stone-50/70">
          <div>
            <h2 className="text-xl font-black text-[#111111] tracking-tight">
              {placedOrder ? 'Order Confirmed!' : 'Express Checkout'}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {placedOrder ? 'Thank you for shopping with OBRYNT' : 'Review details and complete your demo purchase'}
            </p>
          </div>
          <button
            onClick={placedOrder ? handleFinish : onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {placedOrder ? (
            /* Order Placed Success Confirmation */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#d7ff3f] text-[#111111] mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#7a8e12]">
                  Demo order placed successfully
                </span>
                <h3 className="text-2xl font-black text-[#111111] mt-1">
                  Order ID: {placedOrder.orderId}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Transaction ref: TX-{placedOrder.orderId.replace(/^OB-/, '')} · Total: ₹{placedOrder.total.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f7f6f2] border border-[#e4e1da] text-left text-xs space-y-2">
                <div className="flex justify-between font-bold text-stone-800">
                  <span>Delivery to:</span>
                  <span>{placedOrder.customer.fullName} ({placedOrder.customer.pincode})</span>
                </div>
                <div className="text-stone-500">{placedOrder.customer.address}, {placedOrder.customer.city}</div>
                <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200">
                  <span>Estimated delivery:</span>
                  <span className="font-bold text-[#111111]">3–4 business days</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Payment:</span>
                  <span className="font-bold text-[#111111]">{placedOrder.paymentMethod}</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 max-w-sm mx-auto leading-normal">
                No payment was collected and no real order was sent to a supplier. This order is saved to your account session.
              </p>

              <button
                onClick={handleFinish}
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-[#d7ff3f] font-black text-xs sm:text-sm rounded-full transition-transform active:scale-98 cursor-pointer uppercase tracking-wider"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Payment Method */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  3. Payment Method
                </h3>
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
                    <span className="text-[11px] font-bold">Card</span>
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

              <button
                type="submit"
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-[#d7ff3f] font-black text-xs sm:text-sm rounded-full transition-transform active:scale-98 cursor-pointer shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>PLACE DEMO ORDER · ₹{grandTotal.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
