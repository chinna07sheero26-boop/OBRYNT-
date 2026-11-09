import React, { useState } from 'react';
import {
  Factory,
  Plus,
  ShieldCheck,
  Search,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  PackageCheck,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  FactoryPartner,
  FactoryProductSubmission,
  FactorySubmissionStatus,
  Product,
} from '../../types';
import {
  getStoredFactories,
  createFactoryPartner,
  updateFactoryStatus,
  resetFactoryKey,
  generateFactoryInviteUrl,
  getStoredSubmissions,
  ownerReviewFactoryProduct,
} from '../../services/factoryService';

interface FactoryPartnersTabProps {
  onShowNotice: (msg: string) => void;
  onProductPublished?: (newProduct: Product) => void;
  onOpenFactoryPortal?: (token: string) => void;
}

export const FactoryPartnersTab: React.FC<FactoryPartnersTabProps> = ({
  onShowNotice,
  onProductPublished,
  onOpenFactoryPortal,
}) => {
  const [factories, setFactories] = useState<FactoryPartner[]>(() => getStoredFactories());
  const [submissions, setSubmissions] = useState<FactoryProductSubmission[]>(() => getStoredSubmissions());
  const [activeSubTab, setActiveSubTab] = useState<'factories' | 'submissions'>('submissions');
  const [submissionFilter, setSubmissionFilter] = useState<'All' | FactorySubmissionStatus>('pending_approval');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Modal: Register Factory
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFactory, setNewFactory] = useState({
    id: '',
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    secretKey: '',
    capacity: '',
    specialization: '',
    notes: '',
  });

  // Modal: Review Submission
  const [selectedSubmission, setSelectedSubmission] = useState<FactoryProductSubmission | null>(null);
  const [retailSellingPrice, setRetailSellingPrice] = useState<number>(999);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const refreshData = () => {
    setFactories(getStoredFactories());
    setSubmissions(getStoredSubmissions());
  };

  const handleCopyLink = (token: string) => {
    const url = generateFactoryInviteUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    onShowNotice('Factory partner invitation link copied to clipboard.');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleRegisterFactorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactory.name.trim() || !newFactory.secretKey.trim()) {
      alert('Factory name and access secret key are required.');
      return;
    }

    const assignedId =
      newFactory.id.trim() ||
      `FAC-${newFactory.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Math.floor(
        Math.random() * 900 + 100
      )}`;

    try {
      const created = await createFactoryPartner({
        id: assignedId,
        name: newFactory.name.trim(),
        ownerName: newFactory.ownerName.trim(),
        email: newFactory.email.trim(),
        phone: newFactory.phone.trim(),
        address: newFactory.address.trim(),
        accessKeyHash: newFactory.secretKey.trim(),
        plainPasswordPreview: newFactory.secretKey.trim(),
        status: 'active',
        capacity: newFactory.capacity.trim(),
        specialization: newFactory.specialization.trim(),
        notes: newFactory.notes.trim(),
      });

      refreshData();
      setIsAddModalOpen(false);
      setNewFactory({
        id: '',
        name: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        secretKey: '',
        capacity: '',
        specialization: '',
        notes: '',
      });
      onShowNotice(`Factory "${created.name}" registered. Generated invitation token: ${created.invitationToken}`);
    } catch (err: any) {
      alert(`Error registering factory: ${err?.message || 'Check inputs'}`);
    }
  };

  const handleToggleStatus = (factory: FactoryPartner) => {
    const nextStatus = factory.status === 'active' ? 'suspended' : 'active';
    updateFactoryStatus(factory.id, nextStatus);
    refreshData();
    onShowNotice(`Factory "${factory.name}" access is now ${nextStatus.toUpperCase()}.`);
  };

  const openReviewDrawer = (sub: FactoryProductSubmission) => {
    setSelectedSubmission(sub);
    const suggestedPrice = sub.finalSellingPrice || Math.round(sub.factoryQuotation * 2.2);
    setRetailSellingPrice(suggestedPrice);
    setReviewNotes(sub.reviewNotes || '');
  };

  const handleDecision = async (decision: FactorySubmissionStatus) => {
    if (!selectedSubmission) return;
    setIsSubmittingReview(true);

    try {
      const res = await ownerReviewFactoryProduct(selectedSubmission.id, decision, {
        finalSellingPrice: decision === 'approved' ? retailSellingPrice : undefined,
        reviewNotes: reviewNotes.trim(),
      });

      if (res.success) {
        refreshData();
        setSelectedSubmission(null);
        if (decision === 'approved') {
          if (res.publishedProduct && onProductPublished) {
            onProductPublished(res.publishedProduct);
          }
          onShowNotice(
            `Product "${selectedSubmission.productName}" APPROVED & PUBLISHED live to store at ₹${retailSellingPrice}!`
          );
        } else {
          onShowNotice(`Product submission status updated to: ${decision.replace('_', ' ').toUpperCase()}`);
        }
      } else {
        alert(res.error || 'Failed to update review status.');
      }
    } catch (err: any) {
      alert(`Review error: ${err?.message || 'Failed'}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending_approval').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                Factory Partners & Production Sourcing
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Direct Mill Sourcing
                </span>
              </h2>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm max-w-2xl">
              Register apparel factories, generate private invitation tokens, and review batch submissions.
              Factories propose products with wholesale quotations; you set the retail customer price and publish live.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Factory Partner</span>
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-800/80">
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500">Partner Factories</div>
            <div className="text-2xl font-black text-white mt-1">{factories.length}</div>
          </div>
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">Pending Approvals</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Approved & Live</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</div>
          </div>
          <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Total Submissions</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{submissions.length}</div>
          </div>
        </div>
      </div>

      {/* Switcher: Submissions Review Queue vs Registered Factories */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'submissions'
                ? 'bg-[#d7ff3f] text-black'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Product Review Queue</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-[#d7ff3f] rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('factories')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'factories'
                ? 'bg-[#d7ff3f] text-black'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Registered Factories ({factories.length})</span>
          </button>
        </div>

        {activeSubTab === 'submissions' && (
          <div className="flex items-center gap-1.5">
            {(['pending_approval', 'approved', 'needs_revision', 'All'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSubmissionFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  submissionFilter === st
                    ? 'bg-stone-800 text-[#d7ff3f] border border-stone-700'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {st === 'pending_approval'
                  ? 'Pending'
                  : st === 'needs_revision'
                  ? 'Needs Revision'
                  : st === 'approved'
                  ? 'Approved'
                  : 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW: SUBMISSIONS QUEUE */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          {submissions
            .filter((s) => submissionFilter === 'All' || s.status === submissionFilter)
            .length === 0 ? (
            <div className="bg-[#141414] border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
              <PackageCheck className="w-10 h-10 mx-auto mb-3 text-stone-600" />
              <p className="font-bold text-white text-base">No submissions matching filter</p>
              <p className="text-xs text-stone-500 mt-1">
                Factory submissions will appear here for your review and retail price markup.
              </p>
            </div>
          ) : (
            submissions
              .filter((s) => submissionFilter === 'All' || s.status === submissionFilter)
              .map((sub) => {
                const estMargin = sub.finalSellingPrice
                  ? Math.round(((sub.finalSellingPrice - sub.factoryQuotation) / sub.finalSellingPrice) * 100)
                  : null;

                return (
                  <div
                    key={sub.id}
                    className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Product & Factory Overview */}
                      <div className="flex items-start gap-4">
                        <img
                          src={sub.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg'}
                          alt={sub.productName}
                          className="w-16 h-16 rounded-xl object-cover bg-stone-800 shrink-0 border border-stone-700"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white text-base">{sub.productName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 font-bold border border-stone-700">
                              {sub.sku}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : sub.status === 'pending_approval'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {sub.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                              <Factory className="w-3.5 h-3.5" />
                              {sub.factoryName}
                            </span>
                            <span>•</span>
                            <span>
                              Category: {sub.category} / {sub.subcategory}
                            </span>
                            <span>•</span>
                            <span>MOQ: {sub.moq} units</span>
                            <span>•</span>
                            <span>Stock: {sub.stockQuantity}</span>
                          </div>

                          <p className="text-xs text-stone-400 line-clamp-1">{sub.description}</p>
                          <div className="text-[11px] text-stone-500">Fabric: {sub.materialFabric}</div>
                        </div>
                      </div>

                      {/* Right: Pricing & Action */}
                      <div className="flex flex-col sm:flex-row lg:flex-col sm:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-800">
                        <div className="sm:text-right space-y-0.5">
                          <div className="text-xs text-stone-400">
                            Factory Quote:{' '}
                            <span className="font-black text-amber-400 text-sm">₹{sub.factoryQuotation}</span>
                          </div>
                          {sub.finalSellingPrice ? (
                            <div className="text-xs text-emerald-400 font-bold">
                              Live Retail: ₹{sub.finalSellingPrice} ({estMargin}% Gross Margin)
                            </div>
                          ) : (
                            <div className="text-[11px] text-stone-500 italic">No retail price set yet</div>
                          )}
                        </div>

                        <button
                          onClick={() => openReviewDrawer(sub)}
                          className="px-4 py-2 bg-stone-900 hover:bg-[#d7ff3f] hover:text-black text-stone-200 text-xs font-black rounded-xl border border-stone-700 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{sub.status === 'pending_approval' ? 'Review & Set Retail Price' : 'Edit Review'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* VIEW: REGISTERED FACTORIES */}
      {activeSubTab === 'factories' && (
        <div className="space-y-4">
          {factories.map((fac) => {
            const facSubmissions = submissions.filter((s) => s.factoryId === fac.id);
            const inviteUrl = generateFactoryInviteUrl(fac.invitationToken);

            return (
              <div
                key={fac.id}
                className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-colors space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Factory Meta */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-white text-base">{fac.name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 text-stone-300 font-bold border border-stone-700">
                        {fac.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          fac.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {fac.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
                      <span>Owner: {fac.ownerName}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-500" />
                        {fac.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-stone-500" />
                        {fac.email}
                      </span>
                    </div>

                    {fac.specialization && (
                      <p className="text-[11px] text-stone-400 font-medium">Specialization: {fac.specialization}</p>
                    )}
                    {fac.capacity && <p className="text-[11px] text-stone-500">Monthly Capacity: {fac.capacity}</p>}
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(fac)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                        fac.status === 'active'
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/50'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
                      }`}
                    >
                      {fac.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                    </button>
                  </div>
                </div>

                {/* Unique Invitation Link Box */}
                <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3 text-[#d7ff3f]" />
                      Unique Partner Invitation Portal Link
                    </div>
                    <div className="text-xs text-stone-300 font-mono truncate select-all">{inviteUrl}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyLink(fac.invitationToken)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedToken === fac.invitationToken ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {onOpenFactoryPortal && (
                      <button
                        onClick={() => onOpenFactoryPortal(fac.invitationToken)}
                        className="px-3 py-1.5 bg-[#d7ff3f] hover:bg-[#cbf532] text-black text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Simulate Factory Portal as this partner"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Launch Portal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: REGISTER FACTORY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-400" />
                Register Factory Partner
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterFactorySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Factory Name *</label>
                <input
                  type="text"
                  required
                  value={newFactory.name}
                  onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                  placeholder="e.g. Tirupur Knitwear Works, Surat Silk Mills"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Owner / Director Name</label>
                  <input
                    type="text"
                    value={newFactory.ownerName}
                    onChange={(e) => setNewFactory({ ...newFactory, ownerName: e.target.value })}
                    placeholder="e.g. Karthik Subramanian"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Access Secret Key *</label>
                  <input
                    type="text"
                    required
                    value={newFactory.secretKey}
                    onChange={(e) => setNewFactory({ ...newFactory, secretKey: e.target.value })}
                    placeholder="e.g. tirupur@knit25"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newFactory.phone}
                    onChange={(e) => setNewFactory({ ...newFactory, phone: e.target.value })}
                    placeholder="e.g. +91 94431 88201"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newFactory.email}
                    onChange={(e) => setNewFactory({ ...newFactory, email: e.target.value })}
                    placeholder="e.g. factory@textiles.in"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Mill / Facility Address</label>
                <textarea
                  rows={2}
                  value={newFactory.address}
                  onChange={(e) => setNewFactory({ ...newFactory, address: e.target.value })}
                  placeholder="Industrial area, city, state, pincode..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={newFactory.specialization}
                    onChange={(e) => setNewFactory({ ...newFactory, specialization: e.target.value })}
                    placeholder="e.g. Heavy Combed Fleece, Rayon Shirts"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Monthly Capacity</label>
                  <input
                    type="text"
                    value={newFactory.capacity}
                    onChange={(e) => setNewFactory({ ...newFactory, capacity: e.target.value })}
                    placeholder="e.g. 50,000 units / month"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs rounded-xl cursor-pointer"
                >
                  Register & Generate Invite Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: REVIEW PRODUCT & SET RETAIL PRICE */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-stone-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d7ff3f]" />
                  Owner Product Review & Retail Margin Setup
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Submitted by {selectedSubmission.factoryName} • SKU: {selectedSubmission.sku}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-900/60 p-4 rounded-xl border border-stone-800">
              <div className="md:col-span-1">
                <img
                  src={selectedSubmission.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg'}
                  alt={selectedSubmission.productName}
                  className="w-full h-48 object-cover rounded-xl bg-stone-800 border border-stone-700"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="text-base font-black text-white">{selectedSubmission.productName}</div>
                <p className="text-xs text-stone-300 leading-relaxed">{selectedSubmission.description}</p>
                <div className="text-xs text-stone-400 space-y-1 pt-1">
                  <div>
                    <span className="font-bold text-stone-300">Category:</span> {selectedSubmission.category} /{' '}
                    {selectedSubmission.subcategory}
                  </div>
                  <div>
                    <span className="font-bold text-stone-300">Fabric & Material:</span>{' '}
                    {selectedSubmission.materialFabric}
                  </div>
                  <div>
                    <span className="font-bold text-stone-300">Sizes:</span> {selectedSubmission.sizes.join(', ')}
                  </div>
                  <div>
                    <span className="font-bold text-stone-300">Colours:</span> {selectedSubmission.colors.join(', ')}
                  </div>
                  <div>
                    <span className="font-bold text-stone-300">Stock & MOQ:</span> {selectedSubmission.stockQuantity}{' '}
                    available • MOQ: {selectedSubmission.moq} units
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Calculator: Factory Quotation vs Retail Selling Price */}
            <div className="bg-[#181818] border border-stone-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  OBRYNT Retail Pricing & Gross Margin
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                  <div className="text-[10px] font-black uppercase text-stone-400">Factory Quotation (Cost)</div>
                  <div className="text-xl font-black text-amber-400 mt-1">₹{selectedSubmission.factoryQuotation}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Set by factory partner</div>
                </div>

                <div className="bg-stone-900 p-3 rounded-lg border border-stone-700">
                  <label className="block text-[10px] font-black uppercase text-[#d7ff3f] mb-1">
                    Store Selling Price (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={selectedSubmission.factoryQuotation + 1}
                      value={retailSellingPrice}
                      onChange={(e) => setRetailSellingPrice(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-600 rounded-lg pl-7 pr-3 py-1.5 text-base font-black text-white focus:outline-none focus:border-[#d7ff3f]"
                    />
                  </div>
                </div>

                <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
                  <div className="text-[10px] font-black uppercase text-stone-400">Gross Margin %</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {retailSellingPrice > selectedSubmission.factoryQuotation
                      ? `${Math.round(
                          ((retailSellingPrice - selectedSubmission.factoryQuotation) / retailSellingPrice) * 100
                        )}%`
                      : '0%'}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Profit: ₹{Math.max(0, retailSellingPrice - selectedSubmission.factoryQuotation)} / unit
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Owner Review Notes / Feedback to Factory
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Excellent fabric density. Approved for immediate spring launch."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d7ff3f]"
                />
              </div>
            </div>

            {/* Decisions */}
            <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
              >
                Close Without Saving
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleDecision('needs_revision')}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl border border-amber-900/60 transition-colors cursor-pointer"
                >
                  Request Factory Revisions
                </button>

                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleDecision('rejected')}
                  className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-colors cursor-pointer"
                >
                  Reject Submission
                </button>

                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleDecision('approved')}
                  className="px-5 py-2.5 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Publish to Store</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
