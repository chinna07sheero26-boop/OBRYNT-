import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  return (
    <section className="my-10 sm:my-14 py-8 border-y border-neutral-200 bg-white">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <div className="flex items-start gap-3.5">
          <Truck className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-black uppercase tracking-[0.16em] block mb-1">
              Complimentary Express Delivery
            </strong>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Dispatched with tracked courier partners on all orders above ₹1,499.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <Sparkles className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-black uppercase tracking-[0.16em] block mb-1">
              Bespoke Silkscreen Studio
            </strong>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Craft personal custom prints live on 240 GSM combed organic luxury cotton.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <RefreshCw className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-black uppercase tracking-[0.16em] block mb-1">
              Complimentary 7-Day Returns
            </strong>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Doorstep courier pickup and seamless exchanges or instant refunds.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-black uppercase tracking-[0.16em] block mb-1">
              Encrypted Checkout & COD
            </strong>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Secured with Razorpay 256-bit SSL, UPI QR, Cards, and Cash on Delivery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
