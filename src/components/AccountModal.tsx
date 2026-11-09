import React, { useState } from 'react';
import {
  X,
  Package,
  CreditCard,
  Heart,
  Sparkles,
  ShoppingBag,
  Trash2,
  Calendar,
  CheckCircle2,
  User,
  ArrowRight,
} from 'lucide-react';
import { OrderDetails, TransactionRecord, CustomDesign, Product } from '../types';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'orders' | 'transactions' | 'wishlist' | 'designs' | 'profile';
  orders: OrderDetails[];
  transactions: TransactionRecord[];
  wishlist: Product[];
  savedDesigns: CustomDesign[];
  onRemoveWishlist: (product: Product) => void;
  onAddToCart: (product: Product, size?: string) => void;
  onAddCustomToCart: (design: CustomDesign) => void;
  onDeleteSavedDesign: (id: string) => void;
  onOpenOwnerLogin?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'orders',
  orders,
  transactions,
  wishlist,
  savedDesigns,
  onRemoveWishlist,
  onAddToCart,
  onAddCustomToCart,
  onDeleteSavedDesign,
  onOpenOwnerLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'wishlist' | 'designs' | 'profile'>(
    initialTab
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4e1da]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#e4e1da] flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-700 bg-black shadow-sm shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                  My OBRYNT Account
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-stone-900 text-stone-200">
                  ATELIER
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Orders, payments, wishlist, and bespoke saved studio designs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
            aria-label="Close Account Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e4e1da] bg-white overflow-x-auto no-scrollbar px-4 sm:px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4 text-stone-600" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-stone-600" />
            <span>Transactions ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4 text-stone-600" />
            <span>Wishlist ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('designs')}
            className={`py-2.5 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'designs'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#7a8e12]" />
            <span>Saved Designs ({savedDesigns.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh]">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-600">No orders yet</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                    Completed demo checkouts will be saved here in your session history.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="p-4 rounded-2xl border border-[#e4e1da] bg-stone-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-[#111111]">
                            {order.orderId}
                          </strong>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#111111] text-[#d7ff3f]">
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{order.date}</span>
                          <span>·</span>
                          <span>{order.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-[#111111] tabular-nums">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                        <div className="text-[11px] text-stone-500">
                          {order.items.reduce((s, x) => s + x.quantity, 0)} item(s)
                        </div>
                      </div>
                    </div>

                    {/* Order Items Summary */}
                    <div className="border-t border-[#e4e1da] pt-2 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7a8e12]" />
                            <span className="font-bold text-stone-800">{item.product.name}</span>
                            <span className="text-stone-500">({item.size} × {item.quantity})</span>
                          </div>
                          <span className="font-bold text-stone-700">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-600">No transactions recorded</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Payments made during demo checkout will appear here.
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl border border-[#e4e1da] bg-stone-50/50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-[#111111]">{tx.id}</strong>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Linked Order: <strong>{tx.orderId}</strong> · {tx.date}
                      </div>
                      <div className="text-xs text-stone-600 font-medium mt-1">
                        Method: {tx.method}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-[#111111] tabular-nums">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold">
                        Verified Mock
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-3">
              {wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-600">Your wishlist is empty</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Tap the ♡ heart icon on any product to save it here for later.
                  </p>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div
                    key={item.sku || item.id}
                    className="p-3.5 rounded-2xl border border-[#e4e1da] bg-stone-50/50 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color || '#171717' }}
                      >
                        <span className="text-[8px] font-black text-white/70 uppercase">OB</span>
                      </div>
                      <div>
                        <strong className="text-sm font-extrabold text-[#111111] block line-clamp-1">
                          {item.name}
                        </strong>
                        <div className="text-xs font-bold text-stone-600">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onAddToCart(item, item.sizes?.[0] || 'L');
                          onRemoveWishlist(item);
                        }}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-black text-[#d7ff3f] text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                      <button
                        onClick={() => onRemoveWishlist(item)}
                        className="p-2 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Saved Custom Designs Tab */}
          {activeTab === 'designs' && (
            <div className="space-y-4">
              {savedDesigns.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-600">No saved custom designs yet</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Create a customized T-shirt in the OBRYNT Studio and hit "Save" to keep it here.
                  </p>
                </div>
              ) : (
                savedDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="p-4 rounded-2xl border border-[#e4e1da] bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* Mini T-shirt shape preview */}
                      <div
                        className="w-14 h-16 clip-shirt-preview shrink-0 flex items-center justify-center shadow-md relative"
                        style={{ backgroundColor: design.colorHex }}
                      >
                        <span
                          className="text-[7px] font-black tracking-tighter uppercase px-1 text-center line-clamp-1"
                          style={{ color: design.textColor }}
                        >
                          {design.text}
                        </span>
                      </div>

                      <div>
                        <strong className="text-sm font-black text-[#111111] block">
                          "{design.text}"
                        </strong>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {design.side} View · Size {design.size} · Color: {design.colorName}
                        </div>
                        {design.dateCreated && (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Saved on {design.dateCreated}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onAddCustomToCart(design)}
                        className="px-4 py-2 bg-[#111111] hover:bg-black text-[#d7ff3f] text-xs font-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order · ₹799</span>
                      </button>

                      {design.id && (
                        <button
                          onClick={() => onDeleteSavedDesign(design.id!)}
                          className="p-2 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete saved design"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 border-t border-[#e4e1da] bg-stone-50 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-stone-500">
            OBRYNT Client session active · Stored securely in your browser.
          </p>
          {onOpenOwnerLogin && (
            <button
              onClick={() => {
                onClose();
                onOpenOwnerLogin();
              }}
              className="text-[10px] text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              • Merchant Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
