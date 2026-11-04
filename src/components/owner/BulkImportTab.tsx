import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ArrowRight,
  Filter,
  Search,
  Check,
  X,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Info,
  HelpCircle,
  Package,
  Copy,
} from 'lucide-react';
import { Product, Category, ALL_CATEGORIES, BulkImportItem, BulkImportReport } from '../../types';
import {
  parseBulkFile,
  categorizeImportBatch,
  generateMixedDemoFeed,
  downloadBulkImportTemplate,
  RawImportProduct,
} from '../../services/bulkImportService';
import { saveProductsBulk } from '../../services/productService';
import { getSupabaseStatus } from '../../services/supabaseClient';
import { OBRYNT_TAXONOMY } from '../../utils/aiTaxonomyEngine';

interface BulkImportTabProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onShowNotice: (msg: string) => void;
}

export const BulkImportTab: React.FC<BulkImportTabProps> = ({
  products,
  onUpdateProducts,
  onShowNotice,
}) => {
  // Step State: 'upload' | 'processing' | 'review' | 'saving' | 'complete'
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'review' | 'saving' | 'complete'>('upload');

  // File & Feed State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedUrlInput, setFeedUrlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Processing Progress
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0, currentItem: '', pct: 0 });

  // Imported Items State
  const [importBatch, setImportBatch] = useState<BulkImportItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [importReport, setImportReport] = useState<BulkImportReport | null>(null);

  // Filters in Review Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'categorized' | 'needs_review' | 'duplicates'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Bulk Edit Modal State
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditAction, setBulkEditAction] = useState<'price' | 'stock' | 'status' | 'category' | 'brand'>('category');
  const [bulkEditCategory, setBulkEditCategory] = useState<string>('Men');
  const [bulkEditSubcategory, setBulkEditSubcategory] = useState<string>('Shirts');
  const [bulkEditStatus, setBulkEditStatus] = useState<'active' | 'draft' | 'out_of_stock'>('active');
  const [bulkEditPricePct, setBulkEditPricePct] = useState<number>(0);
  const [bulkEditStockVal, setBulkEditStockVal] = useState<number>(50);
  const [bulkEditBrandVal, setBulkEditBrandVal] = useState<string>('OBRYNT');

  // Direct editing of an individual item in modal
  const [editingItem, setEditingItem] = useState<BulkImportItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseStatus = getSupabaseStatus();

  // Summary Metrics of current batch
  const batchStats = useMemo(() => {
    let categorized = 0;
    let needsReview = 0;
    let duplicates = 0;
    const catCounts: Record<string, number> = {};

    importBatch.forEach((item) => {
      if (item.isDuplicate) {
        duplicates++;
      } else if (item.status === 'needs_review' || item.confidence < 75) {
        needsReview++;
      } else {
        categorized++;
      }

      const cat = item.category || 'Uncategorised';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    return {
      total: importBatch.length,
      categorized,
      needsReview,
      duplicates,
      catCounts,
    };
  }, [importBatch]);

  // Filtered Items for Review
  const filteredItems = useMemo(() => {
    return importBatch.filter((item) => {
      // Tab filter
      if (filterTab === 'duplicates' && !item.isDuplicate) return false;
      if (filterTab === 'needs_review' && (!item.product.needsReview && item.confidence >= 75)) return false;
      if (filterTab === 'categorized' && (item.isDuplicate || item.product.needsReview || item.confidence < 75)) return false;

      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.product.name.toLowerCase().includes(q);
        const matchSku = item.product.sku.toLowerCase().includes(q);
        const matchBrand = (item.product.brand || '').toLowerCase().includes(q);
        const matchSub = (item.subcategory || '').toLowerCase().includes(q);
        return matchName || matchSku || matchBrand || matchSub;
      }

      return true;
    });
  }, [importBatch, filterTab, categoryFilter, searchQuery]);

  // Handle File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await startFileProcessing(file);
  };

  // Start Parsing and AI Auto-Categorisation
  const startFileProcessing = async (file: File) => {
    setIsParsing(true);
    setCurrentStep('processing');
    setProcessProgress({ current: 0, total: 0, currentItem: 'Reading catalogue file...', pct: 5 });

    try {
      const parsed = await parseBulkFile(file);
      if (parsed.products.length === 0) {
        onShowNotice('No valid products found in uploaded file. Please check format.');
        setCurrentStep('upload');
        setIsParsing(false);
        return;
      }

      setProcessProgress({
        current: 0,
        total: parsed.products.length,
        currentItem: 'AI Auto-Categorisation in progress (Gemini + Taxonomy Engine)...',
        pct: 15,
      });

      // Execute AI categorization in batches
      const categorized = await categorizeImportBatch(
        parsed.products,
        products,
        (current, total, currentItem) => {
          const pct = Math.round(15 + (current / total) * 80);
          setProcessProgress({ current, total, currentItem, pct });
        }
      );

      setImportBatch(categorized);
      // Select all non-duplicate items by default
      const initialSelected = new Set<string>();
      categorized.forEach((it) => {
        if (!it.isDuplicate) initialSelected.add(it.id);
      });
      setSelectedItemIds(initialSelected);

      setCurrentStep('review');
      onShowNotice(`AI successfully analysed ${categorized.length} products across all categories.`);
    } catch (err: any) {
      onShowNotice(`Import parsing failed: ${err?.message || 'Check file format'}`);
      setCurrentStep('upload');
    } finally {
      setIsParsing(false);
    }
  };

  // Load Mixed Demo Feed (e.g. 50 items across shirts, shoes, watches, kurtis, boxers, bags)
  const handleLoadDemoFeed = async (count: number = 30) => {
    setIsParsing(true);
    setCurrentStep('processing');
    setProcessProgress({ current: 0, total: count, currentItem: 'Generating multi-category catalogue feed...', pct: 10 });

    try {
      const demoProducts = generateMixedDemoFeed(count);
      const categorized = await categorizeImportBatch(
        demoProducts,
        products,
        (current, total, currentItem) => {
          const pct = Math.round(10 + (current / total) * 85);
          setProcessProgress({ current, total, currentItem, pct });
        }
      );

      setImportBatch(categorized);
      const initialSelected = new Set<string>();
      categorized.forEach((it) => {
        if (!it.isDuplicate) initialSelected.add(it.id);
      });
      setSelectedItemIds(initialSelected);

      setCurrentStep('review');
      onShowNotice(`Loaded and AI categorised ${categorized.length} mixed demo products.`);
    } catch (err: any) {
      onShowNotice(`Failed to load demo feed: ${err?.message}`);
      setCurrentStep('upload');
    } finally {
      setIsParsing(false);
    }
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      const newSet = new Set(selectedItemIds);
      filteredItems.forEach((it) => newSet.add(it.id));
      setSelectedItemIds(newSet);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  };

  // Execute Bulk Edit on selected items
  const handleApplyBulkEdit = () => {
    if (selectedItemIds.size === 0) {
      onShowNotice('Please select at least one product to edit.');
      return;
    }

    setImportBatch((prev) =>
      prev.map((item) => {
        if (!selectedItemIds.has(item.id)) return item;

        const updatedProd = { ...item.product };

        if (bulkEditAction === 'category') {
          updatedProd.category = bulkEditCategory as Category;
          updatedProd.cat = bulkEditCategory;
          updatedProd.subcategory = bulkEditSubcategory;
          return {
            ...item,
            category: bulkEditCategory,
            subcategory: bulkEditSubcategory,
            confidence: 100,
            product: updatedProd,
            status: 'categorized',
          };
        }

        if (bulkEditAction === 'status') {
          updatedProd.status = bulkEditStatus;
          updatedProd.isPublished = bulkEditStatus !== 'draft';
          return { ...item, product: updatedProd };
        }

        if (bulkEditAction === 'price' && bulkEditPricePct !== 0) {
          const multiplier = 1 + bulkEditPricePct / 100;
          updatedProd.price = Math.round(updatedProd.price * multiplier);
          if (updatedProd.originalPrice) {
            updatedProd.originalPrice = Math.round(updatedProd.originalPrice * multiplier);
          }
          return { ...item, product: updatedProd };
        }

        if (bulkEditAction === 'stock') {
          updatedProd.stock = Number(bulkEditStockVal);
          return { ...item, product: updatedProd };
        }

        if (bulkEditAction === 'brand') {
          updatedProd.brand = bulkEditBrandVal;
          updatedProd.brandName = bulkEditBrandVal;
          return { ...item, brand: bulkEditBrandVal, product: updatedProd };
        }

        return item;
      })
    );

    setIsBulkEditOpen(false);
    onShowNotice(`Bulk updated ${selectedItemIds.size} products.`);
  };

  // Save Approved Items to Database (Supabase + Local Cache)
  const handlePublishImportedProducts = async () => {
    const itemsToSave = importBatch.filter((it) => selectedItemIds.has(it.id));
    if (itemsToSave.length === 0) {
      onShowNotice('No products selected for publication. Please select items with the checkboxes.');
      return;
    }

    setCurrentStep('saving');
    setProcessProgress({
      current: 0,
      total: itemsToSave.length,
      currentItem: 'Saving to Supabase PostgreSQL & updating storefront...',
      pct: 10,
    });

    try {
      const productsPayload = itemsToSave.map((it) => it.product);

      // Save using batched database upserts
      const res = await saveProductsBulk(productsPayload, (saved, total) => {
        const pct = Math.round(10 + (saved / total) * 85);
        setProcessProgress({ current: saved, total, currentItem: `Saved ${saved} of ${total} products...`, pct });
      });

      // Update parent catalogue state in memory
      const existingSkuMap = new Map<string, Product>();
      products.forEach((p) => existingSkuMap.set(p.sku, p));
      productsPayload.forEach((p) => existingSkuMap.set(p.sku, p));
      const updatedAll = Array.from(existingSkuMap.values());
      onUpdateProducts(updatedAll);

      // Build report
      setImportReport({
        batchId: `BATCH-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('en-IN'),
        totalParsed: importBatch.length,
        categorized: batchStats.categorized,
        needsReview: batchStats.needsReview,
        duplicates: batchStats.duplicates,
        imported: itemsToSave.length,
        failed: 0,
        categoriesBreakdown: batchStats.catCounts,
        sourceName: selectedFile?.name || 'Bulk Import Feed',
      });

      setCurrentStep('complete');
      onShowNotice(`Success! ${itemsToSave.length} products published into OBRYNT storefront catalogue.`);
    } catch (err: any) {
      onShowNotice(`Database save error: ${err?.message}`);
      setCurrentStep('review');
    }
  };

  // Re-categorize single item modal save
  const handleSaveEditedItem = (updated: BulkImportItem) => {
    setImportBatch((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setEditingItem(null);
    onShowNotice(`Updated "${updated.product.name}"`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Smart Bulk Import & AI Auto-Categorisation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Import thousands of mixed products (Shirts, Watches, Shoes, Bags, Underwear). Gemini automatically identifies and separates them into correct categories without manual tagging.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadBulkImportTemplate('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition-colors cursor-pointer"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel Template</span>
          </button>
          <button
            onClick={() => downloadBulkImportTemplate('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition-colors cursor-pointer"
            title="Download CSV Template"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV Template</span>
          </button>
        </div>
      </div>

      {/* STEP 1: UPLOAD AREA */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          {/* Main Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 sm:p-12 rounded-3xl bg-[#141414] border-2 border-dashed border-stone-700 hover:border-[#d7ff3f] transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-4 shadow-xl group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, .json"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-16 h-16 rounded-2xl bg-stone-900 group-hover:bg-[#d7ff3f]/10 border border-stone-800 group-hover:border-[#d7ff3f] flex items-center justify-center transition-colors">
              <Upload className="w-8 h-8 text-[#d7ff3f]" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Drag & Drop or Click to Upload Product Feed
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                Upload CSV, Excel (.xlsx, .xls), or Supplier JSON feeds with up to 5,000+ products. AI automatically extracts attributes, detects duplicates, and sorts into categories.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 font-bold">
                ✓ Excel (.XLSX, .XLS)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 font-bold">
                ✓ Comma-Separated (.CSV)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 font-bold">
                ✓ Supplier JSON API Feeds
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 font-bold">
                ✓ Multi-Image Gallery URLs
              </span>
            </div>
          </div>

          {/* Quick Demo Feed One-Click Buttons */}
          <div className="p-6 rounded-3xl bg-[#141414] border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d7ff3f]" />
                  <span>Instant Multi-Category Feed Test</span>
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Test the automatic sorting system instantly without uploading your own file.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => handleLoadDemoFeed(30)}
                className="p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-[#d7ff3f] text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <strong className="text-white text-xs block font-bold group-hover:text-[#d7ff3f]">
                    Load 30 Mixed Products Feed
                  </strong>
                  <span className="text-[11px] text-stone-400 mt-0.5 block">
                    Shirts, Watches, Sneakers, Kurtis, Boxers, Backpacks
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-[#d7ff3f] transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => handleLoadDemoFeed(100)}
                className="p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-[#d7ff3f] text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <strong className="text-white text-xs block font-bold group-hover:text-[#d7ff3f]">
                    Load 100 Multi-Category Products
                  </strong>
                  <span className="text-[11px] text-stone-400 mt-0.5 block">
                    Large catalog stress test with duplicate identification
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-[#d7ff3f] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PROCESSING & AI AUTO-CATEGORISATION */}
      {(currentStep === 'processing' || currentStep === 'saving') && (
        <div className="p-8 sm:p-14 rounded-3xl bg-[#141414] border border-stone-800 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-[#d7ff3f]/10 border border-[#d7ff3f] flex items-center justify-center mx-auto text-[#d7ff3f] animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {currentStep === 'saving'
                ? 'Saving Products to Supabase Database...'
                : 'AI Automatic Product Categorisation in Progress...'}
            </h3>
            <p className="text-xs text-stone-400 line-clamp-1 font-mono">
              {processProgress.currentItem}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-stone-900 rounded-full h-3 overflow-hidden border border-stone-800 p-0.5">
              <div
                className="bg-[#d7ff3f] h-full rounded-full transition-all duration-300"
                style={{ width: `${processProgress.pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
              <span>{processProgress.pct}% Complete</span>
              {processProgress.total > 0 && (
                <span>
                  {processProgress.current} / {processProgress.total} Items
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-xs text-stone-400 max-w-md mx-auto">
            Powered by <strong>Gemini 3.8 Flash</strong> with deep rule-based fallback. Categorizing mixed inventory into Men, Women, Footwear, Accessories, Beauty and assigning subcategories.
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW, CATEGORY BREAKDOWN & BULK ACTIONS */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Batch Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                Total Parsed
              </span>
              <div className="text-xl font-black text-white tabular-nums">{batchStats.total}</div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">From imported feed</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                AI Categorised
              </span>
              <div className="text-xl font-black text-emerald-400 tabular-nums">
                {batchStats.categorized}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-0.5 block">High confidence (≥75%)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                Waiting for Review
              </span>
              <div className="text-xl font-black text-amber-400 tabular-nums">
                {batchStats.needsReview}
              </div>
              <span className="text-[10px] text-amber-400/80 mt-0.5 block">Ambiguous / Low confidence</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                Duplicates Detected
              </span>
              <div className="text-xl font-black text-rose-400 tabular-nums">
                {batchStats.duplicates}
              </div>
              <span className="text-[10px] text-rose-400/80 mt-0.5 block">Matched existing SKU/Name</span>
            </div>
          </div>

          {/* Category-Wise Breakdown Strip */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-400">
              <span>Category Auto-Distribution:</span>
              <span className="font-mono text-[10px] text-[#d7ff3f]">
                {Object.keys(batchStats.catCounts).length} Distinct Collections
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(batchStats.catCounts).map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? 'All' : cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    categoryFilter === cat
                      ? 'bg-[#d7ff3f] text-[#111111] shadow'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      categoryFilter === cat ? 'bg-[#111111]/20 text-[#111111]' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in imported batch by name, SKU, brand, subcategory..."
                  className="w-full bg-[#1c1c1c] border border-stone-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              {/* Bulk Actions Button Group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkEditOpen(true)}
                  disabled={selectedItemIds.size === 0}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#d7ff3f]" />
                  <span>Bulk Edit ({selectedItemIds.size})</span>
                </button>

                <button
                  onClick={handlePublishImportedProducts}
                  disabled={selectedItemIds.size === 0}
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 text-[#111111] text-xs font-black shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish to Shop ({selectedItemIds.size})</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Select All bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-800 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-xs font-bold text-stone-300 cursor-pointer"
                >
                  {selectedItemIds.size === filteredItems.length && filteredItems.length > 0
                    ? 'Deselect All'
                    : `Select All (${filteredItems.length})`}
                </button>
                <span className="text-xs text-stone-500 font-mono">
                  {selectedItemIds.size} of {importBatch.length} selected
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Items', count: batchStats.total },
                  { id: 'categorized', label: 'AI Confident', count: batchStats.categorized },
                  { id: 'needs_review', label: 'Needs Review', count: batchStats.needsReview },
                  { id: 'duplicates', label: 'Duplicates', count: batchStats.duplicates },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      filterTab === tab.id
                        ? 'bg-[#d7ff3f] text-[#111111]'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table of Categorised Products */}
          <div className="bg-[#141414] rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-900 text-stone-400 font-bold uppercase tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.size === filteredItems.length && filteredItems.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded accent-[#d7ff3f] cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Product & SKU</th>
                    <th className="p-3">AI Main Category</th>
                    <th className="p-3">Subcategory</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3">Price (₹)</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">AI Confidence</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 font-medium">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-500">
                        <Package className="w-10 h-10 mx-auto mb-2 text-stone-600" />
                        <p className="font-bold text-stone-400">No items match this filter tab.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected = selectedItemIds.has(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-stone-900/50 transition-colors ${
                            item.isDuplicate ? 'bg-rose-950/20' : item.product.needsReview ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="rounded accent-[#d7ff3f] cursor-pointer"
                            />
                          </td>

                          {/* Item Title & SKU */}
                          <td className="p-3 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <strong className="text-white block font-extrabold line-clamp-1 text-xs">
                                  {item.product.name}
                                </strong>
                                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                                  <span>{item.product.sku}</span>
                                  {item.duplicateOfSku && (
                                    <span className="text-rose-400 font-bold">
                                      ({item.duplicateOfSku})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Main Category */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-stone-900 text-[#d7ff3f] border border-stone-800">
                              {item.category}
                            </span>
                          </td>

                          {/* Subcategory */}
                          <td className="p-3 whitespace-nowrap text-stone-300 font-bold">
                            {item.subcategory}
                          </td>

                          {/* Brand */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-900 text-stone-300 border border-stone-800">
                              {item.brand}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="p-3 whitespace-nowrap text-white font-black tabular-nums">
                            ₹{item.product.price.toLocaleString('en-IN')}
                          </td>

                          {/* Stock */}
                          <td className="p-3 whitespace-nowrap text-stone-300 tabular-nums font-bold">
                            {item.product.stock}
                          </td>

                          {/* AI Confidence Meter */}
                          <td className="p-3 whitespace-nowrap">
                            {item.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                                <Copy className="w-3 h-3" /> Duplicate
                              </span>
                            ) : item.confidence >= 85 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                <Check className="w-3 h-3" /> {item.confidence}% Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                                <AlertTriangle className="w-3 h-3" /> {item.confidence}% Review
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-[#d7ff3f] hover:text-[#111111] text-stone-300 transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setImportBatch((prev) => prev.filter((it) => it.id !== item.id));
                                  onShowNotice('Removed from batch.');
                                }}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-500 hover:text-white text-stone-400 transition-colors cursor-pointer"
                                title="Discard"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PUBLISHED SUCCESS REPORT */}
      {currentStep === 'complete' && importReport && (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#141414] border border-stone-800 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bulk Import Successfully Published!
            </h2>
            <p className="text-xs text-stone-400">
              Batch <span className="font-mono text-white">{importReport.batchId}</span> is now live in the OBRYNT catalog.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Imported Live</span>
              <span className="text-xl font-black text-emerald-400">{importReport.imported}</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Categories Sorted</span>
              <span className="text-xl font-black text-white">{Object.keys(importReport.categoriesBreakdown).length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Source File</span>
              <span className="text-xs font-mono text-stone-300 truncate block mt-1">{importReport.sourceName}</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Completed At</span>
              <span className="text-xs font-mono text-stone-300 block mt-1">{importReport.timestamp}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setImportBatch([]);
                setSelectedFile(null);
                setCurrentStep('upload');
              }}
              className="px-6 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Import Another Feed
            </button>
          </div>
        </div>
      )}

      {/* BULK EDIT MODAL */}
      {isBulkEditOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBulkEditOpen(false)}
        >
          <div
            className="bg-[#141414] border border-stone-800 text-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#d7ff3f]" />
                <span>Bulk Edit ({selectedItemIds.size} Selected Items)</span>
              </h3>
              <button onClick={() => setIsBulkEditOpen(false)} className="text-stone-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 font-bold mb-1.5">Action to Apply:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'category', label: 'Category & Sub' },
                    { id: 'status', label: 'Publish Status' },
                    { id: 'price', label: 'Price (% Adjust)' },
                    { id: 'stock', label: 'Set Stock Qty' },
                    { id: 'brand', label: 'Assign Brand' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setBulkEditAction(act.id as any)}
                      className={`p-2 rounded-xl font-bold text-center cursor-pointer border ${
                        bulkEditAction === act.id
                          ? 'bg-[#d7ff3f] text-[#111111] border-[#d7ff3f]'
                          : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Specific Controls */}
              {bulkEditAction === 'category' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Target Category</label>
                    <select
                      value={bulkEditCategory}
                      onChange={(e) => setBulkEditCategory(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    >
                      {ALL_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={bulkEditSubcategory}
                      onChange={(e) => setBulkEditSubcategory(e.target.value)}
                      placeholder="e.g. Shirts, Kurtis, Sneakers"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>
              )}

              {bulkEditAction === 'status' && (
                <div className="pt-2">
                  <label className="block text-stone-400 font-bold mb-1">Set Product Status</label>
                  <select
                    value={bulkEditStatus}
                    onChange={(e) => setBulkEditStatus(e.target.value as any)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  >
                    <option value="active">Active (Visible in Shop)</option>
                    <option value="draft">Draft (Hidden from Customers)</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              )}

              {bulkEditAction === 'price' && (
                <div className="pt-2">
                  <label className="block text-stone-400 font-bold mb-1">
                    Percentage Adjustment (e.g. +10 for 10% markup, -15 for 15% discount)
                  </label>
                  <input
                    type="number"
                    value={bulkEditPricePct}
                    onChange={(e) => setBulkEditPricePct(Number(e.target.value))}
                    placeholder="+10 or -10"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              )}

              {bulkEditAction === 'stock' && (
                <div className="pt-2">
                  <label className="block text-stone-400 font-bold mb-1">Set Stock Quantity</label>
                  <input
                    type="number"
                    value={bulkEditStockVal}
                    onChange={(e) => setBulkEditStockVal(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              )}

              {bulkEditAction === 'brand' && (
                <div className="pt-2">
                  <label className="block text-stone-400 font-bold mb-1">Assign Brand Name</label>
                  <input
                    type="text"
                    value={bulkEditBrandVal}
                    onChange={(e) => setBulkEditBrandVal(e.target.value)}
                    placeholder="e.g. OBRYNT"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsBulkEditOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkEdit}
                className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-[#111111] font-black text-xs cursor-pointer shadow"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ITEM EDIT MODAL */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-[#141414] border border-stone-800 text-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black text-white">Edit Imported Item</h3>
              <button onClick={() => setEditingItem(null)} className="text-stone-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 font-bold mb-1">Product Title</label>
                <input
                  type="text"
                  value={editingItem.product.name}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      product: { ...editingItem.product, name: e.target.value },
                    })
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value,
                        product: { ...editingItem.product, category: e.target.value as Category, cat: e.target.value },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  >
                    {ALL_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editingItem.subcategory}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        subcategory: e.target.value,
                        product: { ...editingItem.product, subcategory: e.target.value },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingItem.product.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        product: { ...editingItem.product, price: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Stock</label>
                  <input
                    type="number"
                    value={editingItem.product.stock}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        product: { ...editingItem.product, stock: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingItem.brand}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        brand: e.target.value,
                        product: { ...editingItem.product, brand: e.target.value, brandName: e.target.value },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedItem(editingItem)}
                className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-[#111111] font-black text-xs cursor-pointer shadow"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
