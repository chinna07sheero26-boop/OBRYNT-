import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
}) => {
  const [jumpPageInput, setJumpPageInput] = useState('');

  if (totalPages <= 1) return null;

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPageInput('');
    }
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pt-8 pb-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
      {/* Range summary */}
      <div className="text-stone-600 font-medium text-center sm:text-left">
        Showing{' '}
        <span className="font-semibold text-stone-900 tabular-nums">
          {startItem.toLocaleString('en-IN')} – {endItem.toLocaleString('en-IN')}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-stone-900 tabular-nums">
          {totalItems.toLocaleString('en-IN')}
        </span>{' '}
        garments
        {totalItems >= 100000 && (
          <span className="ml-1 text-stone-500 font-normal">
            ({(totalItems / 100000).toFixed(1)} Lakhs)
          </span>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4 text-stone-700" />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer font-medium text-stone-700"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Current / Total */}
        <div className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-900 font-mono font-bold tabular-nums">
          Page {currentPage.toLocaleString('en-IN')} of {totalPages.toLocaleString('en-IN')}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer font-medium text-stone-700"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4 text-stone-700" />
        </button>
      </div>

      {/* Jump to Page & Page Size */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
          <span className="text-stone-500">Go to:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder="#"
            className="w-14 text-center px-1.5 py-1 bg-white border border-stone-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-stone-900 text-white rounded font-medium hover:bg-stone-800 cursor-pointer"
          >
            Go
          </button>
        </form>

        <div className="flex items-center gap-1">
          <span className="text-stone-500">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-white border border-stone-300 rounded px-1.5 py-1 text-xs font-mono cursor-pointer"
          >
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="96">96</option>
          </select>
        </div>
      </div>
    </div>
  );
};
