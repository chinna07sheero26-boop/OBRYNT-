import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { OrderDetails, StoreSettings } from '../types';

interface InvoiceModalProps {
  order: OrderDetails | null;
  onClose: () => void;
  settings: StoreSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose, settings }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4e1da]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions */}
        <div className="p-4 sm:p-5 border-b border-[#e4e1da] flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Tax Invoice & Packing Slip
            </span>
            <span className="text-xs font-mono text-stone-500">#{order.orderId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#d7ff3f]" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 font-sans text-stone-800">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-stone-200 pb-6">
            <div>
              <div className="text-2xl font-black tracking-widest text-[#111111]">
                OBRYNT<span className="text-[#7a8e12]">.</span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-1">
                {settings.tagline}
              </p>
              <p className="text-xs text-stone-500">
                GSTIN: 29AABCO0001Z1ZX · {settings.contactEmail}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded bg-[#d7ff3f] text-[#111111]">
                {order.status}
              </span>
              <div className="text-xs font-mono text-stone-600 mt-2">
                Date: {order.date}
              </div>
              <div className="text-xs font-mono text-stone-600">
                Invoice No: INV-{order.orderId.replace(/^OB-/, '')}
              </div>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <div className="font-black uppercase text-stone-400 tracking-wider mb-1">
                Billed / Shipped To:
              </div>
              <strong className="text-sm font-black text-stone-900 block">
                {order.customer.fullName}
              </strong>
              <div className="text-stone-600 mt-0.5 leading-relaxed">
                {order.customer.address}<br />
                {order.customer.city}, {order.customer.state} — {order.customer.pincode}<br />
                Phone: {order.customer.phone}<br />
                Email: {order.customer.email}
              </div>
            </div>

            <div className="text-right">
              <div className="font-black uppercase text-stone-400 tracking-wider mb-1">
                Payment Details:
              </div>
              <div className="text-stone-700 font-bold">
                Method: {order.paymentMethod}
              </div>
              <div className="text-stone-500 mt-0.5">
                Transaction Ref: TX-{order.orderId.replace(/^OB-/, '')}
              </div>
              <div className="text-emerald-700 font-bold mt-1">
                Payment Status: Verified / Settled
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500 font-black uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Variant / Size</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="p-3">
                      <strong className="font-black text-stone-900 block">{item.product.name}</strong>
                      {item.customDesign && (
                        <span className="text-[10px] text-[#7a8e12] font-bold block">
                          Bespoke Print: "{item.customDesign.text}" ({item.customDesign.side} View, {item.customDesign.colorName})
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 font-mono">SKU: {item.product.sku}</span>
                    </td>
                    <td className="p-3 font-bold text-stone-700">{item.size}</td>
                    <td className="p-3 text-center tabular-nums font-bold">{item.quantity}</td>
                    <td className="p-3 text-right tabular-nums">₹{item.product.price.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-black tabular-nums text-stone-900">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold tabular-nums">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount:</span>
                  <span className="tabular-nums">-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping & Handling:</span>
                <span className="font-bold tabular-nums">
                  {order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (Estimated 5%):</span>
                <span className="font-bold tabular-nums">₹{order.tax || Math.round(order.subtotal * 0.05)}</span>
              </div>
              <div className="border-t border-stone-300 pt-2 flex justify-between text-sm font-black text-[#111111]">
                <span>Total Amount Paid:</span>
                <span className="tabular-nums">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-stone-200 pt-4 text-[11px] text-stone-400 text-center leading-normal">
            Thank you for your order with OBRYNT. For returns or exchanges within 7 days, contact {settings.contactEmail}.<br />
            This is a computer-generated invoice for order {order.orderId}.
          </div>
        </div>
      </div>
    </div>
  );
};
