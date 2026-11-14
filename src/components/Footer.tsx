import React from 'react';
import { ArrowUp, ArrowRight, ShieldCheck } from 'lucide-react';
import { ObryntLogo, OBRYNT_EMBLEM_SRC } from './ObryntBrand';

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
  isVendorAuth?: boolean;
  onOpenVendorLogin?: () => void;
  onOpenPartnerOnboarding?: () => void;
  onOpenGarmentStaffLogin?: () => void;
  onOpenRoadsideStaffLogin?: () => void;
  onOpenBrandAssets?: () => void;
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
  isVendorAuth = false,
  onOpenVendorLogin,
  onOpenPartnerOnboarding,
  onOpenGarmentStaffLogin,
  onOpenRoadsideStaffLogin,
  onOpenBrandAssets,
}) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryNav = (cat: string) => {
    onSelectCategory(cat);
    const el = document.getElementById('shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-white pt-16 sm:pt-20 pb-12 mt-16 sm:mt-24 border-t border-neutral-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-14 border-b border-neutral-800">
          
          {/* Column 1: Brand & Atelier Ethos */}
          <div className="space-y-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-3 text-left cursor-pointer group"
              aria-label="Back to top"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0">
                <img
                  src={OBRYNT_EMBLEM_SRC}
                  alt="OBRYNT"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-luxury text-2xl font-bold tracking-[0.24em] text-white">
                  OBRYNT
                </span>
                <span className="text-[8px] font-semibold tracking-[0.3em] uppercase text-neutral-400">
                  TIMELESS STYLE
                </span>
              </div>
            </button>

            <p className="text-xs text-neutral-400 leading-relaxed font-normal pt-1">
              An international fashion marketplace and bespoke design atelier. Precision-crafted silhouettes, architectural tailoring, and effortless staples.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-mono">
              <span>EST. 2026</span>
              <span>·</span>
              <span>PARIS / MILAN / INDIA</span>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white mb-5">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => handleCategoryNav('Women')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Women's Runway & Tailoring
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Men')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Men's Modern Silhouettes
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Kids')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Kids' Timeless Organic Basics
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Footwear')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Footwear & Italian Leather
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryNav('Bags & Accessories')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sculptural Bags & Accessories
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToStudio}
                  className="text-white hover:text-neutral-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Bespoke Design Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Experience */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white mb-5">
              Client Care
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => onOpenAccount('orders')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Order Tracking & History
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAccount('wishlist')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Saved Wishlist Items
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAccount('transactions')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Payment & Transaction Invoices
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAccount('designs')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Saved Custom Artworks
                </button>
              </li>
              <li>
                <span className="text-neutral-500">Express Delivery (2–4 Days)</span>
              </li>
              <li>
                <span className="text-neutral-500">7-Day Home Collection Returns</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Brand Hallmarks & Trust */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white mb-5">
              Brand Hallmarks
            </h4>
            <div className="p-4 bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Verified OBRYNT Atelier</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                100% authentic garments and accessories. Built with platinum silver hallmark security and Razorpay 256-bit encryption.
              </p>
            </div>

            {onOpenBrandAssets && (
              <button
                onClick={onOpenBrandAssets}
                className="text-xs text-neutral-400 hover:text-white uppercase tracking-wider font-semibold transition-colors cursor-pointer block"
              >
                Official Brand & Packaging Kit →
              </button>
            )}
          </div>
        </div>

        {/* Bottom Strip: Copyright & Portals */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p className="font-normal text-center sm:text-left">
            © {currentYear} OBRYNT Studio Co. All rights reserved. International Fashion Marketplace.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Discreet Staff Portal */}
            {onOpenStaffLogin && (
              <button
                onClick={onOpenStaffLogin}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                title="Company Staff Portal"
              >
                {isStaffAuthenticated ? '• Staff Console (Active)' : '• Staff Console'}
              </button>
            )}

            {/* Discreet Partner Registration & Partner Login */}
            {onOpenPartnerOnboarding && (
              <button
                onClick={onOpenPartnerOnboarding}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                title="Register as Supplier, Garment Shop, or Roadside Store"
              >
                • Partner Onboarding
              </button>
            )}

            {onOpenVendorLogin && (
              <button
                onClick={onOpenVendorLogin}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                title="Partner Console Login"
              >
                {isVendorAuth ? '• Partner Portal (Active)' : '• Partner Portal'}
              </button>
            )}

            {onOpenGarmentStaffLogin && (
              <button
                onClick={onOpenGarmentStaffLogin}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                title="Private Garment Shop Staff Login"
              >
                • Garment Staff Login
              </button>
            )}

            {onOpenRoadsideStaffLogin && (
              <button
                onClick={onOpenRoadsideStaffLogin}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                title="Private Roadside Store Staff Login"
              >
                • Roadside Staff Login
              </button>
            )}

            {/* Discreet Courier Portal */}
            {onOpenDeliveryLogin && (
              <button
                onClick={onOpenDeliveryLogin}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                title="Restricted Courier Portal"
              >
                {isDeliveryAuth ? '• Courier Hub (Active)' : '• Courier Hub'}
              </button>
            )}

            {/* Discreet Owner Portal */}
            {onOpenOwnerDashboard && (
              <button
                onClick={onOpenOwnerDashboard}
                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer font-bold"
                title="Store Owner Admin"
              >
                {isOwnerAuthenticated ? '• Owner OS (Active)' : '• Owner Portal'}
              </button>
            )}

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs uppercase tracking-wider transition-colors cursor-pointer border border-neutral-800"
            >
              <span>TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
