import React, { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'L');
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const brandName = product.brand || 'OBRYNT';
  const categoryLabel = product.category || product.cat || 'Ready-to-Wear';
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct = hasDiscount
    ? Math.round((((product.originalPrice || 0) - product.price) / (product.originalPrice || 1)) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article
      onClick={() => onOpenDetail(product)}
      className="group relative bg-white flex flex-col cursor-pointer transition-all duration-300 border border-neutral-200 hover:border-black"
    >
      {/* Product Image Canvas (Consistent 3:4 Portrait Ratio) */}
      <div className="relative w-full aspect-[3/4] bg-[#f7f7f7] overflow-hidden flex items-center justify-center">
        {/* Wishlist Heart Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-20 ${
            isWishlisted
              ? 'bg-black text-white'
              : 'bg-white/80 hover:bg-white text-black opacity-80 hover:opacity-100 shadow-xs'
          }`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white text-white' : 'text-black'}`} />
        </button>

        {/* Discount Tag */}
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-3 left-3 bg-black text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 z-10">
            -{discountPct}%
          </span>
        )}

        {/* Product Photograph */}
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-100 text-neutral-400">
            <span className="font-luxury text-base font-bold tracking-[0.2em] text-neutral-600 mb-1">
              OBRYNT
            </span>
            <span className="text-[10px] uppercase tracking-wider">
              {product.colorName || 'Atelier Garment'}
            </span>
          </div>
        )}

        {/* Quick Add To Bag Hover Bar on Desktop */}
        <div className="absolute bottom-0 inset-x-0 p-3 hidden sm:block translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-full py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
              justAdded
                ? 'bg-neutral-800 text-white'
                : 'bg-black hover:bg-neutral-900 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ADDED TO BAG</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>QUICK ADD</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details Block */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Subtle Brand & Category Kicker */}
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-1">
            <span>{brandName}</span>
            <span className="text-neutral-300">·</span>
            <span>{categoryLabel}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-[13px] font-medium text-black leading-snug line-clamp-1 mb-2 group-hover:text-neutral-600 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price Row & Mobile Add Action */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-black tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-neutral-400 line-through tabular-nums">
                ₹{product.originalPrice?.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Mobile Quick Add Button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className="sm:hidden p-1.5 bg-black text-white hover:bg-neutral-800 transition-colors"
            title="Add to Bag"
            aria-label="Add to Bag"
          >
            {justAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
};
