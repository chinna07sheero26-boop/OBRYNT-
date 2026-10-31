import React from 'react';
import { X, Check } from 'lucide-react';
import { FilterState, ALL_CATEGORIES } from '../types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filter: FilterState;
  onChangeFilter: (newFilter: FilterState) => void;
  availableSizes: string[];
  availableColors: string[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filter,
  onChangeFilter,
  availableSizes,
  availableColors,
}) => {
  if (!isOpen) return null;

  const toggleSize = (size: string) => {
    const exists = filter.sizes.includes(size);
    const updated = exists ? filter.sizes.filter((s) => s !== size) : [...filter.sizes, size];
    onChangeFilter({ ...filter, sizes: updated });
  };

  const toggleColor = (color: string) => {
    const exists = filter.colors.includes(color);
    const updated = exists ? filter.colors.filter((c) => c !== color) : [...filter.colors, color];
    onChangeFilter({ ...filter, colors: updated });
  };

  const handlePriceChange = (val: number) => {
    onChangeFilter({ ...filter, maxPrice: val });
  };

  const handleReset = () => {
    onChangeFilter({
      ...filter,
      sizes: [],
      colors: [],
      maxPrice: 3000,
      inStockOnly: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 font-display">Filters & Attributes</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-7">
            {/* Price Filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-stone-900">Maximum Price</span>
                <span className="text-sm font-mono font-medium text-stone-700 tabular-nums">
                  Up to ₹{filter.maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={filter.maxPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full accent-stone-900 h-2 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-400 font-mono mt-1">
                <span>₹500</span>
                <span>₹1,750</span>
                <span>₹3,000</span>
              </div>
            </div>

            {/* In Stock Only */}
            <div className="flex items-center justify-between py-2 border-y border-stone-100">
              <div>
                <div className="text-sm font-semibold text-stone-900">In-Stock Only</div>
                <div className="text-xs text-stone-500">Hide garments currently out of stock</div>
              </div>
              <button
                type="button"
                onClick={() => onChangeFilter({ ...filter, inStockOnly: !filter.inStockOnly })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  filter.inStockOnly ? 'bg-stone-900' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    filter.inStockOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sizes */}
            <div>
              <div className="text-sm font-semibold text-stone-900 mb-3">Available Sizes</div>
              <div className="grid grid-cols-4 gap-2">
                {availableSizes.map((size) => {
                  const isChecked = filter.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        isChecked
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colours */}
            <div>
              <div className="text-sm font-semibold text-stone-900 mb-3">Garment Colors</div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const isChecked = filter.colors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? 'border-stone-900 bg-stone-900 text-white font-medium'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-stone-950 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
