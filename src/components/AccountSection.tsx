import React from 'react';
import { Package, CreditCard, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

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
    <section id="account" className="my-14 sm:my-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-8 border-b border-neutral-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-1">
            CLIENT SERVICES & ORDER SUITE
          </span>
          <h2 className="font-luxury text-2xl sm:text-4xl font-bold tracking-[0.08em] text-black uppercase">
            Private Client Portal
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md font-normal leading-relaxed">
          Manage your tracked shipments, invoices, saved wishlist edits, and bespoke silhouettes in one dedicated space.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Order history */}
        <div className="bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
              <Package className="w-4 h-4 text-black" />
            </div>
            <h3 className="font-luxury text-sm font-bold tracking-[0.14em] uppercase text-black mb-2 flex items-center justify-between">
              <span>Orders & Tracking</span>
              {ordersCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-black text-white px-1.5 py-0.5">
                  {ordersCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6 font-normal">
              Review live shipment manifests, courier tracking links, and official delivery statuses.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('orders')}
            className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer group"
          >
            <span>View Orders</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 2: Transaction history */}
        <div className="bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
              <CreditCard className="w-4 h-4 text-black" />
            </div>
            <h3 className="font-luxury text-sm font-bold tracking-[0.14em] uppercase text-black mb-2 flex items-center justify-between">
              <span>Invoices & Payments</span>
              {transactionsCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-neutral-100 text-black px-1.5 py-0.5">
                  {transactionsCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6 font-normal">
              Review payment confirmations, GST receipts, and transaction reference numbers.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('transactions')}
            className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer group"
          >
            <span>View Invoices</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 3: Wishlist */}
        <div className="bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
              <Heart className="w-4 h-4 text-black" />
            </div>
            <h3 className="font-luxury text-sm font-bold tracking-[0.14em] uppercase text-black mb-2 flex items-center justify-between">
              <span>Saved Wishlist</span>
              {wishlistCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-neutral-100 text-black px-1.5 py-0.5">
                  {wishlistCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6 font-normal">
              Curate your personal seasonal lookbook and transfer saved garments to your bag anytime.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('wishlist')}
            className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer group"
          >
            <span>View Wishlist</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 4: Bespoke designs */}
        <div className="bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <h3 className="font-luxury text-sm font-bold tracking-[0.14em] uppercase text-black mb-2 flex items-center justify-between">
              <span>Custom Artworks</span>
              {savedDesignsCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-neutral-100 text-black px-1.5 py-0.5">
                  {savedDesignsCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-6 font-normal">
              Access your saved bespoke silkscreen prints and continue editing your custom designs.
            </p>
          </div>
          <button
            onClick={() => onOpenModal('designs')}
            className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer group"
          >
            <span>Open Designs</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
