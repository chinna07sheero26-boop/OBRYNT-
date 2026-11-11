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
  Globe,
  Link,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Lock,
  FileText,
  DollarSign,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  Building2,
  ShieldCheck as ShieldCheckIcon,
  Store,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Product,
  Category,
  ALL_CATEGORIES,
  BulkImportItem,
  BulkImportReport,
  MultiStoreFieldEntry,
  MultiStoreReportItem,
  MultiStoreBatchResponse,
} from '../../types';
import {
  parseBulkFile,
  categorizeImportBatch,
  generateMixedDemoFeed,
  downloadBulkImportTemplate,
  RawImportProduct,
  fetchSupplierCatalogueUrl,
  VERIFIED_SUPPLIER_SAMPLE_FEEDS,
  SupplierCatalogueFetchResult,
  extractProductsFromUrls,
  retryFailedImportUrls,
  convertExtractedItemsToBulkItems,
  getRegisteredSuppliers,
  saveRegisteredSupplier,
  RegisteredSupplier,
  importMultiStoreUrls,
  convertMultiStoreProductsToBulkItems,
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

  // Import Source Method: 'multi_store' (30 Store URL Fields) | 'urls' (Single & Bulk URLs) | 'catalogue_url' (Catalogue Feed URL) | 'file' (Excel/CSV/JSON) | 'demo' (Instant Feeds) | 'suppliers' (Directory)
  const [importMethod, setImportMethod] = useState<'multi_store' | 'urls' | 'catalogue_url' | 'file' | 'demo' | 'suppliers'>('multi_store');

  // 30 Store URL Fields State strictly numbered 1 to 30
  const [storeFields, setStoreFields] = useState<string[]>(() => {
    const arr = Array(30).fill('');
    // Initialize first 3 with valid supplier feeds for immediate instant testing
    arr[0] = 'https://api.obrynt.com/v1/supplier/tirupur-knitwear.store';
    arr[1] = 'https://api.obrynt.com/v1/supplier/bombay-denim-mills.store';
    arr[2] = 'https://api.obrynt.com/v1/supplier/alpine-fleece-atelier.store';
    return arr;
  });
  const [isImportingMultiStore, setIsImportingMultiStore] = useState(false);
  const [multiStoreFieldStatus, setMultiStoreFieldStatus] = useState<Record<number, MultiStoreReportItem>>({});
  const [multiStoreBatchReport, setMultiStoreBatchReport] = useState<MultiStoreBatchResponse | null>(null);

  // Single & Multiple Product URLs State
  const [multipleUrlsInput, setMultipleUrlsInput] = useState(
    'http://localhost:3000/api/demo-supplier/product/oversized-acid-wash-tee\nhttp://localhost:3000/api/demo-supplier/product/oxford-cotton-shirt\nhttp://localhost:3000/api/demo-supplier/product/denim-selvedge-jeans'
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState('sup-apparel-hub');
  const [targetMarginPct, setTargetMarginPct] = useState(40);
  const [isExtractingUrls, setIsExtractingUrls] = useState(false);
  const [registeredSuppliers, setRegisteredSuppliers] = useState<RegisteredSupplier[]>(() => getRegisteredSuppliers());
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    defaultMarginPct: 40,
    apiEndpoint: '',
    notes: '',
  });

  // Failed URLs tracking for retry
  const [failedUrlList, setFailedUrlList] = useState<string[]>([]);
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);

  // Supplier Catalogue URL Input & Detection State
  const [supplierUrlInput, setSupplierUrlInput] = useState('https://api.obrynt.com/v1/supplier-feed/apparel.json');
  const [isInspectingUrl, setIsInspectingUrl] = useState(false);
  const [urlDetectionResult, setUrlDetectionResult] = useState<SupplierCatalogueFetchResult | null>(null);

  // Source Feed Metadata for audit and reporting
  const [sourceFeedMetadata, setSourceFeedMetadata] = useState<{
    type: 'supplier_url' | 'file' | 'demo';
    name: string;
    url?: string;
    protocol?: string;
    discovered: number;
    skipped: number;
  }>({
    type: 'supplier_url',
    name: 'OBRYNT Global Apparel Supplier Hub',
    url: 'https://api.obrynt.com/v1/supplier-feed/apparel.json',
    protocol: 'Official Supplier JSON REST API Feed',
    discovered: 0,
    skipped: 0,
  });

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
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'needs_review' | 'duplicates' | 'failed'>('pending');
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
    let pending = 0;
    let approved = 0;
    let needsReview = 0;
    let duplicates = 0;
    let failed = 0;
    let categorized = 0;
    const catCounts: Record<string, number> = {};

    importBatch.forEach((item) => {
      if (item.status === 'failed') {
        failed++;
      } else if (item.isDuplicate) {
        duplicates++;
      } else if (item.approvalStatus === 'approved') {
        approved++;
        categorized++;
      } else {
        pending++;
        categorized++;
      }

      if (item.product.needsReview || item.confidence < 75) {
        needsReview++;
      }

      const cat = item.category || 'Uncategorised';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    return {
      total: importBatch.length,
      pending,
      approved,
      failed,
      needsReview,
      duplicates,
      categorized,
      catCounts,
    };
  }, [importBatch]);

  // Filtered Items for Review
  const filteredItems = useMemo(() => {
    return importBatch.filter((item) => {
      // Tab filter
      if (filterTab === 'pending' && (item.approvalStatus === 'approved' || item.status === 'failed' || item.isDuplicate)) return false;
      if (filterTab === 'approved' && item.approvalStatus !== 'approved') return false;
      if (filterTab === 'failed' && item.status !== 'failed') return false;
      if (filterTab === 'duplicates' && !item.isDuplicate) return false;
      if (filterTab === 'needs_review' && (!item.product.needsReview && item.confidence >= 75)) return false;

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

  // Multi-Store Importer Handlers
  const handleStoreFieldChange = (index: number, value: string) => {
    setStoreFields((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleClearAllStoreFields = () => {
    setStoreFields(Array(30).fill(''));
    setMultiStoreFieldStatus({});
    setMultiStoreBatchReport(null);
    onShowNotice('Cleared all 30 store URL fields.');
  };

  const handleFillSampleStores = () => {
    const samples = [
      'https://api.obrynt.com/v1/supplier/tirupur-knitwear.store',
      'https://api.obrynt.com/v1/supplier/bombay-denim-mills.store',
      'https://api.obrynt.com/v1/supplier/alpine-fleece-atelier.store',
      'https://api.obrynt.com/v1/supplier/surat-luxury-silks.store',
      'https://api.obrynt.com/v1/supplier/ludhiana-wool-craft.store',
      'https://api.obrynt.com/v1/supplier/jaipur-handblock-textiles.store',
      'https://api.obrynt.com/v1/supplier/delhi-activewear-hub.store',
      'https://api.obrynt.com/v1/supplier/bengaluru-tech-apparel.store',
      'https://api.obrynt.com/v1/supplier/agra-leather-footwear.store',
      'https://api.obrynt.com/v1/supplier/kanpur-leather-accessories.store',
      'https://api.obrynt.com/v1/supplier/chennai-organic-cotton.store',
      'https://api.obrynt.com/v1/supplier/coimbatore-spinning-mills.store',
      'https://api.obrynt.com/v1/supplier/varanasi-zari-weavers.store',
      'https://api.obrynt.com/v1/supplier/kolkata-linen-studios.store',
      'https://api.obrynt.com/v1/supplier/ahmedabad-denim-forge.store',
      'https://api.obrynt.com/v1/supplier/mumbai-haute-couture.store',
      'https://api.obrynt.com/v1/supplier/hyderabad-pearl-accessories.store',
      'https://api.obrynt.com/v1/supplier/pune-athleisure-works.store',
      'https://api.obrynt.com/v1/supplier/indore-casualwear-direct.store',
      'https://api.obrynt.com/v1/supplier/surat-chiffon-emporium.store',
      'https://api.obrynt.com/v1/supplier/panipat-home-textiles.store',
      'https://api.obrynt.com/v1/supplier/gurugram-smart-garments.store',
      'https://api.obrynt.com/v1/supplier/noida-fashion-logistics.store',
      'https://api.obrynt.com/v1/supplier/tirupur-polo-masters.store',
      'https://api.obrynt.com/v1/supplier/kochi-coastal-resortwear.store',
      'https://api.obrynt.com/v1/supplier/amritsar-phulkari-guild.store',
      'https://api.obrynt.com/v1/supplier/madurai-handloom-collective.store',
      'https://api.obrynt.com/v1/supplier/guwahati-muga-silks.store',
      'https://api.obrynt.com/v1/supplier/rajkot-silver-accents.store',
      'https://api.obrynt.com/v1/supplier/goa-linen-breeze.store',
    ];
    setStoreFields(samples);
    onShowNotice('Filled all 30 store fields with authorised supplier feeds.');
  };

  const handleImportAllStores = async () => {
    const activeEntries: MultiStoreFieldEntry[] = storeFields
      .map((url, idx) => ({ index: idx + 1, url: url.trim() }))
      .filter((entry) => entry.url.length > 0);

    if (activeEntries.length === 0) {
      onShowNotice('Please enter at least one Store URL in the 30 input fields.');
      return;
    }

    const invalid = activeEntries.filter(
      (e) => !e.url.startsWith('http://') && !e.url.startsWith('https://')
    );
    if (invalid.length > 0) {
      onShowNotice(`Field #${invalid[0].index} is not a valid URL. URLs must start with http:// or https://`);
      return;
    }

    setIsImportingMultiStore(true);
    setCurrentStep('processing');
    setProcessProgress({
      current: 0,
      total: activeEntries.length,
      currentItem: `Querying ${activeEntries.length} supplier store URL(s) in parallel batch...`,
      pct: 12,
    });

    try {
      const response: MultiStoreBatchResponse = await importMultiStoreUrls(activeEntries, targetMarginPct);
      setMultiStoreBatchReport(response);

      const statusMap: Record<number, MultiStoreReportItem> = {};
      response.storeReports.forEach((rep) => {
        statusMap[rep.index] = rep;
      });
      setMultiStoreFieldStatus(statusMap);

      setProcessProgress({
        current: activeEntries.length,
        total: activeEntries.length,
        currentItem: `Batch complete: Discovered ${response.totalDiscovered} products. Validating SKUs, variants, prices & duplicates...`,
        pct: 85,
      });

      const converted = convertMultiStoreProductsToBulkItems(response.allProducts, products);
      setImportBatch(converted);

      const initialSelected = new Set<string>();
      converted.forEach((it) => {
        if (!it.isDuplicate && it.status !== 'failed') {
          initialSelected.add(it.id);
        }
      });
      setSelectedItemIds(initialSelected);

      setSourceFeedMetadata({
        type: 'supplier_url',
        name: `Multi-Store Batch (${response.totalStoresQueried} Stores)`,
        url: `${activeEntries.length} Supplier Store(s)`,
        protocol: 'Multi-Store B2B Automated Catalogue Engine',
        discovered: response.totalDiscovered,
        skipped: response.totalDuplicatesSkipped,
      });

      setCurrentStep('review');
      setFilterTab('pending');
      onShowNotice(
        `Discovered ${response.totalDiscovered} products across ${response.successfulStores} store(s). ${response.totalDuplicatesSkipped > 0 ? `${response.totalDuplicatesSkipped} duplicates skipped.` : ''} All items queued for review.`
      );
    } catch (err: any) {
      onShowNotice(`Multi-store import failed: ${err.message || 'Check network reachability'}`);
      setCurrentStep('upload');
    } finally {
      setIsImportingMultiStore(false);
    }
  };

  // Extract Products from Single or Multiple URLs using Gemini AI
  const handleExtractFromMultipleUrls = async () => {
    const urls = multipleUrlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (urls.length === 0) {
      onShowNotice('Please enter at least one valid product URL starting with http:// or https://');
      return;
    }

    const supplier = registeredSuppliers.find((s) => s.id === selectedSupplierId);
    const supplierName = supplier?.name || 'Partner Supplier';

    setIsExtractingUrls(true);
    setCurrentStep('processing');
    setProcessProgress({
      current: 0,
      total: urls.length,
      currentItem: `Connecting to ${urls.length} product URL(s) via Gemini 3.8 Flash...`,
      pct: 15,
    });

    try {
      const response = await extractProductsFromUrls(urls, selectedSupplierId, supplierName, targetMarginPct);

      setProcessProgress({
        current: response.totalRequested,
        total: response.totalRequested,
        currentItem: `Processing AI structuring, detecting variants and duplicates...`,
        pct: 85,
      });

      const converted = convertExtractedItemsToBulkItems(
        response.results,
        products,
        selectedSupplierId,
        supplierName
      );

      // Track failed URLs for retry button
      const failed = response.results
        .filter((r: any) => r.status === 'failed' || r.status === 'restricted')
        .map((r: any) => r.url);
      setFailedUrlList(failed);

      setImportBatch(converted);

      // By default, select all non-duplicate & non-failed items
      const initialSelected = new Set<string>();
      converted.forEach((it) => {
        if (!it.isDuplicate && it.status !== 'failed') {
          initialSelected.add(it.id);
        }
      });
      setSelectedItemIds(initialSelected);

      setSourceFeedMetadata({
        type: 'supplier_url',
        name: supplierName,
        url: `${urls.length} Supplier URL(s)`,
        protocol: 'AI Smart URL Extraction (Gemini 3.8 Flash)',
        discovered: response.totalRequested,
        skipped: converted.filter((c) => c.isDuplicate).length,
      });

      setCurrentStep('review');
      setFilterTab('pending');
      onShowNotice(
        `AI successfully analysed ${response.successfulCount} of ${response.totalRequested} products. All items are queued under "Pending Approval".`
      );
    } catch (err: any) {
      onShowNotice(`URL extraction failed: ${err.message || 'Check network reachability'}`);
      setCurrentStep('upload');
    } finally {
      setIsExtractingUrls(false);
    }
  };

  // Retry Failed Imports
  const handleRetryFailedImports = async () => {
    if (failedUrlList.length === 0) {
      onShowNotice('No failed URLs to retry in this batch.');
      return;
    }

    setIsRetryingFailed(true);
    try {
      const supplier = registeredSuppliers.find((s) => s.id === selectedSupplierId);
      const supplierName = supplier?.name || 'Partner Supplier';

      const retryRes = await retryFailedImportUrls(failedUrlList, selectedSupplierId, supplierName, targetMarginPct);
      if (retryRes && Array.isArray(retryRes.results)) {
        const recovered = convertExtractedItemsToBulkItems(
          retryRes.results.filter((r: any) => r.status === 'success'),
          products,
          selectedSupplierId,
          supplierName
        );

        if (recovered.length > 0) {
          // Replace failed placeholders with recovered items
          setImportBatch((prev) => {
            const nonFailed = prev.filter((it) => it.status !== 'failed');
            return [...nonFailed, ...recovered];
          });
          setFailedUrlList((prev) => prev.filter((u) => !recovered.some((r) => r.extractionSourceUrl === u)));
          onShowNotice(`Successfully recovered ${recovered.length} products on retry!`);
        } else {
          onShowNotice('Retry completed. These domains require authorised partner API keys.');
        }
      }
    } catch (err: any) {
      onShowNotice(`Retry error: ${err.message}`);
    } finally {
      setIsRetryingFailed(false);
    }
  };

  // Approval System Handlers
  const handleApproveItem = (id: string) => {
    setImportBatch((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            approvalStatus: 'approved',
            product: {
              ...it.product,
              status: 'active',
              isPublished: true,
            },
          };
        }
        return it;
      })
    );
    onShowNotice('Product approved for publication.');
  };

  const handleRejectItem = (id: string) => {
    setImportBatch((prev) => prev.filter((it) => it.id !== id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onShowNotice('Product rejected and removed from batch.');
  };

  const handleApproveAllPending = () => {
    setImportBatch((prev) =>
      prev.map((it) => {
        if (!it.isDuplicate && it.status !== 'failed') {
          return {
            ...it,
            approvalStatus: 'approved',
            product: {
              ...it.product,
              status: 'active',
              isPublished: true,
            },
          };
        }
        return it;
      })
    );
    onShowNotice('All pending products approved!');
  };

  const handleApproveSelected = () => {
    setImportBatch((prev) =>
      prev.map((it) => {
        if (selectedItemIds.has(it.id)) {
          return {
            ...it,
            approvalStatus: 'approved',
            product: {
              ...it.product,
              status: 'active',
              isPublished: true,
            },
          };
        }
        return it;
      })
    );
    onShowNotice(`Approved ${selectedItemIds.size} selected products.`);
  };

  const handleUpdateItemMargin = (itemId: string, newMarginPct: number) => {
    setImportBatch((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const cost = it.supplierCost || it.product.wholesalePrice || 500;
          const safePct = Math.max(5, Math.min(90, newMarginPct));
          const selling = Math.round(cost / (1 - safePct / 100));
          return {
            ...it,
            marginPct: safePct,
            suggestedSellingPrice: selling,
            product: {
              ...it.product,
              price: selling,
              wholesalePrice: cost,
            },
          };
        }
        return it;
      })
    );
  };

  const handleUpdateItemPrice = (itemId: string, newPrice: number) => {
    setImportBatch((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const cost = it.supplierCost || it.product.wholesalePrice || 500;
          const safePrice = Math.max(cost, newPrice);
          const margin = Math.round(((safePrice - cost) / safePrice) * 100);
          return {
            ...it,
            suggestedSellingPrice: safePrice,
            marginPct: margin,
            product: {
              ...it.product,
              price: safePrice,
              wholesalePrice: cost,
            },
          };
        }
        return it;
      })
    );
  };

  const handleSaveNewSupplier = () => {
    if (!newSupplierData.name.trim()) {
      onShowNotice('Please enter supplier name.');
      return;
    }
    const created: RegisteredSupplier = {
      id: `sup-${Date.now().toString(36)}`,
      name: newSupplierData.name.trim(),
      contactEmail: newSupplierData.contactEmail.trim() || undefined,
      phone: newSupplierData.phone.trim() || undefined,
      defaultMarginPct: newSupplierData.defaultMarginPct || 40,
      apiEndpoint: newSupplierData.apiEndpoint.trim() || undefined,
      authType: newSupplierData.apiEndpoint ? 'api_key' : 'none',
      productCount: 0,
      status: 'active',
      notes: newSupplierData.notes.trim() || undefined,
    };
    saveRegisteredSupplier(created);
    setRegisteredSuppliers(getRegisteredSuppliers());
    setSelectedSupplierId(created.id);
    setShowNewSupplierModal(false);
    setNewSupplierData({
      name: '',
      contactEmail: '',
      phone: '',
      defaultMarginPct: 40,
      apiEndpoint: '',
      notes: '',
    });
    onShowNotice(`Supplier "${created.name}" registered successfully.`);
  };

  // Handle File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await startFileProcessing(file);
  };

  // Inspect and Fetch Supplier Catalogue URL
  const handleInspectAndFetchUrl = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || supplierUrlInput).trim();
    if (!urlToFetch) {
      onShowNotice('Please enter an authorized supplier catalogue or API feed URL.');
      return;
    }

    setIsInspectingUrl(true);
    setUrlDetectionResult(null);

    try {
      const result = await fetchSupplierCatalogueUrl(urlToFetch);
      setUrlDetectionResult(result);

      // Requirement 9: If website does not provide authorised access, explain policy. Never bypass!
      if (!result.isAuthorized || result.products.length === 0) {
        setIsInspectingUrl(false);
        onShowNotice(result.message || 'Authorised supplier access or API feed required.');
        return;
      }

      // Requirement 8: Put imported products into existing admin review process. Do not publish automatically!
      setIsInspectingUrl(false);
      setCurrentStep('processing');
      setProcessProgress({
        current: 0,
        total: result.totalProductsDiscovered,
        currentItem: `Discovered ${result.totalProductsDiscovered} products (${result.protocolLabel}). Initiating AI Auto-Categorisation...`,
        pct: 15,
      });

      // Execute AI categorization in batches
      const categorized = await categorizeImportBatch(
        result.products,
        products,
        (current, total, currentItem) => {
          const pct = Math.round(15 + (current / total) * 80);
          setProcessProgress({ current, total, currentItem, pct });
        }
      );

      setImportBatch(categorized);

      // Detect duplicates and select only non-duplicate items
      let duplicatesCount = 0;
      const initialSelected = new Set<string>();
      categorized.forEach((it) => {
        if (!it.isDuplicate) {
          initialSelected.add(it.id);
        } else {
          duplicatesCount++;
        }
      });
      setSelectedItemIds(initialSelected);

      setSourceFeedMetadata({
        type: 'supplier_url',
        name: result.sourceBrand || 'Supplier Feed',
        url: result.url,
        protocol: result.protocolLabel,
        discovered: result.totalProductsDiscovered,
        skipped: duplicatesCount,
      });

      setCurrentStep('review');
      onShowNotice(
        `Discovered ${result.totalProductsDiscovered} products via ${result.protocolLabel}. ${duplicatesCount > 0 ? `${duplicatesCount} duplicates skipped.` : 'Ready for admin review.'}`
      );
    } catch (err: any) {
      setIsInspectingUrl(false);
      onShowNotice(`Supplier connection error: ${err?.message || 'Check URL reachability'}`);
    }
  };

  // Start Parsing and AI Auto-Categorisation from File
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
      let dupCount = 0;
      const initialSelected = new Set<string>();
      categorized.forEach((it) => {
        if (!it.isDuplicate) {
          initialSelected.add(it.id);
        } else {
          dupCount++;
        }
      });
      setSelectedItemIds(initialSelected);

      setSourceFeedMetadata({
        type: 'file',
        name: file.name,
        protocol: parsed.format.toUpperCase() + ' File Upload',
        discovered: parsed.products.length,
        skipped: dupCount,
      });

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
      let dupCount = 0;
      const initialSelected = new Set<string>();
      categorized.forEach((it) => {
        if (!it.isDuplicate) {
          initialSelected.add(it.id);
        } else {
          dupCount++;
        }
      });
      setSelectedItemIds(initialSelected);

      setSourceFeedMetadata({
        type: 'demo',
        name: `Instant Demo Feed (${count} Items)`,
        protocol: 'Multi-Category Synthetic Test Feed',
        discovered: count,
        skipped: dupCount,
      });

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
        sourceName: sourceFeedMetadata.name || selectedFile?.name || 'Bulk Import Feed',
        sourceType: sourceFeedMetadata.type,
        discoveredCount: sourceFeedMetadata.discovered || importBatch.length,
        skippedCount: batchStats.duplicates,
        protocolLabel: sourceFeedMetadata.protocol,
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

      {/* STEP 1: IMPORT SOURCE SELECTION & UPLOAD AREA */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          {/* Method Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#141414] border border-stone-800 rounded-2xl">
            <button
              onClick={() => {
                setImportMethod('multi_store');
                setUrlDetectionResult(null);
              }}
              className={`flex-1 min-w-[210px] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                importMethod === 'multi_store'
                  ? 'bg-[#d7ff3f] text-[#111111] shadow-md font-black'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Multi-Store Importer (30 Stores)</span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  importMethod === 'multi_store' ? 'bg-[#111111] text-[#d7ff3f]' : 'bg-[#d7ff3f] text-[#111111]'
                }`}
              >
                30 Stores
              </span>
            </button>

            <button
              onClick={() => {
                setImportMethod('urls');
                setUrlDetectionResult(null);
              }}
              className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                importMethod === 'urls'
                  ? 'bg-[#d7ff3f] text-[#111111] shadow-md font-black'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Single & Bulk URLs (AI)</span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  importMethod === 'urls' ? 'bg-[#111111] text-[#d7ff3f]' : 'bg-[#d7ff3f] text-[#111111]'
                }`}
              >
                AI Smart
              </span>
            </button>

            <button
              onClick={() => {
                setImportMethod('catalogue_url');
                setUrlDetectionResult(null);
              }}
              className={`flex-1 min-w-[170px] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                importMethod === 'catalogue_url'
                  ? 'bg-[#d7ff3f] text-[#111111] shadow-md font-black'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Catalogue Feed URL</span>
            </button>

            <button
              onClick={() => {
                setImportMethod('file');
                setUrlDetectionResult(null);
              }}
              className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                importMethod === 'file'
                  ? 'bg-[#d7ff3f] text-[#111111] shadow-md font-black'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Excel / CSV File</span>
            </button>

            <button
              onClick={() => {
                setImportMethod('demo');
                setUrlDetectionResult(null);
              }}
              className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                importMethod === 'demo'
                  ? 'bg-[#d7ff3f] text-[#111111] shadow-md font-black'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Instant Test Feeds</span>
            </button>

            <button
              onClick={() => {
                setImportMethod('suppliers');
                setUrlDetectionResult(null);
              }}
              className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                importMethod === 'suppliers'
                  ? 'bg-[#d7ff3f] text-[#111111] shadow-md font-black'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Supplier Directory</span>
              <span className="text-[10px] font-mono opacity-80">({registeredSuppliers.length})</span>
            </button>
          </div>

          {/* TAB: MULTI-STORE URL IMPORTER (EXACTLY 30 SEPARATE URL FIELDS) */}
          {importMethod === 'multi_store' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#141414] border border-stone-800 space-y-6 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                        <Store className="w-5 h-5 text-[#d7ff3f]" />
                        <span>MULTI-STORE URL IMPORTER</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111]">
                        30 Store Fields
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-stone-900 text-stone-300 border border-stone-700">
                        Zero Inventory Required (Cross-Dock)
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1.5 max-w-3xl leading-relaxed">
                      Enter up to 30 complete supplier store or catalogue URLs below. The engine connects across all 30 endpoints simultaneously, discovers accessible products, detects variants and sizes, computes your selling margins, and stages all items under <strong className="text-amber-400">Pending Approval</strong> for your review and bulk publishing to Supabase.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-stone-900 text-stone-300 border border-stone-800 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#d7ff3f]" />
                      <span>
                        <strong className="text-white">{storeFields.filter((u) => u.trim().length > 0).length}</strong> / 30 Stores
                      </span>
                    </span>
                  </div>
                </div>

                {/* Sourcing Controls & Margin Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                  {/* Target Margin % Control */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Target Profit Margin (%)</span>
                      </label>
                      <span className="font-mono text-xs font-black text-emerald-400">{targetMarginPct}% Target Margin</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={80}
                        step={1}
                        value={targetMarginPct}
                        onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                        className="flex-1 accent-[#d7ff3f] cursor-pointer"
                      />
                      <input
                        type="number"
                        min={5}
                        max={90}
                        value={targetMarginPct}
                        onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                        className="w-16 bg-[#141414] border border-stone-700 rounded-xl px-2 py-1 text-center text-xs font-black text-white font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 block">
                      Applied to wholesale costs from all 30 stores. Editable anytime in the review table.
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleFillSampleStores}
                        className="flex-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors cursor-pointer text-center"
                        title="Fill all 30 store fields with verified supplier feeds"
                      >
                        Fill 30 Sample Stores
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllStoreFields}
                        className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-bold rounded-xl border border-stone-800 transition-colors cursor-pointer"
                        title="Clear all 30 fields"
                      >
                        Clear All
                      </button>
                    </div>
                    <span className="text-[10px] text-stone-500 text-right block">
                      Click "Fill 30 Sample Stores" for instant 30-store verification
                    </span>
                  </div>
                </div>

                {/* Primary Action Button Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Every field accepts any complete store or catalogue URL. No category or supplier selection required.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleImportAllStores}
                    disabled={isImportingMultiStore || storeFields.every((u) => u.trim().length === 0)}
                    className="px-8 py-3.5 rounded-2xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 disabled:cursor-not-allowed text-[#111111] font-black text-sm shadow-xl hover:shadow-[#d7ff3f]/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    {isImportingMultiStore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
                        <span>Discovering & Importing 30 Stores...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Import All Stores</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Batch Report Summary Card if available */}
                {multiStoreBatchReport && (
                  <div className="p-4 rounded-2xl bg-stone-900/90 border border-[#d7ff3f]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#d7ff3f]" />
                        <h4 className="text-xs font-black uppercase text-white tracking-wider">
                          Multi-Store Batch Results
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-stone-400">
                        {multiStoreBatchReport.successfulStores} of {multiStoreBatchReport.totalStoresQueried} Stores Accessible
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-stone-800">
                        <span className="text-[10px] text-stone-400 uppercase font-black block">Stores Queried</span>
                        <span className="text-base font-black text-white font-mono">{multiStoreBatchReport.totalStoresQueried}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-stone-800">
                        <span className="text-[10px] text-emerald-400 uppercase font-black block">Discovered</span>
                        <span className="text-base font-black text-emerald-400 font-mono">{multiStoreBatchReport.totalDiscovered}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-stone-800">
                        <span className="text-[10px] text-amber-400 uppercase font-black block">Duplicates Skipped</span>
                        <span className="text-base font-black text-amber-400 font-mono">{multiStoreBatchReport.totalDuplicatesSkipped}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-stone-800">
                        <span className="text-[10px] text-stone-400 uppercase font-black block">Active Status</span>
                        <span className="text-xs font-black text-[#d7ff3f] block mt-1">Pending Approval</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('review')}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Open Admin Review Staging</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#d7ff3f]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* THE 30 SEPARATE URL INPUT FIELDS */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-300">
                      30 Supplier Store URLs:
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      Numbered 1 to 30
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {Array.from({ length: 30 }).map((_, idx) => {
                      const fieldNumber = idx + 1;
                      const status = multiStoreFieldStatus[fieldNumber];
                      const currentValue = storeFields[idx] || '';

                      return (
                        <div
                          key={fieldNumber}
                          className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800/90 hover:border-stone-700 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor={`store-url-${fieldNumber}`}
                              className="text-xs font-bold text-stone-300 font-mono flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="w-5 h-5 rounded-md bg-stone-800 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                                {fieldNumber}
                              </span>
                              <span>{fieldNumber}. Paste Store URL</span>
                            </label>

                            {/* Status Pill if available */}
                            {status && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  status.status === 'success'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : status.status === 'bot_protected'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {status.status === 'success' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span>{status.productsCount} items</span>
                                  </>
                                ) : status.status === 'bot_protected' ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span>Bot Protected</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 text-rose-400" />
                                    <span>Error</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <div className="relative">
                            <input
                              id={`store-url-${fieldNumber}`}
                              type="url"
                              value={currentValue}
                              onChange={(e) => handleStoreFieldChange(idx, e.target.value)}
                              placeholder={`${fieldNumber}. Paste Store URL`}
                              className="w-full bg-[#101010] border border-stone-800 focus:border-[#d7ff3f] rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600 font-mono transition-colors outline-hidden"
                            />
                            {currentValue && (
                              <button
                                type="button"
                                onClick={() => handleStoreFieldChange(idx, '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                                title="Clear field"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Message / Protocol Details */}
                          {status && (
                            <div className="text-[10px] text-stone-400 flex items-center justify-between px-1">
                              <span className="truncate max-w-[280px]" title={status.message}>
                                {status.message}
                              </span>
                              {status.supplierName && (
                                <span className="font-mono text-stone-500 shrink-0 font-bold">
                                  {status.supplierName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Import All Stores Bar */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-800/80">
                    <div className="text-xs text-stone-400 flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#d7ff3f]" />
                      <span>
                        <strong className="text-white">{storeFields.filter((u) => u.trim().length > 0).length}</strong> of 30 store fields configured
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleFillSampleStores}
                        className="px-4 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-2xl border border-stone-800 transition-colors cursor-pointer"
                      >
                        Fill 30 Samples
                      </button>
                      <button
                        type="button"
                        onClick={handleImportAllStores}
                        disabled={isImportingMultiStore || storeFields.every((u) => u.trim().length === 0)}
                        className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 disabled:cursor-not-allowed text-[#111111] font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isImportingMultiStore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
                            <span>Importing All Stores...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Import All Stores</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: AI SMART SINGLE & BULK PRODUCT URLS IMPORT */}
          {importMethod === 'urls' && (
            <div className="space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#141414] border border-stone-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#d7ff3f]" />
                      <span>AI Smart Product Import from URLs</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
                      Paste 1, multiple, or up to 50 supplier product URLs. Gemini 3.8 Flash extracts product names, descriptions, gallery images, sizes, colours, variants, SKUs, wholesale costs, and specifications, and queues everything under <strong className="text-amber-400">Pending Approval</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-stone-900 text-[#d7ff3f] border border-stone-800 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#d7ff3f]" />
                      Owner Approval Enforced
                    </span>
                  </div>
                </div>

                {/* Sourcing Configuration Strip: Supplier & Target Margin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                  {/* Supplier Picker */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#d7ff3f]" />
                        <span>Source Supplier</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewSupplierModal(true)}
                        className="text-[11px] font-bold text-[#d7ff3f] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Add Supplier</span>
                      </button>
                    </div>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => {
                        setSelectedSupplierId(e.target.value);
                        const match = registeredSuppliers.find((s) => s.id === e.target.value);
                        if (match?.defaultMarginPct) {
                          setTargetMarginPct(match.defaultMarginPct);
                        }
                      }}
                      className="w-full bg-[#141414] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    >
                      {registeredSuppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} ({sup.defaultMarginPct}% Margin Default)
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-stone-500 block">
                      Assigned to all extracted products. Wholesale costs remain strictly private.
                    </span>
                  </div>

                  {/* Target Margin % Control */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Target Profit Margin (%)</span>
                      </label>
                      <span className="font-mono text-xs font-black text-emerald-400">{targetMarginPct}% Margin</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={80}
                        step={1}
                        value={targetMarginPct}
                        onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                        className="flex-1 accent-[#d7ff3f] cursor-pointer"
                      />
                      <input
                        type="number"
                        min={5}
                        max={90}
                        value={targetMarginPct}
                        onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                        className="w-16 bg-[#141414] border border-stone-700 rounded-xl px-2 py-1.5 text-center text-xs font-black text-white font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 block">
                      Formula: Selling Price = Wholesale Cost ÷ (1 − {targetMarginPct}%). Editable in review.
                    </span>
                  </div>
                </div>

                {/* Multiline URLs Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-stone-400" />
                      <span>Paste Supplier Product URLs (1 to 50 URLs, one per line):</span>
                    </label>
                    <span className="text-[10px] font-mono text-stone-400">
                      {multipleUrlsInput.split('\n').filter((u) => u.trim().startsWith('http')).length} URLs detected
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={multipleUrlsInput}
                    onChange={(e) => setMultipleUrlsInput(e.target.value)}
                    placeholder="https://supplier.example.com/item/oversized-tee&#10;https://supplier.example.com/item/oxford-shirt&#10;https://supplier.example.com/item/selvedge-denim"
                    className="w-full bg-stone-900 border border-stone-700 rounded-2xl p-3.5 text-xs text-white placeholder:text-stone-500 font-mono leading-relaxed outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>

                {/* Quick Sample URL Test Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">
                      One-Click Demo Test URLs:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMultipleUrlsInput(
                          [
                            'http://localhost:3000/api/demo-supplier/product/oversized-acid-wash-tee',
                            'http://localhost:3000/api/demo-supplier/product/oxford-cotton-shirt',
                            'http://localhost:3000/api/demo-supplier/product/denim-selvedge-jeans',
                            'http://localhost:3000/api/demo-supplier/product/french-terry-hoodie',
                            'http://localhost:3000/api/demo-supplier/product/anarkali-kurti',
                            'http://localhost:3000/api/demo-supplier/product/air-mesh-running-shoes',
                          ].join('\n')
                        )
                      }
                      className="text-[10px] font-black text-[#d7ff3f] hover:underline cursor-pointer"
                    >
                      ⚡ Load All 6 Products
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: '👕 Acid-Wash Tee',
                        url: 'http://localhost:3000/api/demo-supplier/product/oversized-acid-wash-tee',
                      },
                      {
                        label: '👔 Oxford Shirt',
                        url: 'http://localhost:3000/api/demo-supplier/product/oxford-cotton-shirt',
                      },
                      {
                        label: '👖 Selvedge Jeans',
                        url: 'http://localhost:3000/api/demo-supplier/product/denim-selvedge-jeans',
                      },
                      {
                        label: '🧥 Terry Hoodie',
                        url: 'http://localhost:3000/api/demo-supplier/product/french-terry-hoodie',
                      },
                      {
                        label: '👗 Anarkali Kurti',
                        url: 'http://localhost:3000/api/demo-supplier/product/anarkali-kurti',
                      },
                      {
                        label: '👟 Running Shoes',
                        url: 'http://localhost:3000/api/demo-supplier/product/air-mesh-running-shoes',
                      },
                      {
                        label: '🛡️ Scrape-Blocked Test',
                        url: 'https://amazon.com/dp/B08X-Sample-Protected',
                      },
                    ].map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          if (multipleUrlsInput.trim().length === 0) {
                            setMultipleUrlsInput(sample.url);
                          } else {
                            setMultipleUrlsInput((prev) => `${prev.trim()}\n${sample.url}`);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{sample.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMultipleUrlsInput('')}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-500 hover:text-stone-300 text-[11px] font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compliant with web access policies. Products start under Pending Approval.</span>
                  </div>

                  <button
                    onClick={handleExtractFromMultipleUrls}
                    disabled={isExtractingUrls || !multipleUrlsInput.trim()}
                    className="px-8 py-3 rounded-2xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 text-[#111111] font-black text-sm shadow-xl transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    {isExtractingUrls ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Extracting & Structuring with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract with Gemini AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPLIER CATALOGUE FEED URL (EXISTING HIGH-PERFORMANCE PROTOCOL DETECTOR) */}
          {importMethod === 'catalogue_url' && (
            <div className="space-y-6">
              {/* Main URL Input Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#141414] border border-stone-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-[#d7ff3f]" />
                      <span>Authorised Supplier Catalogue or Feed URL</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Paste one approved supplier REST API, JSON feed, XML export or permitted catalog URL. The system automatically inspects protocol, retrieves all available batches with pagination, and queues products for your review.
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 self-start sm:self-auto flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Secure B2B Protocol Detection
                  </span>
                </div>

                {/* Input Bar */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="flex-1 relative">
                    <Globe className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={supplierUrlInput}
                      onChange={(e) => {
                        setSupplierUrlInput(e.target.value);
                        if (urlDetectionResult) setUrlDetectionResult(null);
                      }}
                      placeholder="https://supplier.example.com/api/products or feed.json / feed.xml"
                      className="w-full bg-stone-900 border border-stone-700 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-stone-500 font-mono outline-hidden focus:border-[#d7ff3f] transition-colors"
                      disabled={isInspectingUrl}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInspectAndFetchUrl();
                        }
                      }}
                    />
                  </div>

                  <button
                    onClick={() => handleInspectAndFetchUrl()}
                    disabled={isInspectingUrl || !supplierUrlInput.trim()}
                    className="px-6 py-3 rounded-2xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 text-[#111111] font-black text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    {isInspectingUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting & Inspecting...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Inspect & Retrieve Catalogue</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Protocol detection notice */}
                <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
                  <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    Supported Protocols: Official REST APIs, JSON Catalogues, XML / RSS / Google Merchant Feeds, and Permitted CSV Exports.
                  </span>
                </div>
              </div>

              {/* DETECTION RESULT CARDS (If inspected) */}
              {urlDetectionResult && (
                <div>
                  {/* REQUIREMENT 9: UNAUTHORIZED / RESTRICTED ACCESS NOTIFICATION */}
                  {!urlDetectionResult.isAuthorized ? (
                    <div className="p-6 rounded-3xl bg-rose-950/30 border border-rose-800/80 space-y-4 shadow-2xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-900/50 border border-rose-700 flex items-center justify-center text-rose-300 shrink-0 mt-0.5">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-rose-200">
                              Authorised Supplier Access Required
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-900 text-rose-300 border border-rose-700">
                              {urlDetectionResult.protocolLabel}
                            </span>
                          </div>
                          <p className="text-xs text-rose-300/90 font-medium leading-relaxed">
                            {urlDetectionResult.message}
                          </p>
                        </div>
                      </div>

                      {/* Strict Policy Statement */}
                      <div className="p-4 rounded-2xl bg-[#141414] border border-rose-900/50 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-stone-300 font-bold">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>OBRYNT Access Compliance Policy:</span>
                        </div>
                        <p className="text-stone-400 leading-relaxed text-[11px]">
                          {urlDetectionResult.authorizationNotice ||
                            'To protect supplier intellectual property and comply with access rules, OBRYNT does not bypass web protection or scrape unauthorized websites. Never bypass access restrictions.'}
                        </p>
                      </div>

                      {/* Actionable Next Steps Checklist */}
                      <div className="space-y-2 pt-1">
                        <strong className="text-[11px] font-black uppercase text-stone-300 block tracking-wider">
                          Recommended Next Steps to Connect:
                        </strong>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-[11px] text-stone-300 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>1. Request API Key</span>
                            </div>
                            <p className="text-stone-400 text-[10px]">
                              Ask supplier administrator for an approved JSON REST API token.
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-[11px] text-stone-300 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>2. Obtain Feed URL</span>
                            </div>
                            <p className="text-stone-400 text-[10px]">
                              Request an official XML or JSON product catalog export feed.
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-[11px] text-stone-300 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>3. Upload CSV / Excel</span>
                            </div>
                            <p className="text-stone-400 text-[10px]">
                              Use the File Upload tab to import their offline catalogue spreadsheet.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* AUTHORIZED & DISCOVERED CONFIRMATION CARD */
                    <div className="p-6 rounded-3xl bg-[#141414] border border-[#d7ff3f]/40 space-y-4 shadow-2xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#d7ff3f]/10 border border-[#d7ff3f] flex items-center justify-center text-[#d7ff3f] shrink-0 mt-0.5">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white">
                                {urlDetectionResult.sourceBrand || 'Verified Supplier Hub'}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111]">
                                {urlDetectionResult.protocolLabel}
                              </span>
                              {urlDetectionResult.paginated && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-300">
                                  {urlDetectionResult.pagesRetrieved} Paginated Batches
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                              {urlDetectionResult.message}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInspectAndFetchUrl(supplierUrlInput)}
                          className="px-4 py-2 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs shrink-0 cursor-pointer shadow"
                        >
                          Queue for Review ({urlDetectionResult.totalProductsDiscovered} Items)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verified Partner One-Click Feeds */}
              <div className="p-6 rounded-3xl bg-[#141414] border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d7ff3f]" />
                      <span>Approved Supplier Catalogue Feeds (One-Click Verification)</span>
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Select any approved partner feed to test protocol detection, multi-page batch retrieval, duplicate identification, and AI auto-categorisation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {VERIFIED_SUPPLIER_SAMPLE_FEEDS.map((feed) => {
                    const isSelected = supplierUrlInput === feed.url;
                    const isSecurityTest = feed.badge === 'Security Test';

                    return (
                      <div
                        key={feed.url}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-stone-900 border-[#d7ff3f]'
                            : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                isSecurityTest
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : 'bg-[#d7ff3f]/10 text-[#d7ff3f] border border-[#d7ff3f]/30'
                              }`}
                            >
                              {feed.badge}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono truncate max-w-[140px]">
                              {feed.categoryHint}
                            </span>
                          </div>

                          <h5 className="text-xs font-black text-white">{feed.name}</h5>
                          <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                            {feed.description}
                          </p>
                          <span className="text-[10px] text-stone-500 font-mono mt-1.5 block truncate">
                            {feed.url}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSupplierUrlInput(feed.url);
                            handleInspectAndFetchUrl(feed.url);
                          }}
                          disabled={isInspectingUrl}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSecurityTest
                              ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800'
                              : 'bg-stone-800 hover:bg-[#d7ff3f] hover:text-[#111111] text-stone-200'
                          }`}
                        >
                          {isSecurityTest ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Test Access Policy</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Inspect & Fetch Catalogue</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: FILE UPLOAD DROPZONE (Preserved Excel/CSV/JSON functionality) */}
          {importMethod === 'file' && (
            <div className="space-y-6">
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
                    Drag & Drop or Click to Upload Product Spreadsheet
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
            </div>
          )}

          {/* OPTION 3: INSTANT MULTI-CATEGORY TEST FEEDS */}
          {importMethod === 'demo' && (
            <div className="p-6 rounded-3xl bg-[#141414] border border-stone-800 space-y-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d7ff3f]" />
                  <span>Instant Multi-Category Feed Test</span>
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Test the automatic sorting system instantly without uploading your own file or entering a URL.
                </p>
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
          )}

          {/* TAB 5: SUPPLIER DIRECTORY & MARGIN MANAGEMENT */}
          {importMethod === 'suppliers' && (
            <div className="space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#141414] border border-stone-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#d7ff3f]" />
                      <span>Multiple Supplier Directory & Sourcing Management</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
                      Register approved wholesale suppliers, save authorized integration details, configure default profit margins, and track wholesale costs per product. Wholesale costs remain strictly private to the store owner.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewSupplierModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs cursor-pointer flex items-center gap-2 shadow"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Supplier</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredSuppliers.map((sup) => (
                    <div
                      key={sup.id}
                      className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {sup.status}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            {sup.defaultMarginPct}% Default Margin
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white">{sup.name}</h4>
                        {sup.notes && <p className="text-xs text-stone-400 leading-relaxed">{sup.notes}</p>}
                        <div className="text-[11px] text-stone-400 space-y-1 pt-1 font-mono">
                          {sup.contactEmail && <div>Email: {sup.contactEmail}</div>}
                          {sup.phone && <div>Phone: {sup.phone}</div>}
                          {sup.apiEndpoint && <div className="truncate">Feed: {sup.apiEndpoint}</div>}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                        <span className="text-stone-500 font-mono text-[10px]">ID: {sup.id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplierId(sup.id);
                            setTargetMarginPct(sup.defaultMarginPct);
                            setImportMethod('urls');
                          }}
                          className="text-[#d7ff3f] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Import Products from this Supplier</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
          {/* Source Info & Review Mode Banner */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-[#d7ff3f] shrink-0">
                {sourceFeedMetadata.type === 'supplier_url' ? (
                  <Globe className="w-5 h-5" />
                ) : sourceFeedMetadata.type === 'file' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white truncate">
                    {sourceFeedMetadata.name || 'Imported Feed'}
                  </span>
                  {sourceFeedMetadata.protocol && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-stone-900 text-[#d7ff3f] border border-stone-800">
                      {sourceFeedMetadata.protocol}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    Draft Review Process Active
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                  {sourceFeedMetadata.url ? sourceFeedMetadata.url : 'Products are queued in draft mode. Click "Publish to Shop" when ready to make live.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setImportBatch([]);
                setCurrentStep('upload');
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              ← Back to Sources
            </button>
          </div>

          {/* Batch Metrics Strip (Discovered, AI Categorised, Waiting for Review, Duplicates Skipped) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                Total Discovered
              </span>
              <div className="text-xl font-black text-white tabular-nums">
                {sourceFeedMetadata.discovered || batchStats.total}
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                {sourceFeedMetadata.type === 'supplier_url' ? 'From Supplier URL batches' : 'From input feed'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                AI Auto-Categorised
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
                Duplicates Skipped
              </span>
              <div className="text-xl font-black text-rose-400 tabular-nums">
                {batchStats.duplicates}
              </div>
              <span className="text-[10px] text-rose-400/80 mt-0.5 block">Excluded from auto-publish</span>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApproveAllPending}
                  disabled={batchStats.pending === 0}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 disabled:opacity-30 text-emerald-300 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve All Pending ({batchStats.pending})</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveSelected}
                  disabled={selectedItemIds.size === 0}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approve Selected ({selectedItemIds.size})</span>
                </button>

                {batchStats.failed > 0 && (
                  <button
                    type="button"
                    onClick={handleRetryFailedImports}
                    disabled={isRetryingFailed}
                    className="px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 disabled:opacity-40 text-rose-300 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRetryingFailed ? 'animate-spin' : ''}`} />
                    <span>Retry Failed ({batchStats.failed})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(true)}
                  disabled={selectedItemIds.size === 0}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#d7ff3f]" />
                  <span>Bulk Edit ({selectedItemIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishImportedProducts}
                  disabled={selectedItemIds.size === 0}
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 text-[#111111] text-xs font-black shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Approved to Store ({batchStats.approved})</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Select All bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-800 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
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
                  { id: 'pending', label: 'Pending Approval', count: batchStats.pending, color: 'text-amber-400' },
                  { id: 'approved', label: 'Approved & Live', count: batchStats.approved, color: 'text-emerald-400' },
                  { id: 'needs_review', label: 'Needs Review', count: batchStats.needsReview, color: 'text-amber-300' },
                  { id: 'failed', label: 'Failed / Blocked', count: batchStats.failed, color: 'text-rose-400' },
                  { id: 'duplicates', label: 'Duplicates', count: batchStats.duplicates, color: 'text-stone-400' },
                  { id: 'all', label: 'All Items', count: batchStats.total, color: 'text-white' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      filterTab === tab.id
                        ? 'bg-[#d7ff3f] text-[#111111]'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        filterTab === tab.id ? 'bg-[#111111]/20 text-[#111111]' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {tab.count}
                    </span>
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
                    <th className="p-3 min-w-[240px]">Product & SKU</th>
                    <th className="p-3">Category / Sub</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-stone-400" />
                        <span>Supplier Price (₹)</span>
                      </div>
                    </th>
                    <th className="p-3">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Pricing Rule</span>
                      </div>
                    </th>
                    <th className="p-3 min-w-[160px]">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-white" />
                        <span>OBRYNT Selling Price</span>
                      </div>
                    </th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Approval Status</th>
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
                      const isApproved = item.approvalStatus === 'approved';
                      const isFailed = item.status === 'failed';
                      const cost = item.supplierCost || item.product.wholesalePrice || 500;
                      const price = item.product.price || 999;
                      const margin = item.marginPct !== undefined ? item.marginPct : Math.round(((price - cost) / price) * 100);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-stone-900/50 transition-colors ${
                            isApproved
                              ? 'bg-emerald-950/15'
                              : isFailed
                              ? 'bg-rose-950/25'
                              : item.isDuplicate
                              ? 'bg-rose-950/20'
                              : 'bg-amber-950/10'
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
                          <td className="p-3 min-w-[240px]">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden shrink-0 relative group">
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                {item.product.galleryUrls && item.product.galleryUrls.length > 1 && (
                                  <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-white px-1 font-mono rounded-tl">
                                    +{item.product.galleryUrls.length}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <strong className="text-white block font-extrabold line-clamp-1 text-xs">
                                  {item.product.name}
                                </strong>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-400 font-mono">
                                  <span>{item.product.sku}</span>
                                  {item.product.sizes && item.product.sizes.length > 0 && (
                                    <span className="text-stone-500">[{item.product.sizes.slice(0, 3).join(', ')}]</span>
                                  )}
                                  {item.duplicateOfSku && (
                                    <span className="text-rose-400 font-bold">
                                      (Matches {item.duplicateOfSku})
                                    </span>
                                  )}
                                </div>
                                {item.missingFields && item.missingFields.length > 0 && (
                                  <span className="inline-block text-[9px] text-amber-400/90 font-mono">
                                    Missing: {item.missingFields.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Main Category / Subcategory */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-stone-900 text-[#d7ff3f] border border-stone-800 inline-block">
                                {item.category}
                              </span>
                              <div className="text-[11px] text-stone-300 font-bold truncate">
                                {item.subcategory}
                              </div>
                            </div>
                          </td>

                          {/* Brand & Supplier */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="text-xs text-white font-bold block">{item.brand}</span>
                              <span className="text-[10px] text-stone-500 font-mono block truncate max-w-[120px]">
                                {item.sourceSupplierName || item.product.supplierName || 'Wholesale Supplier'}
                              </span>
                            </div>
                          </td>

                          {/* Supplier Price (Stored Separately) */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 font-mono font-bold text-stone-200 text-xs">
                              <Lock className="w-3 h-3 text-stone-400" />
                              <span>₹{cost.toLocaleString('en-IN')}</span>
                            </div>
                            <span className="text-[9px] text-stone-500 block">Supplier Cost</span>
                          </td>

                          {/* Rule Markup (+₹40) */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                                <span className="font-mono font-black">+₹40</span>
                                <span>Rule</span>
                              </span>
                              <span className="text-[9px] text-stone-400 block font-mono">
                                ₹{cost} + ₹40
                              </span>
                            </div>
                          </td>

                          {/* OBRYNT Selling Price */}
                          <td className="p-3 whitespace-nowrap min-w-[160px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-black text-sm tabular-nums">
                                  ₹{price.toLocaleString('en-IN')}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-stone-900 text-stone-300 border border-stone-700">
                                  Customer
                                </span>
                              </div>
                              <span className="text-[9px] text-emerald-400 font-bold block">
                                Delivery: FREE (₹0)
                              </span>
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="p-3 whitespace-nowrap text-stone-300 tabular-nums font-bold">
                            {item.product.stock}
                          </td>

                          {/* Approval Status Badge */}
                          <td className="p-3 whitespace-nowrap">
                            {isFailed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                <X className="w-3 h-3" /> Failed
                              </span>
                            ) : item.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                                <Copy className="w-3 h-3" /> Duplicate
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                                <Check className="w-3 h-3" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-800">
                                <AlertTriangle className="w-3 h-3" /> Pending Approval
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isApproved && !isFailed && !item.isDuplicate && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveItem(item.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Approve for Store"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-[#d7ff3f] hover:text-[#111111] text-stone-300 transition-colors cursor-pointer"
                                title="Edit Product Details & Images"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectItem(item.id)}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-500 hover:text-white text-stone-400 transition-colors cursor-pointer"
                                title="Reject & Remove"
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto pt-2">
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Discovered</span>
              <span className="text-xl font-black text-white">
                {importReport.discoveredCount || importReport.totalParsed}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">Found in feed</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-rose-400 uppercase font-black block">Skipped</span>
              <span className="text-xl font-black text-rose-400">
                {importReport.skippedCount ?? importReport.duplicates}
              </span>
              <span className="text-[10px] text-rose-400/70 block mt-0.5">Duplicates</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-emerald-400 uppercase font-black block">Published Live</span>
              <span className="text-xl font-black text-emerald-400">{importReport.imported}</span>
              <span className="text-[10px] text-emerald-400/70 block mt-0.5">In OBRYNT catalog</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Categories</span>
              <span className="text-xl font-black text-white">
                {Object.keys(importReport.categoriesBreakdown).length}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">Auto-sorted</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-stone-400 uppercase font-black block">Source & Protocol</span>
              <span className="text-xs font-mono text-[#d7ff3f] truncate block mt-1">
                {importReport.protocolLabel || 'Product Feed'}
              </span>
              <span className="text-[10px] text-stone-500 font-mono truncate block mt-0.5">
                {importReport.sourceName}
              </span>
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

              {/* Description */}
              <div>
                <label className="block text-stone-400 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.product.description}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      product: { ...editingItem.product, description: e.target.value },
                    })
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              {/* Pricing, Wholesale Cost & Automatic +₹40 Rule */}
              <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Global Automatic Pricing Rule</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    OBRYNT Price = Supplier Price + ₹40
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-400" />
                      <span>Supplier Price (₹)</span>
                    </label>
                    <input
                      type="number"
                      value={editingItem.supplierPrice || editingItem.supplierCost || editingItem.product.wholesalePrice || 0}
                      onChange={(e) => {
                        const cost = Math.max(0, Number(e.target.value));
                        // Mandatory rule: Selling Price = Supplier Price + ₹40
                        const selling = cost + 40;
                        const margin = Math.round((40 / (selling || 1)) * 100);
                        setEditingItem({
                          ...editingItem,
                          supplierPrice: cost,
                          supplierCost: cost,
                          markupAmount: 40,
                          marginPct: margin,
                          suggestedSellingPrice: selling,
                          product: {
                            ...editingItem.product,
                            supplierPrice: cost,
                            wholesalePrice: cost,
                            markupAmount: 40,
                            price: selling,
                          },
                        });
                      }}
                      className="w-full bg-[#141414] border border-stone-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-hidden focus:border-white"
                    />
                    <span className="text-[9px] text-stone-500 mt-0.5 block">Original Cost</span>
                  </div>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Rule Markup</span>
                    </label>
                    <div className="w-full bg-[#141414] border border-stone-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-black text-center text-sm">
                      +₹40
                    </div>
                    <span className="text-[9px] text-stone-500 mt-0.5 block text-center">Global Standard</span>
                  </div>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-white" />
                      <span>Customer Price (₹)</span>
                    </label>
                    <input
                      type="number"
                      value={editingItem.product.price}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setEditingItem({
                          ...editingItem,
                          suggestedSellingPrice: price,
                          product: { ...editingItem.product, price },
                        });
                      }}
                      className="w-full bg-[#141414] border border-stone-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-hidden focus:border-white"
                    />
                    <span className="text-[9px] text-emerald-400 mt-0.5 block text-center font-bold">Delivery: FREE (₹0)</span>
                  </div>
                </div>
              </div>

              {/* Stock, Brand, SKU */}
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-stone-400 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingItem.product.sku}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        product: { ...editingItem.product, sku: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold font-mono outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              </div>

              {/* Image Preview & Gallery */}
              <div>
                <label className="block text-stone-400 font-bold mb-1.5">Images (Click to Set Primary):</label>
                <div className="flex items-center gap-2 overflow-x-auto p-1">
                  {[editingItem.product.imageUrl, ...(editingItem.product.galleryUrls || [])]
                    .filter((url, idx, arr) => url && arr.indexOf(url) === idx)
                    .map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setEditingItem({
                            ...editingItem,
                            product: { ...editingItem.product, imageUrl: img },
                          })
                        }
                        className={`w-14 h-14 rounded-xl border overflow-hidden shrink-0 cursor-pointer transition-all ${
                          editingItem.product.imageUrl === img
                            ? 'border-[#d7ff3f] ring-2 ring-[#d7ff3f]/50'
                            : 'border-stone-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  handleApproveItem(editingItem.id);
                  setEditingItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Close</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditedItem(editingItem)}
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-[#111111] font-black text-xs cursor-pointer shadow"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW SUPPLIER MODAL */}
      {showNewSupplierModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowNewSupplierModal(false)}
        >
          <div
            className="bg-[#141414] border border-stone-800 text-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#d7ff3f]" />
                <span>Register New Supplier</span>
              </h3>
              <button onClick={() => setShowNewSupplierModal(false)} className="text-stone-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 font-bold mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  value={newSupplierData.name}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                  placeholder="e.g. Apex Textiles & Apparels"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newSupplierData.contactEmail}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, contactEmail: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newSupplierData.phone}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Default Profit Margin (%)</label>
                <input
                  type="number"
                  min={10}
                  max={85}
                  value={newSupplierData.defaultMarginPct}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, defaultMarginPct: Number(e.target.value) })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">API Endpoint / Feed URL (Optional)</label>
                <input
                  type="url"
                  value={newSupplierData.apiEndpoint}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, apiEndpoint: e.target.value })}
                  placeholder="https://api.supplier.com/v1/feed.json"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Sourcing Notes</label>
                <textarea
                  rows={2}
                  value={newSupplierData.notes}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, notes: e.target.value })}
                  placeholder="e.g. Premium knitted cotton, 2-day lead time."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white outline-hidden focus:border-[#d7ff3f]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowNewSupplierModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewSupplier}
                className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-[#111111] font-black text-xs cursor-pointer shadow"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
