import React, { useState } from 'react';
import { Heart, ShoppingBag, Check, Star } from 'lucide-react';
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
  const audienceLabel = product.audience || product.aud || 'Unisex';
  const categoryLabel = product.category || product.cat || 'Apparel';
  const tagLabel = product.tag || product.badge || product.brand || 'POPULAR';
  const type = product.type || 'shirt';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const getGarmentClass = () => {
    switch (type) {
      case 'shoe':
        return 'w-[150px] h-[80px] clip-shoe';
      case 'bottle':
        return 'w-[80px] h-[140px] clip-bottle';
      case 'bag':
        return 'w-[130px] h-[120px] clip-bag';
      case 'shirt':
      default:
        return 'w-[125px] h-[145px] clip-shirt';
    }
  };

  return (
    <article
      onClick={() => onOpenDetail(product)}
      className="group bg-white border border-[#e4e1da] rounded-[18px] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    >
      {/* Product Art Container */}
      <div className="h-[210px] sm:h-[230px] bg-[#eeede8] relative flex items-center justify-center overflow-hidden transition-colors group-hover:bg-[#e7e6e0]">
        {/* Tag Pill */}
        <span className="absolute top-3 left-3 bg-[#d7ff3f] text-[#111111] px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase z-10 shadow-xs">
          {product.brand ? product.brand : tagLabel}
        </span>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-10 shadow-xs ${
            isWishlisted
              ? 'bg-red-50 text-red-600 scale-110'
              : 'bg-white/80 hover:bg-white text-stone-700 hover:text-black'
          }`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
        </button>

        {/* Product Image with Fallback to Stylized Geometry */}
        <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105 w-full h-full p-4">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              className="max-h-[175px] max-w-[175px] w-auto h-auto object-contain drop-shadow-md rounded-lg"
            />
          ) : (
            <div
              className={`${getGarmentClass()} shadow-xl relative transition-all duration-200 flex items-center justify-center`}
              style={{ backgroundColor: product.color || '#171717' }}
            >
              {type === 'shirt' && (
                <div
                  className="text-[10px] font-black tracking-widest uppercase opacity-40 select-none pointer-events-none"
                  style={{
                    color: product.color === '#f5f4ed' || product.color === '#d5d0c5' || product.color === '#f4f1e8' ? '#111' : '#fff',
                  }}
                >
                  {product.brand || 'OBRYNT'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock badge if low */}
        {product.stock < 35 && product.stock > 0 && (
          <span className="absolute bottom-2.5 left-3 text-[10px] font-bold text-amber-700 bg-amber-50/90 px-1.5 py-0.5 rounded">
            Only {product.stock} left
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#6b6b6b] mb-1">
            {audienceLabel} · {categoryLabel}
          </div>

          <h3 className="font-extrabold text-[15px] text-[#111111] leading-snug line-clamp-1 mb-2 group-hover:text-black">
            {product.name}
          </h3>

          {/* Quick Size Pills */}
          {product.sizes && product.sizes.length > 1 && (
            <div
              className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar py-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] text-stone-400 uppercase font-bold shrink-0">Size:</span>
              {product.sizes.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer shrink-0 ${
                    selectedSize === s
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-[#e4e1da]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price & Add to Bag Row */}
        <div className="pt-2 border-t border-[#e4e1da]/60 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-[#111111] tabular-nums tracking-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-stone-400 line-through tabular-nums">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            className={`px-3 py-2 rounded-full text-xs font-black tracking-wide transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs ${
              justAdded
                ? 'bg-[#7a8e12] text-white'
                : 'bg-[#111111] hover:bg-black text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ADDED</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#d7ff3f]" />
                <span>ADD TO BAG +</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
