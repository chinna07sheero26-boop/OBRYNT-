import React from 'react';
import { X, Trash2, ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveWishlist: (sku: string) => void;
  onAddToCart: (product: Product, size: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveWishlist,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              <h2 className="text-lg font-bold text-stone-900 font-display">Saved Garments</h2>
              <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-mono font-semibold tabular-nums">
                {wishlist.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="text-base font-semibold text-stone-900">No saved garments yet</div>
                <p className="text-xs text-stone-500 max-w-xs">
                  Tap the heart icon on any t-shirt, jeans, or hoodie to save it for later.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 text-xs font-semibold text-white bg-stone-950 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  Explore Catalogue
                </button>
              </div>
            ) : (
              wishlist.map((product) => (
                <div
                  key={product.sku}
                  className="flex gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200/80 items-center"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-18 h-22 object-cover rounded-lg bg-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                      {product.name}
                    </h4>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {product.category} · {product.color}
                    </div>
                    <div className="text-xs font-bold font-mono text-stone-950 mt-1 tabular-nums">
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          onAddToCart(product, product.sizes[0] || 'M');
                          onRemoveWishlist(product.sku);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                      <button
                        onClick={() => onRemoveWishlist(product.sku)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
