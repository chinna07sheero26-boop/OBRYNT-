import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Eye,
  RefreshCw,
  Database,
  Tag,
  Layers,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Package,
} from 'lucide-react';
import { Product, Category, ALL_CATEGORIES, Supplier } from '../../types';
import {
  saveProduct,
  deleteProduct,
  uploadProductImage,
  fetchProductsFromSupabase,
} from '../../services/productService';
import { getSupabaseStatus } from '../../services/supabaseClient';

interface ProductManagementTabProps {
  products: Product[];
  suppliers: Supplier[];
  onUpdateProducts: (products: Product[]) => void;
  onShowNotice: (msg: string) => void;
  onOpenBulkImport?: () => void;
}

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const PRESET_COLORS = [
  { name: 'Pitch Black', hex: '#171717' },
  { name: 'Chalk White', hex: '#f5f5f4' },
  { name: 'Deep Navy', hex: '#1e293b' },
  { name: 'Sage Olive', hex: '#4d5c43' },
  { name: 'Terracotta Rust', hex: '#9f4d35' },
  { name: 'Vintage Grey', hex: '#52525b' },
  { name: 'Electric Lime', hex: '#d7ff3f' },
];

export const ProductManagementTab: React.FC<ProductManagementTabProps> = ({
  products,
  suppliers,
  onUpdateProducts,
  onShowNotice,
  onOpenBulkImport,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'stock-low'>('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteConfirmationSku, setDeleteConfirmationSku] = useState<string | null>(null);

  // Form State
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('OBRYNT');
  const [formCategory, setFormCategory] = useState<Category>('T-Shirts');
  const [formAudience, setFormAudience] = useState<'Unisex' | 'Men' | 'Women' | 'Beauty'>('Unisex');
  const [formPrice, setFormPrice] = useState<number>(699);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(999);
  const [formStock, setFormStock] = useState<number>(50);
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'out_of_stock'>('active');
  const [formDescription, setFormDescription] = useState('');
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(320);
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [formColors, setFormColors] = useState<string[]>(['#171717']);
  const [customColorHex, setCustomColorHex] = useState('#171717');
  const [formImages, setFormImages] = useState<string[]>([
    '/images/product_tshirt_minimal_1793012315796.jpg',
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseStatus = getSupabaseStatus();

  // Statistics
  const stats = useMemo(() => {
    let active = 0;
    let draft = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach((p) => {
      const isOos = p.status === 'out_of_stock' || p.stock === 0;
      const isDrf = p.status === 'draft' || p.isPublished === false;
      if (isOos) {
        outOfStock++;
      } else if (isDrf) {
        draft++;
      } else {
        active++;
      }

      if (p.stock > 0 && p.stock < 25) {
        lowStock++;
      }
    });

    return { total: products.length, active, draft, outOfStock, lowStock };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeof p.category === 'string' && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const isOos = p.status === 'out_of_stock' || p.stock === 0;
        const isDrf = p.status === 'draft' || p.isPublished === false;
        if (statusFilter === 'out_of_stock' && !isOos) return false;
        if (statusFilter === 'draft' && !isDrf) return false;
        if (statusFilter === 'active' && (isOos || isDrf)) return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && p.category !== categoryFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'stock-low') return a.stock - b.stock;
      return 0; // default order
    });
  }, [products, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Reset Form for New Product
  const openAddProductModal = () => {
    const randomSku = `OB-${Math.floor(100 + Math.random() * 900)}`;
    setFormSku(randomSku);
    setFormName('');
    setFormBrand('OBRYNT');
    setFormCategory('T-Shirts');
    setFormAudience('Unisex');
    setFormPrice(699);
    setFormOriginalPrice(999);
    setFormStock(50);
    setFormStatus('active');
    setFormDescription('Crafted from premium heavyweight 240 GSM organic combed cotton with double-stitched reinforced seams.');
    setFormWholesalePrice(320);
    setFormSupplierId('');
    setFormSizes(['S', 'M', 'L', 'XL']);
    setFormColors(['#171717']);
    setFormImages(['/images/product_tshirt_minimal_1793012315796.jpg']);
    setImageUrlInput('');
    setActivePreviewImageIndex(0);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditProductModal = (product: Product) => {
    setFormSku(product.sku);
    setFormName(product.name);
    setFormBrand(product.brand || 'OBRYNT');
    setFormCategory((product.category as Category) || 'T-Shirts');
    setFormAudience((product.audience as any) || 'Unisex');
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice || Math.round(product.price * 1.35));
    setFormStock(product.stock);
    setFormStatus(
      product.status === 'draft'
        ? 'draft'
        : product.stock === 0 || product.status === 'out_of_stock'
        ? 'out_of_stock'
        : 'active'
    );
    setFormDescription(product.description || '');
    setFormWholesalePrice(product.wholesalePrice || Math.round(product.price * 0.5));
    setFormSupplierId(product.supplierId || '');
    setFormSizes(product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL']);
    
    // Gather all images (primary + gallery)
    const imgs: string[] = [];
    if (product.imageUrl) imgs.push(product.imageUrl);
    if (product.galleryUrls && Array.isArray(product.galleryUrls)) {
      product.galleryUrls.forEach((u) => {
        if (u && !imgs.includes(u)) imgs.push(u);
      });
    }
    setFormImages(imgs.length > 0 ? imgs : ['/images/product_tshirt_minimal_1793012315796.jpg']);

    // Colors
    if (product.colors && product.colors.length > 0) {
      setFormColors(product.colors);
    } else if (product.color) {
      setFormColors([product.color]);
    } else {
      setFormColors(['#171717']);
    }

    setImageUrlInput('');
    setActivePreviewImageIndex(0);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Toggle Size selection
  const handleToggleSize = (size: string) => {
    if (formSizes.includes(size)) {
      if (formSizes.length > 1) {
        setFormSizes(formSizes.filter((s) => s !== size));
      } else {
        onShowNotice('At least one size variant must remain active.');
      }
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  // Toggle Color selection
  const handleToggleColor = (hex: string) => {
    if (formColors.includes(hex)) {
      if (formColors.length > 1) {
        setFormColors(formColors.filter((c) => c !== hex));
      }
    } else {
      setFormColors([...formColors, hex]);
    }
  };

  // Add custom color
  const handleAddCustomColor = () => {
    if (!formColors.includes(customColorHex)) {
      setFormColors([...formColors, customColorHex]);
    }
  };

  // Image Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadProductImage(file);
        if (res.url) {
          newUrls.push(res.url);
        }
      }

      if (newUrls.length > 0) {
        setFormImages((prev) => [...prev, ...newUrls]);
        onShowNotice(`Uploaded ${newUrls.length} product image${newUrls.length > 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      onShowNotice('Failed to upload image. Please try again or use direct image URL.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add Image URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const cleanUrl = imageUrlInput.trim();
    if (!formImages.includes(cleanUrl)) {
      setFormImages([...formImages, cleanUrl]);
      setImageUrlInput('');
      onShowNotice('Image URL attached');
    }
  };

  // Remove Image
  const handleRemoveImage = (index: number) => {
    if (formImages.length <= 1) {
      onShowNotice('Product must have at least one primary display image.');
      return;
    }
    const updated = formImages.filter((_, i) => i !== index);
    setFormImages(updated);
    if (activePreviewImageIndex >= updated.length) {
      setActivePreviewImageIndex(0);
    }
  };

  // Set image as primary cover
  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const target = formImages[index];
    const rest = formImages.filter((_, i) => i !== index);
    setFormImages([target, ...rest]);
    setActivePreviewImageIndex(0);
    onShowNotice('Primary cover image updated');
  };

  // Form Submit (Save Product)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) {
      onShowNotice('Please enter Product SKU and Name.');
      return;
    }

    setIsSaving(true);

    const primaryImage = formImages[0] || '/images/product_tshirt_minimal_1793012315796.jpg';
    const gallery = formImages.slice(1);
    const matchedSupplier = suppliers.find((s) => s.id === formSupplierId);

    const productPayload: Product = {
      sku: formSku.trim().toUpperCase(),
      name: formName.trim(),
      brand: formBrand.trim() || 'OBRYNT',
      brandName: formBrand.trim() || 'OBRYNT',
      category: formCategory,
      cat: formCategory,
      audience: formAudience,
      aud: formAudience,
      price: Number(formPrice) || 0,
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      stock: formStatus === 'out_of_stock' ? 0 : Number(formStock) || 0,
      status: formStatus,
      isPublished: formStatus !== 'draft',
      description: formDescription,
      imageUrl: primaryImage,
      galleryUrls: gallery,
      sizes: formSizes,
      colors: formColors,
      color: formColors[0] || '#171717',
      colorName: 'Standard',
      wholesalePrice: formWholesalePrice ? Number(formWholesalePrice) : undefined,
      supplierId: formSupplierId || undefined,
      supplierName: matchedSupplier ? matchedSupplier.brandName : undefined,
      tag: formStatus === 'out_of_stock' ? 'SOLD OUT' : 'NEW',
    };

    try {
      const result = await saveProduct(productPayload);

      // Update parent list
      const existingIdx = products.findIndex((p) => p.sku === productPayload.sku);
      let updatedList: Product[];
      if (existingIdx >= 0) {
        updatedList = [...products];
        updatedList[existingIdx] = result.product;
      } else {
        updatedList = [result.product, ...products];
      }

      onUpdateProducts(updatedList);
      setIsModalOpen(false);

      if (result.savedToSupabase) {
        onShowNotice(`Product "${productPayload.name}" saved securely to Supabase database.`);
      } else {
        onShowNotice(`Product "${productPayload.name}" saved and live in storefront catalog.`);
      }
    } catch (err: any) {
      onShowNotice(`Error saving product: ${err?.message || 'Check database connection'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (sku: string) => {
    try {
      const res = await deleteProduct(sku);
      const updated = products.filter((p) => p.sku !== sku);
      onUpdateProducts(updated);
      setDeleteConfirmationSku(null);

      if (res.deletedFromSupabase) {
        onShowNotice(`Product ${sku} permanently deleted from Supabase.`);
      } else {
        onShowNotice(`Product ${sku} removed from catalog.`);
      }
    } catch (err: any) {
      onShowNotice(`Failed to delete product: ${err?.message}`);
    }
  };

  // Quick refresh from Supabase
  const handleRefreshSupabase = async () => {
    onShowNotice('Syncing catalogue from Supabase database...');
    const res = await fetchProductsFromSupabase();
    if (res.success && res.products.length > 0) {
      onUpdateProducts(res.products);
      onShowNotice(`Synchronized ${res.products.length} products from Supabase.`);
    } else if (res.error) {
      onShowNotice(`Supabase sync note: ${res.error}`);
    } else {
      onShowNotice('Supabase products table is ready. Current local catalogue active.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Product Management System
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111]">
              Live
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Create, update, organize, and publish products across all categories with Supabase database & storage synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefreshSupabase}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition-colors cursor-pointer"
            title="Sync with Supabase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Supabase</span>
          </button>
          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-xl border border-stone-800 hover:border-[#d7ff3f] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d7ff3f]" />
              <span className="hidden sm:inline">Smart Bulk Import</span>
            </button>
          )}
          <button
            onClick={openAddProductModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD PRODUCT</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
            Total Catalogue
          </span>
          <div className="text-xl font-black text-white tabular-nums">{stats.total}</div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Across all categories</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
            Active in Shop
          </span>
          <div className="text-xl font-black text-white tabular-nums">{stats.active}</div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live & purchasable
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
            Draft Items
          </span>
          <div className="text-xl font-black text-white tabular-nums">{stats.draft}</div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Hidden from customers</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
            Out of Stock
          </span>
          <div className="text-xl font-black text-white tabular-nums">{stats.outOfStock}</div>
          <span className="text-[10px] text-rose-400 mt-0.5 block">Zero available units</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
            Low Stock Alert
          </span>
          <div className="text-xl font-black text-amber-400 tabular-nums">{stats.lowStock}</div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">&lt; 25 units remaining</span>
        </div>
      </div>

      {/* Database Connection Indicator Banner */}
      <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#d7ff3f]" />
          <span className="font-bold text-stone-200">Database Storage Mode:</span>
          {supabaseStatus.isConfigured ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Supabase Connected ({supabaseStatus.source})
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400">
              Local Reactive Mode (Supabase URL pending)
            </span>
          )}
        </div>
        <div className="text-[11px] text-stone-400">
          All modifications automatically populate the customer shopping catalogue and checkout bag.
        </div>
      </div>

      {/* Search, Status & Category Filters */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, brand, category..."
              className="w-full bg-[#1c1c1c] border border-stone-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-900 text-stone-300 border border-stone-700 hover:border-[#d7ff3f] rounded-xl px-3 py-2 text-xs font-semibold outline-hidden cursor-pointer"
            >
              <option value="All">All Categories ({products.length})</option>
              {ALL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-900 text-stone-300 border border-stone-700 hover:border-[#d7ff3f] rounded-xl px-3 py-2 text-xs font-semibold outline-hidden cursor-pointer"
            >
              <option value="newest">Sort: Default / New</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock-low">Stock: Low First</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-t border-stone-800 pt-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
            Status:
          </span>
          {[
            { id: 'all', label: 'All Products', count: stats.total },
            { id: 'active', label: 'Active', count: stats.active },
            { id: 'draft', label: 'Drafts', count: stats.draft },
            { id: 'out_of_stock', label: 'Out of Stock', count: stats.outOfStock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-[#111111]/20 text-[#111111]' : 'bg-stone-900 text-stone-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-[#141414] rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-900 text-stone-400 font-bold uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="p-3.5">Product & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Price & MRP</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Sizes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-500">
                    <Package className="w-10 h-10 mx-auto mb-2 text-stone-600" />
                    <p className="font-bold text-stone-400">No products match your search or filter.</p>
                    <p className="text-xs text-stone-600 mt-1">
                      Try clearing filters or click "+ ADD PRODUCT" to create a new item.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOos = p.status === 'out_of_stock' || p.stock === 0;
                  const isDrf = p.status === 'draft' || p.isPublished === false;
                  const effectiveStatus = isOos ? 'Out of Stock' : isDrf ? 'Draft' : 'Active';

                  return (
                    <tr key={p.sku} className="hover:bg-stone-900/50 transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="p-3.5 flex items-center gap-3 min-w-[240px]">
                        <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[9px] font-black text-stone-500 uppercase">OB</span>
                          )}
                          {p.galleryUrls && p.galleryUrls.length > 0 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-black text-white px-1 rounded">
                              +{p.galleryUrls.length}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="text-white block font-extrabold line-clamp-1 text-xs">
                            {p.name}
                          </strong>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                            <span className="font-mono text-stone-400">{p.sku}</span>
                            <span>•</span>
                            <span>{p.audience || 'Unisex'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 text-stone-300 font-bold whitespace-nowrap">
                        {p.category}
                      </td>

                      {/* Brand */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-stone-900 text-stone-300 border border-stone-800">
                          {p.brand || p.brandName || 'OBRYNT'}
                        </span>
                      </td>

                      {/* Price & MRP */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-white font-black text-sm tabular-nums">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-stone-500 line-through text-[10px] tabular-nums">
                              ₹{p.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black tabular-nums ${
                              p.stock === 0
                                ? 'text-rose-400'
                                : p.stock < 25
                                ? 'text-amber-400'
                                : 'text-stone-200'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <span className="text-[10px] text-stone-400">units</span>
                        </div>
                      </td>

                      {/* Sizes */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {(p.sizes || ['S', 'M', 'L']).slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.2 bg-stone-900 border border-stone-800 rounded text-[9px] font-bold text-stone-400"
                            >
                              {s}
                            </span>
                          ))}
                          {(p.sizes || []).length > 4 && (
                            <span className="text-[9px] text-stone-400">
                              +{p.sizes.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {effectiveStatus === 'Active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                        {effectiveStatus === 'Draft' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-950 text-amber-400 border border-amber-800">
                            Draft
                          </span>
                        )}
                        {effectiveStatus === 'Out of Stock' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-950 text-rose-400 border border-rose-800">
                            Sold Out
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-[#d7ff3f] hover:text-[#111111] text-stone-300 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmationSku(p.sku)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-500 hover:text-white text-stone-400 transition-colors cursor-pointer"
                            title="Delete Product"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmationSku && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmationSku(null)}
        >
          <div
            className="bg-[#141414] border border-stone-800 text-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-white">Delete Product?</h3>
              <p className="text-xs text-stone-400 mt-1">
                Are you sure you want to permanently delete SKU{' '}
                <strong className="text-white font-mono">{deleteConfirmationSku}</strong>? This action will remove it from both Supabase and the live shopping catalogue.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationSku(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmationSku)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-500 cursor-pointer"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#141414] border border-stone-800 text-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-7 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{isEditing ? 'Edit Product' : 'Add New Product'}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-800 text-[#d7ff3f]">
                    {formSku}
                  </span>
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Complete product definitions, multiple images, sizing variants, and live preview.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Two-Column Grid: Left Form, Right Live Preview */}
            <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fields (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Basic Info */}
                <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f] block">
                    1. Identity & Classification
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Heavyweight Minimalist Oversize Tee"
                      className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="e.g. OBRYNT"
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        SKU (Unique Item Code) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                        placeholder="e.g. OB-409"
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#d7ff3f] uppercase outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as Category)}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                      >
                        {ALL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Audience
                      </label>
                      <select
                        value={formAudience}
                        onChange={(e) => setFormAudience(e.target.value as any)}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                      >
                        <option value="Unisex">Unisex</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Beauty">Beauty</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Product Status *
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                      >
                        <option value="active">Active (Visible in Shop)</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Description & Specifications
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Fabric GSM, material composition, cut, model fit, washing instructions..."
                      className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>

                {/* 2. Pricing & Stock */}
                <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f] block">
                    2. Pricing & Inventory Controls
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-black text-white tabular-nums outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Original Price / MRP (₹)
                      </label>
                      <input
                        type="number"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-400 tabular-nums outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs font-black text-white tabular-nums outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Supplying Company (Optional)
                      </label>
                      <select
                        value={formSupplierId}
                        onChange={(e) => {
                          setFormSupplierId(e.target.value);
                          const matched = suppliers.find((s) => s.id === e.target.value);
                          if (matched) {
                            setFormBrand(matched.brandName);
                          }
                        }}
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-300 outline-hidden focus:border-[#d7ff3f]"
                      >
                        <option value="">OBRYNT Atelier (In-House)</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.brandName} ({s.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Wholesale Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={formWholesalePrice}
                        onChange={(e) => setFormWholesalePrice(Number(e.target.value))}
                        placeholder="Cost of goods"
                        className="w-full bg-[#181818] border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-300 outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Sizes & Colors */}
                <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f] block">
                    3. Sizing & Colour Variants
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Available Sizes (Click to toggle)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_SIZES.map((sz) => {
                        const isSelected = formSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSize(sz)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#d7ff3f] text-[#111111] shadow-xs'
                                : 'bg-stone-800 text-stone-400 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Available Colours
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESET_COLORS.map((col) => {
                        const isSelected = formColors.includes(col.hex);
                        return (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => handleToggleColor(col.hex)}
                            title={col.name}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border-2 ${
                              isSelected ? 'border-[#d7ff3f] scale-110' : 'border-stone-700'
                            }`}
                            style={{ backgroundColor: col.hex }}
                          >
                            {isSelected && (
                              <Check
                                className={`w-3.5 h-3.5 ${
                                  col.hex === '#f5f5f4' ? 'text-black' : 'text-white'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}

                      {/* Custom color picker */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <input
                          type="color"
                          value={customColorHex}
                          onChange={(e) => setCustomColorHex(e.target.value)}
                          className="w-7 h-7 rounded-lg bg-transparent cursor-pointer border border-stone-700"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          + Add Color
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Multiple Images & Previews */}
                <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f] block">
                      4. Product Images (Multiple Uploads)
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {formImages.length} image{formImages.length > 1 ? 's' : ''} attached
                    </span>
                  </div>

                  {/* Upload Drop Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-700 hover:border-[#d7ff3f] rounded-2xl p-4 text-center cursor-pointer bg-stone-900/40 transition-colors flex flex-col items-center justify-center min-h-[90px]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Upload className="w-5 h-5 text-[#d7ff3f] mb-1" />
                      <span className="text-xs font-bold text-white block">
                        {isUploadingImage ? 'Uploading image...' : 'Click to Upload Images'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        PNG, JPG, WebP supported
                      </span>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-1.5 flex flex-col justify-center">
                      <label className="text-[11px] font-bold text-stone-400">
                        Or Attach Public Image URL:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-[#181818] border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-hidden focus:border-[#d7ff3f]"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-[#d7ff3f] hover:text-[#111111] text-xs font-bold rounded-xl cursor-pointer transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Gallery Thumbnail Strip Before Saving */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-400">
                      Gallery & Cover Selection (Click cover to set as primary):
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {formImages.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-xl bg-stone-900 border-2 overflow-hidden group cursor-pointer ${
                            idx === 0 ? 'border-[#d7ff3f]' : 'border-stone-800 hover:border-stone-600'
                          }`}
                          onClick={() => handleSetPrimaryImage(idx)}
                        >
                          <img
                            src={img}
                            alt={`Preview ${idx}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-[#d7ff3f] text-[#111111] text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Storefront Card Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#d7ff3f]" />
                      Live Customer Preview
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Shop Catalogue View
                    </span>
                  </div>

                  {/* Customer Card Mock */}
                  <div className="rounded-3xl bg-[#141414] border border-stone-800 overflow-hidden shadow-2xl p-4 space-y-3">
                    {/* Primary Image Display */}
                    <div className="relative aspect-3/4 rounded-2xl bg-stone-900 overflow-hidden border border-stone-800 flex items-center justify-center">
                      <img
                        src={
                          formImages[activePreviewImageIndex] ||
                          formImages[0] ||
                          '/images/product_tshirt_minimal_1793012315796.jpg'
                        }
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />

                      {/* Status / Tag Badge */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111] shadow-md">
                          {formBrand || 'OBRYNT'}
                        </span>
                        {formStatus === 'out_of_stock' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-600 text-white">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {/* Multiple Gallery Thumbnail Dots */}
                      {formImages.length > 1 && (
                        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
                          {formImages.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActivePreviewImageIndex(i)}
                              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                                activePreviewImageIndex === i
                                  ? 'bg-[#d7ff3f] w-4'
                                  : 'bg-white/60 hover:bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Meta */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span className="font-bold">{formCategory}</span>
                        <span className="font-mono text-[10px]">{formSku}</span>
                      </div>

                      <h4 className="text-sm font-black text-white line-clamp-1">
                        {formName || 'Untilted Product Title'}
                      </h4>

                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-white">
                          ₹{formPrice.toLocaleString('en-IN')}
                        </span>
                        {formOriginalPrice > formPrice && (
                          <span className="text-xs text-stone-500 line-through">
                            ₹{formOriginalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        {formOriginalPrice > formPrice && (
                          <span className="text-[10px] font-black text-emerald-400">
                            {Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      {/* Sizes Preview */}
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] text-stone-400 mr-1">Sizes:</span>
                        {formSizes.map((s) => (
                          <span
                            key={s}
                            className="w-5 h-5 rounded-md bg-stone-900 border border-stone-800 text-[9px] font-bold text-stone-300 flex items-center justify-center"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Colors Preview */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-stone-400 mr-1">Colours:</span>
                        {formColors.map((hex) => (
                          <span
                            key={hex}
                            className="w-3.5 h-3.5 rounded-full border border-stone-700"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>

                      <p className="text-[11px] text-stone-400 line-clamp-2 pt-1 border-t border-stone-800/80">
                        {formDescription || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Mobile App Sync Badge */}
                  <div className="mt-3 p-3 rounded-2xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-400">
                    <span className="font-bold text-stone-200 block mb-0.5">
                      Multi-Platform Sync:
                    </span>
                    This product schema matches both the OBRYNT Web Store and upcoming OBRYNT Android App catalog definitions.
                  </div>
                </div>
              </div>

              {/* Modal Action Bar */}
              <div className="lg:col-span-12 pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-7 py-2.5 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving to Database...' : isEditing ? 'Update Product' : 'Save & Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
