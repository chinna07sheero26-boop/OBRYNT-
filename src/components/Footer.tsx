import React from 'react';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (category: string) => void;
  onOpenAccount: (tab?: 'orders' | 'transactions' | 'wishlist' | 'designs') => void;
  onScrollToStudio: () => void;
  isOwnerAuthenticated?: boolean;
  onOpenOwnerDashboard?: () => void;
  isStaffAuthenticated?: boolean;
  onOpenStaffLogin?: () => void;
  isDeliveryAuth?: boolean;
  onOpenDeliveryLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenAccount,
  onScrollToStudio,
  isOwnerAuthenticated = false,
  onOpenOwnerDashboard,
  isStaffAuthenticated = false,
  onOpenStaffLogin,
  isDeliveryAuth = false,
  onOpenDeliveryLogin,
}) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToShop = () => {
    onSelectCategory('All');
    const el = document.getElementById('shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111111] text-white pt-12 sm:pt-16 pb-12 mt-16 sm:mt-24 border-t border-stone-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-stone-800">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <button
              onClick={scrollToTop}
              className="text-2xl sm:text-3xl font-black tracking-[0.16em] text-white hover:opacity-90 transition-opacity mb-4 inline-block cursor-pointer text-left"
            >
              OBRYNT<span className="text-[#d7ff3f]">.</span>
            </button>
            <p className="text-stone-400 text-sm leading-relaxed max-w-sm mb-4">
              Wear your identity.<br />
              Everyday apparel, footwear, beauty essentials, and a live custom design studio built for personal expression.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <span className="w-2 h-2 rounded-full bg-[#d7ff3f]" />
              <span>Free Delivery on Orders Above ₹999</span>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d7ff3f] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-300">
              <li>
                <button
                  onClick={scrollToShop}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shop all collection
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToStudio}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Custom Design Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('categories');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Explore Categories
                </button>
              </li>
              <li>
                <a
                  href="./backup-obrynt-original.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-400 hover:text-[#d7ff3f] transition-colors"
                >
                  Original Single-File Backup (.html)
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d7ff3f] mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-300">
              <li>
                <button
                  onClick={() => onOpenAccount('orders')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Order history & tracking
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAccount('transactions')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Transaction history
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAccount('wishlist')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Saved wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAccount('designs')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Bespoke saved designs
                </button>
              </li>
              <li>
                <a
                  href="mailto:support@obrynt.example"
                  className="hover:text-white transition-colors text-stone-400"
                >
                  Contact support (demo)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Back to Top & Discreet Merchant Access */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>
            © {currentYear} OBRYNT Co. All rights reserved. Demo storefront. Product listings, prices and custom studio previews are examples.
          </p>

          <div className="flex items-center gap-3">
            {onOpenStaffLogin && (
              <button
                onClick={onOpenStaffLogin}
                className="text-[10px] text-stone-500 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Staff Operations & Fulfillment Portal"
              >
                {isStaffAuthenticated ? '• Staff Operations (Active)' : '• Staff Portal'}
              </button>
            )}

            {onOpenDeliveryLogin && (
              <button
                onClick={onOpenDeliveryLogin}
                className="text-[10px] text-stone-500 hover:text-amber-400 transition-colors cursor-pointer"
                title="Restricted Courier & Delivery Partner Portal"
              >
                {isDeliveryAuth ? '• Courier Hub (Active)' : '• Courier Portal'}
              </button>
            )}

            {onOpenOwnerDashboard && (
              <button
                onClick={onOpenOwnerDashboard}
                className="text-[10px] text-stone-600 hover:text-[#d7ff3f] transition-colors cursor-pointer"
                title="Store Owner Portal"
              >
                {isOwnerAuthenticated ? '• Owner OS (Active)' : '• Owner Portal'}
              </button>
            )}

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-full text-xs transition-colors cursor-pointer border border-stone-800"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
