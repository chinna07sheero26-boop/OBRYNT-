// OBRYNT AI Clothing Design Studio Service
import { CustomDesign, ArtworkPlacement } from '../types';
import { generateThemedArtworkVariations, GeneratedArtworkOption } from '../utils/aiArtworkGenerator';

export interface ClothingCategoryItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  printPrice: number;
  fabric: string;
  genders: ('Men' | 'Women' | 'Unisex')[];
  fits: string[];
  necklines: string[];
  sleeves: string[];
  sizes: string[];
  printableSides: ('Front' | 'Back')[];
}

export const CLOTHING_CATEGORIES: ClothingCategoryItem[] = [
  {
    id: 't-shirts',
    name: 'T-shirts',
    tagline: 'Timeless Essential',
    description: 'Everyday heavyweight luxury crafted from 220 GSM combed bio-washed cotton.',
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    basePrice: 699,
    printPrice: 299,
    fabric: '220 GSM 100% Combed Cotton',
    genders: ["Men's T-shirts" as any, "Women's T-shirts" as any, "Unisex T-shirts" as any],
    fits: ['Regular fit', 'Oversized fit', 'Slim fit'],
    necklines: ['Round neck', 'V-neck'],
    sleeves: ['Half sleeve', 'Full sleeve'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'oversized-t-shirts',
    name: 'Oversized T-shirts',
    tagline: 'Modern Streetwear Fit',
    description: 'Boxy drop-shoulder silhouette cut from thick 240 GSM heavy jersey with ribbed collar.',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    basePrice: 799,
    printPrice: 299,
    fabric: '240 GSM Heavy French Terry Cotton',
    genders: ["Men's Oversized" as any, "Women's Oversized" as any, "Unisex Oversized" as any],
    fits: ['Oversized drop-shoulder', 'Boxy relaxed fit'],
    necklines: ['Ribbed crew neck', 'High neck'],
    sleeves: ['Drop-shoulder half sleeve', 'Elongated wide sleeve'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'polo-t-shirts',
    name: 'Polo T-shirts',
    tagline: 'Smart Heritage Look',
    description: 'Structured pique knit polo with 2-button placket and engineered collar retention.',
    imageUrl: 'https://images.unsplash.com/photo-1625910513413-7223b9d99bf5?w=800&auto=format&fit=crop&q=80',
    basePrice: 899,
    printPrice: 299,
    fabric: '230 GSM Mercerized Honeycomb Pique',
    genders: ["Men's Polo" as any, "Women's Polo" as any, "Unisex Polo" as any],
    fits: ['Regular fit', 'Athletic slim fit'],
    necklines: ['Polo collar with 2 buttons', 'Mandarin band collar'],
    sleeves: ['Half sleeve with ribbed cuffs', 'Full sleeve'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'hoodies',
    name: 'Hoodies',
    tagline: 'Heavyweight Warmth',
    description: '380 GSM ultra-soft brushed fleece with double-layer hood and kangaroo pouch.',
    imageUrl: './images/product_hoodie_mineral_1793012316379.jpg',
    basePrice: 1499,
    printPrice: 349,
    fabric: '380 GSM Heavy Brushed Fleece',
    genders: ["Men's Hoodie" as any, "Women's Hoodie" as any, "Unisex Hoodie" as any],
    fits: ['Relaxed streetwear fit', 'Oversized boxy fit'],
    necklines: ['Double-layer hood with drawcords'],
    sleeves: ['Full sleeve with heavy ribbing'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'sweatshirts',
    name: 'Sweatshirts',
    tagline: 'Clean Crewneck Comfort',
    description: '340 GSM luxury loopback cotton with ergonomic raglan shoulders and reinforced seams.',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    basePrice: 1299,
    printPrice: 349,
    fabric: '340 GSM Brushed Loopback Fleece',
    genders: ["Men's Sweatshirt" as any, "Women's Sweatshirt" as any, "Unisex Sweatshirt" as any],
    fits: ['Regular fit', 'Relaxed fit'],
    necklines: ['Dense ribbed crew neck'],
    sleeves: ['Full sleeve with elastic cuffs'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'shirts',
    name: 'Shirts',
    tagline: 'Crisp Tailored Fabric',
    description: '100% fine cotton oxford and poplin with durable mother-of-pearl style buttons.',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
    basePrice: 1199,
    printPrice: 299,
    fabric: '100% Premium Oxford Weave Cotton',
    genders: ["Men's Shirt" as any, "Women's Shirt" as any, "Unisex Shirt" as any],
    fits: ['Casual relaxed fit', 'Slim tailored fit'],
    necklines: ['Button-down collar', 'Cuban camp collar'],
    sleeves: ['Half sleeve', 'Full sleeve with barrel cuffs'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'jackets',
    name: 'Jackets',
    tagline: 'Outerwear Statement',
    description: 'Windproof heavy twill bomber silhouette with thermal quilted satin lining.',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    basePrice: 2199,
    printPrice: 399,
    fabric: 'Heavy Cotton Twill & Satin Lining',
    genders: ["Men's Jacket" as any, "Women's Jacket" as any, "Unisex Jacket" as any],
    fits: ['Bomber fit', 'Coach jacket boxy'],
    necklines: ['Baseball ribbed collar', 'Folded shirt collar'],
    sleeves: ['Full sleeve with storm cuffs'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printableSides: ['Front', 'Back'],
  },
  {
    id: 'track-pants',
    name: 'Track pants',
    tagline: 'Effortless Mobility',
    description: '280 GSM interlock fabric with deep zippered security pockets and braided drawstrings.',
    imageUrl: './images/product_denim_raw_1793012316312.jpg',
    basePrice: 999,
    printPrice: 249,
    fabric: '280 GSM Cotton-Stretch Interlock',
    genders: ["Men's Track pants" as any, "Women's Track pants" as any, "Unisex Track pants" as any],
    fits: ['Tapered jogger fit', 'Relaxed straight leg'],
    necklines: ['Elastic waist with drawstring'],
    sleeves: ['Full length with cuffed ankles'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printableSides: ['Front', 'Back'],
  },
];

export interface GarmentColorSwatch {
  name: string;
  hex: string;
  textColor: string;
}

export const GARMENT_COLOR_SWATCHES: GarmentColorSwatch[] = [
  { name: 'Onyx Black', hex: '#171717', textColor: '#ffffff' },
  { name: 'Pure White', hex: '#fcfcfc', textColor: '#111111' },
  { name: 'Heather Charcoal', hex: '#2f343b', textColor: '#ffffff' },
  { name: 'Sand Beige', hex: '#d8b9a5', textColor: '#111111' },
  { name: 'Deep Navy', hex: '#1e293b', textColor: '#ffffff' },
  { name: 'Crimson Red', hex: '#991b1b', textColor: '#ffffff' },
  { name: 'Forest Olive', hex: '#3f4f38', textColor: '#ffffff' },
  { name: 'Electric Lime', hex: '#d7ff3f', textColor: '#111111' },
  { name: 'Lavender Mist', hex: '#c084fc', textColor: '#111111' },
  { name: 'Vintage Mustard', hex: '#d97706', textColor: '#ffffff' },
];

export const SUGGESTED_PROMPT_CHIPS = [
  { label: 'Goku anime-inspired design', prompt: 'Goku super saiyan aura dragon ball anime power vector crest', tag: 'Anime' },
  { label: 'Dragon artwork', prompt: 'Coiled imperial dragon with Japanese smoke clouds and kanji streetwear emblem', tag: 'Dragon' },
  { label: 'Japanese streetwear design', prompt: 'Neo Tokyo shibuya streetwear typography with kanji and cyberpunk crosshair', tag: 'Streetwear' },
  { label: 'Minimalist typography', prompt: 'DISRUPT NORMALITY heavy brutalist typography with coordinates and minimalist frame', tag: 'Typography' },
  { label: 'Racing graphics', prompt: 'Apex motorsport turbo gt checkered speed crest with racing stripes', tag: 'Racing' },
  { label: 'Abstract art', prompt: 'Topographic contour line waves with futuristic chrome liquid matrix', tag: 'Abstract' },
  { label: 'Gaming artwork', prompt: 'Cyber samurai glitch visor helmet with gaming reticle HUD', tag: 'Gaming' },
  { label: 'Floral artwork', prompt: 'Japanese sakura cherry blossom branch with midnight rose line art', tag: 'Floral' },
  { label: 'Custom name and text design', prompt: 'OBRYNT BESPOKE STUDIO YOUR NAME HERE', tag: 'Custom' },
];

// Call Backend AI Artwork API
export async function generateClothingArtwork(
  prompt: string,
  category: string = 'T-shirts',
  garmentColor: string = '#171717'
): Promise<GeneratedArtworkOption[]> {
  try {
    const res = await fetch('/api/ai/generate-clothing-artwork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, category, garmentColor }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.designs) && data.designs.length > 0) {
        return data.designs;
      }
    }
  } catch (err) {
    console.warn('[OBRYNT Studio] Server artwork call fell back to local vector generation engine:', err);
  }

  // Fallback to high quality client-side vector generator
  return generateThemedArtworkVariations(prompt, category);
}

// Download Artwork as Transparent PNG
export async function downloadArtworkAsPng(artworkUrl: string, filename: string = 'obrynt-custom-artwork.png'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const exportSize = 1500; // High resolution 1500x1500px transparent PNG
        canvas.width = exportSize;
        canvas.height = exportSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Keep background transparent
        ctx.clearRect(0, 0, exportSize, exportSize);
        ctx.drawImage(img, 0, 0, exportSize, exportSize);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          resolve();
        }, 'image/png');
      };

      img.onerror = (e) => reject(e);
      img.src = artworkUrl;
    } catch (err) {
      reject(err);
    }
  });
}

// Local Design Library Management
const STORAGE_KEY = 'obrynt_my_designs';

export function getSavedCustomerDesigns(): CustomDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomerDesign(design: CustomDesign): CustomDesign[] {
  try {
    const existing = getSavedCustomerDesigns();
    const id = design.id || `design-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newDesign: CustomDesign = {
      ...design,
      id,
      dateCreated: design.dateCreated || new Date().toISOString(),
    };

    const updated = [newDesign, ...existing.filter((d) => d.id !== id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also sync to legacy obrynt_saved_designs for account drawer compatibility
    try {
      const legacyRaw = localStorage.getItem('obrynt_saved_designs');
      const legacy = legacyRaw ? JSON.parse(legacyRaw) : [];
      localStorage.setItem('obrynt_saved_designs', JSON.stringify([newDesign, ...legacy.filter((d: any) => d.id !== id)]));
    } catch {}

    window.dispatchEvent(new Event('obrynt_designs_updated'));
    return updated;
  } catch {
    return [];
  }
}

export function deleteCustomerDesign(id: string): CustomDesign[] {
  try {
    const existing = getSavedCustomerDesigns();
    const updated = existing.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      const legacyRaw = localStorage.getItem('obrynt_saved_designs');
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        localStorage.setItem('obrynt_saved_designs', JSON.stringify(legacy.filter((d: any) => d.id !== id)));
      }
    } catch {}

    window.dispatchEvent(new Event('obrynt_designs_updated'));
    return updated;
  } catch {
    return [];
  }
}
