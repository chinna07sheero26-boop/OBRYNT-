import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Check,
  ShieldCheck,
  Ruler,
  Truck,
  Star,
  Sparkles,
} from 'lucide-react';
import { Product, ProductReview } from '../types';
import { getStoredReviews, saveReview, getProductRatingData } from '../services/reviewService';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onOpenCustomStudio?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onOpenCustomStudio,
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'L');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);

  const allImages = [
    product.imageUrl,
    ...(Array.isArray(product.galleryUrls) ? product.galleryUrls : []),
  ].filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  useEffect(() => {
    setReviewsList(getStoredReviews());
    setActiveImageIndex(0);
    setImageError(false);
  }, [product.sku]);

  const ratingData = getProductRatingData(product.sku, reviewsList);
  const type = product.type || 'shirt';

  const handleAdd = () => {
    onAddToCart(product, selectedSize, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1600);
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeResult('Delivery available: Standard (3-4 days) · Cash on Delivery available');
    } else {
      setPincodeResult('Please enter a valid 6-digit Indian PIN code');
    }
  };

  const getGarmentClass = () => {
    switch (type) {
      case 'shoe':
        return 'w-[180px] h-[95px] clip-shoe';
      case 'bottle':
        return 'w-[100px] h-[170px] clip-bottle';
      case 'bag':
        return 'w-[150px] h-[140px] clip-bag';
      case 'shirt':
      default:
        return 'w-[150px] h-[175px] clip-shirt';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4e1da]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e4e1da] flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#d7ff3f] text-[#111111]">
              {product.tag || product.badge || 'OBRYNT ORIGINAL'}
            </span>
            <span className="text-xs text-stone-500 font-bold">
              {product.audience || product.aud || 'Unisex'} · {product.category || product.cat}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Left Column: Visual Artwork, Images & Gallery */}
          <div className="bg-[#eeede8] rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center min-h-[320px] relative shadow-inner">
            <button
              onClick={() => onToggleWishlist(product)}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-xs transition-transform cursor-pointer z-10 ${
                isWishlisted ? 'bg-red-50 text-red-600 scale-110' : 'bg-white/80 hover:bg-white text-stone-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
            </button>

            {/* Main Image or Silhouette */}
            <div className="relative flex items-center justify-center w-full min-h-[220px]">
              {allImages.length > 0 && !imageError ? (
                <img
                  src={allImages[activeImageIndex] || allImages[0]}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="max-h-[240px] max-w-full object-contain rounded-xl drop-shadow-lg"
                />
              ) : (
                <div
                  className={`${getGarmentClass()} shadow-2xl relative transition-all duration-300 hover:scale-105 flex items-center justify-center`}
                  style={{ backgroundColor: product.color || '#171717' }}
                >
                  {type === 'shirt' && (
                    <div
                      className="text-xs font-black tracking-widest uppercase opacity-40 select-none pointer-events-none"
                      style={{
                        color: product.color === '#f5f4ed' || product.color === '#d5d0c5' ? '#111' : '#fff',
                      }}
                    >
                      {product.brand || 'OBRYNT'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gallery Thumbnails Strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar py-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activeImageIndex === idx ? 'border-[#111111] scale-105 shadow-sm' : 'border-stone-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 text-xs font-bold text-stone-600">
              Color: <strong>{product.colorName || 'Signature'}</strong> ({product.color})
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight leading-snug">
                {product.name}
              </h2>

              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black ml-1 text-stone-900 tabular-nums">
                    {product.rating || ratingData.averageRating}
                  </span>
                </div>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-stone-500 font-medium">
                  {product.reviewCount || ratingData.totalReviews} verified reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-[#111111] tabular-nums">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-stone-400 line-through tabular-nums">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-[11px] font-bold text-[#7a8e12] bg-[#d7ff3f]/30 px-2 py-0.5 rounded">
                Inclusive of all taxes
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2">
                  Select Size: <strong>{selectedSize}</strong>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        selectedSize === s
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border-[#e4e1da]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-stone-600">Quantity:</span>
              <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 cursor-pointer text-xs"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-black tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 cursor-pointer text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary Buy CTA */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleAdd}
                className={`w-full py-3.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  addedSuccess
                    ? 'bg-[#7a8e12] text-white'
                    : 'bg-[#111111] hover:bg-black text-[#d7ff3f]'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ADDED TO BAG!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO BAG · ₹{(product.price * quantity).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>

              {product.category === 'Custom Design' && onOpenCustomStudio && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCustomStudio();
                  }}
                  className="w-full py-2.5 bg-[#d7ff3f]/20 hover:bg-[#d7ff3f]/40 text-[#111111] border border-[#d7ff3f] rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7a8e12]" />
                  <span>Customize in 3D Studio</span>
                </button>
              )}
            </div>

            {/* Pincode Estimator */}
            <div className="pt-3 border-t border-[#e4e1da]">
              <form onSubmit={checkPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 bg-stone-50 border border-[#e4e1da] rounded-xl px-3 py-1.5 text-xs font-bold outline-hidden focus:border-black"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 rounded-xl text-xs font-bold text-stone-800 transition-colors cursor-pointer"
                >
                  Check
                </button>
              </form>
              {pincodeResult && (
                <p className="text-[11px] font-bold text-[#7a8e12] mt-1.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{pincodeResult}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
