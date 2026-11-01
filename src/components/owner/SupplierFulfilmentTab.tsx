import React, { useState } from 'react';
import {
  PackageCheck,
  Truck,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  Search,
  ExternalLink,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { SupplierFulfilment, Supplier, OrderDetails } from '../../types';
import { saveFulfilments } from '../../services/supplierService';

interface SupplierFulfilmentTabProps {
  fulfilments: SupplierFulfilment[];
  suppliers: Supplier[];
  orders: OrderDetails[];
  onUpdateFulfilments: (fulfilments: SupplierFulfilment[]) => void;
  onShowNotice: (msg: string) => void;
}

export const SupplierFulfilmentTab: React.FC<SupplierFulfilmentTabProps> = ({
  fulfilments,
  suppliers,
  orders,
  onUpdateFulfilments,
  onShowNotice,
}) => {
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedFulfilment, setSelectedFulfilment] = useState<SupplierFulfilment | null>(null);

  // Dispatch details modal
  const [dispatchModalItem, setDispatchModalItem] = useState<SupplierFulfilment | null>(null);
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');

  const filteredFulfilments = fulfilments.filter((f) => {
    const matchesSupplier =
      selectedSupplierFilter === 'All' || f.supplierId === selectedSupplierFilter;
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchesSearch =
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.orderId.toLowerCase().includes(search.toLowerCase()) ||
      f.supplierName.toLowerCase().includes(search.toLowerCase());
    return matchesSupplier && matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = (id: string, newStatus: SupplierFulfilment['status']) => {
    const updated = fulfilments.map((f) =>
      f.id === id ? { ...f, status: newStatus } : f
    );
    onUpdateFulfilments(updated);
    saveFulfilments(updated);
    onShowNotice(`Fulfilment ${id} marked as ${newStatus}.`);
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalItem) return;

    const updated = fulfilments.map((f) => {
      if (f.id === dispatchModalItem.id) {
        return {
          ...f,
          status: 'dispatched' as const,
          courierPartner,
          trackingNumber: trackingNumber || `AWB${Math.floor(100000000 + Math.random() * 900000000)}`,
          dispatchDate: new Date().toISOString(),
        };
      }
      return f;
    });

    onUpdateFulfilments(updated);
    saveFulfilments(updated);
    onShowNotice(`Dispatch manifest recorded with ${courierPartner}.`);
    setDispatchModalItem(null);
    setTrackingNumber('');
  };

  const handleSendNotification = (f: SupplierFulfilment) => {
    const sup = suppliers.find((s) => s.id === f.supplierId);
    onShowNotice(`Forwarded dispatch order packet to ${sup?.email || f.supplierName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-7 h-7 text-[#d7ff3f]" />
            <span>Supplier Order Routing & Fulfilment Segregation</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Automated multi-brand cart splitting. Each supplier sees exclusively their assigned items, agreed wholesale costs, and dispatch details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs">
            Zero-Leakage Multi-Tenant Isolation
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Fulfilment ID, Order ID, or Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
          />
        </div>

        <div>
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="w-full bg-[#141414] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-white outline-hidden focus:border-[#d7ff3f]"
          >
            <option value="All">All Suppliers / Factories</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.brandName} ({s.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#141414] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-white outline-hidden focus:border-[#d7ff3f]"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending Acknowledgement</option>
            <option value="acknowledged">Acknowledged by Factory</option>
            <option value="in_preparation">In Preparation</option>
            <option value="dispatched">Dispatched / In Transit</option>
            <option value="delivered">Delivered to Customer</option>
          </select>
        </div>
      </div>

      {/* Fulfilment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFulfilments.length === 0 ? (
          <div className="col-span-full bg-[#141414] border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
            <PackageCheck className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-bold">No supplier fulfilment records match criteria.</p>
            <p className="text-xs text-stone-500 mt-1">
              New customer orders are automatically routed into supplier packets upon checkout.
            </p>
          </div>
        ) : (
          filteredFulfilments.map((fulfilment) => {
            const correspondingOrder = orders.find((o) => o.orderId === fulfilment.orderId);
            return (
              <div
                key={fulfilment.id}
                className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-lg"
              >
                <div>
                  {/* Top Bar: ID and Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <div>
                      <span className="font-mono text-xs font-black text-white">
                        {fulfilment.id}
                      </span>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        Order: {fulfilment.orderId}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        fulfilment.status === 'dispatched'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : fulfilment.status === 'delivered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : fulfilment.status === 'acknowledged'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {fulfilment.status}
                    </span>
                  </div>

                  {/* Supplier Info */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Assigned Supplier:
                    </div>
                    <div className="font-bold text-sm text-[#d7ff3f]">
                      {fulfilment.supplierName}
                    </div>
                  </div>

                  {/* Order Items Segregation */}
                  <div className="mt-3 bg-stone-900/60 rounded-xl p-3 border border-stone-800/80 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      Isolated Package Items ({fulfilment.items.length})
                    </div>
                    {fulfilment.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-stone-200"
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold">{item.quantity}x</span> {item.product.name}
                          <span className="text-[10px] text-stone-400 block">
                            Size: {item.size} · SKU: {item.product.sku}
                          </span>
                        </div>
                        <span className="font-mono text-stone-400 text-xs shrink-0">
                          ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown for this supplier */}
                  <div className="mt-3 pt-2 grid grid-cols-2 gap-2 text-xs border-t border-stone-800">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                        Wholesale Payable
                      </span>
                      <span className="font-bold text-rose-300">
                        ₹{fulfilment.totalWholesaleCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                        Net Platform Margin
                      </span>
                      <span className="font-bold text-[#d7ff3f]">
                        ₹{fulfilment.estimatedNetMargin.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Tracking info if dispatched */}
                  {fulfilment.trackingNumber && (
                    <div className="mt-3 bg-blue-950/30 border border-blue-900/40 rounded-xl p-2.5 text-xs text-blue-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{fulfilment.courierPartner}: {fulfilment.trackingNumber}</span>
                      </div>
                      <div className="text-[10px] text-blue-300/80 mt-0.5">
                        Dispatched {new Date(fulfilment.dispatchDate || '').toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  )}

                  {/* Destination City */}
                  {correspondingOrder && (
                    <div className="mt-2 text-[11px] text-stone-400">
                      Destination: <strong className="text-stone-300">{correspondingOrder.customer.city}, {correspondingOrder.customer.state}</strong>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendNotification(fulfilment)}
                    className="flex-1 py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Send fulfillment slip to supplier"
                  >
                    <Send className="w-3 h-3 text-[#d7ff3f]" />
                    <span>Send Packet</span>
                  </button>

                  {fulfilment.status !== 'dispatched' && fulfilment.status !== 'delivered' ? (
                    <button
                      onClick={() => setDispatchModalItem(fulfilment)}
                      className="flex-1 py-1.5 px-2 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-[11px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Record Dispatch</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(fulfilment.id, 'delivered')}
                      className="flex-1 py-1.5 px-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Delivered</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Dispatch Modal */}
      {dispatchModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] text-white rounded-3xl w-full max-w-md p-6 border border-stone-800 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1">
              Record Dispatch & Tracking
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Enter courier partner and AWB tracking number for Fulfilment {dispatchModalItem.id}.
            </p>

            <form onSubmit={handleSaveDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  Logistics Partner
                </label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-[#d7ff3f]"
                >
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="Blue Dart Express">Blue Dart Express</option>
                  <option value="Shiprocket Direct">Shiprocket Direct</option>
                  <option value="Shadowfax Logistics">Shadowfax Logistics</option>
                  <option value="DTDC Air">DTDC Air</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  AWB Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL982341908IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-[#d7ff3f]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalItem(null)}
                  className="flex-1 py-2 bg-stone-800 text-stone-300 font-bold text-xs rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#d7ff3f] text-[#111111] font-black text-xs rounded-full cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
