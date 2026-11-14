import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  ShoppingBag,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Truck,
  Search,
  Save,
  Shield,
} from 'lucide-react';
import { ShopStaffSession } from '../types';
import {
  clearShopStaffSession,
  fetchShopStaffWorkspace,
  ShopStaffWorkspace,
  staffPerformOrderAction,
  staffUpdateProductStock,
} from '../services/vendorService';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface ShopStaffDashboardProps {
  session: ShopStaffSession;
  onLogout: () => void;
  onShowNotice: (msg: string) => void;
}

export const ShopStaffDashboard: React.FC<ShopStaffDashboardProps> = ({
  session,
  onLogout,
  onShowNotice,
}) => {
  const [tab, setTab] = useState<'orders' | 'stock'>('orders');
  const [workspace, setWorkspace] = useState<ShopStaffWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const ws = await fetchShopStaffWorkspace();
      setWorkspace(ws);
      const drafts: Record<string, string> = {};
      ws.products.forEach((p) => {
        drafts[p.id] = String(p.totalStock);
      });
      setStockDrafts(drafts);
    } catch (err: any) {
      onShowNotice(`Error loading shop staff workspace: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [session.staffId]);

  const filteredProducts = useMemo(() => {
    const list = workspace?.products || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [workspace, searchQuery]);

  const handleSaveStock = async (productId: string) => {
    const parsed = Math.max(0, Math.floor(Number(stockDrafts[productId] ?? 0)));
    setSavingProductId(productId);
    try {
      const res = await staffUpdateProductStock(productId, parsed);
      onShowNotice(`Updated stock to ${res.totalStock} (${res.approvalStatus})`);
      await loadWorkspace();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    } finally {
      setSavingProductId(null);
    }
  };

  const handleOrderAction = async (
    orderId: string,
    action: 'accept' | 'confirm_stock' | 'mark_processing' | 'mark_ready_for_pickup'
  ) => {
    try {
      const res = await staffPerformOrderAction(orderId, action);
      onShowNotice(`Order updated to ${res.status.toUpperCase()}`);
      await loadWorkspace();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const portalLabel =
    session.staffCategory === 'ROADSIDE_STORE'
      ? 'Roadside Store Staff Station'
      : 'Garment Shop Staff Station';

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-stone-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#141414] border-b border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-wide text-white">
                {workspace?.shopName || session.shopName}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#d7ff3f] text-black font-mono text-[10px] font-black">
                {session.staffCode}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {portalLabel} · Stock & Order Execution Only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadWorkspace}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              clearShopStaffSession();
              onLogout();
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 flex-1">
        <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-2.5 text-xs text-stone-300">
          <Shield className="w-4 h-4 text-[#d7ff3f] shrink-0" />
          <span>
            Scoped strictly to <strong>{workspace?.shopName || session.shopName}</strong>. Financial payouts, Admin controls, and other stores are restricted.
          </span>
        </div>

        <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer ${
              tab === 'orders'
                ? 'bg-[#d7ff3f] text-black'
                : 'bg-[#141414] text-stone-300 border border-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Assigned Orders ({workspace?.orders.length ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('stock')}
            className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer ${
              tab === 'stock'
                ? 'bg-[#d7ff3f] text-black'
                : 'bg-[#141414] text-stone-300 border border-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Stock ({workspace?.products.length ?? 0})</span>
          </button>
        </div>

        {tab === 'orders' && (
          <div className="space-y-3">
            {(!workspace || workspace.orders.length === 0) ? (
              <div className="p-10 rounded-2xl bg-[#141414] border border-stone-800 text-center text-xs text-stone-400">
                No orders assigned to this shop right now.
              </div>
            ) : (
              workspace.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#d7ff3f] bg-black px-2.5 py-1 rounded">
                        {order.suborderCode}
                      </span>
                      <span className="text-stone-400 font-mono">
                        Order: {order.parentOrderCode}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-stone-900 border border-stone-700 font-black uppercase text-[10px]">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-stone-800/80"
                      >
                        <div>
                          <strong className="text-white">{item.productName}</strong>
                          <span className="text-stone-400 ml-2">
                            {item.size} · {item.color} · {item.sku}
                          </span>
                        </div>
                        <strong className="text-[#d7ff3f] tabular-nums">Qty: {item.quantity}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                    <div className="text-stone-400">
                      Customer: <strong className="text-stone-200">{order.customerName}</strong> ·{' '}
                      {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === 'pending_acceptance' && (
                        <button
                          type="button"
                          onClick={() => handleOrderAction(order.id, 'confirm_stock')}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#d7ff3f] text-black font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept & Confirm Stock</span>
                        </button>
                      )}
                      {order.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => handleOrderAction(order.id, 'mark_processing')}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white text-black font-black cursor-pointer"
                        >
                          Start Packing
                        </button>
                      )}
                      {(order.status === 'accepted' || order.status === 'processing') && (
                        <button
                          type="button"
                          onClick={() => handleOrderAction(order.id, 'mark_ready_for_pickup')}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-400 text-black font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Ready for Pickup</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'stock' && (
          <div className="space-y-4">
            <div className="flex items-center bg-[#141414] border border-stone-800 rounded-xl px-3.5 py-2.5">
              <Search className="w-4 h-4 text-stone-500 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shop products by name, SKU, or category..."
                className="w-full bg-transparent outline-hidden text-xs text-white placeholder:text-stone-500"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#141414] border border-stone-800 text-center text-xs text-stone-400">
                No products found for this shop.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#141414] border border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-[#d7ff3f] block">
                        {p.productCode}
                      </span>
                      <h4 className="font-black text-white truncate">{p.name}</h4>
                      <span className="text-[11px] text-stone-400">
                        {p.category} · {p.sizes.join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        value={stockDrafts[p.id] ?? p.totalStock}
                        onChange={(e) =>
                          setStockDrafts({ ...stockDrafts, [p.id]: e.target.value })
                        }
                        className="w-20 min-h-[40px] bg-black border border-stone-700 rounded-lg px-2.5 py-1.5 text-center font-black text-white tabular-nums outline-hidden focus:border-[#d7ff3f]"
                      />
                      <button
                        type="button"
                        disabled={savingProductId === p.id}
                        onClick={() => handleSaveStock(p.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#d7ff3f] hover:bg-[#c9f530] text-black font-black flex items-center gap-1 cursor-pointer"
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
        )}
      </main>
    </div>
  );
};
