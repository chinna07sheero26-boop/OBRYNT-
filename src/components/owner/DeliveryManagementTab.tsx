import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  Trash2,
  ExternalLink,
  RefreshCw,
  Clock,
  UserCheck,
  ChevronRight,
  FileText,
  KeyRound,
  X,
  Phone,
  Mail,
  MapPin,
  Building,
} from 'lucide-react';
import {
  DeliveryCompany,
  DeliveryAssignment,
  DeliveryActivityLog,
  OrderDetails,
} from '../../types';
import {
  getStoredDeliveryCompanies,
  getDeliveryAssignments,
  getDeliveryActivityLogs,
  addDeliveryCompany,
  updateDeliveryCompanyStatus,
  deleteDeliveryCompany,
  assignOrderToDeliveryCompany,
  removeOrderAssignment,
  formatCompleteDeliveryDetails,
} from '../../services/deliveryService';

interface DeliveryManagementTabProps {
  orders: OrderDetails[];
  onShowNotice: (msg: string) => void;
  onOpenDeliveryPortal?: (company?: DeliveryCompany) => void;
}

export const DeliveryManagementTab: React.FC<DeliveryManagementTabProps> = ({
  orders,
  onShowNotice,
  onOpenDeliveryPortal,
}) => {
  // State
  const [companies, setCompanies] = useState<DeliveryCompany[]>(() => getStoredDeliveryCompanies());
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>(() => getDeliveryAssignments());
  const [logs, setLogs] = useState<DeliveryActivityLog[]>(() => getDeliveryActivityLogs());

  // Search & Filters
  const [companySearch, setCompanySearch] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'new' | 'prepaid' | 'cod' | 'delivered'>('all');

  // Modals
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAssignOrderOpen, setIsAssignOrderOpen] = useState(false);
  const [previewAssignment, setPreviewAssignment] = useState<DeliveryAssignment | null>(null);

  // New Company Form State
  const [newCompany, setNewCompany] = useState({
    companyName: '',
    authorizedEmail: '',
    contactNumber: '',
    contactPerson: '',
    accessCode: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: '',
  });

  // Assign Order Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.orderId || '');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Copied indicator state for keys
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Refresh data
  const refreshData = () => {
    setCompanies(getStoredDeliveryCompanies());
    setAssignments(getDeliveryAssignments());
    setLogs(getDeliveryActivityLogs());
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((c) => c.status === 'active').length;
    const totalAssigned = assignments.length;
    const copiedCount = assignments.filter((a) => a.copiedAt || a.status !== 'assigned').length;
    const deliveredCount = assignments.filter((a) => a.status === 'delivered').length;
    const codAssigned = assignments.filter((a) => a.orderSnapshot.isCod).length;
    const prepaidAssigned = assignments.filter((a) => !a.orderSnapshot.isCod).length;

    return {
      totalCompanies,
      activeCompanies,
      totalAssigned,
      copiedCount,
      deliveredCount,
      codAssigned,
      prepaidAssigned,
    };
  }, [companies, assignments]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.authorizedEmail.toLowerCase().includes(q) ||
        c.contactNumber.includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
    );
  }, [companies, companySearch]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Filter logic
      if (assignmentFilter === 'new' && a.status !== 'assigned') return false;
      if (assignmentFilter === 'prepaid' && a.orderSnapshot.isCod) return false;
      if (assignmentFilter === 'cod' && !a.orderSnapshot.isCod) return false;
      if (assignmentFilter === 'delivered' && a.status !== 'delivered') return false;

      // Search logic
      const q = assignmentSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        a.orderId.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.orderSnapshot.customerName.toLowerCase().includes(q) ||
        a.orderSnapshot.city.toLowerCase().includes(q) ||
        a.orderSnapshot.pincode.includes(q)
      );
    });
  }, [assignments, assignmentFilter, assignmentSearch]);

  // Add Company Handler
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.companyName.trim() || !newCompany.authorizedEmail.trim() || !newCompany.contactNumber.trim()) {
      onShowNotice('Please enter company name, authorized email, and contact number.');
      return;
    }

    addDeliveryCompany({
      companyName: newCompany.companyName.trim(),
      authorizedEmail: newCompany.authorizedEmail.trim(),
      contactNumber: newCompany.contactNumber.trim(),
      contactPerson: newCompany.contactPerson.trim() || 'Logistics Incharge',
      accessCode: newCompany.accessCode.trim() || `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'active',
      permissions: {
        canViewCustomerPhone: true,
        canViewAddress: true,
        canUpdateStatus: true,
      },
      notes: newCompany.notes.trim(),
    });

    setIsAddCompanyOpen(false);
    setNewCompany({
      companyName: '',
      authorizedEmail: '',
      contactNumber: '',
      contactPerson: '',
      accessCode: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: '',
    });
    refreshData();
    onShowNotice('Delivery Company registered with isolated restricted access!');
  };

  // Status Change Handler
  const handleStatusChange = (companyId: string, status: 'active' | 'suspended' | 'revoked') => {
    updateDeliveryCompanyStatus(companyId, status);
    refreshData();
    onShowNotice(`Company access updated to ${status.toUpperCase()}.`);
  };

  // Delete Company Handler
  const handleDeleteCompany = (companyId: string) => {
    if (confirm('Are you sure you want to delete this delivery company? Their access will be immediately terminated.')) {
      deleteDeliveryCompany(companyId);
      refreshData();
      onShowNotice('Delivery company deleted.');
    }
  };

  // Assign Order Handler
  const handleAssignOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orders.find((o) => o.orderId === selectedOrderId);
    const targetCompany = companies.find((c) => c.id === selectedCompanyId);

    if (!targetOrder || !targetCompany) {
      onShowNotice('Please select an order and a delivery company.');
      return;
    }

    if (targetCompany.status !== 'active') {
      onShowNotice(`Cannot assign order to a ${targetCompany.status} delivery partner.`);
      return;
    }

    assignOrderToDeliveryCompany(targetOrder, targetCompany, assignmentNotes);
    setIsAssignOrderOpen(false);
    setAssignmentNotes('');
    refreshData();
    onShowNotice(`Order ${targetOrder.orderId} assigned to ${targetCompany.companyName}.`);
  };

  // Unassign Handler
  const handleUnassign = (assignmentId: string) => {
    removeOrderAssignment(assignmentId);
    refreshData();
    onShowNotice('Order assignment removed.');
  };

  // Copy Access Code Helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
    onShowNotice('Access code copied to clipboard!');
  };

  // Selected Order for Assignment Preview
  const previewOrder = orders.find((o) => o.orderId === selectedOrderId);
  const isPreviewCod =
    previewOrder?.paymentMethod.toLowerCase().includes('cod') ||
    previewOrder?.paymentMethod.toLowerCase().includes('cash on delivery') ||
    previewOrder?.paymentStatus === 'cod_pending';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#141414] border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d7ff3f] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d7ff3f]">
              LOGISTICS SECURITY & RESTRICTED ACCESS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Delivery Company Management
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Create restricted accounts for courier partners (BlueDart, Delhivery, Shadowfax, etc.). Authorised delivery partners can view only their assigned orders with strict payment privacy rules: <strong className="text-white">prepaid orders display ZERO prices</strong>, and <strong className="text-amber-400">COD orders display ONLY the exact collection amount</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => setIsAssignOrderOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-lg shadow-[#d7ff3f]/10"
          >
            <Truck className="w-4 h-4 text-[#111111]" />
            <span>ASSIGN AN ORDER</span>
          </button>

          <button
            onClick={() => setIsAddCompanyOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold rounded-full transition-colors cursor-pointer border border-stone-700"
          >
            <Plus className="w-4 h-4 text-[#d7ff3f]" />
            <span>Add Delivery Company</span>
          </button>

          {onOpenDeliveryPortal && (
            <button
              onClick={() => onOpenDeliveryPortal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-black text-[#d7ff3f] text-xs font-black rounded-full transition-colors cursor-pointer border border-stone-800"
              title="Open the Restricted Delivery Partner Portal in a separate window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Delivery Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Active Courier Partners
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {metrics.activeCompanies} <span className="text-xs text-stone-500 font-medium">/ {metrics.totalCompanies} total</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Credentials Verified
          </div>
        </div>

        <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Assigned Shipments
          </div>
          <div className="text-2xl font-black text-[#d7ff3f] mt-1">
            {metrics.totalAssigned}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">
            {metrics.prepaidAssigned} Prepaid · {metrics.codAssigned} COD
          </div>
        </div>

        <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Copied / Dispatched
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {metrics.copiedCount}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">
            Entered into courier apps
          </div>
        </div>

        <div className="bg-[#141414] border border-stone-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Delivered to Customers
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {metrics.deliveredCount}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">
            Confirmed delivery receipts
          </div>
        </div>
      </div>

      {/* SECTION 1: REGISTERED DELIVERY PARTNERS */}
      <div className="bg-[#141414] border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-[#d7ff3f]" />
              <span>Registered Delivery Companies</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Each delivery company has its own isolated login. They cannot access other companies' orders or owner features.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex items-center bg-[#1c1c1c] border border-stone-800 rounded-xl px-3 py-1.5 focus-within:border-[#d7ff3f]">
              <Search className="w-3.5 h-3.5 text-stone-500 mr-2" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search courier partners..."
                className="w-full bg-transparent border-0 outline-hidden text-xs text-white placeholder:text-stone-500"
              />
            </div>
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-xs">
            No delivery companies found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const isCopied = copiedKeyId === comp.id;
              const isSuspended = comp.status === 'suspended';
              const isRevoked = comp.status === 'revoked';

              return (
                <div
                  key={comp.id}
                  className={`bg-[#1a1a1a] border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isRevoked
                      ? 'border-rose-900/60 bg-rose-950/10'
                      : isSuspended
                      ? 'border-amber-900/60 bg-amber-950/10'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div>
                    {/* Header: Title and Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight">
                          {comp.companyName}
                        </h4>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <span>{comp.contactPerson || 'Operations'}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          comp.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : comp.status === 'suspended'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-xs text-stone-300 py-3 border-y border-stone-800/80 my-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">{comp.authorizedEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span>{comp.contactNumber}</span>
                      </div>
                    </div>

                    {/* Access Credentials Box */}
                    <div className="bg-[#121212] border border-stone-800 p-2.5 rounded-xl mb-3">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">
                        <span>Courier Access Key</span>
                        <span className="text-[#d7ff3f]">Confidential</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-white tracking-wider bg-black/60 px-2 py-1 rounded">
                          {comp.accessCode}
                        </code>
                        <button
                          onClick={() => handleCopyCode(comp.accessCode, comp.id)}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                          title="Copy Access Key to clipboard"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {comp.notes && (
                      <p className="text-[11px] text-stone-400 italic mb-3">
                        "{comp.notes}"
                      </p>
                    )}
                  </div>

                  {/* Bottom Controls */}
                  <div className="pt-3 border-t border-stone-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      {comp.status !== 'active' ? (
                        <button
                          onClick={() => handleStatusChange(comp.id, 'active')}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800 text-xs transition-colors cursor-pointer"
                        >
                          Activate Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(comp.id, 'suspended')}
                          className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 hover:text-amber-300 text-stone-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Suspend Access
                        </button>
                      )}

                      {comp.status !== 'revoked' ? (
                        <button
                          onClick={() => handleStatusChange(comp.id, 'revoked')}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-400 font-bold text-xs transition-colors cursor-pointer"
                          title="Revoke company access permanently"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteCompany(comp.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-950 text-rose-300 font-bold text-xs hover:bg-rose-900 transition-colors cursor-pointer"
                          title="Delete company record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {onOpenDeliveryPortal && comp.status === 'active' && (
                      <button
                        onClick={() => onOpenDeliveryPortal(comp)}
                        className="w-full py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-[#d7ff3f] text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-stone-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Company Dashboard</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: ASSIGNED SHIPMENTS DISPATCH STATION */}
      <div className="bg-[#141414] border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#d7ff3f]" />
              <span>Assigned Shipments & Dispatch Monitor</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Track which orders have been allocated, copied, or dispatched by each partner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            {(['all', 'new', 'prepaid', 'cod', 'delivered'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setAssignmentFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  assignmentFilter === filter
                    ? 'bg-[#d7ff3f] text-[#111111] font-black'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {filter === 'all'
                  ? 'All Shipments'
                  : filter === 'new'
                  ? 'New Uncopied'
                  : filter === 'prepaid'
                  ? 'Prepaid (No Price)'
                  : filter === 'cod'
                  ? 'COD Collection'
                  : 'Delivered'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center bg-[#1c1c1c] border border-stone-800 rounded-xl px-3.5 py-2 max-w-md focus-within:border-[#d7ff3f]">
          <Search className="w-4 h-4 text-stone-500 mr-2 shrink-0" />
          <input
            type="text"
            value={assignmentSearch}
            onChange={(e) => setAssignmentSearch(e.target.value)}
            placeholder="Search by Order ID, courier, customer, city or PIN..."
            className="w-full bg-transparent border-0 outline-hidden text-xs text-white placeholder:text-stone-500"
          />
        </div>

        {/* Assignments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Assigned Partner</th>
                <th className="py-3 px-3">Recipient & City</th>
                <th className="py-3 px-3">Payment Rule</th>
                <th className="py-3 px-3">Dispatch Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-medium">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No shipments match this filter or search query.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asgn) => {
                  const isCod = asgn.orderSnapshot.isCod;
                  return (
                    <tr key={asgn.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        {asgn.orderId}
                        <div className="text-[10px] text-stone-500 font-sans">
                          {new Date(asgn.assignedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{asgn.companyName}</div>
                        {asgn.notes && <div className="text-[10px] text-stone-400 italic">"{asgn.notes}"</div>}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-stone-200">{asgn.orderSnapshot.customerName}</div>
                        <div className="text-[11px] text-stone-400">
                          {asgn.orderSnapshot.city}, {asgn.orderSnapshot.pincode}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {isCod ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300 font-bold text-[11px]">
                            <span>COD COLLECT:</span>
                            <span className="font-black text-amber-200">
                              ₹{asgn.orderSnapshot.codAmountToCollect?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>PREPAID (₹0 to Collect)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            asgn.status === 'delivered'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : asgn.status === 'in_transit'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : asgn.status === 'copied'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {asgn.status === 'copied'
                            ? 'Details Copied'
                            : asgn.status === 'in_transit'
                            ? 'In Transit'
                            : asgn.status}
                        </span>
                        {asgn.copiedAt && (
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            Copied {new Date(asgn.copiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewAssignment(asgn)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer"
                            title="Preview Delivery Details format"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUnassign(asgn.id)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-400 cursor-pointer"
                            title="Unassign from courier"
                          >
                            <X className="w-3.5 h-3.5" />
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

      {/* SECTION 3: DELIVERY AUDIT & ACTIVITY LOG */}
      <div className="bg-[#141414] border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#d7ff3f]" />
              <span>Courier Activity & Privacy Audit Trail</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Chronological log recording partner logins, assignments, status updates, and copy button events.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500">Zero-Trust Logs</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
          {logs.slice(0, 15).map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-[#1a1a1a] border border-stone-800 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    log.action.includes('copied')
                      ? 'bg-purple-400'
                      : log.action.includes('failed')
                      ? 'bg-rose-400'
                      : 'bg-[#d7ff3f]'
                  }`}
                />
                <span className="text-stone-300 font-medium">{log.details}</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: ADD DELIVERY COMPANY */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-stone-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d7ff3f] text-[#111111] flex items-center justify-center font-black">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Add Delivery Partner</h3>
                  <p className="text-xs text-stone-400">Configure separate courier credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCompanyOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Delivery Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCompany.companyName}
                  onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                  placeholder="e.g. Delhivery Surface Logistics"
                  className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Authorised Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newCompany.authorizedEmail}
                    onChange={(e) => setNewCompany({ ...newCompany, authorizedEmail: e.target.value })}
                    placeholder="dispatch@courier.com"
                    className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompany.contactNumber}
                    onChange={(e) => setNewCompany({ ...newCompany, contactNumber: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Contact Person / Role
                  </label>
                  <input
                    type="text"
                    value={newCompany.contactPerson}
                    onChange={(e) => setNewCompany({ ...newCompany, contactPerson: e.target.value })}
                    placeholder="Dispatch Hub Manager"
                    className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Custom Access Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={newCompany.accessCode}
                      onChange={(e) => setNewCompany({ ...newCompany, accessCode: e.target.value })}
                      className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#d7ff3f] outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewCompany({
                          ...newCompany,
                          accessCode: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
                        })
                      }
                      className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer shrink-0"
                      title="Generate new access key"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Operational Notes (Optional)
                </label>
                <input
                  type="text"
                  value={newCompany.notes}
                  onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                  placeholder="e.g. Handles South Region shipments and COD cash remittances"
                  className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN ORDER */}
      {isAssignOrderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-stone-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-lg font-black text-white">Assign Order to Delivery Partner</h3>
                <p className="text-xs text-stone-400">Strict privacy controls applied automatically</p>
              </div>
              <button
                onClick={() => setIsAssignOrderOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignOrder} className="space-y-4">
              {/* Order Select */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Select Order to Dispatch *
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden cursor-pointer"
                >
                  {orders.map((o) => (
                    <option key={o.orderId} value={o.orderId}>
                      {o.orderId} — {o.customer.fullName} ({o.customer.city}) · [{o.paymentMethod}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Partner Select */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Assign to Courier Partner *
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden cursor-pointer"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.status !== 'active'}>
                      {c.companyName} {c.status !== 'active' ? `(${c.status.toUpperCase()})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Dispatch Notes (Optional)
                </label>
                <input
                  type="text"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Fragile package, hand over before 4 PM"
                  className="w-full bg-[#121212] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#d7ff3f] outline-hidden"
                />
              </div>

              {/* Real-time Privacy Redaction Preview */}
              {previewOrder && (
                <div className="bg-[#121212] border border-stone-800 p-4 rounded-2xl space-y-2">
                  <div className="text-[11px] font-black uppercase text-[#d7ff3f] tracking-wider flex items-center justify-between">
                    <span>What This Delivery Company Will See</span>
                    <span className="text-[10px] text-stone-400 font-mono">Privacy Enforced</span>
                  </div>

                  <div className="text-xs text-stone-300 space-y-1">
                    <div>
                      <span className="text-stone-500">Recipient:</span> {previewOrder.customer.fullName} (
                      {previewOrder.customer.phone})
                    </div>
                    <div>
                      <span className="text-stone-500">Address:</span> {previewOrder.customer.address},{' '}
                      {previewOrder.customer.city}, {previewOrder.customer.state} - {previewOrder.customer.pincode}
                    </div>
                    <div className="pt-2 border-t border-stone-800">
                      {isPreviewCod ? (
                        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300 font-bold">
                          CASH ON DELIVERY · AMOUNT TO COLLECT: ₹{previewOrder.total.toLocaleString('en-IN')}
                          <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                            Supplier costs and profit margins are completely hidden.
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-bold">
                          PREPAID · ZERO AMOUNT TO COLLECT
                          <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                            Product price, order total, and payment transaction details are completely hidden.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignOrderOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Confirm & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW FORMATTED DISPATCH DETAILS */}
      {previewAssignment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-stone-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-black text-white">Formatted Courier Dispatch Details</h3>
                <p className="text-xs text-stone-400">Permitted courier format (Suitable for delivery apps)</p>
              </div>
              <button
                onClick={() => setPreviewAssignment(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="bg-[#101010] border border-stone-800 p-4 rounded-2xl text-xs font-mono text-stone-200 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
              {formatCompleteDeliveryDetails(previewAssignment.orderSnapshot, previewAssignment.notes)}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-stone-500">
                Payment: {previewAssignment.orderSnapshot.paymentMethodType}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    formatCompleteDeliveryDetails(previewAssignment.orderSnapshot, previewAssignment.notes)
                  );
                  onShowNotice('Complete delivery details copied!');
                }}
                className="px-4 py-2 rounded-full bg-[#d7ff3f] text-[#111111] text-xs font-black cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
