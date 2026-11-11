import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CategoryGridProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenCustomStudio: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenCustomStudio,
}) => {
  const editorialCampaigns = [
    {
      title: "WOMEN'S COLLECTION",
      subtitle: "Structured blazers, fluid trousers and tailored silks.",
      category: "Women",
      image: "/images/editorial_women_collection.jpg",
      badge: "AUTUMN / WINTER '26",
    },
    {
      title: "MEN'S COLLECTION",
      subtitle: "Architectural coats, combed cotton knits and relaxed trousers.",
      category: "Men",
      image: "/images/editorial_men_collection.jpg",
      badge: "NEW ARRIVALS",
    },
    {
      title: "KIDS' COLLECTION",
      subtitle: "Minimalist organic knits and effortless everyday layers.",
      category: "Kids",
      image: "/images/editorial_kids_collection.jpg",
      badge: "ORGANIC COTTON",
    },
    {
      title: "ACCESSORIES & FOOTWEAR",
      subtitle: "Sculptural Italian leather shoulder bags and minimal sneakers.",
      category: "Footwear",
      image: "/images/editorial_accessories_footwear.jpg",
      badge: "CURATED OBJECTS",
    },
  ];

  const handleCampaignClick = (cat: string) => {
    onSelectCategory(cat);
    const el = document.getElementById('shop');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categories" className="my-12 sm:my-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-8 border-b border-neutral-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-1">
            SEASONAL EDITORIAL CAMPAIGNS
          </span>
          <h2 className="font-luxury text-2xl sm:text-4xl font-bold tracking-[0.08em] text-black uppercase">
            Curated Collections
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md font-normal leading-relaxed">
          Explore directional lines crafted with premium textiles, minimalist cuts, and international fashion sensibilities.
        </p>
      </div>

      {/* 4-Card Editorial Campaign Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {editorialCampaigns.map((camp) => (
          <div
            key={camp.title}
            onClick={() => handleCampaignClick(camp.category)}
            className="group relative aspect-[3/4] bg-neutral-100 overflow-hidden cursor-pointer border border-neutral-200 flex flex-col justify-end"
          >
            {/* Background Editorial Image */}
            <img
              src={camp.image}
              alt={camp.title}
              className="absolute inset-0 w-full h-full object-cover object-top brightness-[0.92] group-hover:scale-105 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
            
            {/* Subtle Gradient Scrim for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity group-hover:opacity-95" />

            {/* Campaign Text Content */}
            <div className="relative z-10 p-5 sm:p-6 text-white flex flex-col justify-end h-full">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-300 mb-2 block">
                {camp.badge}
              </span>

              <h3 className="font-luxury text-lg sm:text-xl font-bold tracking-[0.14em] uppercase text-white mb-1.5 leading-snug">
                {camp.title}
              </h3>

              <p className="text-xs text-neutral-300 font-normal leading-relaxed line-clamp-2 mb-4">
                {camp.subtitle}
              </p>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white group-hover:underline underline-offset-4">
                <span>Explore Line</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
