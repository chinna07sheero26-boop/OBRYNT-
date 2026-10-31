import React, { useState } from 'react';
import {
  X,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  ShoppingBag,
  Search,
  Trash2,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { OrderDetails } from '../types';
import { LazyImage } from './LazyImage';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderDetails[];
  onClearOrders: () => void;
  onAddSampleOrder: () => void;
  onShopNow: () => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onClearOrders,
  onAddSampleOrder,
  onShopNow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<OrderDetails | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintOrder = (order: OrderDetails) => {
    window.print();
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesId = order.orderId.toLowerCase().includes(q);
    const matchesItem = order.items.some((i) =>
      i.product.name.toLowerCase().includes(q) || i.product.sku.toLowerCase().includes(q)
    );
    const matchesAddress =
      order.customer.city.toLowerCase().includes(q) ||
      order.customer.fullName.toLowerCase().includes(q);
    return matchesId || matchesItem || matchesAddress;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>On The Way</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Processing</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
            <span>Order Confirmed</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-950 text-white rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold font-display text-stone-950 text-lg">My Orders</h2>
                <span className="text-xs bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full font-mono font-semibold">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Purchase history stored locally on your browser
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orders.length > 0 && (
              <button
                type="button"
                onClick={onClearOrders}
                title="Clear order history"
                className="text-stone-400 hover:text-red-600 p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter / Search Bar if orders exist */}
        {orders.length > 0 && (
          <div className="px-6 py-3 border-b border-stone-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by Order ID or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-950 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onAddSampleOrder}
                className="text-[11px] text-stone-600 hover:text-stone-950 font-medium underline underline-offset-2 cursor-pointer"
              >
                + Add Demo Order
              </button>
            </div>
          </div>
        )}

        {/* Modal Body / Orders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {orders.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 font-display">No Orders Yet</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  You haven&apos;t placed any garment orders in this session yet. Complete checkout
                  or load a sample order to test the history.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onShopNow();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-stone-950 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Shop Garments
                </button>
                <button
                  type="button"
                  onClick={onAddSampleOrder}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                >
                  Load Sample Order
                </button>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              No orders matched your search query &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={order.orderId}
                  className="border border-stone-200 rounded-xl bg-white shadow-2xs overflow-hidden transition-all hover:border-stone-300"
                >
                  {/* Order Card Header */}
                  <div className="p-4 sm:p-5 bg-stone-50/70 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                      {/* Order ID */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 font-medium">Order:</span>
                        <span className="font-mono font-bold text-stone-950">
                          {order.orderId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(order.orderId)}
                          className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedId === order.orderId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <span className="text-stone-300 hidden md:inline">|</span>

                      {/* Order Date */}
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-medium">{order.date}</span>
                      </div>

                      <span className="text-stone-300 hidden md:inline">|</span>

                      {/* Payment Method */}
                      <div className="flex items-center gap-1 text-stone-600">
                        <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                        <span>{order.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Status & Total */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <div>{getStatusBadge(order.status)}</div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                          Total Amount
                        </div>
                        <div className="font-mono font-extrabold text-base text-stone-950">
                          ₹{order.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Items Purchased ({totalItemsCount} {totalItemsCount === 1 ? 'piece' : 'pieces'})
                    </div>

                    <div className="divide-y divide-stone-100">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Garment Image Thumbnail */}
                            <div className="w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                              <LazyImage
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                aspectRatioClass="aspect-[4/5]"
                              />
                            </div>

                            {/* Item Details */}
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                                {item.product.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-stone-500">
                                <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono font-medium">
                                  Size: {item.size}
                                </span>
                                <span>·</span>
                                <span>Qty: {item.quantity}</span>
                                <span>·</span>
                                <span className="text-stone-600">{item.product.color}</span>
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                                SKU: {item.product.sku}
                              </div>
                            </div>
                          </div>

                          {/* Item Price */}
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs sm:text-sm text-stone-900">
                              ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              ₹{item.product.price.toLocaleString('en-IN')} each
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Card Footer */}
                  <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Shipping Address snippet */}
                    <div className="flex items-center gap-2 text-stone-600 truncate">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">
                        Ship to: <strong className="text-stone-800">{order.customer.fullName}</strong>,{' '}
                        {order.customer.city}, {order.customer.state} ({order.customer.pincode})
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedTrackingOrder(order)}
                        className="px-3 py-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintOrder(order)}
                        className="px-3 py-1.5 bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-stone-500" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            Stored in browser key:{' '}
            <code className="bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
              threadlab_orders
            </code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-stone-950 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Nested Tracking Simulation Modal */}
      {selectedTrackingOrder && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-stone-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-stone-950 font-display text-sm">Package Tracking</h3>
                <div className="font-mono text-xs text-stone-500">{selectedTrackingOrder.orderId}</div>
              </div>
              <button
                onClick={() => setSelectedTrackingOrder(null)}
                className="text-stone-400 hover:text-stone-900 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Carrier Info */}
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Logistics Partner:</span>
                <span className="font-semibold text-stone-900">Delhivery Express Air</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">AWB Tracking No:</span>
                <span className="font-mono font-bold text-stone-900">
                  DEL-{selectedTrackingOrder.orderId.replace('TL-', '')}99X
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Destination:</span>
                <span className="text-stone-900">
                  {selectedTrackingOrder.customer.city}, {selectedTrackingOrder.customer.pincode}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 pt-1">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="w-0.5 h-10 bg-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Order Placed & Verified</div>
                  <div className="text-[11px] text-stone-500">
                    Payment verified via {selectedTrackingOrder.paymentMethod}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{selectedTrackingOrder.date}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="w-0.5 h-10 bg-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Garments Picked & Quality Checked</div>
                  <div className="text-[11px] text-stone-500">
                    Packed in zero-plastic biodegradable kraft box
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="w-0.5 h-10 bg-stone-200" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">In Transit - Hub Dispatch</div>
                  <div className="text-[11px] text-stone-500">
                    Dispatched from Mumbai Logistics Hub
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    selectedTrackingOrder.status === 'Delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-500'
                  }`}>
                    {selectedTrackingOrder.status === 'Delivered' ? '✓' : '4'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    {selectedTrackingOrder.status === 'Delivered'
                      ? 'Delivered to Doorstep'
                      : 'Out for Delivery (Estimated)'}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {selectedTrackingOrder.status === 'Delivered'
                      ? 'Handed over directly to recipient'
                      : 'Scheduled delivery window: 10:00 AM - 6:00 PM'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTrackingOrder(null)}
              className="w-full py-2.5 text-xs font-bold bg-stone-950 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
