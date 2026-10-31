import { ProductReview } from '../types';

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-01',
    sku: 'TL-PTS-001',
    author: 'Vikram Mehta',
    rating: 5,
    date: '18 Oct 2026',
    title: 'Heaviest and cleanest cotton tee I have owned in India',
    comment: 'The 240 GSM weight is extraordinary. Collar sits flat without stretching out even after 4 washes. The boxy cut pairs perfectly with selvedge denim.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
  {
    id: 'rev-02',
    sku: 'TL-PTS-001',
    author: 'Ananya Roy',
    rating: 5,
    date: '12 Oct 2026',
    title: 'Perfect oversized silhouette',
    comment: 'Got size M for an oversized streetwear look. Fabric feels dense and luxurious, not flimsy like fast fashion brands.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
  {
    id: 'rev-03',
    sku: 'TL-PTS-002',
    author: 'Rohan Deshmukh',
    rating: 5,
    date: '20 Oct 2026',
    title: 'Supima cotton feels silky smooth',
    comment: 'Californian Supima cotton is genuinely breathable for Indian climate. Fantastic finish.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
  {
    id: 'rev-04',
    sku: 'TL-HOD-001',
    author: 'Karan Singhania',
    rating: 5,
    date: '15 Oct 2026',
    title: '450 GSM French Terry is indestructible',
    comment: 'The double-layered hood holds its shape standing up. No unnecessary drawstrings. Sage green colorway is subtle and clean.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
  {
    id: 'rev-05',
    sku: 'TL-JNS-001',
    author: 'Sameer Sen',
    rating: 5,
    date: '08 Oct 2026',
    title: 'Authentic redline Japanese selvedge denim',
    comment: 'Raw 14oz denim is stiff at first as it should be, but molds into your body after a week. True artisan craftsmanship.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
  {
    id: 'rev-06',
    sku: 'TL-GYM-001',
    author: 'Aditya Nair',
    rating: 5,
    date: '22 Oct 2026',
    title: 'Superior ventilation during heavy workouts',
    comment: 'The micro-perforations wick away sweat rapidly. Does not cling to the chest during deadlifts or runs.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
  {
    id: 'rev-07',
    sku: 'TL-SHT-001',
    author: 'Nikhil Bose',
    rating: 5,
    date: '10 Oct 2026',
    title: 'Breathable linen with relaxed drape',
    comment: 'The Cuban open collar sits nicely over plain black and white undershirts. Natural texture looks elevated.',
    verifiedPurchase: true,
    fitFeedback: 'True to Size',
  },
];

export function getStoredReviews(): ProductReview[] {
  try {
    const saved = localStorage.getItem('threadlab_reviews');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_REVIEWS;
}

export function saveReview(newReview: Omit<ProductReview, 'id' | 'date' | 'verifiedPurchase'>): ProductReview {
  const all = getStoredReviews();
  const created: ProductReview = {
    ...newReview,
    id: `rev-${Date.now()}`,
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    verifiedPurchase: true,
  };

  const updated = [created, ...all];
  try {
    localStorage.setItem('threadlab_reviews', JSON.stringify(updated));
  } catch {
    // ignore
  }
  return created;
}

export function getProductRatingData(sku: string, allReviews: ProductReview[]) {
  const productReviews = allReviews.filter((r) => r.sku === sku);

  // If specific SKU doesn't have custom reviews yet, generate realistic baseline data based on category
  const count = productReviews.length > 0 ? productReviews.length : 16;
  const avg =
    productReviews.length > 0
      ? Number((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
      : 4.9;

  return {
    averageRating: avg,
    totalReviews: count,
    reviews: productReviews,
  };
}
