import React, { useState } from 'react';
import { ObryntLogo, OBRYNT_EMBLEM_SRC } from './ObryntBrand';
import { Search, Heart, ShoppingBag, User, Sparkles, X, Menu, ArrowRight } from 'lucide-react';

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
  announcementText = 'COMPLIMENTARY WORLDWIDE EXPRESS DELIVERY ON ORDERS OVER ₹1,499 · DISCOVER AUTUMN / WINTER 2026',
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { label: 'Home', value: 'All' },
    { label: 'Men', value: 'Men' },
    { label: 'Women', value: 'Women' },
    { label: 'Kids', value: 'Kids' },
    { label: 'Trending', value: 'Trending' },
    { label: 'New Arrivals', value: 'New Arrivals' },
    { label: 'Accessories', value: 'Bags & Accessories' },
    { label: 'Footwear', value: 'Footwear' },
  ];

  const handleNavClick = (val: string) => {
    setIsMobileMenuOpen(false);
    if (val === 'All') {
      onSelectCategory('All');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onSelectCategory(val);
      const el = document.getElementById('shop');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Top Editorial Announcement Strip */}
      <div className="bg-black text-white text-center py-2 px-4 text-[10px] sm:text-[11px] font-medium tracking-[0.22em] uppercase border-b border-neutral-800 flex items-center justify-center gap-2">
        <span>{announcementText}</span>
      </div>

      {/* Main Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-black hover:text-neutral-600 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Left / Center: Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                onSelectCategory('All');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-left"
              aria-label="OBRYNT Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-neutral-300 bg-black shrink-0 transition-transform duration-300 group-hover:scale-105">
                <img
                  src={OBRYNT_EMBLEM_SRC}
                  alt="OBRYNT"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-luxury text-xl sm:text-2xl font-black tracking-[0.24em] uppercase text-black leading-none">
                  OBRYNT
                </span>
                <span className="text-[8px] font-semibold tracking-[0.3em] uppercase text-neutral-400 mt-0.5">
                  TIMELESS STYLE
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 ml-6" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = activeCategory === item.value || (item.value === 'All' && activeCategory === 'All');
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.value)}
                    className={`text-[12px] uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer py-1 relative ${
                      isActive
                        ? 'text-black font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onSelectCategory('Custom Design');
                  onScrollToStudio();
                }}
                className="text-[12px] uppercase tracking-[0.16em] font-bold text-black transition-colors cursor-pointer py-1 relative flex items-center gap-1 hover:text-neutral-600"
              >
                <span>Bespoke Studio</span>
                <Sparkles className="w-3 h-3 text-neutral-800" />
              </button>
            </nav>
          </div>

          {/* Right Action Icons: Search, Wishlist, Account, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Input on Desktop */}
            <div className="relative hidden md:flex items-center">
              <div className="flex items-center bg-neutral-100/80 hover:bg-neutral-100 focus-within:bg-white border border-transparent focus-within:border-black rounded-none px-3 py-1.5 transition-all w-48 lg:w-60">
                <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full bg-transparent border-0 outline-hidden text-xs text-black placeholder:text-neutral-400 font-normal"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="text-neutral-400 hover:text-black p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-black hover:text-neutral-600 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Account Icon */}
            <button
              onClick={() => onOpenAccount('orders')}
              className="p-2 text-black hover:text-neutral-600 transition-colors cursor-pointer relative"
              title="My Account"
              aria-label="My Account"
            >
              <User className="w-4 h-4" />
              {ordersCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-black" />
              )}
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={onOpenWishlist}
              className="p-2 text-black hover:text-neutral-600 transition-colors cursor-pointer relative"
              title="Saved Wishlist"
              aria-label="Saved Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-black text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center leading-none py-0.5">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart / Shopping Bag */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer tracking-wider text-xs font-semibold"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.14em]">Bag</span>
              <span className="text-[11px] font-bold tabular-nums">({cartCount})</span>
            </button>

            {/* Owner Portal (discreet button visible only to authenticated owner) */}
            {isOwnerAuthenticated && onOpenOwnerDashboard && (
              <button
                onClick={onOpenOwnerDashboard}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-neutral-300"
                title="Open Owner Dashboard"
              >
                <span>Owner Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Overlay Bar */}
        {isSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-neutral-100 bg-white pt-2">
            <div className="flex items-center bg-neutral-100 border border-neutral-300 px-3 py-2">
              <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search collection, category, designer..."
                className="w-full bg-transparent border-0 outline-hidden text-xs text-black placeholder:text-neutral-400"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="text-neutral-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Slide-down Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-neutral-200 px-6 py-6 space-y-4 shadow-xl animate-in fade-in duration-150">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.value)}
                  className={`text-left text-sm uppercase tracking-[0.18em] font-semibold py-1.5 flex items-center justify-between border-b border-neutral-100 ${
                    activeCategory === item.value ? 'text-black font-black' : 'text-neutral-600'
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              ))}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectCategory('Custom Design');
                  onScrollToStudio();
                }}
                className="text-left text-sm uppercase tracking-[0.18em] font-bold text-black py-2 flex items-center justify-between border-b border-neutral-100"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Bespoke Studio</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-neutral-500">
              <button onClick={() => onOpenAccount('orders')} className="hover:text-black">
                My Orders
              </button>
              <button onClick={onOpenWishlist} className="hover:text-black">
                Wishlist ({wishlistCount})
              </button>
              <button onClick={onOpenCart} className="hover:text-black font-bold text-black">
                Bag ({cartCount})
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
