import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
  Users,
  Settings,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter,
  Eye,
  FileText,
  Check,
  AlertCircle,
  Download,
  Trash2,
  Edit3,
  ExternalLink,
  DollarSign,
  Truck,
  Layers,
  ArrowLeft,
  RefreshCw,
  Lock,
  Building2,
  PackageCheck,
  ShieldCheck,
  Factory,
} from 'lucide-react';
import {
  Product,
  OrderDetails,
  TransactionRecord,
  CustomDesign,
  StoreSettings,
  PromoCode,
  ALL_CATEGORIES,
  Category,
  Supplier,
  SupplierFulfilment,
  DeliveryCompany,
  CompanyAccount,
  FactoryPartner,
} from '../types';
import { exportCatalogueToCSV } from '../services/csvService';
import {
  getStoredSuppliers,
  getStoredFulfilments,
  saveSuppliers,
  saveFulfilments,
  splitOrderIntoSupplierFulfilments,
  calculateFinancials,
} from '../services/supplierService';
import { InvoiceModal } from './InvoiceModal';
import { SupplierManagementTab } from './owner/SupplierManagementTab';
import { SupplierFulfilmentTab } from './owner/SupplierFulfilmentTab';
import { FinancialsTab } from './owner/FinancialsTab';
import { SecurityAuditTab } from './owner/SecurityAuditTab';
import { ProductManagementTab } from './owner/ProductManagementTab';
import { BulkImportTab } from './owner/BulkImportTab';
import { DeliveryManagementTab } from './owner/DeliveryManagementTab';
import { CompanyManagementTab } from './owner/CompanyManagementTab';
import { FactoryPartnersTab } from './owner/FactoryPartnersTab';
import { OBRYNT_EMBLEM_SRC, OBRYNT_LOGO_SRC } from './ObryntBrand';

