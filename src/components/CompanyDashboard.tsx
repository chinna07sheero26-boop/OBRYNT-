import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  LogOut,
  Search,
  Filter,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { CompanyAccount, CompanyAssignedOrder, CompanyFulfillmentStatus, CompanyStaffSession } from '../types';
import {
  getOrdersForCompany,
  updateCompanyOrderStatus,
  clearCompanyStaffSession,
} from '../services/companyService';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface CompanyDashboardProps {
  session: CompanyStaffSession;
  onLogout: () => void;
  onShowNotice: (msg: string) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ session, onLogout, onShowNotice }) => {
  const [orders, setOrders] = useState<CompanyAssignedOrder[]>(() => getOrdersForCompany(session.companyId));
  const [statusFilter, setStatusFilter] = useState<'All' | CompanyFulfillmentStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CompanyAssignedOrder | null>(null);

  // Sync orders
  const refreshOrders = () => {
    setOrders(getOrdersForCompany(session.companyId));
  };

  useEffect(() => {
    refreshOrders();
  }, [session.companyId]);

  const handleUpdateStatus = (assignmentId: string, nextStatus: CompanyFulfillmentStatus) => {
    const updated = updateCompanyOrderStatus(assignmentId, nextStatus);
    if (updated) {
      refreshOrders();
      if (selectedOrder && selectedOrder.assignmentId === assignmentId) {
        setSelectedOrder(updated);
      }
      onShowNotice(`Order status updated to "${nextStatus}".`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.fulfillmentStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.pincode.includes(q);
    return matchesStatus && matchesSearch;
  });

  const countByStatus = {
    received: orders.filter((o) => o.fulfillmentStatus === 'Order received').length,
    packing: orders.filter((o) => o.fulfillmentStatus === 'Packing').length,
    packed: orders.filter((o) => o.fulfillmentStatus === 'Packed').length,
    dispatched: orders.filter((o) => o.fulfillmentStatus === 'Dispatched').length,
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-100 flex flex-col font-sans selection:bg-[#d7ff3f] selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#141414] border-b border-stone-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shadow-md shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wide text-white font-serif">{session.companyName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 font-bold border border-stone-700">
                {session.companyId}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-semibold">OBRYNT Authorized Partner Fulfillment Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearCompanyStaffSession();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-full transition-colors cursor-pointer border border-stone-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Order Received
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{countByStatus.received}</div>
          </div>

          <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Packing In-Progress
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{countByStatus.packing}</div>
          </div>

          <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Packed & Ready
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-1.5">{countByStatus.packed}</div>
          </div>

          <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              Dispatched
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1.5">{countByStatus.dispatched}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer, city..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
            {(['All', 'Order received', 'Packing', 'Packed', 'Dispatched'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-stone-400 hover:text-white hover:bg-stone-900'
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
            <div className="bg-[#141414] border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-3 text-stone-600" />
              <p className="font-bold text-white text-base">No assigned orders found</p>
              <p className="text-xs text-stone-500 mt-1">
                When the OBRYNT owner assigns orders to {session.companyName}, they will appear here.
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div
                key={ord.assignmentId}
                className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-colors space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Product & Order Details */}
                  <div className="flex items-start gap-4">
                    <img
                      src={ord.productImageUrl}
                      alt={ord.productName}
                      className="w-16 h-16 rounded-xl object-cover bg-stone-800 shrink-0 border border-stone-700"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-white text-base">Order #{ord.orderId}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 font-bold border border-stone-700">
                          {ord.productSku}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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

                      <div className="text-sm font-bold text-stone-200">{ord.productName}</div>

                      <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
                        <span className="font-bold text-[#d7ff3f]">Qty: {ord.quantity}</span>
                        <span>•</span>
                        <span>Size: {ord.size}</span>
                        <span>•</span>
                        <span>Colour: {ord.color}</span>
                        <span>•</span>
                        <span>Order Date: {new Date(ord.orderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Customer Delivery Information */}
                  <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/80 space-y-1 text-xs max-w-sm w-full">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Customer: {ord.customerName}</span>
                      <span className="flex items-center gap-1 text-cyan-400 font-mono">
                        <Phone className="w-3 h-3" />
                        {ord.customerPhone}
                      </span>
                    </div>
                    <div className="text-stone-400 flex items-start gap-1.5 text-[11px] leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <span>
                        {ord.deliveryAddress}, {ord.city}, {ord.state} - {ord.pincode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Advancement Buttons */}
                <div className="pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span>
                      Packing:{' '}
                      <strong className="text-stone-200 font-bold">
                        {ord.packingStatus || 'Pending'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Dispatch:{' '}
                      <strong className="text-stone-200 font-bold">
                        {ord.dispatchStatus || 'Pending'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-stone-500 mr-1">Update Status:</span>

                    <button
                      onClick={() => handleUpdateStatus(ord.assignmentId, 'Order received')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ord.fulfillmentStatus === 'Order received'
                          ? 'bg-stone-700 text-white font-black'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      Received
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(ord.assignmentId, 'Packing')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ord.fulfillmentStatus === 'Packing'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 font-black'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      Packing
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(ord.assignmentId, 'Packed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ord.fulfillmentStatus === 'Packed'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-black'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      Packed
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(ord.assignmentId, 'Dispatched')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ord.fulfillmentStatus === 'Dispatched'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-black'
                          : 'bg-[#d7ff3f] text-black hover:bg-[#cbf532]'
                      }`}
                    >
                      Dispatched
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
