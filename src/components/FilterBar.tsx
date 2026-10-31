import React from 'react';
import { SlidersHorizontal, X, ArrowUpDown, Check } from 'lucide-react';
import { ALL_CATEGORIES, FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onChangeFilter: (newFilter: FilterState) => void;
  onOpenDrawer: () => void;
  totalCount: number;
  availableColors: string[];
  availableSizes: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  onOpenDrawer,
  totalCount,
  availableColors,
  availableSizes,
}) => {
  const categoriesWithAll = ['All', ...ALL_CATEGORIES];

  const handleCategoryClick = (cat: string) => {
    onChangeFilter({ ...filter, category: cat });
  };

  const activeFilterCount =
    (filter.category !== 'All' ? 1 : 0) +
    filter.sizes.length +
    filter.colors.length +
    (filter.inStockOnly ? 1 : 0) +
    (filter.maxPrice < 3000 ? 1 : 0);

  const resetAllFilters = () => {
    onChangeFilter({
      ...filter,
      search: '',
      category: 'All',
      sizes: [],
      colors: [],
      maxPrice: 3000,
      minPrice: 0,
      inStockOnly: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {categoriesWithAll.map((cat) => {
          const isSelected = filter.category === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300/80 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Control Strip: Results count, Filters button, Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-200">
        <div className="text-xs sm:text-sm text-stone-500 font-medium">
          Showing <span className="text-stone-900 font-semibold tabular-nums">{totalCount.toLocaleString('en-IN')}</span> garments
          {totalCount >= 100000 && (
            <span className="ml-2 bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full inline-block">
              {(totalCount / 100000).toFixed(1)} Lakhs Scale
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filter Drawer Toggle */}
          <button
            onClick={onOpenDrawer}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border flex items-center gap-2 transition-colors cursor-pointer ${
              activeFilterCount > 0
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-stone-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={filter.sortBy}
              onChange={(e) =>
                onChangeFilter({
                  ...filter,
                  sortBy: e.target.value as FilterState['sortBy'],
                })
              }
              className="appearance-none bg-white border border-stone-300 text-stone-800 text-xs font-medium rounded-lg px-3 py-2 pr-7 hover:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
            >
              <option value="featured">Featured / Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetical (A - Z)</option>
              <option value="stock">Stock Availability</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-stone-500 font-medium">Applied:</span>

          {filter.category !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md">
              <span>{filter.category}</span>
              <button
                onClick={() => onChangeFilter({ ...filter, category: 'All' })}
                className="hover:text-stone-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filter.sizes.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md"
            >
              <span>Size: {s}</span>
              <button
                onClick={() =>
                  onChangeFilter({
                    ...filter,
                    sizes: filter.sizes.filter((sz) => sz !== s),
                  })
                }
                className="hover:text-stone-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filter.colors.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md"
            >
              <span>Color: {c}</span>
              <button
                onClick={() =>
                  onChangeFilter({
                    ...filter,
                    colors: filter.colors.filter((cl) => cl !== c),
                  })
                }
                className="hover:text-stone-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filter.inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md">
              <span>In Stock Only</span>
              <button
                onClick={() => onChangeFilter({ ...filter, inStockOnly: false })}
                className="hover:text-stone-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filter.maxPrice < 3000 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md">
              <span>Under ₹{filter.maxPrice}</span>
              <button
                onClick={() => onChangeFilter({ ...filter, maxPrice: 3000 })}
                className="hover:text-stone-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-stone-500 hover:text-stone-900 underline underline-offset-2 ml-1 cursor-pointer font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
