import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, Truck, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedCheckout: () => void;
  onExploreShop: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  onExploreShop,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number; flatDiscount: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= 999 || (appliedPromo && appliedPromo.code === 'FREESHIP');
  const deliveryFee = subtotal === 0 ? 0 : isFreeDelivery ? 0 : 99;

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountPercent > 0) {
      discount = Math.round((subtotal * appliedPromo.discountPercent) / 100);
    } else if (appliedPromo.flatDiscount > 0) {
      discount = Math.min(subtotal, appliedPromo.flatDiscount);
    }
  }

  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);
  const freeShippingThreshold = 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();

    if (code === 'OBRYNT10' || code === 'THREAD10') {
      setAppliedPromo({ code: 'OBRYNT10', discountPercent: 10, flatDiscount: 0 });
    } else if (code === 'WELCOME100') {
      setAppliedPromo({ code: 'WELCOME100', discountPercent: 0, flatDiscount: 100 });
    } else if (code === 'FREESHIP') {
      setAppliedPromo({ code: 'FREESHIP', discountPercent: 0, flatDiscount: 0 });
    } else {
      setPromoError('Invalid coupon. Try OBRYNT10 (10% off) or FREESHIP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-300 bg-black shrink-0">
                <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-luxury text-base font-bold tracking-[0.16em] uppercase text-black">
                    Shopping Bag
                  </h2>
                  <span className="bg-black text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {items.reduce((s, x) => s + x.quantity, 0)}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                  Atelier Direct Checkout
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          {items.length > 0 && (
            <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-black" />
                  {isFreeDelivery ? (
                    <span className="text-black font-semibold">Complimentary Delivery unlocked</span>
                  ) : (
                    <span>
                      Add <strong>₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> for Free Delivery
                    </span>
                  )}
                </span>
                <span className="tabular-nums font-mono text-[11px]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-neutral-200 h-1 overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#f7f6f2] flex items-center justify-center mb-4 text-2xl border border-[#e4e1da]">
                  🛍️
                </div>
                <h3 className="text-base font-black text-[#111111] mb-1">Your bag is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Explore our curated apparel, footwear, beauty essentials, or design your bespoke T-shirt.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onExploreShop();
                  }}
                  className="px-6 py-3 bg-[#111111] hover:bg-black text-[#d7ff3f] font-black text-xs rounded-full uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-sm"
                >
                  EXPLORE THE COLLECTION
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-[#e4e1da] bg-stone-50/40 flex gap-3.5 items-start"
                >
                  {/* Thumbnail / Mini-Garment */}
                  {item.customDesign ? (
                    <div
                      className="w-14 h-16 rounded-xl clip-shirt-preview shrink-0 flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: item.customDesign.colorHex }}
                    >
                      <span
                        className="text-[6px] font-black uppercase text-center px-1 line-clamp-1"
                        style={{ color: item.customDesign.textColor }}
                      >
                        {item.customDesign.text}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: item.product.color || '#171717' }}
                    >
                      <span className="text-[9px] font-black text-white/80 uppercase">OB</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-[#111111] leading-tight line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {item.customDesign ? (
                        <span>
                          Colour {item.customDesign.colorName} · {item.customDesign.side} · Size {item.size}
                        </span>
                      ) : (
                        <span>Size: <strong>{item.size}</strong> · Color: {item.product.colorName || 'Standard'}</span>
                      )}
                    </div>

                    {item.customDesign && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#7a8e12] mt-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Bespoke Studio Print</span>
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-200/60">
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 cursor-pointer text-xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-black text-[#111111] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 cursor-pointer text-xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-[#111111] tabular-nums">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#e4e1da] bg-stone-50 space-y-3.5">
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Coupon (e.g. OBRYNT10)"
                  className="flex-1 bg-white border border-[#e4e1da] rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-hidden focus:border-black"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {appliedPromo && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <span>Coupon {appliedPromo.code} applied</span>
                  <button
                    onClick={() => setAppliedPromo(null)}
                    className="text-stone-500 hover:text-black cursor-pointer text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              )}

              {promoError && (
                <p className="text-[11px] font-bold text-red-600">{promoError}</p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900 tabular-nums">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span className="tabular-nums">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-bold text-stone-900 tabular-nums">
                    {deliveryFee === 0 ? <span className="text-[#7a8e12]">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="border-t border-[#e4e1da] pt-2 flex justify-between text-base font-black text-[#111111]">
                  <span>Total Amount</span>
                  <span className="tabular-nums">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-[10px] text-neutral-400 text-center uppercase tracking-wider">
                Encrypted Razorpay Checkout & Cash on Delivery supported.
              </p>

              <button
                onClick={onProceedCheckout}
                className="w-full py-4 bg-black hover:bg-neutral-900 text-white font-bold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
