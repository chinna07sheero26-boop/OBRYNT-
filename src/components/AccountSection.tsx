import React from 'react';
import { Package, CreditCard, Heart, Sparkles, ArrowRight } from 'lucide-react';

interface AccountSectionProps {
  ordersCount: number;
  transactionsCount: number;
  wishlistCount: number;
  savedDesignsCount: number;
  onOpenModal: (tab: 'orders' | 'transactions' | 'wishlist' | 'designs') => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  ordersCount,
  transactionsCount,
  wishlistCount,
  savedDesignsCount,
  onOpenModal,
}) => {
  return (
    <section id="account" className="my-12 sm:my-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7a8e12] mb-1">
            Your OBRYNT
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-[-0.04em] text-[#111111]">
            Everything in one account
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Account features designed for a seamless, transparent customer experience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Order history */}
        <div className="bg-white border border-[#e4e1da] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-stone-400 hover:shadow-md transition-all">
          <div>
            <div className="text-2xl mb-3">📦</div>
            <h3 className="text-base font-black text-[#111111] mb-1.5 flex items-center justify-between">
              <span>Order history</span>
              {ordersCount > 0 && (
                <span className="text-[11px] font-bold bg-[#111111] text-[#d7ff3f] px-2 py-0.5 rounded-full">
                  {ordersCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              View purchases, live delivery tracking status, item manifests, and invoices.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('orders')}
            className="text-xs font-black text-[#111111] underline underline-offset-4 hover:text-[#7a8e12] transition-colors cursor-pointer text-left flex items-center gap-1 group"
          >
            <span>View orders</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 2: Transaction history */}
        <div className="bg-white border border-[#e4e1da] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-stone-400 hover:shadow-md transition-all">
          <div>
            <div className="text-2xl mb-3">₹</div>
            <h3 className="text-base font-black text-[#111111] mb-1.5 flex items-center justify-between">
              <span>Transaction history</span>
              {transactionsCount > 0 && (
                <span className="text-[11px] font-bold bg-stone-100 text-stone-800 px-2 py-0.5 rounded-full">
                  {transactionsCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Review payment confirmations, transaction reference numbers, and refunds.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('transactions')}
            className="text-xs font-black text-[#111111] underline underline-offset-4 hover:text-[#7a8e12] transition-colors cursor-pointer text-left flex items-center gap-1 group"
          >
            <span>View transactions</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 3: Wishlist */}
        <div className="bg-white border border-[#e4e1da] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-stone-400 hover:shadow-md transition-all">
          <div>
            <div className="text-2xl mb-3 text-red-500">♡</div>
            <h3 className="text-base font-black text-[#111111] mb-1.5 flex items-center justify-between">
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="text-[11px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Keep favourite garments, sneakers, and beauty essentials saved in one place.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('wishlist')}
            className="text-xs font-black text-[#111111] underline underline-offset-4 hover:text-[#7a8e12] transition-colors cursor-pointer text-left flex items-center gap-1 group"
          >
            <span>View wishlist</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 4: Saved designs */}
        <div className="bg-white border border-[#e4e1da] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-stone-400 hover:shadow-md transition-all">
          <div>
            <div className="text-2xl mb-3 text-[#7a8e12]">✳</div>
            <h3 className="text-base font-black text-[#111111] mb-1.5 flex items-center justify-between">
              <span>Saved designs</span>
              {savedDesignsCount > 0 && (
                <span className="text-[11px] font-bold bg-[#d7ff3f] text-[#111111] px-2 py-0.5 rounded-full">
                  {savedDesignsCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Revisit your custom studio creations, modify typography, and re-order anytime.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('designs')}
            className="text-xs font-black text-[#111111] underline underline-offset-4 hover:text-[#7a8e12] transition-colors cursor-pointer text-left flex items-center gap-1 group"
          >
            <span>View designs</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
