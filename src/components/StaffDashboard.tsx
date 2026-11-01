import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Boxes,
  FileText,
  UserCheck,
  Building2,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  Shield,
  Layers,
  ArrowUpRight,
  Printer,
  X,
} from 'lucide-react';
import { Product, OrderDetails } from '../types';
import { getStaffSession } from '../services/staffAuthService';

interface StaffDashboardProps {
  products: Product[];
  orders: OrderDetails[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onCloseStaffDashboard: () => void;
  onLogoutStaff: () => void;
  onShowNotice: (msg: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  products,
  orders,
  onUpdateProducts,
  onUpdateOrderStatus,
  onCloseStaffDashboard,
  onLogoutStaff,
  onShowNotice,
}) => {
  const staffSession = getStaffSession();
  const [activeTab, setActiveTab] = useState<'fulfillment' | 'inventory' | 'support'>('fulfillment');

  // Fulfillment Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<OrderDetails | null>(null);

  // Inventory Filters
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Support Lookup
  const [supportQuery, setSupportQuery] = useState('');

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderId = order.orderId || '';
      const custName = order.customer?.fullName || '';
      const custEmail = order.customer?.email || '';
      const custCity = order.customer?.city || '';

      const matchesSearch =
        orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
        custName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        custEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
        custCity.toLowerCase().includes(orderSearch.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ||
        order.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, statusFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (prod.sku && prod.sku.toLowerCase().includes(productSearch.toLowerCase()));

      const matchesCat =
        categoryFilter === 'All' || prod.category === categoryFilter || prod.cat === categoryFilter;

      const currentStock = prod.stock ?? 10;
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = currentStock > 0 && currentStock <= 5;
      if (stockFilter === 'out') matchesStock = currentStock === 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, productSearch, categoryFilter, stockFilter]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Adjust stock handler
  const handleStockDelta = (sku: string, delta: number) => {
    const updated = products.map((prod) => {
      const match = prod.sku === sku || String(prod.id) === sku;
      if (match) {
        const current = prod.stock ?? 10;
        const newStock = Math.max(0, current + delta);
        return { ...prod, stock: newStock };
      }
      return prod;
    });

    onUpdateProducts(updated);
    onShowNotice(`Inventory updated for SKU ${sku}`);
  };

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800';
      case 'dispatched':
      case 'shipped':
        return 'bg-blue-950/80 text-blue-400 border border-blue-800';
      case 'processing':
        return 'bg-amber-950/80 text-amber-400 border border-amber-800';
      case 'cancelled':
        return 'bg-rose-950/80 text-rose-400 border border-rose-800';
      default:
        return 'bg-stone-800 text-stone-300 border border-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Staff Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#161b22]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-cyan-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">OBRYNT</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-black tracking-wider uppercase">
                Staff Operations Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Warehouse Logistics, Order Fulfillment & Real-time Stock Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Permission isolation notice badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-slate-900 border border-slate-800 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Role: Staff Member (Financials Isolated)</span>
          </div>

          <button
            onClick={onCloseStaffDashboard}
            className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            Storefront
          </button>

          <button
            onClick={onLogoutStaff}
            className="px-3.5 py-1.5 rounded-full bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-xs font-bold text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-[#161b22] border-b border-slate-800 px-4 sm:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setActiveTab('fulfillment')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'fulfillment'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Order Fulfillment Station ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Warehouse Stock Sync ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'support'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Customer Order Lookup</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* ===================================================================== */}
        {/* TAB 1: ORDER FULFILLMENT STATION */}
        {/* ===================================================================== */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="text-2xl font-black text-white mt-1">{orders.length}</div>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Pending / Processing
                </span>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {orders.filter((o) => ['pending', 'processing', 'demo order placed'].includes(o.status.toLowerCase())).length}
                </div>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Dispatched
                </span>
                <div className="text-2xl font-black text-blue-300 mt-1">
                  {orders.filter((o) => ['dispatched', 'shipped'].includes(o.status.toLowerCase())).length}
                </div>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Completed / Delivered
                </span>
                <div className="text-2xl font-black text-emerald-300 mt-1">
                  {orders.filter((o) => o.status.toLowerCase() === 'delivered').length}
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Order ID, Customer, City..."
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['All', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 ${
                      statusFilter === st
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Order ID & Date</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Items / SKU</th>
                      <th className="py-3.5 px-4">Destination</th>
                      <th className="py-3.5 px-4">Current Status</th>
                      <th className="py-3.5 px-4 text-right">Fulfillment Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No orders match the current fulfillment filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const orderId = order.orderId;
                        const cust = order.customer;
                        return (
                          <tr key={orderId} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-white block">
                                {orderId}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {order.date || 'Today'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-200 block">
                                {cust?.fullName || 'Customer'}
                              </span>
                              <span className="text-[11px] text-slate-400 block font-mono">
                                {cust?.phone}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-300">
                                    <span className="font-bold text-white">{it.quantity}x</span>{' '}
                                    <span>{it.product.name}</span>{' '}
                                    <span className="text-slate-400">({it.size})</span>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-300">
                              <div>{cust?.city}, {cust?.state}</div>
                              <div className="text-[10px] text-slate-400">{cust?.pincode}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${getStatusBadge(order.status)}`}>
                                {order.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <select
                                  value={order.status}
                                  onChange={(e) => onUpdateOrderStatus(orderId, e.target.value)}
                                  className="bg-[#0d1117] border border-slate-700 text-xs font-bold text-white rounded-lg px-2.5 py-1.5 cursor-pointer outline-hidden focus:border-cyan-400"
                                >
                                  <option value="Processing">Set: Processing</option>
                                  <option value="Dispatched">Set: Dispatched</option>
                                  <option value="Delivered">Set: Delivered</option>
                                  <option value="Cancelled">Set: Cancelled</option>
                                </select>

                                <button
                                  onClick={() => setSelectedOrderForSlip(order)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                  title="Print Packing Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
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

        {/* ===================================================================== */}
        {/* TAB 2: WAREHOUSE INVENTORY SYNC */}
        {/* ===================================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161b22] border border-slate-800 p-4 rounded-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter inventory by SKU or product name..."
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#0d1117] border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer outline-hidden focus:border-cyan-400"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="bg-[#0d1117] border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer outline-hidden focus:border-cyan-400"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="low">Low Stock (&le; 5 units)</option>
                  <option value="out">Out of Stock (0 units)</option>
                </select>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => {
                const stock = prod.stock ?? 10;
                const isLow = stock > 0 && stock <= 5;
                const isOut = stock === 0;

                return (
                  <div
                    key={prod.sku}
                    className="bg-[#161b22] border border-slate-800 rounded-2xl p-4 flex gap-3.5 hover:border-slate-700 transition-colors"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-20 h-24 object-cover rounded-xl bg-slate-900 border border-slate-800 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-white truncate">{prod.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                              isOut
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-400 block mt-0.5">
                          {prod.sku}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {prod.category || prod.cat}
                        </span>
                      </div>

                      {/* Stock Adjustment Controls */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="text-xs font-black text-white">
                          Units: <span className="text-cyan-400 text-sm font-mono">{stock}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStockDelta(prod.sku, -1)}
                            disabled={stock <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                            title="Decrease Stock (-1)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleStockDelta(prod.sku, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                            title="Increase Stock (+1)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleStockDelta(prod.sku, 5)}
                            className="px-2 h-7 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-[11px] font-bold text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                            title="Restock Batch (+5)"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: CUSTOMER ORDER LOOKUP */}
        {/* ===================================================================== */}
        {activeTab === 'support' && (
          <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-white">Customer Support Order Lookup</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quickly locate an order to answer customer inquiries or update shipping addresses without exposing store financial records.
              </p>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Order ID, Customer Phone, or Email
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={supportQuery}
                  onChange={(e) => setSupportQuery(e.target.value)}
                  placeholder="e.g. ORD-1730 or customer@email.com"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            {supportQuery.trim() && (
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Matching Search Results:
                </h4>

                {orders
                  .filter(
                    (o) =>
                      o.orderId.toLowerCase().includes(supportQuery.toLowerCase()) ||
                      (o.customer?.email && o.customer.email.toLowerCase().includes(supportQuery.toLowerCase())) ||
                      (o.customer?.phone && o.customer.phone.includes(supportQuery))
                  )
                  .map((match) => (
                    <div
                      key={match.orderId}
                      className="bg-[#0d1117] border border-slate-800 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            {match.orderId}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">Placed: {match.date}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadge(match.status)}`}>
                          {match.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-bold text-slate-400 block mb-1">Customer & Destination:</span>
                          <div className="font-bold text-white">{match.customer?.fullName}</div>
                          <div className="text-slate-300">{match.customer?.address}</div>
                          <div className="text-slate-300">{match.customer?.city}, {match.customer?.state} - {match.customer?.pincode}</div>
                          <div className="text-slate-400 font-mono mt-1">{match.customer?.phone} · {match.customer?.email}</div>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 block mb-1">Package Items:</span>
                          <div className="space-y-1">
                            {match.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-slate-300">
                                <span>{it.quantity}x {it.product.name} ({it.size})</span>
                                <span className="font-mono text-cyan-400">{it.product.sku}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => onUpdateOrderStatus(match.orderId, 'Dispatched')}
                          className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-800 text-xs font-bold text-blue-300 cursor-pointer"
                        >
                          Mark as Dispatched
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(match.orderId, 'Delivered')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-bold text-emerald-300 cursor-pointer"
                        >
                          Mark as Delivered
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Packing Slip Modal */}
      {selectedOrderForSlip && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedOrderForSlip(null)}
        >
          <div
            className="bg-white text-black rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black">OBRYNT PACKING SLIP</h3>
                <p className="text-xs text-stone-500">Warehouse Dispatch & Verification Document</p>
              </div>
              <button
                onClick={() => setSelectedOrderForSlip(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-3 rounded-xl border">
                <div>
                  <span className="font-bold text-stone-400 block uppercase text-[10px]">Order Ref:</span>
                  <span className="font-mono font-bold text-stone-900">{selectedOrderForSlip.orderId}</span>
                </div>
                <div>
                  <span className="font-bold text-stone-400 block uppercase text-[10px]">Packing Date:</span>
                  <span className="font-bold text-stone-900">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-stone-400 block uppercase text-[10px] mb-1">Deliver To:</span>
                <div className="font-bold text-stone-900">{selectedOrderForSlip.customer?.fullName}</div>
                <div className="text-stone-700">{selectedOrderForSlip.customer?.address}</div>
                <div className="text-stone-700">{selectedOrderForSlip.customer?.city}, {selectedOrderForSlip.customer?.state} - {selectedOrderForSlip.customer?.pincode}</div>
                <div className="text-stone-500 font-mono mt-1">{selectedOrderForSlip.customer?.phone}</div>
              </div>

              <div className="border-t pt-3">
                <span className="font-bold text-stone-400 block uppercase text-[10px] mb-2">Package Contents:</span>
                <div className="divide-y border rounded-xl overflow-hidden">
                  {selectedOrderForSlip.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                      <div>
                        <span className="font-bold">{it.product.name}</span>
                        <span className="text-stone-500 text-[11px] block">Size: {it.size} · SKU: {it.product.sku}</span>
                      </div>
                      <span className="font-black text-sm px-2.5 py-1 bg-stone-100 rounded-lg">
                        Qty: {it.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForSlip(null)}
                  className="px-5 py-3 border font-bold rounded-xl text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
