import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  Star,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';
import { Product, ProductReview } from '../types';
import { getStoredReviews, getProductRatingData } from '../services/reviewService';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow?: (product: Product, size: string, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onOpenCustomStudio?: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts = [],
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
  onOpenCustomStudio,
  onSelectProduct,
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'L');
  const [selectedColor, setSelectedColor] = useState<string>(product.color || '#111111');
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

  // Reviews data
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  useEffect(() => {
    setReviewsList(getStoredReviews());
    setActiveImageIndex(0);
    setImageError(false);
    setSelectedSize(product.sizes?.[0] || 'L');
  }, [product.sku, product.id]);

  const ratingData = getProductRatingData(product.sku, reviewsList);
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct = hasDiscount
    ? Math.round((((product.originalPrice || 0) - product.price) / (product.originalPrice || 1)) * 100)
    : 0;

  const handleAdd = () => {
    onAddToCart(product, selectedSize, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1600);
  };

  const handleDirectBuy = () => {
    if (onBuyNow) {
      onBuyNow(product, selectedSize, quantity);
    } else {
      handleAdd();
    }
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeResult('FREE Express Delivery (₹0) available: 2–4 business days · Cash on Delivery & Express Courier eligible');
    } else {
      setPincodeResult('Please enter a valid 6-digit Indian PIN code');
    }
  };

  // Curated Related Products
  const relatedProducts = allProducts
    .filter((p) => p.sku !== product.sku && (p.category === product.category || p.audience === product.audience))
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white text-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-300 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <span className="font-luxury text-sm font-bold tracking-[0.2em] uppercase text-black">
              OBRYNT
            </span>
            <span className="text-neutral-300">/</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              {product.category || product.cat} · {product.audience || 'Unisex'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer"
            aria-label="Close product view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Gallery & Multiple Images */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-[#f7f7f7] border border-neutral-200 overflow-hidden flex items-center justify-center">
                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 shadow-xs ${
                    isWishlisted ? 'bg-black text-white' : 'bg-white/80 hover:bg-white text-black'
                  }`}
                  aria-label="Wishlist toggle"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : 'text-black'}`} />
                </button>

                {/* Main Selected Image */}
                {allImages.length > 0 && !imageError ? (
                  <img
                    src={allImages[activeImageIndex] || allImages[0]}
                    alt={product.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-8">
                    <span className="font-luxury text-xl font-bold uppercase tracking-[0.2em] text-neutral-700 block mb-2">
                      OBRYNT
                    </span>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider">
                      {product.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-20 border transition-all cursor-pointer overflow-hidden shrink-0 ${
                        activeImageIndex === idx ? 'border-black' : 'border-neutral-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Contiguous Purchase Module */}
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-400 block mb-1.5">
                  {product.brand || 'OBRYNT ATELIER'}
                </span>
                <h1 className="font-luxury text-2xl sm:text-3xl font-bold text-black tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Verified reviews */}
                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                  <div className="flex items-center text-black">
                    <Star className="w-3.5 h-3.5 fill-black text-black" />
                    <span className="font-bold ml-1 tabular-nums">{product.rating || 4.8}</span>
                  </div>
                  <span>·</span>
                  <span>{product.reviewCount || 34} verified client reviews</span>
                </div>
              </div>

              {/* Price Line */}
              <div className="flex items-baseline gap-2.5 py-3 border-y border-neutral-100">
                <span className="text-2xl sm:text-3xl font-bold text-black tabular-nums">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    ₹{product.originalPrice?.toLocaleString('en-IN')}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-[11px] font-bold text-black uppercase tracking-wider bg-neutral-100 px-2 py-0.5">
                    Save {discountPct}%
                  </span>
                )}
                <span className="text-xs text-neutral-400 ml-auto font-normal">
                  All taxes included
                </span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-black">
                      Select Size: <strong className="font-bold">{selectedSize}</strong>
                    </span>
                    <span className="text-neutral-400 underline cursor-pointer text-[11px]">
                      Size Guide
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-[48px] h-10 px-3 text-xs font-bold uppercase transition-colors cursor-pointer border ${
                          selectedSize === s
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-neutral-200 hover:border-black'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold uppercase tracking-wider text-black">Quantity:</span>
                <div className="flex items-center border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-neutral-400 text-[11px]">In stock · Dispatched in 24 hours</span>
              </div>

              {/* Action Buttons: Add to Bag & Buy Now */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    addedSuccess
                      ? 'bg-neutral-800 text-white'
                      : 'bg-black hover:bg-neutral-900 text-white shadow-lg'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ADDED TO BAG</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO BAG</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectBuy}
                  className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.2em] border border-neutral-300 transition-colors cursor-pointer"
                >
                  BUY NOW
                </button>
              </div>

              {/* Delivery Estimator Strip */}
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black">
                  <Truck className="w-4 h-4" />
                  <span>Check Delivery & Availability</span>
                </div>
                <form onSubmit={checkPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code"
                    className="flex-1 border border-neutral-300 px-3 py-2 text-xs text-black outline-hidden focus:border-black font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {pincodeResult && (
                  <p className="text-[11px] text-neutral-600 font-medium">{pincodeResult}</p>
                )}
              </div>

              {/* Trust Details */}
              <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-3 text-[11px] text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" />
                  <span>100% Genuine OBRYNT</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-black" />
                  <span>7-Day Return Policy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="pt-8 border-t border-neutral-200">
              <h3 className="font-luxury text-sm sm:text-base font-bold uppercase tracking-[0.16em] text-black mb-4">
                You May Also Admire
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.sku || rel.id}
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(rel);
                    }}
                    className="group cursor-pointer border border-neutral-200 hover:border-black transition-colors"
                  >
                    <div className="aspect-[3/4] bg-neutral-100 overflow-hidden">
                      <img
                        src={rel.imageUrl}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-2.5 bg-white">
                      <h4 className="text-xs font-medium text-black line-clamp-1">{rel.name}</h4>
                      <span className="text-xs font-bold text-black tabular-nums mt-1 block">
                        ₹{rel.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
