import React, { useEffect, useMemo, useState } from 'react';
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  LogOut,
  ArrowLeft,
  Bell,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  MapPin,
  Upload,
  RefreshCw,
  ShieldCheck,
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
import { uploadProductImage } from '../services/productService';
import { VendorCatalogManager } from './vendor/VendorCatalogManager';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface DukaniDashboardProps {
  session: VendorAuthSession;
  onLogout: () => void;
  onBackToStorefront?: () => void;
  onShowNotice: (msg: string) => void;
}

type DukaniTab = 'overview' | 'profile' | 'products' | 'orders' | 'earnings';

export const DukaniDashboard: React.FC<DukaniDashboardProps> = ({
  session,
  onLogout,
  onBackToStorefront,
  onShowNotice,
}) => {
  const [activeTab, setActiveTab] = useState<DukaniTab>('overview');
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorSubOrder[]>([]);
  const [financialSummary, setFinancialSummary] = useState<VendorFinancialSummary | null>(null);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [commissionRule, setCommissionRule] = useState<VendorCommissionRule | null>(null);

  // Shop profile form
  const [shopForm, setShopForm] = useState({
    shopName: '',
    ownerName: session.fullName,
    shopAddress: '',
    city: '',
    state: '',
    pincode: '',
    contactNumber: '',
    shopPhotos: [] as string[],
    gstNumber: '',
    openingHours: '10:00 AM - 9:00 PM',
    pickupAddress: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Order filter & reject modal
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [rejectTarget, setRejectTarget] = useState<VendorSubOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadDukaniData = async () => {
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

      setShopForm({
        shopName: prof.shopProfile?.shopName || prof.businessName || '',
        ownerName: prof.shopProfile?.ownerName || prof.fullName || '',
        shopAddress: prof.shopProfile?.shopAddress || '',
        city: prof.shopProfile?.city || '',
        state: prof.shopProfile?.state || '',
        pincode: prof.shopProfile?.pincode || '',
        contactNumber: prof.shopProfile?.contactNumber || prof.phone || '',
        shopPhotos: prof.shopProfile?.shopPhotos || [],
        gstNumber: prof.gstNumber || prof.shopProfile?.gstNumber || '',
        openingHours: prof.shopProfile?.openingHours || '10:00 AM - 9:00 PM',
        pickupAddress: prof.shopProfile?.pickupAddress || prof.pickupAddress || '',
        accountHolderName: prof.bankDetails?.accountHolderName || '',
        accountNumber: '',
        ifscCode: prof.bankDetails?.ifscCode || '',
        upiId: prof.bankDetails?.upiId || '',
      });
    } catch (err: any) {
      onShowNotice(`Error loading shop console: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDukaniData();
  }, [session.vendorId]);

  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.approvalStatus === 'approved' && p.totalStock > 0).length;
    const outOfStockProducts = products.filter(
      (p) => p.approvalStatus === 'out_of_stock' || p.totalStock === 0
    ).length;
    const newOrders = orders.filter((o) => o.status === 'pending_acceptance').length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;
    const totalSales = financialSummary?.totalSales ?? 0;
    const netEarnings = financialSummary?.totalPayableEarnings ?? 0;
    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      newOrders,
      completedOrders,
      totalSales,
      netEarnings,
    };
  }, [products, orders, financialSummary]);

  const notifications = useMemo(() => {
    const list: string[] = [];
    if (kpis.newOrders > 0) {
      list.push(`${kpis.newOrders} new order(s) awaiting stock confirmation & acceptance.`);
    }
    const pendingApproval = products.filter((p) => p.approvalStatus === 'pending_approval').length;
    if (pendingApproval > 0) {
      list.push(`${pendingApproval} product(s) pending OBRYNT Admin approval.`);
    }
    if (kpis.outOfStockProducts > 0) {
      list.push(`${kpis.outOfStockProducts} item(s) are currently out of stock.`);
    }
    return list;
  }, [kpis, products]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'ALL') return orders;
    if (orderFilter === 'NEW') return orders.filter((o) => o.status === 'pending_acceptance');
    if (orderFilter === 'ACTIVE')
      return orders.filter((o) => ['accepted', 'processing', 'ready_for_pickup', 'picked_up', 'in_transit'].includes(o.status));
    if (orderFilter === 'COMPLETED') return orders.filter((o) => o.status === 'delivered');
    if (orderFilter === 'CANCELLED')
      return orders.filter((o) => ['rejected', 'cancelled', 'returned'].includes(o.status));
    return orders;
  }, [orders, orderFilter]);

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateVendorProfile({
        fullName: shopForm.ownerName,
        businessName: shopForm.shopName,
        phone: shopForm.contactNumber,
        gstNumber: shopForm.gstNumber,
        pickupAddress: shopForm.pickupAddress,
        bankDetails: {
          accountHolderName: shopForm.accountHolderName,
          accountNumber: shopForm.accountNumber || undefined,
          ifscCode: shopForm.ifscCode,
          upiId: shopForm.upiId,
        },
        shopProfile: {
          shopName: shopForm.shopName,
          ownerName: shopForm.ownerName,
          shopAddress: shopForm.shopAddress,
          city: shopForm.city,
          state: shopForm.state,
          pincode: shopForm.pincode,
          contactNumber: shopForm.contactNumber,
          shopPhotos: shopForm.shopPhotos,
          gstNumber: shopForm.gstNumber,
          openingHours: shopForm.openingHours,
          pickupAddress: shopForm.pickupAddress,
        },
      });
      setProfile(updated);
      setShopForm((prev) => ({ ...prev, accountNumber: '' }));
      onShowNotice('Shop profile & bank settlement settings saved.');
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleShopPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls: string[] = [];
    for (const f of files) {
      const res = await uploadProductImage(f);
      if (res.url) urls.push(res.url);
    }
    setShopForm((prev) => ({ ...prev, shopPhotos: [...prev.shopPhotos, ...urls] }));
    onShowNotice(`Uploaded ${urls.length} shop photo(s). Click Save Profile to publish.`);
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
          ? `Order ${res.order.suborderCode} packed & Delivery System notified for pickup!`
          : `Order ${res.order.suborderCode} updated to ${res.order.status.toUpperCase()}`
      );
      await loadDukaniData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#141414] border-b border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-serif tracking-[0.14em] text-white">
                {session.partnerCategory === 'GARMENT_SHOP' ? 'OBRYNT GARMENT SHOP' : 'OBRYNT DUKANI'}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#d7ff3f] text-[#111111] font-mono text-[10px] font-black">
                {session.vendorCode}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {session.partnerCategory === 'GARMENT_SHOP' ? 'Garment Shop Panel' : 'Shop Owner Panel'} ·{' '}
              {profile?.shopProfile?.shopName || session.businessName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDukaniData}
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
        <aside className="w-full lg:w-64 bg-[#141414] border-b lg:border-b-0 lg:border-r border-stone-800 p-4 shrink-0">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Shop Dashboard', icon: LayoutDashboard },
              { id: 'profile', label: 'Shop Profile & Bank', icon: Store },
              { id: 'products', label: `Products (${products.length})`, icon: Package },
              { id: 'orders', label: `Shop Orders (${orders.length})`, icon: ShoppingBag },
              { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as DukaniTab)}
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
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Strictly Isolated Shop</span>
            </div>
            <p className="text-[11px] text-stone-400">
              You see only your own shop inventory, customer suborders & settlements.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {/* TAB 1: DUKANI OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">
                  {profile?.shopProfile?.shopName || session.businessName} Overview
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  Real-time Dukani shop metrics, inventory approvals & fulfillment status.
                </p>
              </div>

              {/* 7 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Total Products', val: kpis.totalProducts, tone: 'text-white' },
                  { label: 'Active Products', val: kpis.activeProducts, tone: 'text-emerald-400' },
                  { label: 'Out of Stock', val: kpis.outOfStockProducts, tone: 'text-amber-300' },
                  { label: 'New Orders', val: kpis.newOrders, tone: 'text-[#d7ff3f]' },
                  { label: 'Completed Orders', val: kpis.completedOrders, tone: 'text-white' },
                  { label: 'Total Sales', val: `₹${kpis.totalSales.toLocaleString('en-IN')}`, tone: 'text-white' },
                  { label: 'Net Earnings', val: `₹${kpis.netEarnings.toLocaleString('en-IN')}`, tone: 'text-[#d7ff3f]' },
                ].map((card) => (
                  <div key={card.label} className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">
                      {card.label}
                    </span>
                    <div className={`text-xl font-black mt-1 tabular-nums ${card.tone}`}>{card.val}</div>
                  </div>
                ))}
              </div>

              {/* Notifications */}
              <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#d7ff3f]" />
                  <span>Shop Notifications & Action Alerts</span>
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-xs text-stone-400">All shop operations are up to date.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((msg, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200"
                      >
                        {msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SHOP PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveShopProfile} className="space-y-6 max-w-4xl text-xs">
              <div>
                <h2 className="text-xl font-black text-white">Dukani Shop Profile & Pickup Settings</h2>
                <p className="text-stone-400 mt-1">
                  Your pickup address is shared with courier riders when orders are marked Ready for Pickup.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={shopForm.shopName}
                      onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={shopForm.ownerName}
                      onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Full Shop Address *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.shopAddress}
                    onChange={(e) => setShopForm({ ...shopForm, shopAddress: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">City</label>
                    <input
                      type="text"
                      value={shopForm.city}
                      onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">State</label>
                    <input
                      type="text"
                      value={shopForm.state}
                      onChange={(e) => setShopForm({ ...shopForm, state: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Pincode</label>
                    <input
                      type="text"
                      value={shopForm.pincode}
                      onChange={(e) => setShopForm({ ...shopForm, pincode: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={shopForm.contactNumber}
                      onChange={(e) => setShopForm({ ...shopForm, contactNumber: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Opening Hours</label>
                    <input
                      type="text"
                      value={shopForm.openingHours}
                      onChange={(e) => setShopForm({ ...shopForm, openingHours: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={shopForm.gstNumber}
                      onChange={(e) => setShopForm({ ...shopForm, gstNumber: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Courier Pickup Address *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.pickupAddress}
                    onChange={(e) => setShopForm({ ...shopForm, pickupAddress: e.target.value })}
                    placeholder="Exact dispatch counter / shop address for rider collection"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                {/* Shop Photos */}
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-300">Shop Photos ({shopForm.shopPhotos.length})</span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#d7ff3f]" />
                      <span>Upload Shop Photo</span>
                      <input type="file" accept="image/*" multiple onChange={handleShopPhotoUpload} className="hidden" />
                    </label>
                  </div>
                  {shopForm.shopPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {shopForm.shopPhotos.map((u, idx) => (
                        <div key={idx} className="relative">
                          <img src={u} alt="" className="w-20 h-16 object-cover rounded-lg border border-stone-700" />
                          <button
                            type="button"
                            onClick={() =>
                              setShopForm((prev) => ({
                                ...prev,
                                shopPhotos: prev.shopPhotos.filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-black cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Masked Bank Details */}
                <div className="pt-3 border-t border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase text-stone-300">
                      Bank / UPI Settlement Details
                    </span>
                    {profile?.bankDetails?.accountNumberMasked && (
                      <span className="font-mono text-emerald-400">
                        Saved Acct: {profile.bankDetails.accountNumberMasked}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={shopForm.accountHolderName}
                      onChange={(e) => setShopForm({ ...shopForm, accountHolderName: e.target.value })}
                      placeholder="Account Holder Name"
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="password"
                      value={shopForm.accountNumber}
                      onChange={(e) => setShopForm({ ...shopForm, accountNumber: e.target.value })}
                      placeholder={
                        profile?.bankDetails?.accountNumberMasked
                          ? `Current: ${profile.bankDetails.accountNumberMasked} (enter new to replace)`
                          : 'Bank Account Number'
                      }
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={shopForm.ifscCode}
                      onChange={(e) => setShopForm({ ...shopForm, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="IFSC Code"
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={shopForm.upiId}
                      onChange={(e) => setShopForm({ ...shopForm, upiId: e.target.value })}
                      placeholder="UPI ID (e.g. shop@okaxis)"
                      className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-full bg-[#d7ff3f] text-[#111111] font-black cursor-pointer"
                >
                  {savingProfile ? 'SAVING...' : 'SAVE SHOP PROFILE'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <VendorCatalogManager
              products={products}
              vendorType="SHOP_OWNER"
              onRefresh={loadDukaniData}
              onShowNotice={onShowNotice}
            />
          )}

          {/* TAB 4: SHOP ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {['ALL', 'NEW', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                      orderFilter === f
                        ? 'bg-[#d7ff3f] text-[#111111] font-black'
                        : 'bg-[#141414] text-stone-400 border border-stone-800 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#141414] border border-stone-800 text-center text-xs text-stone-400">
                  No orders in "{orderFilter}" for your shop.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#d7ff3f] bg-black px-2.5 py-1 rounded">
                            {o.suborderCode}
                          </span>
                          <span className="text-stone-400">Order {o.parentOrderCode}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700 font-black uppercase text-[10px]">
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[10px] uppercase text-stone-500 block">Items</span>
                          {o.items.map((it) => (
                            <div key={it.id} className="text-white font-semibold mt-1">
                              {it.productName} ({it.size}/{it.color}) × {it.quantity}
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-stone-500 block">Delivery Destination</span>
                          <strong className="text-white block">{o.customerName}</strong>
                          <span className="text-stone-400 block">
                            {o.deliveryAddress.city}, {o.deliveryAddress.state} - {o.deliveryAddress.pincode}
                          </span>
                        </div>
                        <div className="bg-black/50 p-3 rounded-xl border border-stone-800">
                          <span className="text-[10px] text-stone-500 block">Your Payable Earnings</span>
                          <strong className="text-base text-[#d7ff3f]">
                            ₹{o.vendorPayableAmount.toLocaleString('en-IN')}
                          </strong>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Gross: ₹{o.subtotalSellingPrice} · Comm: ₹{o.obryntCommission} · Fee: ₹{o.applicableFees}
                          </div>
                        </div>
                      </div>

                      {o.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200">
                          Rejection Reason: {o.rejectionReason}
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
                              <span>Confirm Stock & Accept Order</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectTarget(o);
                                setRejectReason('');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950 text-rose-200 border border-rose-800 font-bold cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject with Reason</span>
                            </button>
                          </>
                        )}

                        {o.status === 'accepted' && (
                          <button
                            onClick={() => handleOrderAction(o.id, 'mark_processing')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-950 text-blue-200 border border-blue-800 font-bold cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark Order Processing</span>
                          </button>
                        )}

                        {(o.status === 'accepted' || o.status === 'processing') && (
                          <button
                            onClick={() => handleOrderAction(o.id, 'mark_ready_for_pickup')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-800 font-black cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark Packed & Ready for Pickup</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EARNINGS & SETTLEMENTS */}
          {activeTab === 'earnings' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Gross Sales</span>
                  <strong className="text-lg text-white">
                    ₹{(financialSummary?.totalSales ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">OBRYNT Commission + Fees</span>
                  <strong className="text-lg text-stone-300">
                    ₹{((financialSummary?.totalCommission ?? 0) + (financialSummary?.totalFees ?? 0)).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Settled Paid Out</span>
                  <strong className="text-lg text-emerald-400">
                    ₹{(financialSummary?.settledAmount ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  <span className="text-[10px] uppercase text-stone-400 block">Pending Payout</span>
                  <strong className="text-lg text-[#d7ff3f]">
                    ₹{(financialSummary?.pendingPayableAmount ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {commissionRule && (
                <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800">
                  Active Commission Terms: <strong>{commissionRule.commissionMode}</strong> ·{' '}
                  {commissionRule.percentageRate}% + ₹{commissionRule.fixedAmount} · Platform Fee{' '}
                  {commissionRule.platformFeePct}%
                </div>
              )}

              <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3">
                <h3 className="text-sm font-black uppercase text-white">Settlement History</h3>
                {settlements.length === 0 ? (
                  <p className="text-stone-500">No settlement records yet.</p>
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
                            Gross: ₹{s.grossSellingAmount} · Comm: ₹{s.obryntCommission} · Fee: ₹{s.applicableFees}
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

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-3xl p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-rose-300">
              Reject Order {rejectTarget.suborderCode}
            </h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason (e.g. Stock damaged / item unavailable)"
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
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
