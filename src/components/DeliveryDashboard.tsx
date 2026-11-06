import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Copy,
  Check,
  Search,
  Filter,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  Package,
} from 'lucide-react';
import { DeliverySession, DeliveryAssignment } from '../types';
import {
  getDeliveryAssignments,
  recordDeliveryCopyAction,
  updateDeliveryStatus,
  formatCompleteDeliveryDetails,
  clearDeliverySession,
} from '../services/deliveryService';

interface DeliveryDashboardProps {
  session: DeliverySession;
  onLogout: () => void;
  onShowNotice: (msg: string) => void;
  onBackToStorefront?: () => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  session,
  onLogout,
  onShowNotice,
  onBackToStorefront,
}) => {
  // Assignments assigned strictly to this authenticated company
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>(() =>
    getDeliveryAssignments(session.companyId)
  );

  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'prepaid' | 'cod' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Track recent copied item IDs for feedback
  const [copiedItemField, setCopiedItemField] = useState<string | null>(null);

  // Tracking numbers draft state
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const refreshAssignments = () => {
    setAssignments(getDeliveryAssignments(session.companyId));
  };

  useEffect(() => {
    refreshAssignments();
  }, [session.companyId]);

  // Metrics specifically for this company
  const metrics = useMemo(() => {
    const total = assignments.length;
    const newAssignments = assignments.filter((a) => a.status === 'assigned').length;
    const copiedCount = assignments.filter((a) => a.copiedAt || a.status !== 'assigned').length;
    const prepaidCount = assignments.filter((a) => !a.orderSnapshot.isCod).length;
    const codCount = assignments.filter((a) => a.orderSnapshot.isCod).length;
    const deliveredCount = assignments.filter((a) => a.status === 'delivered').length;

    return {
      total,
      newAssignments,
      copiedCount,
      prepaidCount,
      codCount,
      deliveredCount,
    };
  }, [assignments]);

  // Filtered list
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (activeFilter === 'new' && a.status !== 'assigned') return false;
      if (activeFilter === 'prepaid' && a.orderSnapshot.isCod) return false;
      if (activeFilter === 'cod' && !a.orderSnapshot.isCod) return false;
      if (activeFilter === 'completed' && a.status !== 'delivered') return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        a.orderId.toLowerCase().includes(q) ||
        a.orderSnapshot.customerName.toLowerCase().includes(q) ||
        a.orderSnapshot.customerPhone.includes(q) ||
        a.orderSnapshot.city.toLowerCase().includes(q) ||
        a.orderSnapshot.pincode.includes(q) ||
        a.orderSnapshot.address.toLowerCase().includes(q)
      );
    });
  }, [assignments, activeFilter, searchQuery]);

  // Copy Single Field Helper
  const handleCopyField = (text: string, fieldLabel: string, assignmentId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItemField(`${assignmentId}-${fieldLabel}`);
    recordDeliveryCopyAction(assignmentId, fieldLabel, session.companyId, session.companyName);
    refreshAssignments();
    setTimeout(() => setCopiedItemField(null), 2000);
    onShowNotice(`Copied ${fieldLabel}: "${text}"`);
  };

  // Copy Complete Delivery Details Helper
  const handleCopyCompleteDetails = (assignment: DeliveryAssignment) => {
    const formatted = formatCompleteDeliveryDetails(assignment.orderSnapshot, assignment.notes);
    navigator.clipboard.writeText(formatted);
    setCopiedItemField(`${assignment.id}-complete`);
    recordDeliveryCopyAction(assignment.id, 'Complete Delivery Details', session.companyId, session.companyName);
    refreshAssignments();
    setTimeout(() => setCopiedItemField(null), 2500);
    onShowNotice(`Copied complete delivery details for ${assignment.orderId}! Ready to paste into courier app.`);
  };

  // Status Update Handler
  const handleUpdateStatus = (
    assignmentId: string,
    newStatus: DeliveryAssignment['status'],
    tracking?: string
  ) => {
    updateDeliveryStatus(assignmentId, newStatus, tracking);
    refreshAssignments();
    onShowNotice(`Order status updated to ${newStatus.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-stone-100 flex flex-col font-sans selection:bg-[#d7ff3f] selection:text-black">
      {/* Top Banner: Confidential Dispatch Access */}
      <div className="bg-[#1a1a1a] border-b border-stone-800 py-2 px-4 sm:px-8 text-center text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#d7ff3f]" />
          <span className="font-mono text-[11px] text-stone-300">
            RESTRICTED DISPATCH TERMINAL · <strong className="text-white">{session.companyName}</strong>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#d7ff3f] text-[#111111]">
            ZERO FINANCIAL EXPOSURE
          </span>
        </div>

        <div className="flex items-center gap-3 text-stone-400 text-[11px]">
          <span>Auth: {session.authorizedEmail}</span>
          <span>·</span>
          <span>Role: Delivery Courier Partner</span>
        </div>
      </div>

      {/* Main App Bar */}
      <header className="sticky top-0 z-30 bg-[#121212]/95 border-b border-stone-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#d7ff3f] text-[#111111] flex items-center justify-center font-black text-base shadow-lg shadow-[#d7ff3f]/10">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-wider text-white">
                OBRYNT COURIER OS
              </span>
              <span className="text-stone-500 font-bold hidden sm:inline">/</span>
              <span className="text-xs text-[#d7ff3f] font-bold hidden sm:inline">
                {session.companyName}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              Authorized Delivery Dispatch & Parcel Handover Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onBackToStorefront && (
            <button
              onClick={onBackToStorefront}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-full transition-colors cursor-pointer border border-stone-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          )}

          <button
            onClick={() => {
              clearDeliverySession();
              onLogout();
              onShowNotice('Logged out of Delivery Portal safely.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-black rounded-full transition-colors cursor-pointer border border-rose-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Courier Session</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 space-y-8">
        {/* Compliance & Privacy Guarantees Strip */}
        <div className="p-4 rounded-2xl bg-[#161616] border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block">Strict Privacy Rules in Effect:</span>
              <span className="text-stone-400">
                Prepaid shipments have all pricing & transaction data redacted. Cash on Delivery shipments display strictly the exact COD collection amount.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs text-stone-400 font-mono">
            <span>Orders Assigned: <strong className="text-white">{metrics.total}</strong></span>
            <span>·</span>
            <span>Pending Dispatch: <strong className="text-[#d7ff3f]">{metrics.newAssignments}</strong></span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: `All Shipments (${metrics.total})` },
              { id: 'new', label: `New / Pending (${metrics.newAssignments})` },
              { id: 'prepaid', label: `Prepaid (${metrics.prepaidCount})` },
              { id: 'cod', label: `COD to Collect (${metrics.codCount})` },
              { id: 'completed', label: `Delivered (${metrics.deliveredCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-[#d7ff3f] text-[#111111] font-black shadow-md shadow-[#d7ff3f]/10'
                    : 'bg-[#181818] text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80">
            <div className="flex items-center bg-[#181818] border border-stone-800 rounded-full px-3.5 py-2 focus-within:border-[#d7ff3f]">
              <Search className="w-4 h-4 text-stone-500 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID, recipient, city, PIN..."
                className="w-full bg-transparent border-0 outline-hidden text-xs text-white placeholder:text-stone-500"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-20 bg-[#141414] rounded-3xl border border-stone-800 p-8">
            <Truck className="w-12 h-12 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Assigned Shipments Found</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              There are currently no customer shipments matching this filter assigned to {session.companyName}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAssignments.map((asgn) => {
              const snap = asgn.orderSnapshot;
              const isCod = snap.isCod;
              const isCopiedComplete = copiedItemField === `${asgn.id}-complete`;

              return (
                <div
                  key={asgn.id}
                  className="bg-[#141414] border border-stone-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 hover:border-stone-700 transition-all"
                >
                  {/* Top Row: Order ID, Date, and Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-black border border-stone-800 font-mono font-black text-sm text-[#d7ff3f]">
                        {snap.orderId}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-300">
                          Assigned: {new Date(asgn.assignedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {asgn.notes ? `Note: "${asgn.notes}"` : 'Standard dispatch'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Payment Method Badge */}
                      {isCod ? (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-950/70 border border-amber-700 text-amber-300 font-black text-xs shadow-xs">
                          <Banknote className="w-4 h-4 text-amber-400" />
                          <span>CASH ON DELIVERY</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-700 text-emerald-300 font-black text-xs shadow-xs">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          <span>PREPAID · DO NOT COLLECT CASH</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          asgn.status === 'delivered'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : asgn.status === 'in_transit'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : asgn.status === 'copied'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-stone-800 text-stone-300 border border-stone-700'
                        }`}
                      >
                        {asgn.status === 'copied' ? 'Details Copied' : asgn.status}
                      </span>
                    </div>
                  </div>

                  {/* Middle Section: Recipient Details with Individual Copy Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                    {/* Customer & Mobile */}
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-stone-800/80 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          Recipient Name
                        </span>
                        <button
                          onClick={() => handleCopyField(snap.customerName, 'Customer Name', asgn.id)}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          {copiedItemField === `${asgn.id}-Customer Name` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="text-sm font-black text-white">{snap.customerName}</div>

                      <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-500 uppercase tracking-wider">Mobile Number</div>
                          <div className="text-xs font-mono font-bold text-stone-200 mt-0.5">
                            {snap.customerPhone}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyField(snap.customerPhone, 'Mobile Number', asgn.id)}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          {copiedItemField === `${asgn.id}-Mobile Number` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    {/* Delivery Address & PIN */}
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-stone-800/80 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          Full Delivery Address
                        </span>
                        <button
                          onClick={() => handleCopyField(snap.address, 'Full Address', asgn.id)}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          {copiedItemField === `${asgn.id}-Full Address` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="text-xs text-stone-200 font-medium leading-relaxed">
                        {snap.address}
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-500 uppercase tracking-wider">
                            City, State & PIN
                          </div>
                          <div className="text-xs font-bold text-white mt-0.5">
                            {snap.city}, {snap.state} - <span className="font-mono text-[#d7ff3f]">{snap.pincode}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyField(snap.pincode, 'PIN Code', asgn.id)}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          {copiedItemField === `${asgn.id}-PIN Code` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy PIN</span>
                        </button>
                      </div>
                    </div>

                    {/* Payment Privacy & COD Card */}
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between">
                      {isCod ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-400">
                            <span>Cash Collection Required</span>
                            <button
                              onClick={() =>
                                handleCopyField(
                                  String(snap.codAmountToCollect || 0),
                                  'COD Amount',
                                  asgn.id
                                )
                              }
                              className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            >
                              {copiedItemField === `${asgn.id}-COD Amount` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy COD</span>
                            </button>
                          </div>

                          <div className="p-3 bg-black/60 rounded-xl border border-amber-900/60">
                            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                              AMOUNT TO COLLECT
                            </span>
                            <span className="text-2xl font-black text-amber-200">
                              ₹{snap.codAmountToCollect?.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-400 leading-tight">
                            Collect exact cash from the customer before parcel handover. Remit to OBRYNT hub.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>100% PREPAID SHIPMENT</span>
                          </div>

                          <div className="p-3 bg-black/60 rounded-xl border border-emerald-900/60">
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                              AMOUNT TO COLLECT
                            </span>
                            <span className="text-xl font-black text-emerald-300">
                              ₹0 (ZERO)
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-400 leading-tight">
                            Paid online. <strong className="text-white">DO NOT</strong> collect any cash or delivery fee from customer.
                          </p>
                        </div>
                      )}

                      <div className="text-[10px] text-stone-500 pt-2 border-t border-stone-800/80">
                        Financial details, margins and supplier costs are permanently hidden.
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar: Complete Copy Button + Tracking / Status Update */}
                  <div className="pt-4 border-t border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* The Primary "Copy Complete Delivery Details" Button */}
                    <button
                      onClick={() => handleCopyCompleteDetails(asgn)}
                      className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                        isCopiedComplete
                          ? 'bg-emerald-400 text-black'
                          : 'bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] shadow-[#d7ff3f]/10'
                      }`}
                    >
                      {isCopiedComplete ? (
                        <>
                          <Check className="w-4 h-4 text-black" />
                          <span>COPIED TO CLIPBOARD!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#111111]" />
                          <span>COPY COMPLETE DELIVERY DETAILS</span>
                        </>
                      )}
                    </button>

                    {/* Status & Tracking Section */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <input
                        type="text"
                        placeholder="Air Waybill / Tracking #"
                        value={trackingInputs[asgn.id] ?? asgn.trackingNumber ?? ''}
                        onChange={(e) =>
                          setTrackingInputs({ ...trackingInputs, [asgn.id]: e.target.value })
                        }
                        className="bg-[#1a1a1a] border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:border-[#d7ff3f] outline-hidden w-48"
                      />

                      {asgn.status !== 'in_transit' && asgn.status !== 'delivered' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              asgn.id,
                              'in_transit',
                              trackingInputs[asgn.id] || asgn.trackingNumber
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 text-xs font-bold border border-blue-800 cursor-pointer transition-colors"
                        >
                          Mark In Transit
                        </button>
                      )}

                      {asgn.status === 'in_transit' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              asgn.id,
                              'out_for_delivery',
                              trackingInputs[asgn.id] || asgn.trackingNumber
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-800 cursor-pointer transition-colors"
                        >
                          Out for Delivery
                        </button>
                      )}

                      {asgn.status !== 'delivered' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              asgn.id,
                              'delivered',
                              trackingInputs[asgn.id] || asgn.trackingNumber
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-black border border-emerald-800 cursor-pointer transition-colors"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#121212] border-t border-stone-800/80 py-4 px-4 text-center text-xs text-stone-500">
        OBRYNT Restricted Logistics Terminal · All actions logged for regulatory compliance & consumer data privacy.
      </footer>
    </div>
  );
};
