import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  Search,
  KeyRound,
  Ban,
  CheckCircle2,
  Package,
  Layers,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { CompanyAccount, CompanyAssignedOrder, Product, OrderDetails } from '../../types';
import {
  getStoredCompanies,
  saveCompanies,
  createCompanyAccount,
  updateCompanyStatus,
  resetCompanyPassword,
  assignProductsToCompany,
  assignOrderToCompany,
  getStoredAssignedOrders,
  updateCompanyOrderStatus,
} from '../../services/companyService';

interface CompanyManagementTabProps {
  products: Product[];
  orders: OrderDetails[];
  onShowNotice: (msg: string) => void;
  onOpenCompanyPortal?: (company: CompanyAccount) => void;
}

export const CompanyManagementTab: React.FC<CompanyManagementTabProps> = ({
  products,
  orders,
  onShowNotice,
  onOpenCompanyPortal,
}) => {
  const [companies, setCompanies] = useState<CompanyAccount[]>(() => getStoredCompanies());
  const [assignedOrders, setAssignedOrders] = useState<CompanyAssignedOrder[]>(() => getStoredAssignedOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'active' | 'suspended'>('All');

  // Modal: Add Company
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    id: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    notes: '',
  });

  // Modal: Assign Products
  const [selectedCompanyForProducts, setSelectedCompanyForProducts] = useState<CompanyAccount | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Modal: Assign Order
  const [selectedCompanyForOrders, setSelectedCompanyForOrders] = useState<CompanyAccount | null>(null);
  const [orderSearch, setOrderSearch] = useState('');

  // Password reset state
  const [editingPasswordCompanyId, setEditingPasswordCompanyId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Activity drawer
  const [selectedCompanyActivity, setSelectedCompanyActivity] = useState<CompanyAccount | null>(null);

  const refreshData = () => {
    setCompanies(getStoredCompanies());
    setAssignedOrders(getStoredAssignedOrders());
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Handle Add Company Submit
  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim() || !newCompany.password.trim()) {
      alert('Company name and staff access password are required.');
      return;
    }

    const assignedId =
      newCompany.id.trim() ||
      `COMP-${newCompany.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Math.floor(
        Math.random() * 900 + 100
      )}`;

    try {
      await createCompanyAccount({
        id: assignedId,
        name: newCompany.name.trim(),
        contactPerson: newCompany.contactPerson.trim(),
        email: newCompany.email.trim(),
        phone: newCompany.phone.trim(),
        address: newCompany.address.trim(),
        accessPasswordHash: newCompany.password.trim(),
        plainPasswordPreview: newCompany.password.trim(),
        status: 'active',
        assignedProducts: [],
        notes: newCompany.notes.trim(),
      });

      refreshData();
      setIsAddModalOpen(false);
      setNewCompany({
        id: '',
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        notes: '',
      });
      onShowNotice(`Company "${newCompany.name}" registered and activated with password.`);
    } catch (err: any) {
      alert(`Error creating company: ${err?.message || 'Check inputs'}`);
    }
  };

  const handleToggleStatus = (company: CompanyAccount) => {
    const nextStatus = company.status === 'active' ? 'suspended' : 'active';
    updateCompanyStatus(company.id, nextStatus);
    refreshData();
    onShowNotice(`Company "${company.name}" is now ${nextStatus.toUpperCase()}.`);
  };

  const handleSaveResetPassword = (companyId: string) => {
    if (!newPasswordVal.trim()) return;
    resetCompanyPassword(companyId, newPasswordVal.trim());
    refreshData();
    setEditingPasswordCompanyId(null);
    setNewPasswordVal('');
    onShowNotice('Staff access password updated successfully.');
  };

  // Toggle assigned product SKU
  const handleToggleProductSku = (sku: string) => {
    if (!selectedCompanyForProducts) return;
    const current = selectedCompanyForProducts.assignedProducts || [];
    const exists = current.includes(sku);
    const next = exists ? current.filter((s) => s !== sku) : [...current, sku];
    assignProductsToCompany(selectedCompanyForProducts.id, next);
    setSelectedCompanyForProducts({ ...selectedCompanyForProducts, assignedProducts: next });
    refreshData();
    onShowNotice(`Assigned products for ${selectedCompanyForProducts.name} updated.`);
  };

  // Assign Order to Company
  const handleAssignOrder = (order: OrderDetails, itemIndex = 0) => {
    if (!selectedCompanyForOrders) return;
    const item = order.items[itemIndex] || order.items[0];
    if (!item) return;

    assignOrderToCompany(selectedCompanyForOrders.id, {
      orderId: order.orderId,
      orderDate: order.date,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      deliveryAddress: order.customer.address,
      city: order.customer.city,
      state: order.customer.state,
      pincode: order.customer.pincode,
      productName: item.product.name,
      productSku: item.product.sku,
      productImageUrl: item.product.imageUrl || item.product.galleryUrls?.[0] || '/images/product_tshirt_minimal_1793012315796.jpg',
      quantity: item.quantity,
      size: item.size || 'Standard',
      color: item.product.colorName || item.product.color || 'Default',
      packingStatus: 'Pending',
      dispatchStatus: 'Pending',
      fulfillmentStatus: 'Order received',
      notes: `Order placed via OBRYNT storefront. Assigned by Owner to ${selectedCompanyForOrders.name}.`,
    });

    refreshData();
    onShowNotice(`Order #${order.orderId} assigned to ${selectedCompanyForOrders.name}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metric Banner */}
      <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                Company Management
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Staff Fulfillment Network
                </span>
              </h2>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm max-w-2xl">
              Register fulfillment companies (Meesho, Amazon, Flipkart, Myntra, etc.), assign store products and orders,
              and issue individual staff access passwords. Company staff log in via the public footer link without exposing company lists.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Company</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-800/80">
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500">Total Companies</div>
            <div className="text-2xl font-black text-white mt-1">{companies.length}</div>
          </div>
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Active Companies</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {companies.filter((c) => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Assigned Orders</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{assignedOrders.length}</div>
          </div>
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">In Packing / Dispatched</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {assignedOrders.filter((o) => o.fulfillmentStatus !== 'Order received').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, ID, contact..."
            className="w-full bg-[#141414] border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(['All', 'active', 'suspended'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-stone-800 text-[#d7ff3f] border border-stone-700'
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'
              }`}
            >
              {st === 'All' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Directory Table / Cards */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <div className="bg-[#141414] border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-stone-600" />
            <p className="font-bold text-white text-base">No companies found</p>
            <p className="text-xs text-stone-500 mt-1">Try adjusting your search or add a new company.</p>
          </div>
        ) : (
          filteredCompanies.map((comp) => {
            const compOrders = assignedOrders.filter((o) => o.companyId === comp.id);
            const isEditingPwd = editingPasswordCompanyId === comp.id;

            return (
              <div
                key={comp.id}
                className={`bg-[#141414] border rounded-2xl p-5 transition-colors ${
                  comp.status === 'suspended' ? 'border-rose-900/50 bg-[#161214]' : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Company Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-white text-base">{comp.name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 text-stone-300 font-bold border border-stone-700">
                        {comp.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          comp.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-500" />
                        {comp.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-500" />
                        {comp.phone}
                      </span>
                      {comp.contactPerson && (
                        <span className="text-stone-300 font-medium">Contact: {comp.contactPerson}</span>
                      )}
                    </div>

                    {comp.address && (
                      <p className="text-[11px] text-stone-500 flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {comp.address}
                      </p>
                    )}
                  </div>

                  {/* Actions & Credentials */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-800">
                    <button
                      onClick={() => setSelectedCompanyForProducts(comp)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Products ({comp.assignedProducts?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setSelectedCompanyForOrders(comp)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assign Orders</span>
                    </button>

                    <button
                      onClick={() => setSelectedCompanyActivity(comp)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fulfillment ({compOrders.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingPasswordCompanyId(comp.id);
                        setNewPasswordVal(comp.plainPasswordPreview || '');
                      }}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Reset staff password"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      <span>Password</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(comp)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                        comp.status === 'active'
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/50'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
                      }`}
                    >
                      {comp.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Password reset bar */}
                {isEditingPwd && (
                  <div className="mt-4 pt-3 border-t border-stone-800 flex items-center gap-3 bg-stone-900/80 p-3 rounded-xl">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-stone-300 shrink-0">Reset Password:</span>
                    <input
                      type="text"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="Enter new staff access password"
                      className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleSaveResetPassword(comp.id)}
                      className="px-3 py-1 bg-[#d7ff3f] text-black font-black text-xs rounded-lg hover:bg-[#cbf532] cursor-pointer"
                    >
                      Save Password
                    </button>
                    <button
                      onClick={() => setEditingPasswordCompanyId(null)}
                      className="px-2.5 py-1 text-stone-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Assigned products summary tag */}
                {comp.assignedProducts && comp.assignedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center gap-2 flex-wrap text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-500">Assigned SKUs:</span>
                    {comp.assignedProducts.map((sku) => (
                      <span
                        key={sku}
                        className="px-2 py-0.5 rounded bg-stone-900 text-stone-300 font-mono text-[10px] border border-stone-800"
                      >
                        {sku}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD COMPANY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Add New Fulfillment Company
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="e.g. Meesho, Amazon, Flipkart, Myntra"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Company ID <span className="text-stone-500">(Auto-generated if empty)</span>
                  </label>
                  <input
                    type="text"
                    value={newCompany.id}
                    onChange={(e) => setNewCompany({ ...newCompany, id: e.target.value })}
                    placeholder="e.g. COMP-MEESHO-101"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Staff Access Password *</label>
                  <input
                    type="text"
                    required
                    value={newCompany.password}
                    onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                    placeholder="e.g. meesho@2025"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newCompany.contactPerson}
                    onChange={(e) => setNewCompany({ ...newCompany, contactPerson: e.target.value })}
                    placeholder="e.g. Anand Verma"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="e.g. +91 98201 44521"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Official Email</label>
                <input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  placeholder="e.g. fulfillment@meesho-partner.in"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Warehouse / Hub Address</label>
                <textarea
                  rows={2}
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  placeholder="Warehouse address, city, pincode..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={newCompany.notes}
                  onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                  placeholder="Fulfillment priority, logistics agreement details..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs rounded-xl cursor-pointer"
                >
                  Save & Activate Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: ASSIGN PRODUCTS */}
      {selectedCompanyForProducts && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  Assign OBRYNT Products to {selectedCompanyForProducts.name}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Select which catalogue items this company has authorization to pack and dispatch.
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyForProducts(null)}
                className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by SKU, name or category..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {products
                .filter(
                  (p) =>
                    !productSearch ||
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.sku.toLowerCase().includes(productSearch.toLowerCase())
                )
                .map((prod) => {
                  const isAssigned = (selectedCompanyForProducts.assignedProducts || []).includes(prod.sku);

                  return (
                    <div
                      key={prod.sku}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        isAssigned ? 'bg-cyan-950/20 border-cyan-800' : 'bg-stone-900/50 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl || prod.galleryUrls?.[0] || '/images/product_tshirt_minimal_1793012315796.jpg'}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover bg-stone-800 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{prod.name}</div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {prod.sku} • ₹{prod.price} • Stock: {prod.stock}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleProductSku(prod.sku)}
                        className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                          isAssigned
                            ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                            : 'bg-[#d7ff3f] text-black hover:bg-[#cbf532]'
                        }`}
                      >
                        {isAssigned ? 'Remove' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setSelectedCompanyForProducts(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN ORDERS */}
      {selectedCompanyForOrders && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  Assign Customer Orders to {selectedCompanyForOrders.name}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Pick an existing OBRYNT order to route to this company's fulfillment queue.
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyForOrders(null)}
                className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders by ID, customer name or city..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {orders.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-6">No customer orders available to assign.</p>
              ) : (
                orders
                  .filter(
                    (o) =>
                      !orderSearch ||
                      o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customer.city.toLowerCase().includes(orderSearch.toLowerCase())
                  )
                  .map((ord) => {
                    const firstItem = ord.items[0];
                    const alreadyAssigned = assignedOrders.some(
                      (a) => a.orderId === ord.orderId && a.companyId === selectedCompanyForOrders.id
                    );

                    return (
                      <div
                        key={ord.orderId}
                        className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">Order #{ord.orderId}</span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(ord.date).toLocaleDateString()}
                            </span>
                            {alreadyAssigned && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-black border border-emerald-800">
                                Assigned
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-300 font-medium">
                            Customer: {ord.customer.fullName} ({ord.customer.city})
                          </div>
                          {firstItem && (
                            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                              <span>
                                {firstItem.product.name} (Qty: {firstItem.quantity}, Size: {firstItem.size})
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleAssignOrder(ord, 0)}
                          disabled={alreadyAssigned}
                          className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                            alreadyAssigned
                              ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                              : 'bg-[#d7ff3f] text-black hover:bg-[#cbf532]'
                          }`}
                        >
                          {alreadyAssigned ? 'Assigned' : 'Assign to Hub'}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setSelectedCompanyForOrders(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: FULFILLMENT ACTIVITY */}
      {selectedCompanyActivity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  Live Fulfillment Activity — {selectedCompanyActivity.name}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Monitor orders processed, packed, and dispatched by this company's staff team.
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyActivity(null)}
                className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {assignedOrders.filter((o) => o.companyId === selectedCompanyActivity.id).length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-stone-600" />
                  <p className="text-sm font-bold text-white">No orders assigned yet</p>
                  <p className="text-xs text-stone-500 mt-1">Use the "Assign Orders" button to assign orders to this company.</p>
                </div>
              ) : (
                assignedOrders
                  .filter((o) => o.companyId === selectedCompanyActivity.id)
                  .map((ord) => (
                    <div
                      key={ord.assignmentId}
                      className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={ord.productImageUrl}
                          alt={ord.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-stone-800 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white">Order #{ord.orderId}</span>
                            <span className="text-[10px] font-mono text-stone-400">{ord.productSku}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                ord.fulfillmentStatus === 'Dispatched'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : ord.fulfillmentStatus === 'Packed'
                                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                  : ord.fulfillmentStatus === 'Packing'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              {ord.fulfillmentStatus}
                            </span>
                          </div>
                          <div className="text-xs text-stone-200 font-medium">{ord.productName}</div>
                          <div className="text-[11px] text-stone-400">
                            Qty: {ord.quantity} • Size: {ord.size} • Color: {ord.color}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            Customer: {ord.customerName} ({ord.customerPhone}) • {ord.city}, {ord.pincode}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1 text-[11px] text-stone-500">
                        <span>Updated: {new Date(ord.statusUpdatedAt || ord.orderDate).toLocaleTimeString()}</span>
                        {ord.notes && <span className="text-stone-400 italic text-[10px]">Note: {ord.notes}</span>}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setSelectedCompanyActivity(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl cursor-pointer"
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
