import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe,
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  ShoppingBag,
  TrendingUp,
  LogOut,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  VendorAuthSession,
  VendorCommissionRule,
  VendorProduct,
  VendorProfile,
  VendorSettlement,
  VendorSubOrder,
} from '../types';
import {
  clearVendorSession,
  fetchVendorFinancials,
  fetchVendorOrders,
  fetchVendorProducts,
  fetchVendorProfile,
  performVendorOrderAction,
  updateVendorProfile,
  VendorFinancialSummary,
} from '../services/vendorService';
import { VendorCatalogManager } from './vendor/VendorCatalogManager';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface ExistingSupplierDashboardProps {
  session: VendorAuthSession;
  onLogout: () => void;
  onBackToStorefront?: () => void;
  onShowNotice: (msg: string) => void;
}

type SupplierTab = 'overview' | 'products' | 'bulk' | 'orders' | 'profile' | 'settlements';

export const ExistingSupplierDashboard: React.FC<ExistingSupplierDashboardProps> = ({
  session,
  onLogout,
  onBackToStorefront,
  onShowNotice,
}) => {
  const [activeTab, setActiveTab] = useState<SupplierTab>('overview');
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorSubOrder[]>([]);
  const [financialSummary, setFinancialSummary] = useState<VendorFinancialSummary | null>(null);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [commissionRule, setCommissionRule] = useState<VendorCommissionRule | null>(null);

  const [supplierForm, setSupplierForm] = useState({
    fullName: session.fullName,
    businessName: session.businessName,
    phone: '',
    gstNumber: '',
    pickupAddress: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [rejectTarget, setRejectTarget] = useState<VendorSubOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [prof, prods, ords, fin] = await Promise.all([
        fetchVendorProfile(),
        fetchVendorProducts(),
        fetchVendorOrders(),
        fetchVendorFinancials(),
      ]);
      setProfile(prof);
      setProducts(prods);
      setOrders(ords);
      setFinancialSummary(fin.summary);
      setSettlements(fin.settlements);
      setCommissionRule(fin.commissionRule);

      setSupplierForm({
        fullName: prof.fullName || '',
        businessName: prof.businessName || '',
        phone: prof.phone || '',
        gstNumber: prof.gstNumber || '',
        pickupAddress: prof.pickupAddress || '',
        accountHolderName: prof.bankDetails?.accountHolderName || '',
        accountNumber: '',
        ifscCode: prof.bankDetails?.ifscCode || '',
        upiId: prof.bankDetails?.upiId || '',
      });
    } catch (err: any) {
      onShowNotice(`Error loading supplier console: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [session.vendorId]);

  const metrics = useMemo(() => {
    const activeSkus = products.filter((p) => p.approvalStatus === 'approved' && p.totalStock > 0).length;
    const pendingSkus = products.filter((p) => p.approvalStatus === 'pending_approval').length;
    const totalUnits = products.reduce((s, p) => s + (p.totalStock || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending_acceptance').length;
    return {
      activeSkus,
      pendingSkus,
      totalUnits,
      pendingOrders,
      grossSales: financialSummary?.totalSales ?? 0,
      netPayable: financialSummary?.totalPayableEarnings ?? 0,
      settled: financialSummary?.settledAmount ?? 0,
    };
  }, [products, orders, financialSummary]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'ALL') return orders;
    if (orderFilter === 'NEW') return orders.filter((o) => o.status === 'pending_acceptance');
    if (orderFilter === 'ACTIVE')
      return orders.filter((o) =>
        ['accepted', 'processing', 'ready_for_pickup', 'picked_up', 'in_transit'].includes(o.status)
      );
    if (orderFilter === 'DELIVERED') return orders.filter((o) => o.status === 'delivered');
    return orders;
  }, [orders, orderFilter]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateVendorProfile({
        fullName: supplierForm.fullName,
        businessName: supplierForm.businessName,
        phone: supplierForm.phone,
        gstNumber: supplierForm.gstNumber,
        pickupAddress: supplierForm.pickupAddress,
        bankDetails: {
          accountHolderName: supplierForm.accountHolderName,
          accountNumber: supplierForm.accountNumber || undefined,
          ifscCode: supplierForm.ifscCode,
          upiId: supplierForm.upiId,
        },
      });
      setProfile(updated);
      setSupplierForm((prev) => ({ ...prev, accountNumber: '' }));
      onShowNotice('Supplier warehouse & settlement details saved.');
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOrderAction = async (
    orderId: string,
    action: 'accept' | 'confirm_stock' | 'reject' | 'mark_processing' | 'mark_ready_for_pickup',
    reason?: string
  ) => {
    try {
      const res = await performVendorOrderAction(orderId, action, { reason });
      onShowNotice(
        res.deliveryNotice
          ? `Order ${res.order.suborderCode} packed & courier dispatch notified.`
          : `Order ${res.order.suborderCode} updated to ${res.order.status.toUpperCase()}`
      );
      await loadSupplierData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const sourceUrl = profile?.existingWebsiteUrl || session.existingWebsiteUrl;

  return (
    <div className="min-h-screen bg-[#0c0d0f] text-stone-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#131519] border-b border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-[0.14em] text-white uppercase">
                OBRYNT Supplier Console
              </span>
              <span className="px-2 py-0.5 rounded bg-[#d7ff3f] text-black font-mono text-[10px] font-black">
                {session.vendorCode}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Existing Supplier · {profile?.businessName || session.businessName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSupplierData}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onBackToStorefront && (
            <button
              type="button"
              onClick={onBackToStorefront}
              className="min-h-[40px] px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              clearVendorSession();
              onLogout();
            }}
            className="min-h-[40px] px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-black rounded-lg border border-rose-800 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1500px] w-full mx-auto">
        <aside className="w-full lg:w-64 bg-[#131519] border-b lg:border-b-0 lg:border-r border-stone-800 p-4 shrink-0">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Supplier Overview', icon: LayoutDashboard },
              { id: 'products', label: `Catalogue (${products.length})`, icon: Package },
              { id: 'bulk', label: 'Bulk CSV Upload', icon: FileSpreadsheet },
              { id: 'orders', label: `Supplier Orders (${orders.length})`, icon: ShoppingBag },
              { id: 'profile', label: 'Warehouse & URL', icon: UserCheck },
              { id: 'settlements', label: 'Settlements', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as SupplierTab)}
                  className={`min-h-[42px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#d7ff3f] text-black font-black'
                      : 'text-stone-300 hover:bg-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {sourceUrl && (
            <div className="p-4 rounded-xl bg-[#16191f] border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#d7ff3f]" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                    Connected Source Website / Feed URL
                  </span>
                  <strong className="text-white font-mono">{sourceUrl}</strong>
                </div>
              </div>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[#d7ff3f] font-bold flex items-center gap-1"
              >
                <span>Open Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Existing Supplier Dashboard</h1>
                <p className="text-xs text-stone-400 mt-1">
                  Manage synced SKUs, wholesale pricing, courier handoffs, and supplier settlements.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#16191f] border border-stone-800">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Live SKUs</span>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">{metrics.activeSkus}</div>
                  <span className="text-[11px] text-amber-300">{metrics.pendingSkus} awaiting approval</span>
                </div>
                <div className="p-4 rounded-xl bg-[#16191f] border border-stone-800">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Warehouse Stock</span>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">{metrics.totalUnits}</div>
                  <span className="text-[11px] text-stone-500">Available units</span>
                </div>
                <div className="p-4 rounded-xl bg-[#16191f] border border-stone-800">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Pending Orders</span>
                  <div className="text-2xl font-black text-amber-300 mt-1 tabular-nums">{metrics.pendingOrders}</div>
                  <span className="text-[11px] text-stone-500">{orders.length} total suborders</span>
                </div>
                <div className="p-4 rounded-xl bg-[#16191f] border border-stone-800">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Net Payable</span>
                  <div className="text-2xl font-black text-[#d7ff3f] mt-1 tabular-nums">
                    ₹{metrics.netPayable.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Settled: ₹{metrics.settled.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#16191f] border border-stone-800 flex items-center justify-between flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#d7ff3f]" />
                  <div>
                    <strong className="text-white block">Supplier Permissions Active</strong>
                    <span className="text-stone-400">
                      Only OBRYNT-approved products appear live on the storefront. Strictly isolated to {session.vendorCode}.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#d7ff3f] text-black font-black cursor-pointer"
                >
                  Manage Catalogue
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'products' || activeTab === 'bulk') && (
            <VendorCatalogManager
              products={products}
              vendorType="SELLER"
              onRefresh={loadSupplierData}
              onShowNotice={onShowNotice}
              defaultOpenBulk={activeTab === 'bulk'}
            />
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-white">Supplier Fulfilment Orders</h2>
                <div className="flex gap-1.5">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'NEW', label: 'New' },
                    { id: 'ACTIVE', label: 'In Progress' },
                    { id: 'DELIVERED', label: 'Delivered' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        orderFilter === f.id
                          ? 'bg-[#d7ff3f] text-black font-black'
                          : 'bg-[#16191f] text-stone-300 border border-stone-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-10 rounded-xl bg-[#16191f] border border-stone-800 text-center text-xs text-stone-400">
                  No supplier orders in this queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-4 sm:p-5 rounded-xl bg-[#16191f] border border-stone-800 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#d7ff3f] bg-black px-2 py-0.5 rounded">
                            {o.suborderCode}
                          </span>
                          <span className="text-stone-400">Order: {o.parentOrderCode}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-stone-900 border border-stone-700 font-black uppercase text-[10px]">
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {o.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-stone-800/70"
                          >
                            <div>
                              <strong className="text-white">{item.productName}</strong>
                              <span className="text-stone-400 ml-2">
                                {item.size} / {item.color} × {item.quantity}
                              </span>
                            </div>
                            <strong className="text-[#d7ff3f]">₹{item.vendorPayable}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                        <span className="text-stone-400">
                          Ship to: {o.customerName} · {o.deliveryAddress.city}, {o.deliveryAddress.pincode}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {o.status === 'pending_acceptance' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOrderAction(o.id, 'confirm_stock')}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#d7ff3f] text-black font-black flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept & Confirm Stock</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectTarget(o);
                                  setRejectReason('');
                                }}
                                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-950 text-rose-200 border border-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {o.status === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => handleOrderAction(o.id, 'mark_processing')}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white text-black font-black cursor-pointer"
                            >
                              Pack Parcel
                            </button>
                          )}
                          {(o.status === 'accepted' || o.status === 'processing') && (
                            <button
                              type="button"
                              onClick={() => handleOrderAction(o.id, 'mark_ready_for_pickup')}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-400 text-black font-black flex items-center gap-1 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Ready for Pickup</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="p-5 sm:p-6 rounded-2xl bg-[#16191f] border border-stone-800 space-y-4 text-xs max-w-2xl"
            >
              <h2 className="text-lg font-black text-white">Supplier Warehouse & Bank Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.businessName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, businessName: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Owner / Contact Name</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.fullName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, fullName: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={supplierForm.gstNumber}
                    onChange={(e) => setSupplierForm({ ...supplierForm, gstNumber: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-stone-400 font-bold mb-1">Warehouse / Dispatch Address</label>
                <input
                  type="text"
                  value={supplierForm.pickupAddress}
                  onChange={(e) => setSupplierForm({ ...supplierForm, pickupAddress: e.target.value })}
                  className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Bank Account Holder</label>
                  <input
                    type="text"
                    value={supplierForm.accountHolderName}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, accountHolderName: e.target.value })
                    }
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={supplierForm.ifscCode}
                    onChange={(e) => setSupplierForm({ ...supplierForm, ifscCode: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={supplierForm.upiId}
                    onChange={(e) => setSupplierForm({ ...supplierForm, upiId: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Supplier Profile'}
              </button>
            </form>
          )}

          {activeTab === 'settlements' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#16191f] border border-stone-800 flex flex-wrap gap-6">
                <div>
                  <span className="text-stone-400 block">Agreed Commission Plan</span>
                  <strong className="text-white text-sm">
                    {commissionRule
                      ? `${commissionRule.percentageRate}% + ₹${commissionRule.fixedAmount}`
                      : '10%'}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Pending Manual Payout</span>
                  <strong className="text-[#d7ff3f] text-sm">
                    ₹{(financialSummary?.pendingPayableAmount ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {settlements.length === 0 ? (
                <div className="p-10 rounded-xl bg-[#16191f] border border-stone-800 text-center text-stone-400">
                  No supplier settlements recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {settlements.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-[#16191f] border border-stone-800 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="font-mono text-white">{s.settlementCode}</strong>
                        <span className="text-stone-400 ml-2">{s.suborderCode}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="uppercase font-bold text-stone-300">{s.settlementStatus}</span>
                        <strong className="text-[#d7ff3f] font-mono">
                          ₹{s.netVendorPayable.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#16191f] border border-stone-800 rounded-2xl p-5 space-y-3 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-rose-300">
              Reject Order {rejectTarget.suborderCode}
            </h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejecting order (e.g. out of stock in warehouse)"
              className="w-full bg-black border border-stone-700 rounded-xl p-3 text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = rejectTarget;
                  setRejectTarget(null);
                  await handleOrderAction(target.id, 'reject', rejectReason || 'Out of stock');
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-black cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
