import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  return (
    <section className="my-8 sm:my-10 py-6 border-y border-[#e4e1da] bg-white/60 rounded-2xl px-4 sm:px-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f6f2] border border-[#e4e1da] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-[#111111]" />
          </div>
          <div>
            <strong className="text-xs font-black text-[#111111] uppercase tracking-wider block">
              Free Express Shipping
            </strong>
            <span className="text-[11px] text-stone-500 font-medium">
              On all orders above ₹999 across India
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f6f2] border border-[#e4e1da] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#7a8e12]" />
          </div>
          <div>
            <strong className="text-xs font-black text-[#111111] uppercase tracking-wider block">
              Bespoke Silkscreen Studio
            </strong>
            <span className="text-[11px] text-stone-500 font-medium">
              High-density print on 220 GSM combed cotton
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f6f2] border border-[#e4e1da] flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-[#111111]" />
          </div>
          <div>
            <strong className="text-xs font-black text-[#111111] uppercase tracking-wider block">
              7-Day Returns & Exchanges
            </strong>
            <span className="text-[11px] text-stone-500 font-medium">
              Doorstep pickup & instantaneous store credits
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f6f2] border border-[#e4e1da] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#111111]" />
          </div>
          <div>
            <strong className="text-xs font-black text-[#111111] uppercase tracking-wider block">
              100% Secure Checkout
            </strong>
            <span className="text-[11px] text-stone-500 font-medium">
              UPI QR, Cards & Cash on Delivery supported
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
