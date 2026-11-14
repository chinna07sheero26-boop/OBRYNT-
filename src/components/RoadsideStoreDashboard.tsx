import React, { useEffect, useMemo, useState } from 'react';
import {
  Store,
  Package,
  ShoppingBag,
  MapPin,
  DollarSign,
  LogOut,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Truck,
  Save,
} from 'lucide-react';
import {
  VendorAuthSession,
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
  updateVendorProduct,
  updateVendorProfile,
  VendorFinancialSummary,
} from '../services/vendorService';
import { VendorCatalogManager } from './vendor/VendorCatalogManager';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface RoadsideStoreDashboardProps {
  session: VendorAuthSession;
  onLogout: () => void;
  onBackToStorefront?: () => void;
  onShowNotice: (msg: string) => void;
}

type RoadsideTab = 'home' | 'items' | 'orders' | 'store';

export const RoadsideStoreDashboard: React.FC<RoadsideStoreDashboardProps> = ({
  session,
  onLogout,
  onBackToStorefront,
  onShowNotice,
}) => {
  const [tab, setTab] = useState<RoadsideTab>('home');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorSubOrder[]>([]);
  const [financialSummary, setFinancialSummary] = useState<VendorFinancialSummary | null>(null);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);

  const [quickStockDrafts, setQuickStockDrafts] = useState<Record<string, string>>({});
  const [storeForm, setStoreForm] = useState({
    shopName: session.businessName,
    ownerName: session.fullName,
    contactNumber: '',
    shopAddress: '',
    openingHours: '9:00 AM - 10:00 PM',
    upiId: '',
  });
  const [savingStore, setSavingStore] = useState(false);

  const loadRoadsideData = async () => {
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

      const drafts: Record<string, string> = {};
      prods.forEach((p) => {
        drafts[p.id] = String(p.totalStock);
      });
      setQuickStockDrafts(drafts);

      setStoreForm({
        shopName: prof.shopProfile?.shopName || prof.businessName || '',
        ownerName: prof.shopProfile?.ownerName || prof.fullName || '',
        contactNumber: prof.phone || '',
        shopAddress: prof.shopProfile?.shopAddress || prof.pickupAddress || '',
        openingHours: prof.shopProfile?.openingHours || '9:00 AM - 10:00 PM',
        upiId: prof.bankDetails?.upiId || '',
      });
    } catch (err: any) {
      onShowNotice(`Error loading store workspace: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadsideData();
  }, [session.vendorId]);

  const kpis = useMemo(() => {
    const newOrders = orders.filter((o) => o.status === 'pending_acceptance').length;
    const totalStock = products.reduce((s, p) => s + (p.totalStock || 0), 0);
    return {
      newOrders,
      totalStock,
      liveItems: products.filter((p) => p.approvalStatus === 'approved').length,
      netEarnings: financialSummary?.totalPayableEarnings ?? 0,
    };
  }, [orders, products, financialSummary]);

  const handleQuickStockSave = async (prod: VendorProduct) => {
    const newStock = Math.max(0, Math.floor(Number(quickStockDrafts[prod.id] ?? prod.totalStock)));
    try {
      await updateVendorProduct(prod.id, { totalStock: newStock });
      onShowNotice(`Stock updated for "${prod.name}" -> ${newStock}`);
      await loadRoadsideData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleOrderAction = async (
    orderId: string,
    action: 'accept' | 'confirm_stock' | 'mark_processing' | 'mark_ready_for_pickup'
  ) => {
    try {
      const res = await performVendorOrderAction(orderId, action);
      onShowNotice(
        res.deliveryNotice
          ? `Order ${res.order.suborderCode} packed! Rider alerted.`
          : `Order ${res.order.suborderCode} -> ${res.order.status.toUpperCase()}`
      );
      await loadRoadsideData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      await updateVendorProfile({
        fullName: storeForm.ownerName,
        businessName: storeForm.shopName,
        phone: storeForm.contactNumber,
        pickupAddress: storeForm.shopAddress,
        bankDetails: { upiId: storeForm.upiId },
        shopProfile: {
          shopName: storeForm.shopName,
          ownerName: storeForm.ownerName,
          shopAddress: storeForm.shopAddress,
          pickupAddress: storeForm.shopAddress,
          contactNumber: storeForm.contactNumber,
          openingHours: storeForm.openingHours,
        },
      });
      onShowNotice('Store location & UPI payout info saved.');
      await loadRoadsideData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-stone-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#141414] border-b border-stone-800 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">
                {profile?.businessName || session.businessName}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#d7ff3f] text-black font-mono text-[10px] font-black">
                {session.vendorCode}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Roadside Store Simple Seller Console</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={loadRoadsideData}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-stone-900 border border-stone-800 text-stone-300 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onBackToStorefront && (
            <button
              type="button"
              onClick={onBackToStorefront}
              className="min-h-[40px] px-3 rounded-lg bg-stone-900 border border-stone-700 text-xs font-bold text-stone-200 flex items-center gap-1 cursor-pointer"
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
            className="min-h-[40px] px-3.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      <div className="bg-[#141414] border-b border-stone-800 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'home', label: 'Store Home', icon: Store },
          { id: 'items', label: `My Items (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'store', label: 'Location & Payout', icon: MapPin },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as RoadsideTab)}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                active ? 'bg-[#d7ff3f] text-black' : 'bg-stone-900 text-stone-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {tab === 'home' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#151515] border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">New Orders</span>
                <div className="text-2xl font-black text-amber-300 mt-1 tabular-nums">{kpis.newOrders}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#151515] border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Live Items</span>
                <div className="text-2xl font-black text-white mt-1 tabular-nums">{kpis.liveItems}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#151515] border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Units in Stock</span>
                <div className="text-2xl font-black text-white mt-1 tabular-nums">{kpis.totalStock}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#151515] border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">My Earnings</span>
                <div className="text-2xl font-black text-[#d7ff3f] mt-1 tabular-nums">
                  ₹{kpis.netEarnings.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-white">Quick Stock Counter</h2>
                <button
                  type="button"
                  onClick={() => setTab('items')}
                  className="text-xs font-bold text-[#d7ff3f] underline underline-offset-4 cursor-pointer"
                >
                  + Add New Item
                </button>
              </div>
              {products.length === 0 ? (
                <p className="text-xs text-stone-400">
                  No items listed yet. Tap "My Items" above to add clothes, footwear, or accessories.
                </p>
              ) : (
                <div className="space-y-2">
                  {products.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-black/50 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="text-white block truncate">{p.name}</strong>
                        <span className="text-stone-400">₹{p.sellingPrice} · {p.approvalStatus.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          value={quickStockDrafts[p.id] ?? p.totalStock}
                          onChange={(e) =>
                            setQuickStockDrafts({ ...quickStockDrafts, [p.id]: e.target.value })
                          }
                          className="w-16 min-h-[40px] bg-stone-900 border border-stone-700 rounded-lg text-center font-black text-white tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickStockSave(p)}
                          className="min-h-[40px] px-3 rounded-lg bg-[#d7ff3f] text-black font-black flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'items' && (
          <VendorCatalogManager
            products={products}
            vendorType="SHOP_OWNER"
            onRefresh={loadRoadsideData}
            onShowNotice={onShowNotice}
          />
        )}

        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-10 rounded-xl bg-[#151515] border border-stone-800 text-center text-xs text-stone-400">
                No customer orders for your store yet.
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-xl bg-[#151515] border border-stone-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <span className="font-mono font-black text-[#d7ff3f]">{o.suborderCode}</span>
                    <span className="px-2 py-0.5 rounded bg-black border border-stone-700 uppercase font-black text-[10px]">
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {o.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-stone-200">
                        <span>
                          {item.productName} ({item.size}) × {item.quantity}
                        </span>
                        <strong className="text-[#d7ff3f]">₹{item.vendorPayable}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-800">
                    {o.status === 'pending_acceptance' && (
                      <button
                        type="button"
                        onClick={() => handleOrderAction(o.id, 'confirm_stock')}
                        className="min-h-[42px] flex-1 px-4 py-2 rounded-xl bg-[#d7ff3f] text-black font-black flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Order</span>
                      </button>
                    )}
                    {(o.status === 'accepted' || o.status === 'processing') && (
                      <button
                        type="button"
                        onClick={() => handleOrderAction(o.id, 'mark_ready_for_pickup')}
                        className="min-h-[42px] flex-1 px-4 py-2 rounded-xl bg-emerald-400 text-black font-black flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Ready for Pickup</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'store' && (
          <div className="space-y-5">
            <form
              onSubmit={handleSaveStoreInfo}
              className="p-5 rounded-2xl bg-[#151515] border border-stone-800 space-y-3 text-xs"
            >
              <h2 className="text-base font-black text-white">Store Location & UPI Payout</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={storeForm.shopName}
                    onChange={(e) => setStoreForm({ ...storeForm, shopName: e.target.value })}
                    className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={storeForm.contactNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, contactNumber: e.target.value })}
                    className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-stone-400 font-bold mb-1">Store Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={storeForm.shopAddress}
                  onChange={(e) => setStoreForm({ ...storeForm, shopAddress: e.target.value })}
                  className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Opening Hours</label>
                  <input
                    type="text"
                    value={storeForm.openingHours}
                    onChange={(e) => setStoreForm({ ...storeForm, openingHours: e.target.value })}
                    className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">UPI ID for Payouts</label>
                  <input
                    type="text"
                    value={storeForm.upiId}
                    onChange={(e) => setStoreForm({ ...storeForm, upiId: e.target.value })}
                    placeholder="name@upi"
                    className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingStore}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
              >
                {savingStore ? 'Saving...' : 'Save Store Info'}
              </button>
            </form>

            {settlements.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#151515] border border-stone-800 space-y-2 text-xs">
                <h3 className="font-black text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#d7ff3f]" />
                  <span>Recent Store Payouts</span>
                </h3>
                {settlements.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg bg-black/50 border border-stone-800 flex justify-between"
                  >
                    <span className="font-mono text-stone-300">{s.settlementCode}</span>
                    <span className="text-[#d7ff3f] font-black">₹{s.netVendorPayable}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
