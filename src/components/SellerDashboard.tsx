import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  LayoutDashboard,
  UserCheck,
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
  Clock,
  ShieldCheck,
  RotateCcw,
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

interface SellerDashboardProps {
  session: VendorAuthSession;
  onLogout: () => void;
  onBackToStorefront?: () => void;
  onShowNotice: (msg: string) => void;
}

type SellerTab = 'overview' | 'profile' | 'products' | 'bulk' | 'orders' | 'reports';

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  session,
  onLogout,
  onBackToStorefront,
  onShowNotice,
}) => {
  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorSubOrder[]>([]);
  const [financialSummary, setFinancialSummary] = useState<VendorFinancialSummary | null>(null);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [commissionRule, setCommissionRule] = useState<VendorCommissionRule | null>(null);

  const [sellerForm, setSellerForm] = useState({
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

  const loadSellerData = async () => {
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

      setSellerForm({
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
      onShowNotice(`Error loading seller panel: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [session.vendorId]);

  const metrics = useMemo(() => {
    const activeSkus = products.filter((p) => p.approvalStatus === 'approved' && p.totalStock > 0).length;
    const pendingSkus = products.filter((p) => p.approvalStatus === 'pending_approval').length;
    const totalUnits = products.reduce((s, p) => s + (p.totalStock || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending_acceptance').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const returnsCancelled = orders.filter((o) =>
      ['rejected', 'cancelled', 'returned'].includes(o.status)
    ).length;

    return {
      activeSkus,
      pendingSkus,
      totalUnits,
      pendingOrders,
      deliveredOrders,
      returnsCancelled,
      grossSales: financialSummary?.totalSales ?? 0,
      netEarnings: financialSummary?.totalPayableEarnings ?? 0,
      settled: financialSummary?.settledAmount ?? 0,
    };
  }, [products, orders, financialSummary]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'ALL') return orders;
    if (orderFilter === 'NEW') return orders.filter((o) => o.status === 'pending_acceptance');
    if (orderFilter === 'DISPATCH')
      return orders.filter((o) =>
        ['accepted', 'processing', 'ready_for_pickup', 'picked_up', 'in_transit'].includes(o.status)
      );
    if (orderFilter === 'DELIVERED') return orders.filter((o) => o.status === 'delivered');
    if (orderFilter === 'RETURNS')
      return orders.filter((o) => ['rejected', 'cancelled', 'returned'].includes(o.status));
    return orders;
  }, [orders, orderFilter]);

  const handleSaveSellerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateVendorProfile({
        fullName: sellerForm.fullName,
        businessName: sellerForm.businessName,
        phone: sellerForm.phone,
        gstNumber: sellerForm.gstNumber,
        pickupAddress: sellerForm.pickupAddress,
        bankDetails: {
          accountHolderName: sellerForm.accountHolderName,
          accountNumber: sellerForm.accountNumber || undefined,
          ifscCode: sellerForm.ifscCode,
          upiId: sellerForm.upiId,
        },
      });
      setProfile(updated);
      setSellerForm((prev) => ({ ...prev, accountNumber: '' }));
      onShowNotice('Seller profile & settlement account saved.');
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
          ? `Order ${res.order.suborderCode} packed & Delivery notified for warehouse pickup!`
          : `Order ${res.order.suborderCode} updated to ${res.order.status.toUpperCase()}`
      );
      await loadSellerData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d0f] text-stone-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#131519] border-b border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-serif tracking-[0.14em] text-white">
                OBRYNT SELLER HUB
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-400 text-black font-mono text-[10px] font-black">
                {session.vendorCode}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Verified Seller Panel · {profile?.businessName || session.businessName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSellerData}
            className="p-2 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onBackToStorefront && (
            <button
              onClick={onBackToStorefront}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-full border border-stone-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          )}

          <button
            onClick={() => {
              clearVendorSession();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-200 text-xs font-black rounded-full border border-rose-800 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1550px] w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-[#131519] border-b lg:border-b-0 lg:border-r border-stone-800 p-4 shrink-0">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Seller Dashboard', icon: LayoutDashboard },
              { id: 'profile', label: 'Seller Profile & Payouts', icon: UserCheck },
              { id: 'products', label: `Catalog (${products.length})`, icon: Package },
              { id: 'bulk', label: 'Bulk CSV / Excel Upload', icon: FileSpreadsheet },
              { id: 'orders', label: `Orders & Returns (${orders.length})`, icon: ShoppingBag },
              { id: 'reports', label: 'Sales & Settlements', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as SellerTab)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#d7ff3f] text-[#111111]'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:block mt-6 p-3.5 rounded-2xl bg-black/60 border border-stone-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Seller Data Isolation</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Scoped strictly to Seller ID <span className="font-mono text-white">{session.vendorCode}</span>.
            </p>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {/* TAB 1: SELLER OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">
                  {profile?.businessName || session.businessName} · Seller Performance
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  Separate Seller workspace for catalog velocity, order fulfillment & settlement accounting.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Live Approved SKUs', val: metrics.activeSkus, tone: 'text-emerald-400' },
                  { label: 'Pending Approval', val: metrics.pendingSkus, tone: 'text-amber-300' },
                  { label: 'Stock Units', val: metrics.totalUnits, tone: 'text-white' },
                  { label: 'New Orders', val: metrics.pendingOrders, tone: 'text-[#d7ff3f]' },
                  { label: 'Returns / Cancelled', val: metrics.returnsCancelled, tone: 'text-rose-300' },
                  { label: 'Net Earnings', val: `₹${metrics.netEarnings.toLocaleString('en-IN')}`, tone: 'text-[#d7ff3f]' },
                ].map((c) => (
                  <div key={c.label} className="p-4 rounded-2xl bg-[#131519] border border-stone-800">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">{c.label}</span>
                    <div className={`text-xl font-black mt-1 tabular-nums ${c.tone}`}>{c.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SELLER PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveSellerProfile} className="space-y-5 max-w-3xl text-xs">
              <h2 className="text-xl font-black text-white">Seller Account & Bank Settlement Profile</h2>
              <div className="p-5 rounded-2xl bg-[#131519] border border-stone-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Authorized Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={sellerForm.fullName}
                      onChange={(e) => setSellerForm({ ...sellerForm, fullName: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Seller / Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={sellerForm.businessName}
                      onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={sellerForm.phone}
                      onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={sellerForm.gstNumber}
                      onChange={(e) => setSellerForm({ ...sellerForm, gstNumber: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Warehouse / Dispatch Pickup Address *</label>
                  <input
                    type="text"
                    required
                    value={sellerForm.pickupAddress}
                    onChange={(e) => setSellerForm({ ...sellerForm, pickupAddress: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="pt-3 border-t border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase text-stone-300">Bank & UPI Payout Details</span>
                    {profile?.bankDetails?.accountNumberMasked && (
                      <span className="font-mono text-emerald-400">
                        Masked Acct: {profile.bankDetails.accountNumberMasked}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={sellerForm.accountHolderName}
                      onChange={(e) =>
                        setSellerForm({ ...sellerForm, accountHolderName: e.target.value })
                      }
                      placeholder="Account Holder Name"
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="password"
                      value={sellerForm.accountNumber}
                      onChange={(e) => setSellerForm({ ...sellerForm, accountNumber: e.target.value })}
                      placeholder={
                        profile?.bankDetails?.accountNumberMasked
                          ? `Saved (${profile.bankDetails.accountNumberMasked})`
                          : 'Bank Account Number'
                      }
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={sellerForm.ifscCode}
                      onChange={(e) =>
                        setSellerForm({ ...sellerForm, ifscCode: e.target.value.toUpperCase() })
                      }
                      placeholder="IFSC Code"
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={sellerForm.upiId}
                      onChange={(e) => setSellerForm({ ...sellerForm, upiId: e.target.value })}
                      placeholder="UPI ID"
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-full bg-[#d7ff3f] text-[#111111] font-black cursor-pointer"
                >
                  {savingProfile ? 'SAVING...' : 'SAVE SELLER PROFILE'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3 & 4: CATALOG & BULK UPLOAD */}
          {(activeTab === 'products' || activeTab === 'bulk') && (
            <VendorCatalogManager
              key={activeTab}
              products={products}
              vendorType="SELLER"
              onRefresh={loadSellerData}
              onShowNotice={onShowNotice}
              defaultOpenBulk={activeTab === 'bulk'}
            />
          )}

          {/* TAB 5: ORDERS, RETURNS & CANCELLATIONS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: `All (${orders.length})` },
                  { id: 'NEW', label: 'New Orders' },
                  { id: 'DISPATCH', label: 'Processing & Dispatch' },
                  { id: 'DELIVERED', label: 'Delivered' },
                  { id: 'RETURNS', label: 'Returns & Cancellations' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                      orderFilter === f.id
                        ? 'bg-[#d7ff3f] text-[#111111] font-black'
                        : 'bg-[#131519] text-stone-400 border border-stone-800 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#131519] border border-stone-800 text-center text-xs text-stone-400">
                  No seller suborders matching this filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-5 rounded-2xl bg-[#131519] border border-stone-800 space-y-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#d7ff3f] bg-black px-2.5 py-1 rounded">
                            {o.suborderCode}
                          </span>
                          <span className="text-stone-400">Parent Order {o.parentOrderCode}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700 font-black uppercase text-[10px]">
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[10px] uppercase text-stone-500 block">Line Items</span>
                          {o.items.map((it) => (
                            <div key={it.id} className="text-white font-semibold mt-1">
                              {it.productName} ({it.size}/{it.color}) × {it.quantity}
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-stone-500 block">Destination</span>
                          <strong className="text-white block">{o.customerName}</strong>
                          <span className="text-stone-400">
                            {o.deliveryAddress.city}, {o.deliveryAddress.state} - {o.deliveryAddress.pincode}
                          </span>
                        </div>
                        <div className="bg-black/50 p-3 rounded-xl border border-stone-800">
                          <span className="text-[10px] text-stone-500 block">Seller Payable</span>
                          <strong className="text-base text-[#d7ff3f]">
                            ₹{o.vendorPayableAmount.toLocaleString('en-IN')}
                          </strong>
                          <div className="text-[10px] text-stone-400">
                            Selling ₹{o.subtotalSellingPrice} · Comm ₹{o.obryntCommission}
                          </div>
                        </div>
                      </div>

                      {o.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200">
                          Cancellation / Rejection Note: {o.rejectionReason}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800">
                        {o.status === 'pending_acceptance' && (
                          <>
                            <button
                              onClick={() => handleOrderAction(o.id, 'confirm_stock')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d7ff3f] text-[#111111] font-black cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Stock & Accept</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectTarget(o);
                                setRejectReason('');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950 text-rose-200 border border-rose-800 font-bold cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject Order</span>
                            </button>
                          </>
                        )}
                        {o.status === 'accepted' && (
                          <button
                            onClick={() => handleOrderAction(o.id, 'mark_processing')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-950 text-blue-200 border border-blue-800 font-bold cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark Processing</span>
                          </button>
                        )}
                        {(o.status === 'accepted' || o.status === 'processing') && (
                          <button
                            onClick={() => handleOrderAction(o.id, 'mark_ready_for_pickup')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-800 font-black cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Packed & Ready for Pickup</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SALES REPORTS, EARNINGS & SETTLEMENTS */}
          {activeTab === 'reports' && (
            <div className="space-y-5 text-xs">
              <h2 className="text-xl font-black text-white">Sales, Commission & Settlement Reports</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#131519] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Total Sales</span>
                  <strong className="text-lg text-white">
                    ₹{(financialSummary?.totalSales ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#131519] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Total Commission + Fees</span>
                  <strong className="text-lg text-stone-300">
                    ₹{((financialSummary?.totalCommission ?? 0) + (financialSummary?.totalFees ?? 0)).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#131519] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Settled Paid</span>
                  <strong className="text-lg text-emerald-400">
                    ₹{(financialSummary?.settledAmount ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#131519] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Pending Balance</span>
                  <strong className="text-lg text-[#d7ff3f]">
                    ₹{(financialSummary?.pendingPayableAmount ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {commissionRule && (
                <div className="p-4 rounded-2xl bg-[#131519] border border-stone-800">
                  Current Commission Agreement: <strong>{commissionRule.commissionMode}</strong> ·{' '}
                  {commissionRule.percentageRate}% + ₹{commissionRule.fixedAmount} · Platform Fee{' '}
                  {commissionRule.platformFeePct}%
                </div>
              )}

              <div className="p-5 rounded-2xl bg-[#131519] border border-stone-800 space-y-3">
                <h3 className="text-sm font-black uppercase text-white">Payment & Settlement Ledger</h3>
                {settlements.length === 0 ? (
                  <p className="text-stone-500">No settlements generated yet.</p>
                ) : (
                  <div className="space-y-2">
                    {settlements.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <strong className="text-white font-mono">{s.settlementCode}</strong> · {s.suborderCode}
                          <div className="text-[11px] text-stone-400">
                            Selling: ₹{s.grossSellingAmount} · Commission: ₹{s.obryntCommission} · Fees: ₹{s.applicableFees}
                          </div>
                        </div>
                        <div className="text-right">
                          <strong className="text-[#d7ff3f] block">₹{s.netVendorPayable}</strong>
                          <span className="uppercase text-[10px] font-bold text-stone-300">
                            {s.settlementStatus} {s.paymentReference ? `(${s.paymentReference})` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            className="w-full max-w-md bg-[#131519] border border-stone-800 rounded-3xl p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-rose-300">
              Reject Order {rejectTarget.suborderCode}
            </h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) return;
                  await handleOrderAction(rejectTarget.id, 'reject', rejectReason.trim());
                  setRejectTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black cursor-pointer"
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
