import React from 'react';
import { CATEGORY_METADATA, Category } from '../types';

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
  const handleClick = (catName: string) => {
    if (catName === 'Custom Design') {
      onSelectCategory('Custom Design');
      onOpenCustomStudio();
    } else {
      onSelectCategory(catName);
      const el = document.getElementById('shop');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="categories" className="my-10 sm:my-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7a8e12] mb-1">
            Explore OBRYNT
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-[-0.04em] text-[#111111]">
            Shop your way
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Clear categories to help you find exactly what you want.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {CATEGORY_METADATA.map((cat) => {
          const isActive = activeCategory === cat.name;
          const isStudio = cat.name === 'Custom Design';

          return (
            <button
              key={cat.name}
              onClick={() => handleClick(cat.name)}
              className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] group ${
                isActive
                  ? 'bg-[#111111] text-white border-[#111111] shadow-md -translate-y-1'
                  : isStudio
                  ? 'bg-[#d7ff3f]/20 hover:bg-[#d7ff3f]/30 border-[#d7ff3f] hover:border-black text-[#111111] hover:-translate-y-1'
                  : 'bg-white hover:bg-stone-50 border-[#e4e1da] hover:border-stone-400 hover:-translate-y-1 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-2xl transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-[#d7ff3f]' : isStudio ? 'text-[#7a8e12]' : 'text-[#111111]'
                  }`}
                >
                  {cat.icon}
                </span>
                {isStudio && (
                  <span className="text-[9px] font-black tracking-wider uppercase bg-[#111111] text-[#d7ff3f] px-2 py-0.5 rounded-full">
                    Studio
                  </span>
                )}
              </div>

              <div>
                <strong
                  className={`block text-sm font-extrabold leading-tight mb-1 ${
                    isActive ? 'text-white' : 'text-[#111111]'
                  }`}
                >
                  {cat.name}
                </strong>
                <small
                  className={`block text-xs leading-normal ${
                    isActive ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {cat.desc}
                </small>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
