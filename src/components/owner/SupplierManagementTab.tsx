import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  ShieldAlert,
  Star,
  Search,
  Package,
  Layers,
  Clock,
  CreditCard,
  Trash2,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Supplier, Product, ALL_CATEGORIES, Category } from '../../types';
import { persistSupplierToDatabase, saveSuppliers } from '../../services/supplierService';

interface SupplierManagementTabProps {
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onShowNotice: (msg: string) => void;
  products?: Product[];
  onUpdateProducts?: (products: Product[]) => void;
}

const COMMON_SUPPLIER_CATEGORIES: string[] = [
  'T-Shirts',
  'Plain T-shirts',
  'Printed T-shirts',
  'Gym & Sports',
  'Shirts',
  'Jeans',
  'Trousers',
  'Shorts',
  'Hoodies & Sweatshirts',
  'Footwear',
  'Bags & Accessories',
  'Innerwear',
  'Custom Design',
];

export const SupplierManagementTab: React.FC<SupplierManagementTabProps> = ({
  suppliers,
  onUpdateSuppliers,
  onShowNotice,
  products = [],
  onUpdateProducts,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingLinkedCompany, setViewingLinkedCompany] = useState<Supplier | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<Supplier>>({
    name: '',
    brandName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'active',
    commercialTerms: 'Net 30 days, 30% margin',
    paymentTerms: 'Net 30 days via NEFT/RTGS wire transfer',
    shippingTerms: 'Door-to-door courier surface delivery, tracking within 24h',
    wholesalePrices: '30% off retail MRP, volume tiered pricing',
    productCategories: ['T-Shirts'],
    wholesaleDiscountPct: 30,
    dispatchDays: 2,
    acceptsSingleItem: true,
    acceptsCod: true,
    acceptsReturns: true,
    autoForwardOrders: false,
  });

  // Filtered suppliers list (supports 1, 100, 1000+ companies without limit)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.brandName.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.productCategories || []).some((c) => c.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'All' ||
        (s.productCategories || []).includes(categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suppliers, search, statusFilter, categoryFilter]);

  // Map products to suppliers for quick counts
  const companyProductCount = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.supplierId) {
        counts[p.supplierId] = (counts[p.supplierId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm({
      name: '',
      brandName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      status: 'active',
      commercialTerms: 'Net 30 days, 30% margin',
      paymentTerms: 'Net 30 days via NEFT/RTGS wire transfer',
      shippingTerms: 'Door-to-door courier surface delivery, tracking within 24h',
      wholesalePrices: '30% off retail MRP, volume tiered pricing',
      productCategories: ['T-Shirts'],
      wholesaleDiscountPct: 30,
      dispatchDays: 2,
      acceptsSingleItem: true,
      acceptsCod: true,
      acceptsReturns: true,
      autoForwardOrders: false,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      ...supplier,
      productCategories: supplier.productCategories || ['T-Shirts'],
      paymentTerms: supplier.paymentTerms || supplier.commercialTerms || 'Net 30 days',
      shippingTerms: supplier.shippingTerms || `${supplier.dispatchDays}-day dispatch SLA`,
      wholesalePrices: supplier.wholesalePrices || `${supplier.wholesaleDiscountPct}% off MRP`,
    });
    setIsAddModalOpen(true);
  };

  const handleCategoryToggle = (category: string) => {
    const current = form.productCategories || [];
    if (current.includes(category)) {
      setForm({ ...form, productCategories: current.filter((c) => c !== category) });
    } else {
      setForm({ ...form, productCategories: [...current, category] });
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.brandName || !form.contactPerson || !form.email) {
      alert('Please fill out all required company fields.');
      return;
    }

    if (editingSupplier) {
      const updatedSupplier: Supplier = {
        ...editingSupplier,
        ...form,
        name: form.name!,
        brandName: form.brandName!,
        contactPerson: form.contactPerson!,
        email: form.email!,
        phone: form.phone || '+91 00000 00000',
        address: form.address || '',
        city: form.city || 'Mumbai',
        state: form.state || 'Maharashtra',
        pincode: form.pincode || '400001',
        status: (form.status as any) || 'active',
        commercialTerms: form.paymentTerms || form.commercialTerms || 'Net 30 days',
        paymentTerms: form.paymentTerms || 'Net 30 days via wire transfer',
        shippingTerms: form.shippingTerms || 'Door-to-door courier logistics',
        wholesalePrices: form.wholesalePrices || `${form.wholesaleDiscountPct || 30}% off MRP`,
        productCategories: form.productCategories || ['T-Shirts'],
        wholesaleDiscountPct: Number(form.wholesaleDiscountPct || 30),
        dispatchDays: Number(form.dispatchDays || 2),
        acceptsSingleItem: form.acceptsSingleItem ?? true,
        acceptsCod: form.acceptsCod ?? true,
        acceptsReturns: form.acceptsReturns ?? true,
        autoForwardOrders: form.autoForwardOrders ?? false,
      };

      const nextList = suppliers.map((s) => (s.id === editingSupplier.id ? updatedSupplier : s));
      onUpdateSuppliers(nextList);
      await persistSupplierToDatabase(updatedSupplier);
      onShowNotice(`Company "${updatedSupplier.brandName}" updated successfully.`);
      setIsAddModalOpen(false);
      setEditingSupplier(null);
    } else {
      const newSupplier: Supplier = {
        id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: form.name!,
        brandName: form.brandName!,
        contactPerson: form.contactPerson!,
        email: form.email!,
        phone: form.phone || '+91 00000 00000',
        address: form.address || '',
        city: form.city || 'Mumbai',
        state: form.state || 'Maharashtra',
        pincode: form.pincode || '400001',
        status: (form.status as any) || 'active',
        commercialTerms: form.paymentTerms || form.commercialTerms || 'Net 30 days',
        paymentTerms: form.paymentTerms || 'Net 30 days via wire transfer',
        shippingTerms: form.shippingTerms || 'Door-to-door courier logistics',
        wholesalePrices: form.wholesalePrices || `${form.wholesaleDiscountPct || 30}% off MRP`,
        productCategories: form.productCategories && form.productCategories.length > 0 ? form.productCategories : ['T-Shirts'],
        wholesaleDiscountPct: Number(form.wholesaleDiscountPct || 30),
        dispatchDays: Number(form.dispatchDays || 2),
        acceptsSingleItem: form.acceptsSingleItem ?? true,
        acceptsCod: form.acceptsCod ?? true,
        acceptsReturns: form.acceptsReturns ?? true,
        autoForwardOrders: form.autoForwardOrders ?? false,
        rating: 5.0,
        totalFulfilled: 0,
        totalReturned: 0,
        createdAt: new Date().toISOString(),
      };

      const nextList = [newSupplier, ...suppliers];
      onUpdateSuppliers(nextList);
      await persistSupplierToDatabase(newSupplier);
      onShowNotice(`Company "${newSupplier.brandName}" registered persistently.`);
      setIsAddModalOpen(false);
    }
  };

  const toggleSupplierStatus = (id: string) => {
    const updated = suppliers.map((s) => {
      if (s.id === id) {
        const nextStatus: 'active' | 'suspended' = s.status === 'active' ? 'suspended' : 'active';
        const modified: Supplier = { ...s, status: nextStatus };
        persistSupplierToDatabase(modified);
        return modified;
      }
      return s;
    });
    onUpdateSuppliers(updated);
    saveSuppliers(updated);
    onShowNotice('Company supplier status updated.');
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove company "${name}"?`)) {
      const updated = suppliers.filter((s) => s.id !== id);
      onUpdateSuppliers(updated);
      saveSuppliers(updated);
      onShowNotice(`Company "${name}" removed.`);
    }
  };

  // Products linked to the currently selected company
  const linkedProducts = useMemo(() => {
    if (!viewingLinkedCompany) return [];
    return products.filter((p) => p.supplierId === viewingLinkedCompany.id);
  }, [viewingLinkedCompany, products]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#d7ff3f]/10 text-[#d7ff3f] border border-[#d7ff3f]/30">
              SUPPLIER & FACTORY DIRECTORY
            </span>
            <span className="text-xs text-stone-500">· {suppliers.length} Registered</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Building2 className="w-7 h-7 text-[#d7ff3f]" />
            <span>Companies & Suppliers</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-3xl">
            Register wholesale manufacturers and brand partners. Manage product categories, wholesale pricing schedules, shipping dispatch SLAs, and commercial settlement terms.
          </p>
        </div>

        {/* Primary Action Button: Add Company */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-lg self-start sm:self-auto uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ADD COMPANY</span>
        </button>
      </div>

      {/* KPI & Directory Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Companies</span>
            <Building2 className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{suppliers.length}</div>
          <p className="text-[10px] text-stone-500 mt-0.5">No limit capacity</p>
        </div>

        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Active Suppliers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#d7ff3f] mt-1">
            {suppliers.filter((s) => s.status === 'active').length}
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">Fulfillment ready</p>
        </div>

        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Linked Products</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {products.filter((p) => Boolean(p.supplierId)).length}
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">Assigned to partners</p>
        </div>

        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Avg Dispatch SLA</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {suppliers.length > 0
              ? (suppliers.reduce((s, x) => s + (x.dispatchDays || 2), 0) / suppliers.length).toFixed(1)
              : '2.0'}{' '}
            <span className="text-xs font-bold text-stone-400">Days</span>
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">Order fulfillment speed</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company name, brand, contact person, categories, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
            />
          </div>

          {/* Status Segment Filter */}
          <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-xl border border-stone-700 shrink-0 w-full sm:w-auto">
            {(['all', 'active', 'pending', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer flex-1 sm:flex-initial ${
                  statusFilter === st
                    ? 'bg-[#d7ff3f] text-[#111111]'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] font-black uppercase text-stone-500 shrink-0 mr-1">
            Category:
          </span>
          {['All', ...COMMON_SUPPLIER_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? 'bg-white text-black'
                  : 'bg-stone-800/80 text-stone-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Companies & Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center bg-[#141414] rounded-2xl border border-stone-800">
          <Building2 className="w-12 h-12 text-stone-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-300">No companies found</p>
          <p className="text-xs text-stone-500 mt-1">
            {search || statusFilter !== 'all' || categoryFilter !== 'All'
              ? 'Try adjusting your search query or filters.'
              : 'Click "+ ADD COMPANY" above to register your first supplier partner.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-[#d7ff3f] text-[#111111] text-xs font-black rounded-full cursor-pointer uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSuppliers.map((supplier) => {
            const linkedCount = companyProductCount[supplier.id] || 0;

            return (
              <div
                key={supplier.id}
                className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-all shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Company Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-black text-[#d7ff3f] text-base shrink-0 shadow-inner">
                      {supplier.brandName ? supplier.brandName.slice(0, 2).toUpperCase() : 'CO'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white">{supplier.brandName}</h3>
                        <span className="text-xs text-stone-400 font-semibold">({supplier.name})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            supplier.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : supplier.status === 'pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              supplier.status === 'active'
                                ? 'bg-emerald-400'
                                : supplier.status === 'pending'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span>{supplier.status}</span>
                        </span>

                        {linkedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-950 text-sky-400 border border-sky-800 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{linkedCount} linked products</span>
                          </span>
                        )}
                      </div>

                      {/* Contact Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 pt-0.5">
                        <span className="font-bold text-stone-300 flex items-center gap-1">
                          👤 {supplier.contactPerson}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-500" />
                          <span>{supplier.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-500" />
                          <span>{supplier.phone}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-500" />
                          <span>
                            {supplier.city}, {supplier.state} {supplier.pincode ? `(${supplier.pincode})` : ''}
                          </span>
                        </span>
                      </div>

                      {/* Product Categories */}
                      {supplier.productCategories && supplier.productCategories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-[10px] font-black uppercase text-stone-500">Categories:</span>
                          {supplier.productCategories.map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 pt-2 lg:pt-0">
                    {linkedCount > 0 && (
                      <button
                        onClick={() => setViewingLinkedCompany(supplier)}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-sky-300 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        title="View products supplied by this company"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>View Products ({linkedCount})</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(supplier)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Edit Company Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => toggleSupplierStatus(supplier.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        supplier.status === 'active'
                          ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-900'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-900'
                      }`}
                      title={supplier.status === 'active' ? 'Suspend Supplier' : 'Activate Supplier'}
                    >
                      {supplier.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDeleteSupplier(supplier.id, supplier.brandName)}
                      className="p-1.5 bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-500 rounded-lg transition-colors cursor-pointer"
                      title="Remove Company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Terms Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-stone-800/80 text-xs">
                  {/* Wholesale Pricing */}
                  <div className="bg-[#191919] p-3 rounded-xl border border-stone-800/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-[#d7ff3f]" />
                      <span>Wholesale Prices</span>
                    </span>
                    <div className="font-bold text-[#d7ff3f]">
                      {supplier.wholesaleDiscountPct}% Off Retail MRP
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-2">
                      {supplier.wholesalePrices || 'Standard contracted wholesale pricing'}
                    </p>
                  </div>

                  {/* Shipping Terms & SLA */}
                  <div className="bg-[#191919] p-3 rounded-xl border border-stone-800/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-stone-400" />
                      <span>Shipping Terms & SLA</span>
                    </span>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{supplier.dispatchDays} Days Dispatch Target</span>
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-2">
                      {supplier.shippingTerms || 'Standard courier surface logistics'}
                    </p>
                  </div>

                  {/* Payment Terms */}
                  <div className="bg-[#191919] p-3 rounded-xl border border-stone-800/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-stone-400" />
                      <span>Payment Terms</span>
                    </span>
                    <div className="font-bold text-stone-200">
                      {supplier.paymentTerms || supplier.commercialTerms || 'Net 30 Days'}
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Settlement Cycle & Direct Bank Wire
                    </p>
                  </div>

                  {/* Operational Capabilities */}
                  <div className="bg-[#191919] p-3 rounded-xl border border-stone-800/60 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-stone-400" />
                      <span>Capabilities</span>
                    </span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px]">
                      <span className={supplier.acceptsCod ? 'text-emerald-400' : 'text-stone-500'}>
                        {supplier.acceptsCod ? '✓ COD Supported' : '✕ No COD'}
                      </span>
                      <span className={supplier.acceptsReturns ? 'text-emerald-400' : 'text-stone-500'}>
                        {supplier.acceptsReturns ? '✓ 7d Returns' : '✕ No Returns'}
                      </span>
                      <span className={supplier.acceptsSingleItem ? 'text-emerald-400' : 'text-stone-500'}>
                        {supplier.acceptsSingleItem ? '✓ Dropship' : '✕ Bulk Only'}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 block">
                      Auto-Forward: {supplier.autoForwardOrders ? 'Enabled' : 'Manual Review'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Company Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-[#141414] text-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 border border-stone-800 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div>
                <h3 className="text-xl font-black text-white">
                  {editingSupplier ? 'Edit Company & Supplier Terms' : 'Add New Company / Supplier'}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Save manufacturing agreements, wholesale prices, shipping terms, and contact details persistently.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
              {/* 1. Company Identification */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  1. Company & Brand Identification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">
                      Legal Company / Manufacturer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Apex Garments Manufacturing Pvt Ltd"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">
                      Brand / Trading Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.brandName || ''}
                      onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                      placeholder="e.g. Apex Mills Tirupur"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Contact Details */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  2. Contact Details & Location
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={form.contactPerson || ''}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="e.g. R. Senthil Kumar (Operations Head)"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="dispatch@brand.com"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 94432 00000"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">City</label>
                    <input
                      type="text"
                      value={form.city || ''}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Tirupur / Mumbai"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">State</label>
                    <input
                      type="text"
                      value={form.state || ''}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Tamil Nadu"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      value={form.pincode || ''}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      placeholder="641603"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Product Categories Supplied */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  3. Product Categories Supplied
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-stone-900 border border-stone-800">
                  {COMMON_SUPPLIER_CATEGORIES.map((cat) => {
                    const isSelected = (form.productCategories || []).includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#d7ff3f] text-[#111111]'
                            : 'bg-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Wholesale Prices & Commercials */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  4. Wholesale Prices & Rates
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">
                      Wholesale Discount (% off MRP) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="90"
                      required
                      value={form.wholesaleDiscountPct ?? 30}
                      onChange={(e) => setForm({ ...form, wholesaleDiscountPct: Number(e.target.value) })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-stone-400 font-bold mb-1">
                      Wholesale Pricing Terms / Rate Structure
                    </label>
                    <input
                      type="text"
                      value={form.wholesalePrices || ''}
                      onChange={(e) => setForm({ ...form, wholesalePrices: e.target.value })}
                      placeholder="e.g. ₹280 base crew neck, ₹420 heavyweight French terry"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Shipping Terms & Dispatch SLA */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  5. Shipping Terms & Dispatch Target
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">
                      Dispatch SLA (Days) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      required
                      value={form.dispatchDays ?? 2}
                      onChange={(e) => setForm({ ...form, dispatchDays: Number(e.target.value) })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-stone-400 font-bold mb-1">
                      Shipping Terms & Logistics
                    </label>
                    <input
                      type="text"
                      value={form.shippingTerms || ''}
                      onChange={(e) => setForm({ ...form, shippingTerms: e.target.value })}
                      placeholder="e.g. Door-to-door courier surface delivery, tracking within 24h"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Payment Terms & Supplier Status */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  6. Payment Terms & Status
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-stone-400 font-bold mb-1">
                      Payment Terms & Commercial Settlement *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.paymentTerms || ''}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      placeholder="e.g. Net 15 days via NEFT wire, weekly invoice ledger"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 font-bold mb-1">
                      Supplier Status *
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold outline-hidden focus:border-[#d7ff3f]"
                    >
                      <option value="active">Active (Receiving Orders)</option>
                      <option value="pending">Pending Review</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Capability Checkboxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptsCod ?? true}
                      onChange={(e) => setForm({ ...form, acceptsCod: e.target.checked })}
                      className="rounded accent-[#d7ff3f]"
                    />
                    <span>Accepts COD</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptsReturns ?? true}
                      onChange={(e) => setForm({ ...form, acceptsReturns: e.target.checked })}
                      className="rounded accent-[#d7ff3f]"
                    />
                    <span>Accepts Returns</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptsSingleItem ?? true}
                      onChange={(e) => setForm({ ...form, acceptsSingleItem: e.target.checked })}
                      className="rounded accent-[#d7ff3f]"
                    />
                    <span>Single-Item Dropship</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.autoForwardOrders ?? false}
                      onChange={(e) => setForm({ ...form, autoForwardOrders: e.target.checked })}
                      className="rounded accent-[#d7ff3f]"
                    />
                    <span>Auto-Forward</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-transform active:scale-95 shadow-md"
                >
                  {editingSupplier ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Linked Products Inspector Modal */}
      {viewingLinkedCompany && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingLinkedCompany(null)}
        >
          <div
            className="bg-[#141414] text-white rounded-3xl w-full max-w-2xl p-6 border border-stone-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#d7ff3f]" />
                  <span>Products Supplied by {viewingLinkedCompany.brandName}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {linkedProducts.length} product(s) linked to this manufacturing partner.
                </p>
              </div>
              <button
                onClick={() => setViewingLinkedCompany(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {linkedProducts.length === 0 ? (
              <p className="text-xs text-stone-400 p-6 text-center">
                No products are currently linked to {viewingLinkedCompany.brandName}. You can link products in the Inventory & Catalogue section or when adding a new product.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {linkedProducts.map((p) => (
                  <div
                    key={p.sku}
                    className="p-3 bg-stone-900 rounded-xl border border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: p.color || '#171717' }}
                      >
                        <span className="text-[7px] font-black text-white/70">OB</span>
                      </div>
                      <div>
                        <strong className="text-white block font-bold">{p.name}</strong>
                        <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>SKU: {p.sku}</span>
                          <span>· Category: {p.category}</span>
                          <span>· Stock: {p.stock}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-[#d7ff3f]">₹{p.price.toLocaleString('en-IN')}</div>
                      <span className="text-[10px] text-stone-500">Retail MRP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setViewingLinkedCompany(null)}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
