import React from 'react';
import { ObryntLogo } from './ObryntBrand';
import { Search, Heart, ShoppingBag, User, Sparkles, X } from 'lucide-react';
import { ALL_CATEGORIES, Category } from '../types';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  ordersCount: number;
  activeCategory: string;
  announcementText?: string;
  isOwnerAuthenticated?: boolean;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: (tab?: 'orders' | 'transactions' | 'wishlist' | 'designs') => void;
  onOpenOwnerDashboard?: () => void;
  onScrollToStudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  ordersCount,
  activeCategory,
  announcementText = 'INTRODUCING OBRYNT · FASHION WITHOUT LIMITS · DESIGN IT YOUR WAY',
  isOwnerAuthenticated = false,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  onOpenOwnerDashboard,
  onScrollToStudio,
}) => {
  const handleCategoryClick = (cat: string) => {
    if (cat === 'Custom Design' || cat === 'Custom Design Studio') {
      onSelectCategory('Custom Design');
      onScrollToStudio();
    } else {
      onSelectCategory(cat);
      const shopEl = document.getElementById('shop');
      if (shopEl) {
        shopEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* OBRYNT Top Announcement Bar */}
      <div className="bg-[#d7ff3f] text-[#111111] text-center py-2 px-4 text-xs font-black tracking-widest uppercase selection:bg-black selection:text-[#d7ff3f] flex items-center justify-center gap-2">
        <span>{announcementText}</span>
      </div>

      {/* Main Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e4e1da] transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 md:gap-8">
          {/* Official OBRYNT Brand Logo */}
          <button
            onClick={() => {
              onSelectCategory('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:opacity-90 transition-opacity shrink-0 cursor-pointer text-left"
            aria-label="OBRYNT Home"
          >
            <ObryntLogo variant="horizontal" size="md" theme="light" showSubtitle={true} />
          </button>

          {/* Search Form */}
          <div className="flex-1 max-w-[480px] hidden sm:flex items-center bg-[#fafafa] border border-[#e4e1da] rounded-full px-3.5 py-1.5 focus-within:border-[#111111] focus-within:bg-white transition-all shadow-xs">
            <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search clothing, shoes, beauty..."
              className="w-full bg-transparent border-0 outline-hidden text-sm text-[#111111] placeholder:text-stone-400"
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Top Actions: Account, Wishlist, Bag */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Account pill */}
            <button
              onClick={() => onOpenAccount('orders')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#e4e1da] bg-white hover:bg-stone-50 text-[#111111] rounded-full text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shadow-xs"
              title="My Account"
            >
              <User className="w-3.5 h-3.5 text-stone-600" />
              <span>Account</span>
              {ordersCount > 0 && (
                <span className="ml-1 w-2 h-2 rounded-full bg-[#7a8e12]" />
              )}
            </button>

            {/* Wishlist pill */}
            <button
              onClick={onOpenWishlist}
              className="inline-flex items-center gap-1 px-3 py-2 border border-[#e4e1da] bg-white hover:bg-stone-50 text-[#111111] rounded-full text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shadow-xs"
              title="View Wishlist"
            >
              <Heart className="w-3.5 h-3.5 text-[#111111]" />
              <span className="hidden sm:inline">Saved</span>
              {wishlistCount > 0 && (
                <span className="bg-[#111111] text-[#d7ff3f] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Bag pill */}
            <button
              onClick={onOpenCart}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-full text-xs sm:text-[13px] font-black transition-transform active:scale-95 cursor-pointer shadow-sm"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#d7ff3f]" />
              <span>Bag</span>
              <span className="bg-[#d7ff3f] text-[#111111] text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {cartCount}
              </span>
            </button>

            {/* Owner Portal Button - ONLY visible to the authenticated store owner */}
            {isOwnerAuthenticated && onOpenOwnerDashboard && (
              <button
                onClick={onOpenOwnerDashboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-black text-[#d7ff3f] rounded-full text-xs sm:text-[13px] font-black transition-colors cursor-pointer shadow-xs border border-stone-800"
                title="Merchant & Owner Control Center"
              >
                <span className="w-2 h-2 rounded-full bg-[#d7ff3f] animate-pulse" />
                <span className="hidden md:inline">Owner</span>
                <span>Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="sm:hidden px-4 pb-3">
          <div className="flex items-center bg-[#fafafa] border border-[#e4e1da] rounded-full px-3 py-1.5">
            <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search clothing, shoes, beauty..."
              className="w-full bg-transparent border-0 outline-hidden text-sm text-[#111111]"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="p-1 text-stone-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Bar (Preserving all categories) */}
        <nav
          className="flex items-center gap-6 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 py-2.5 bg-white border-t border-[#e4e1da]/60 text-xs sm:text-[13px] font-bold text-[#222222] whitespace-nowrap"
          aria-label="Main navigation"
        >
          <button
            onClick={() => handleCategoryClick('All')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'All' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => handleCategoryClick('Men')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Men' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Men
          </button>
          <button
            onClick={() => handleCategoryClick('Women')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Women' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Women
          </button>
          <button
            onClick={() => handleCategoryClick('T-Shirts')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'T-Shirts' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            T-Shirts
          </button>
          <button
            onClick={() => handleCategoryClick('Gym & Sports')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Gym & Sports' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Gym & Sports
          </button>
          <button
            onClick={() => handleCategoryClick('Innerwear')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Innerwear' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Innerwear
          </button>
          <button
            onClick={() => handleCategoryClick('Footwear')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Footwear' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Footwear
          </button>
          <button
            onClick={() => handleCategoryClick('Bags & Accessories')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Bags & Accessories' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Bags & Accessories
          </button>
          <button
            onClick={() => handleCategoryClick('Beauty & Makeup')}
            className={`transition-colors cursor-pointer hover:underline underline-offset-6 ${
              activeCategory === 'Beauty & Makeup' ? 'text-[#111111] font-black underline' : 'text-stone-600'
            }`}
          >
            Beauty & Makeup
          </button>
          <button
            onClick={onScrollToStudio}
            className="inline-flex items-center gap-1.5 text-[#111111] font-black bg-[#d7ff3f] hover:bg-[#c9f530] px-3 py-1 rounded-full text-xs transition-colors cursor-pointer shadow-xs ml-auto"
          >
            <Sparkles className="w-3 h-3 text-[#111111]" />
            <span>Custom Design Studio</span>
          </button>
        </nav>
      </header>
    </>
  );
};