interface OwnerDashboardProps {
  products: Product[];
  orders: OrderDetails[];
  transactions: TransactionRecord[];
  savedDesigns: CustomDesign[];
  storeSettings: StoreSettings;
  promoCodes: PromoCode[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onUpdatePromoCodes: (codes: PromoCode[]) => void;
  onCloseDashboard: () => void;
  onLogoutOwner?: () => void;
  onShowNotice: (msg: string) => void;
  onOpenDeliveryPortal?: (company?: DeliveryCompany) => void;
  onOpenCompanyPortal?: (company: CompanyAccount) => void;
  onOpenFactoryPortal?: (token: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  products,
  orders,
  transactions,
  savedDesigns,
  storeSettings,
  promoCodes,
  onUpdateProducts,
  onUpdateOrderStatus,
  onUpdateSettings,
  onUpdatePromoCodes,
  onCloseDashboard,
  onLogoutOwner,
  onShowNotice,
  onOpenDeliveryPortal,
  onOpenCompanyPortal,
  onOpenFactoryPortal,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'orders'
    | 'custom-queue'
    | 'inventory'
    | 'bulk-import'
    | 'promotions'
    | 'customers'
    | 'settings'
    | 'suppliers'
    | 'fulfilments'
    | 'financials'
    | 'security'
    | 'delivery'
    | 'companies'
    | 'factories'
  >('overview');

  // Supplier & Fulfilment State
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredSuppliers());
  const [fulfilments, setFulfilments] = useState<SupplierFulfilment[]>(() => {
    const existing = getStoredFulfilments();
    if (existing.length === 0 && orders.length > 0) {
      const sups = getStoredSuppliers();
      const all: SupplierFulfilment[] = [];
      orders.forEach((o) => {
        all.push(...splitOrderIntoSupplierFulfilments(o, sups));
      });
      saveFulfilments(all);
      return all;
    }
    return existing;
  });

  // Accurate marketplace financial calculations
  const financials = useMemo(() => {
    return calculateFinancials(orders, fulfilments);
  }, [orders, fulfilments]);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderDetails | null>(null);

  // New Product Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({
    sku: `OB-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    category: 'T-Shirts',
    audience: 'Unisex',
    supplierId: '',
    supplierName: '',
    wholesalePrice: 0,
    price: 699,
    originalPrice: 999,
    sizes: ['S', 'M', 'L', 'XL'],
    color: '#171717',
    colorName: 'Pitch Black',
    type: 'shirt',
    tag: 'NEW',
    description: '',
    stock: 50,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...storeSettings });

  // New Coupon form state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('10');
  const [newPromoMinSpend, setNewPromoMinSpend] = useState('0');

  // Computed Business Metrics
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = orders.length;
    const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const totalUnitsInStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = products.filter((p) => (p.stock || 0) < 30).length;

    // Custom studio items count across all orders
    let customShirtsOrdered = 0;
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.customDesign || item.product.category === 'Custom Design') {
          customShirtsOrdered += item.quantity;
        }
      });
    });

    return {
      totalRevenue,
      totalOrdersCount,
      aov,
      totalUnitsInStock,
      lowStockCount,
      customShirtsOrdered,
    };
  }, [orders, products]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
      const q = orderSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.orderId.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.customer.city.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
      const q = productSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.colorName || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Custom Studio Queue Items
  const customOrdersQueue = useMemo(() => {
    const queue: { orderId: string; date: string; customerName: string; item: any; status: string }[] = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.customDesign || item.product.category === 'Custom Design') {
          queue.push({
            orderId: order.orderId,
            date: order.date,
            customerName: order.customer.fullName,
            item,
            status: order.status,
          });
        }
      });
    });
    return queue;
  }, [orders]);

  // Unique Customers List
  const customersList = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string; city: string; ordersCount: number; totalSpent: number; lastDate: string }>();
    orders.forEach((o) => {
      const key = o.customer.email.toLowerCase() || o.customer.phone;
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += o.total;
        existing.lastDate = o.date;
      } else {
        map.set(key, {
          name: o.customer.fullName,
          email: o.customer.email,
          phone: o.customer.phone,
          city: `${o.customer.city}, ${o.customer.state}`,
          ordersCount: 1,
          totalSpent: o.total,
          lastDate: o.date,
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  // Handlers
  const handleInlineStockChange = (sku: string, newStock: number) => {
    const updated = products.map((p) => (p.sku === sku ? { ...p, stock: Math.max(0, newStock) } : p));
    onUpdateProducts(updated);
    onShowNotice('Stock updated.');
  };

  const handleInlinePriceChange = (sku: string, newPrice: number) => {
    const updated = products.map((p) => (p.sku === sku ? { ...p, price: Math.max(1, newPrice) } : p));
    onUpdateProducts(updated);
    onShowNotice('Price updated.');
  };

  const handleDeleteProduct = (sku: string) => {
    if (window.confirm(`Delete product ${sku}?`)) {
      const updated = products.filter((p) => p.sku !== sku);
      onUpdateProducts(updated);
      onShowNotice('Product removed from catalog.');
    }
  };

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) {
      alert('Product name and price are required');
      return;
    }
    const fullProduct: Product = {
      sku: newProd.sku || `OB-${Date.now().toString().slice(-4)}`,
      name: newProd.name,
      category: newProd.category || 'T-Shirts',
      cat: newProd.category || 'T-Shirts',
      audience: newProd.audience || 'Unisex',
      aud: newProd.audience || 'Unisex',
      supplierId: newProd.supplierId || undefined,
      supplierName:
        newProd.supplierName ||
        (newProd.supplierId ? suppliers.find((s) => s.id === newProd.supplierId)?.brandName : undefined),
      wholesalePrice: newProd.wholesalePrice ? Number(newProd.wholesalePrice) : undefined,
      price: Number(newProd.price),
      originalPrice: Number(newProd.originalPrice || newProd.price),
      sizes: newProd.sizes || ['S', 'M', 'L', 'XL'],
      color: newProd.color || '#171717',
      colorName: newProd.colorName || 'Black',
      type: newProd.type || 'shirt',
      tag: newProd.tag || 'NEW',
      badge: newProd.tag || 'NEW',
      description: newProd.description || 'Premium OBRYNT product.',
      stock: Number(newProd.stock || 50),
      imageUrl: newProd.imageUrl || './images/product_tshirt_minimal_1793012315796.jpg',
      rating: 5.0,
      reviewCount: 1,
    };

    onUpdateProducts([fullProduct, ...products]);
    setIsAddProductOpen(false);
    onShowNotice(`Added product "${fullProduct.name}" to store.`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    onShowNotice('Store settings saved successfully.');
  };

  const handleAddPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newPromoCode.trim().toUpperCase();
    if (!code) return;
    const newCode: PromoCode = {
      code,
      discountPercent: parseInt(newPromoDiscount, 10) || 10,
      flatDiscount: 0,
      minSpend: parseInt(newPromoMinSpend, 10) || 0,
      usageCount: 0,
      active: true,
    };
    onUpdatePromoCodes([...promoCodes, newCode]);
    setNewPromoCode('');
    onShowNotice(`Promo code "${code}" created.`);
  };

  const handleTogglePromo = (code: string) => {
    const updated = promoCodes.map((c) => (c.code === code ? { ...c, active: !c.active } : c));
    onUpdatePromoCodes(updated);
  };

  const handleDeletePromo = (code: string) => {
    const updated = promoCodes.filter((c) => c.code !== code);
    onUpdatePromoCodes(updated);
    onShowNotice(`Promo code "${code}" removed.`);
  };

  const handleExportCSV = () => {
    const csv = exportCatalogueToCSV(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obrynt_inventory_${Date.now()}.csv`;
    link.click();
    onShowNotice('Inventory CSV downloaded.');
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-100 flex flex-col font-sans selection:bg-[#d7ff3f] selection:text-black">
      {/* Top Merchant Appbar */}
      <header className="sticky top-0 z-40 bg-[#141414] border-b border-stone-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shadow-md shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-serif tracking-[0.16em] text-white">
                OBRYNT MERCHANT OS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                LIVE STORE
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
              Owner Management & Fulfillment Console · Black, Platinum Silver & White
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCloseDashboard}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-100 text-[#111111] text-xs font-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VIEW STOREFRONT</span>
          </button>

          {onLogoutOwner && (
            <button
              onClick={onLogoutOwner}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-300 text-xs font-bold rounded-full transition-colors cursor-pointer border border-stone-700"
              title="Lock Owner Mode and return to public visitor view"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock / Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-[#141414] border-r border-stone-800 p-4 shrink-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 px-3 mb-2">
            CONTROL CENTER
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Orders & Fulfillment</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'orders' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'}`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('custom-queue')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'custom-queue'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Custom Studio Queue</span>
              </div>
              {customOrdersQueue.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'custom-queue' ? 'bg-black text-[#d7ff3f]' : 'bg-amber-900/60 text-amber-300'}`}>
                  {customOrdersQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Inventory & Catalogue</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'inventory' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'}`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bulk-import')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'bulk-import'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#d7ff3f] shrink-0" />
                <span>Smart Bulk Import & AI</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${activeTab === 'bulk-import' ? 'bg-black text-[#d7ff3f]' : 'bg-[#d7ff3f]/20 text-[#d7ff3f]'}`}>
                AI
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Customer Directory</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'customers' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'}`}>
                {customersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'promotions'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4" />
                <span>Banner & Coupons</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Storefront Settings</span>
              </div>
            </button>

            <div className="pt-3 pb-1 px-3 text-[10px] font-black uppercase tracking-widest text-stone-500">
              MARKETPLACE & SECURITY
            </div>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'suppliers'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Companies & Suppliers</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'suppliers' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'}`}>
                {suppliers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fulfilments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'fulfilments'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4" />
                <span>Supplier Fulfilment</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'fulfilments' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'}`}>
                {fulfilments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'financials'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Financials & Margin</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Cybersecurity & Vault</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'delivery'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#d7ff3f] shrink-0" />
                <span>Delivery Company Access</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'delivery' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'}`}>
                Restricted
              </span>
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'companies'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Company Management</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${activeTab === 'companies' ? 'bg-black text-[#d7ff3f]' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'}`}>
                Staff
              </span>
            </button>

            <button
              onClick={() => setActiveTab('factories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                activeTab === 'factories'
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Factory className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Factory Partners</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${activeTab === 'factories' ? 'bg-black text-[#d7ff3f]' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                Mills
              </span>
            </button>
          </nav>

          {/* Quick Metrics Footer */}
          <div className="mt-8 p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">
              Live Gateway Health
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>UPI & COD Active</span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              Total GMV: ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </aside>

        {/* Right Main Panel Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Executive Storefront Overview
                  </h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Real-time transaction settlement, order fulfillment status, and inventory velocity.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-full cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD PRODUCT</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-full cursor-pointer transition-colors border border-stone-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    Gross Revenue
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +18.4% this week
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    Total Orders
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {metrics.totalOrdersCount}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 mt-1 block">
                    All India Deliveries
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    Avg Order Value
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    ₹{metrics.aov.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 mt-1 block">
                    Target: ₹899+
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    Custom Studio
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#d7ff3f] tabular-nums">
                    {metrics.customShirtsOrdered}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 mt-1 block">
                    Bespoke Silkscreen
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    Active Catalog
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {products.length}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 mt-1 block">
                    9 Categories Live
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    Stock Health
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {metrics.totalUnitsInStock} <span className="text-xs font-normal text-stone-400">units</span>
                  </div>
                  {metrics.lowStockCount > 0 ? (
                    <span className="text-[10px] font-bold text-amber-400 mt-1 block">
                      {metrics.lowStockCount} items low stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 mt-1 block">
                      Inventory Healthy
                    </span>
                  )}
                </div>
              </div>

              {/* 7-Day Sales Trend & Category Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Trend Chart */}
                <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#141414] border border-stone-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Sales Velocity & Revenue Trend
                      </h3>
                      <p className="text-xs text-stone-400">
                        7-day moving revenue distribution (₹ INR)
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#d7ff3f]">
                      7 Days Total: ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Visual Bar Graph */}
                  <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-stone-800">
                    {[
                      { day: 'Mon', val: 1298, height: '40%' },
                      { day: 'Tue', val: 2498, height: '65%' },
                      { day: 'Wed', val: 1899, height: '52%' },
                      { day: 'Thu', val: 3196, height: '82%' },
                      { day: 'Fri', val: 2798, height: '70%' },
                      { day: 'Sat', val: 4290, height: '95%' },
                      { day: 'Today', val: Math.max(1298, metrics.totalRevenue), height: '100%', highlight: true },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[9px] font-mono text-stone-400 group-hover:text-white tabular-nums">
                          ₹{bar.val}
                        </span>
                        <div className="w-full max-w-[36px] bg-stone-800 rounded-t-lg relative flex items-end h-32 overflow-hidden">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              bar.highlight
                                ? 'bg-[#d7ff3f] shadow-lg shadow-[#d7ff3f]/20'
                                : 'bg-stone-600 group-hover:bg-stone-400'
                            }`}
                            style={{ height: bar.height }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${bar.highlight ? 'text-[#d7ff3f]' : 'text-stone-400'}`}>
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-3">
                    <span>Average Dispatch Turnaround: <strong>24 Hours</strong></span>
                    <span>Return Rate: <strong>&lt; 0.8%</strong></span>
                  </div>
                </div>

                {/* Category Revenue Distribution */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-3.5">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Category Performance
                  </h3>
                  <p className="text-xs text-stone-400">
                    Revenue contribution across product families
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {[
                      { name: 'T-Shirts & Tops', share: 42, color: 'bg-[#d7ff3f]' },
                      { name: 'Custom Studio Garments', share: 24, color: 'bg-emerald-400' },
                      { name: 'Footwear & Slides', share: 16, color: 'bg-sky-400' },
                      { name: 'Gym & Sports Activewear', share: 10, color: 'bg-amber-400' },
                      { name: 'Bags & Accessories', share: 5, color: 'bg-purple-400' },
                      { name: 'Beauty & Skincare', share: 3, color: 'bg-rose-400' },
                    ].map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-stone-300">
                          <span>{cat.name}</span>
                          <span className="tabular-nums font-mono">{cat.share}%</span>
                        </div>
                        <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cat.color} rounded-full`}
                            style={{ width: `${cat.share}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Quick Feed */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Recent Customer Purchases
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#d7ff3f] hover:underline cursor-pointer"
                  >
                    View All Orders ({orders.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-stone-400 uppercase tracking-wider border-b border-stone-800 pb-2">
                      <tr>
                        <th className="py-2">Order ID</th>
                        <th className="py-2">Customer</th>
                        <th className="py-2">City</th>
                        <th className="py-2">Items</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2 text-center">Status</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-medium">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.orderId} className="hover:bg-stone-900/60">
                          <td className="py-3 font-mono font-bold text-white">{o.orderId}</td>
                          <td className="py-3 font-bold text-stone-200">{o.customer.fullName}</td>
                          <td className="py-3 text-stone-400">{o.customer.city}</td>
                          <td className="py-3 text-stone-300">
                            {o.items.reduce((s, x) => s + x.quantity, 0)} item(s)
                          </td>
                          <td className="py-3 text-right font-black tabular-nums text-white">
                            ₹{o.total.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-800 text-[#d7ff3f] border border-stone-700">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setSelectedInvoiceOrder(o)}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-bold cursor-pointer"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS & FULFILLMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Orders & Fulfillment Center
                  </h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Manage real customer orders, dispatch packages, update delivery tracking, and print tax receipts.
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#141414] p-4 rounded-2xl border border-stone-800">
                <div className="flex-1 max-w-md relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order ID, Customer name, Phone..."
                    className="w-full bg-[#1c1c1c] border border-stone-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {['All', 'Confirmed', 'In Production', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                        orderStatusFilter === st
                          ? 'bg-[#d7ff3f] text-[#111111]'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center bg-[#141414] rounded-2xl border border-stone-800">
                    <Package className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-stone-300">No matching orders found</p>
                    <p className="text-xs text-stone-500 mt-1">
                      Try clearing search parameters or placing a demo order from the storefront.
                    </p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4 hover:border-stone-700 transition-colors"
                    >
                      {/* Order Row Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-black text-white">
                            {order.orderId}
                          </span>
                          <span className="text-xs text-stone-400">· {order.date}</span>
                          <span className="text-xs text-stone-400">· {order.paymentMethod}</span>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 font-bold">Status:</span>
                            <select
                              value={order.status}
                              onChange={(e) => {
                                onUpdateOrderStatus(order.orderId, e.target.value);
                                onShowNotice(`Order ${order.orderId} marked as ${e.target.value}`);
                              }}
                              className="bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f] cursor-pointer"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="In Production">In Production</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-stone-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#d7ff3f]" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* Customer Address & Shipping Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
                        <div>
                          <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">
                            Customer Details
                          </span>
                          <strong className="text-sm font-bold text-white block mt-0.5">
                            {order.customer.fullName}
                          </strong>
                          <div className="text-stone-400 mt-0.5">
                            📞 {order.customer.phone} · ✉️ {order.customer.email}
                          </div>
                        </div>

                        <div>
                          <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">
                            Delivery Destination
                          </span>
                          <div className="text-stone-300 mt-0.5 leading-relaxed">
                            {order.customer.address}, {order.customer.city}, {order.customer.state} — <strong>{order.customer.pincode}</strong>
                          </div>
                        </div>

                        <div className="text-right flex flex-col justify-between">
                          <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">
                            Settlement Summary
                          </span>
                          <div>
                            <span className="text-lg font-black text-white tabular-nums">
                              ₹{order.total.toLocaleString('en-IN')}
                            </span>
                            <div className="text-[11px] text-emerald-400">
                              Payment: Verified (Demo)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ordered Items List */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                          Package Contents ({order.items.length} unique items)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-stone-900/40 border border-stone-800 flex items-center gap-3"
                            >
                              {it.customDesign ? (
                                <div
                                  className="w-12 h-14 rounded-lg clip-shirt-preview shrink-0 flex items-center justify-center shadow-xs"
                                  style={{ backgroundColor: it.customDesign.colorHex }}
                                >
                                  <span
                                    className="text-[6px] font-black uppercase text-center px-1 line-clamp-1"
                                    style={{ color: it.customDesign.textColor }}
                                  >
                                    {it.customDesign.text}
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center shadow-xs"
                                  style={{ backgroundColor: it.product.color || '#171717' }}
                                >
                                  <span className="text-[8px] font-black text-white/70 uppercase">OB</span>
                                </div>
                              )}

                              <div className="flex-1 min-w-0 text-xs">
                                <strong className="text-white block line-clamp-1">
                                  {it.product.name}
                                </strong>
                                <div className="text-stone-400 text-[11px]">
                                  Size: <strong>{it.size}</strong> · Qty: <strong>{it.quantity}</strong>
                                </div>
                                {it.customDesign && (
                                  <span className="text-[10px] text-[#d7ff3f] font-bold block">
                                    ★ Custom Print: "{it.customDesign.text}" ({it.customDesign.side})
                                  </span>
                                )}
                              </div>

                              <span className="text-xs font-black text-stone-200 tabular-nums">
                                ₹{(it.product.price * it.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM STUDIO QUEUE */}
          {activeTab === 'custom-queue' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Custom Studio Production Queue
                  </h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Bespoke apparel printing jobs generated from the interactive 3D studio.
                  </p>
                </div>
              </div>

              {customOrdersQueue.length === 0 ? (
                <div className="p-12 text-center bg-[#141414] rounded-2xl border border-stone-800">
                  <Sparkles className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-300">No custom studio jobs in queue</p>
                  <p className="text-xs text-stone-500 mt-1">
                    Custom T-shirts designed and ordered by customers will appear here for print production.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customOrdersQueue.map((job, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#141414] border border-stone-800 flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">
                              {job.orderId}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111]">
                              {job.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">
                            Customer: <strong>{job.customerName}</strong> · Ordered on {job.date}
                          </p>
                        </div>
                      </div>

                      {/* Visual Garment Mock */}
                      <div className="bg-stone-900 rounded-xl p-4 flex items-center justify-center gap-6">
                        <div
                          className="w-20 h-24 clip-shirt-preview shrink-0 flex items-center justify-center shadow-lg relative"
                          style={{ backgroundColor: job.item.customDesign?.colorHex || '#171717' }}
                        >
                          <span
                            className="text-[8px] font-black tracking-tighter uppercase px-1 text-center line-clamp-2"
                            style={{ color: job.item.customDesign?.textColor || '#fff' }}
                          >
                            {job.item.customDesign?.text || job.item.product.name}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-stone-300">
                          <div>Print Text: <strong className="text-white">"{job.item.customDesign?.text || 'CUSTOM'}"</strong></div>
                          <div>Garment View: <strong>{job.item.customDesign?.side || 'Front'} View</strong></div>
                          <div>Garment Size: <strong>{job.item.size}</strong></div>
                          <div>Fabric Colour: <strong>{job.item.customDesign?.colorName || 'Black'}</strong></div>
                          <div>Ink Tone: <strong style={{ color: job.item.customDesign?.textColor }}>{job.item.customDesign?.textColor}</strong></div>
                        </div>
                      </div>

                      {/* Stage progression buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(job.orderId, 'In Production');
                            onShowNotice(`Job ${job.orderId} sent to Silkscreen Production`);
                          }}
                          className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          1. Silkscreen Print
                        </button>
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(job.orderId, 'Shipped');
                            onShowNotice(`Job ${job.orderId} QC approved & dispatched`);
                          }}
                          className="flex-1 py-2 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-lg cursor-pointer transition-colors"
                        >
                          2. QC & Ship
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY & CATALOGUE - PRODUCT MANAGEMENT SYSTEM */}
          {activeTab === 'inventory' && (
            <ProductManagementTab
              products={products}
              suppliers={suppliers}
              onUpdateProducts={onUpdateProducts}
              onShowNotice={onShowNotice}
              onOpenBulkImport={() => setActiveTab('bulk-import')}
            />
          )}

          {/* TAB: SMART BULK PRODUCT IMPORT & AI AUTO-CATEGORISATION */}
          {activeTab === 'bulk-import' && (
            <BulkImportTab
              products={products}
              onUpdateProducts={onUpdateProducts}
              onShowNotice={onShowNotice}
            />
          )}

          {/* TAB 5: PROMOTIONS & BANNER */}
          {activeTab === 'promotions' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Promotions & Storefront Announcements
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  Control the top scrolling marquee announcement and customer discount codes.
                </p>
              </div>

              {/* Announcement Bar Live Editor */}
              <div className="p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Top Announcement Bar (Live Storefront)
                </h3>
                <div className="bg-[#d7ff3f] text-[#111111] font-black text-xs p-3 rounded-xl text-center uppercase tracking-wider">
                  {settingsForm.announcementText}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-300">
                    Edit Announcement Text:
                  </label>
                  <input
                    type="text"
                    value={settingsForm.announcementText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-full cursor-pointer transition-transform active:scale-95"
                >
                  SAVE & PUBLISH BANNER
                </button>
              </div>

              {/* Discount Promo Codes Manager */}
              <div className="p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Active Discount Coupons
                </h3>

                {/* Create Promo Code */}
                <form onSubmit={handleAddPromoCode} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-stone-900 p-3.5 rounded-xl border border-stone-800">
                  <input
                    type="text"
                    required
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    placeholder="Coupon Code (e.g. FLASH25)"
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white uppercase outline-hidden focus:border-[#d7ff3f]"
                  />
                  <input
                    type="number"
                    required
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                    placeholder="Discount % (e.g. 15)"
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                  />
                  <input
                    type="number"
                    value={newPromoMinSpend}
                    onChange={(e) => setNewPromoMinSpend(e.target.value)}
                    placeholder="Min Spend ₹ (e.g. 999)"
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-lg cursor-pointer"
                  >
                    + CREATE CODE
                  </button>
                </form>

                {/* Coupons Table */}
                <div className="space-y-2">
                  {promoCodes.map((c) => (
                    <div
                      key={c.code}
                      className="p-3.5 rounded-xl bg-stone-900/50 border border-stone-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-[#d7ff3f] bg-black px-2.5 py-1 rounded">
                          {c.code}
                        </span>
                        <div className="text-xs text-stone-300">
                          {c.discountPercent > 0 ? `${c.discountPercent}% OFF` : `₹${c.flatDiscount} FLAT OFF`}
                          {c.minSpend > 0 && <span className="text-stone-500 ml-1.5">(Min spend ₹{c.minSpend})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePromo(c.code)}
                          className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                            c.active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {c.active ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleDeletePromo(c.code)}
                          className="p-1.5 text-stone-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS & AUDIT */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Customer Directory & Transaction Audit
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  View registered shoppers, transaction logs, and customer lifetime value.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customers Directory */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Verified Customer Profiles ({customersList.length})
                  </h3>
                  <div className="space-y-3">
                    {customersList.map((c, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-white block font-bold text-sm">{c.name}</strong>
                          <div className="text-stone-400 text-[11px] mt-0.5">
                            ✉️ {c.email} · 📞 {c.phone}
                          </div>
                          <div className="text-stone-500 text-[10px] mt-0.5">{c.city}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-[#d7ff3f] tabular-nums block">
                            ₹{c.totalSpent.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {c.ordersCount} order(s)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Gateway Transactions */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Transaction Audit Ledger ({transactions.length})
                  </h3>
                  <div className="space-y-3">
                    {transactions.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{t.id}</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                              {t.status}
                            </span>
                          </div>
                          <div className="text-stone-400 text-[11px] mt-1">
                            Order: {t.orderId} · {t.method}
                          </div>
                          <div className="text-stone-500 text-[10px]">{t.date}</div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-white tabular-nums block">
                            ₹{t.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-400">Settled</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STORE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Storefront Configuration
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  Adjust shipping thresholds, brand parameters, and checkout gateway options.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Store Brand Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.storeName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Brand Tagline
                    </label>
                    <input
                      type="text"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Free Delivery Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.freeDeliveryThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Standard Shipping Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.standardDeliveryFee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, standardDeliveryFee: Number(e.target.value) })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Merchant Support Email
                    </label>
                    <input
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Support Contact Phone
                    </label>
                    <input
                      type="text"
                      value={settingsForm.contactPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>

                {/* Gateway Toggles */}
                <div className="pt-2">
                  <span className="block text-xs font-bold text-stone-300 mb-2">
                    Payment Gateway Methods
                  </span>
                  <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <label className="flex items-center gap-2 cursor-pointer text-stone-200">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableUpi}
                        onChange={(e) => setSettingsForm({ ...settingsForm, enableUpi: e.target.checked })}
                        className="rounded accent-[#d7ff3f]"
                      />
                      <span>UPI QR (Google Pay / PhonePe / Paytm)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-stone-200">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableCod}
                        onChange={(e) => setSettingsForm({ ...settingsForm, enableCod: e.target.checked })}
                        className="rounded accent-[#d7ff3f]"
                      />
                      <span>Cash on Delivery (COD)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-stone-200">
                      <input
                        type="checkbox"
                        checked={settingsForm.enableCards}
                        onChange={(e) => setSettingsForm({ ...settingsForm, enableCards: e.target.checked })}
                        className="rounded accent-[#d7ff3f]"
                      />
                      <span>Credit & Debit Cards</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-full cursor-pointer transition-transform active:scale-95 shadow-md"
                  >
                    SAVE STORE CONFIGURATION
                  </button>
                </div>
              </form>

              {/* Official OBRYNT Brand Identity & Digital Assets Standard */}
              <div className="p-6 rounded-2xl bg-[#141414] border border-stone-800 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
                      <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white font-serif tracking-wider">
                        Official OBRYNT Brand Identity Standards
                      </h2>
                      <p className="text-xs text-stone-400">
                        Brand rules: Black, Platinum Silver and White · Exact Silver Emblem
                      </p>
                    </div>
                  </div>
                  <a
                    href={OBRYNT_LOGO_SRC}
                    download="OBRYNT-Master-Emblem.jpg"
                    className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-200 border border-stone-700 cursor-pointer"
                  >
                    Download Master Emblem
                  </a>
                </div>

                {/* Email Templates & Order Notifications Preview */}
                <div className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-stone-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    <span>Customer Email Template: Order Dispatch & Fulfillment Notice</span>
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-black p-5 text-stone-300 font-sans text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-700 bg-black">
                          <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-serif font-black tracking-widest text-white text-sm">OBRYNT</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                        noreply@obrynt.example
                      </span>
                    </div>
                    <div className="space-y-1">
                      <strong className="text-white text-sm block">Your OBRYNT order is on its way.</strong>
                      <p className="text-stone-400 text-xs leading-relaxed">
                        Dear Aarav, your tailored items from the OBRYNT Atelier have been verified, packaged with our official silver seal, and handed to dispatch.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-stone-500 text-[10px] uppercase font-bold">Estimated Delivery</div>
                        <div className="text-white font-bold">3 Business Days · Safe Insured Courier</div>
                      </div>
                      <span className="px-2 py-1 rounded bg-stone-800 text-stone-200 font-mono text-[10px]">
                        TRACK-OB-9382
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 pt-1 text-center border-t border-stone-900">
                      OBRYNT ATELIER · WEAR YOUR IDENTITY · TIMELESS STYLE
                    </div>
                  </div>
                </div>

                {/* Packaging & Digital Materials */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-black uppercase tracking-wider text-stone-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-stone-400" />
                    <span>Standardized Brand Packaging Materials</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <strong className="text-white block font-bold mb-1">Rigid Box & Garment Sleeve</strong>
                      <p className="text-stone-400 text-[11px] leading-relaxed">
                        Matte carbon black with hot-stamped platinum silver emblem on lid.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <strong className="text-white block font-bold mb-1">Damask Woven Brand Tag</strong>
                      <p className="text-stone-400 text-[11px] leading-relaxed">
                        100D dense weave with metallic silver thread and serialized batch code.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <strong className="text-white block font-bold mb-1">Authenticity Certificate</strong>
                      <p className="text-stone-400 text-[11px] leading-relaxed">
                        Tamper-evident holographic silver seal with order validation signature.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: COMPANIES & SUPPLIERS DIRECTORY */}
          {activeTab === 'suppliers' && (
            <SupplierManagementTab
              suppliers={suppliers}
              onUpdateSuppliers={setSuppliers}
              onShowNotice={onShowNotice}
              products={products}
              onUpdateProducts={onUpdateProducts}
            />
          )}

          {/* TAB 9: SUPPLIER FULFILMENT & ORDER ROUTING */}
          {activeTab === 'fulfilments' && (
            <SupplierFulfilmentTab
              fulfilments={fulfilments}
              suppliers={suppliers}
              orders={orders}
              onUpdateFulfilments={setFulfilments}
              onShowNotice={onShowNotice}
            />
          )}

          {/* TAB 10: FINANCIAL LEDGER & MARGIN WATERFALL */}
          {activeTab === 'financials' && (
            <FinancialsTab
              financials={financials}
              orders={orders}
              fulfilments={fulfilments}
              suppliers={suppliers}
              onShowNotice={onShowNotice}
            />
          )}

          {/* TAB 11: CYBERSECURITY & AUDIT VAULT */}
          {activeTab === 'security' && (
            <SecurityAuditTab onShowNotice={onShowNotice} />
          )}

          {/* TAB 12: RESTRICTED DELIVERY COMPANY MANAGEMENT */}
          {activeTab === 'delivery' && (
            <DeliveryManagementTab
              orders={orders}
              onShowNotice={onShowNotice}
              onOpenDeliveryPortal={onOpenDeliveryPortal}
            />
          )}

          {/* TAB 13: COMPANY MANAGEMENT (Staff Fulfillment Network) */}
          {activeTab === 'companies' && (
            <CompanyManagementTab
              products={products}
              orders={orders}
              onShowNotice={onShowNotice}
              onOpenCompanyPortal={onOpenCompanyPortal}
            />
          )}

          {/* TAB 14: FACTORY PARTNERS & PRODUCTION SOURCING */}
          {activeTab === 'factories' && (
            <FactoryPartnersTab
              onShowNotice={onShowNotice}
              onProductPublished={(newProd) => onUpdateProducts([newProd, ...products])}
              onOpenFactoryPortal={onOpenFactoryPortal}
            />
          )}
        </main>
      </div>

      {/* Add New Product Modal */}
      {isAddProductOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddProductOpen(false)}
        >
          <div
            className="bg-[#141414] text-white rounded-3xl w-full max-w-lg p-6 border border-stone-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black tracking-tight text-white">
                Add New Product to OBRYNT Catalogue
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 font-bold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Heavyweight Minimalist Oversize Tee"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Category</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value as Category })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  >
                    {ALL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Audience</label>
                  <select
                    value={newProd.audience}
                    onChange={(e) => setNewProd({ ...newProd, audience: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Beauty">Beauty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Supplying Company / Brand
                  </label>
                  <select
                    value={newProd.supplierId || ''}
                    onChange={(e) => {
                      const supId = e.target.value;
                      const matched = suppliers.find((s) => s.id === supId);
                      setNewProd({
                        ...newProd,
                        supplierId: supId,
                        supplierName: matched ? matched.brandName : '',
                      });
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  >
                    <option value="">OBRYNT Atelier (In-House Production)</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.brandName} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Wholesale Cost (₹)</label>
                  <input
                    type="number"
                    value={newProd.wholesalePrice || ''}
                    onChange={(e) => setNewProd({ ...newProd, wholesalePrice: Number(e.target.value) })}
                    placeholder="e.g. 350"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Color Name</label>
                  <input
                    type="text"
                    value={newProd.colorName}
                    onChange={(e) => setNewProd({ ...newProd, colorName: e.target.value })}
                    placeholder="e.g. Vintage Chalk"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Garment Type Shape</label>
                  <select
                    value={newProd.type}
                    onChange={(e) => setNewProd({ ...newProd, type: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                  >
                    <option value="shirt">T-Shirt / Top</option>
                    <option value="shoe">Footwear / Shoe</option>
                    <option value="bottle">Beauty / Bottle</option>
                    <option value="bag">Bag / Accessory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Description</label>
                <textarea
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  placeholder="Fabric specs, GSM, fit details..."
                  rows={2}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black rounded-xl cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          settings={storeSettings}
        />
      )}
    </div>
  );
};
