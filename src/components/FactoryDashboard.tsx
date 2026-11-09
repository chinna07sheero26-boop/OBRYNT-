import React, { useState, useEffect } from 'react';
import {
  Factory,
  Package,
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  LogOut,
  Layers,
  Tag,
  Building,
  Check,
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { FactorySession, FactoryProductSubmission, FactoryPartner } from '../types';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';
import {
  getFactorySubmissions,
  submitSingleFactoryProduct,
  submitBulkFactoryProducts,
  downloadFactoryBulkExcelTemplate,
  getStoredFactories,
  clearFactorySession,
} from '../services/factoryService';
import { ALL_CATEGORIES } from '../types';

interface FactoryDashboardProps {
  session: FactorySession;
  onLogout: () => void;
  onShowNotice: (msg: string) => void;
}

export const FactoryDashboard: React.FC<FactoryDashboardProps> = ({ session, onLogout, onShowNotice }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'my-products' | 'profile'>('my-products');
  const [submissions, setSubmissions] = useState<FactoryProductSubmission[]>(() =>
    getFactorySubmissions(session.factoryId)
  );
  const [factoryProfile, setFactoryProfile] = useState<FactoryPartner | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending_approval' | 'approved' | 'needs_revision'>('All');

  // Single Product Form State
  const [singleForm, setSingleForm] = useState({
    productName: '',
    description: '',
    category: 'Men',
    subcategory: 'T-shirts',
    imageUrl: '',
    factoryQuotation: 450,
    sizes: 'S, M, L, XL',
    colors: 'Black, Charcoal',
    stockQuantity: 100,
    materialFabric: '100% Combed Compact Cotton (220 GSM)',
    sku: '',
    moq: 20,
  });

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkReport, setBulkReport] = useState<{ total: number; valid: number; duplicates: number } | null>(null);

  const refreshSubmissions = () => {
    setSubmissions(getFactorySubmissions(session.factoryId));
    const facs = getStoredFactories();
    const current = facs.find((f) => f.id === session.factoryId) || null;
    setFactoryProfile(current);
  };

  useEffect(() => {
    refreshSubmissions();
  }, [session.factoryId]);

  // Handle Single Product Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.productName.trim() || !singleForm.sku.trim()) {
      alert('Product Name and Factory SKU are required.');
      return;
    }

    const sizesArr = singleForm.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colorsArr = singleForm.colors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const imgArr = singleForm.imageUrl.trim()
      ? [singleForm.imageUrl.trim()]
      : ['/images/product_tshirt_minimal_1793012315796.jpg'];

    try {
      await submitSingleFactoryProduct(session, {
        productName: singleForm.productName.trim(),
        description: singleForm.description.trim(),
        category: singleForm.category,
        subcategory: singleForm.subcategory,
        images: imgArr,
        factoryQuotation: Number(singleForm.factoryQuotation),
        sizes: sizesArr.length > 0 ? sizesArr : ['M', 'L'],
        colors: colorsArr.length > 0 ? colorsArr : ['Black'],
        stockQuantity: Number(singleForm.stockQuantity),
        materialFabric: singleForm.materialFabric.trim(),
        sku: singleForm.sku.trim().toUpperCase(),
        moq: Number(singleForm.moq),
      });

      refreshSubmissions();
      setActiveTab('my-products');
      setSingleForm({
        productName: '',
        description: '',
        category: 'Men',
        subcategory: 'T-shirts',
        imageUrl: '',
        factoryQuotation: 450,
        sizes: 'S, M, L, XL',
        colors: 'Black, Charcoal',
        stockQuantity: 100,
        materialFabric: '100% Combed Compact Cotton (220 GSM)',
        sku: '',
        moq: 20,
      });
      onShowNotice('Product submitted for OBRYNT Owner approval.');
    } catch (err: any) {
      alert(`Submission error: ${err?.message || 'Failed'}`);
    }
  };

  // Handle File Selection for Bulk Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    // Read and parse CSV / text
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('File is empty or has only headers.');
        return;
      }

      const rows = lines.slice(1);
      const parsedItems: any[] = [];
      const seenSkus = new Set<string>();
      let duplicateCount = 0;

      rows.forEach((line, idx) => {
        // Simple CSV splitter handling quoted fields
        const cols: string[] = [];
        let inQuotes = false;
        let cur = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim());

        const name = cols[0] || `Factory Item #${idx + 1}`;
        const desc = cols[1] || '';
        const cat = cols[2] || 'Men';
        const subcat = cols[3] || 'T-shirts';
        const quote = Number(cols[4] || 450);
        const sizes = (cols[5] || 'S, M, L, XL').split(',').map((s) => s.trim());
        const colors = (cols[6] || 'Black').split(',').map((c) => c.trim());
        const stock = Number(cols[7] || 50);
        const fabric = cols[8] || '100% Combed Cotton';
        const sku = cols[9] || `FAC-BULK-${Date.now().toString(36)}-${idx + 1}`;
        const moq = Number(cols[10] || 25);
        const img = cols[11] || '/images/product_tshirt_minimal_1793012315796.jpg';

        if (seenSkus.has(sku.toLowerCase())) {
          duplicateCount++;
        } else {
          seenSkus.add(sku.toLowerCase());
          parsedItems.push({
            productName: name,
            description: desc,
            category: cat,
            subcategory: subcat,
            images: [img],
            factoryQuotation: quote,
            sizes,
            colors,
            stockQuantity: stock,
            materialFabric: fabric,
            sku: sku.toUpperCase(),
            moq,
          });
        }
      });

      setBulkPreview(parsedItems);
      setBulkReport({
        total: rows.length,
        valid: parsedItems.length,
        duplicates: duplicateCount,
      });
    };

    reader.readAsText(file);
  };

  // Submit parsed bulk items
  const handleBulkUploadSubmit = async () => {
    if (bulkPreview.length === 0) return;
    setIsProcessingBulk(true);

    try {
      await submitBulkFactoryProducts(session, bulkPreview);
      refreshSubmissions();
      setBulkFile(null);
      setBulkPreview([]);
      setBulkReport(null);
      setActiveTab('my-products');
      onShowNotice(`Successfully submitted ${bulkPreview.length} products for OBRYNT review.`);
    } catch (err: any) {
      alert(`Bulk submission error: ${err?.message || 'Failed'}`);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === 'All') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-stone-100 flex flex-col font-sans selection:bg-[#d7ff3f] selection:text-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#141414] border-b border-stone-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shadow-md shrink-0">
            <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wide text-white font-serif">{session.factoryName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 font-bold border border-stone-700">
                {session.factoryId}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-semibold">
              OBRYNT Sourcing Network • Authorized Factory Partner Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearFactorySession();
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
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('my-products')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'my-products'
                ? 'bg-[#d7ff3f] text-black shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Submitted Products</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'my-products' ? 'bg-black text-[#d7ff3f]' : 'bg-stone-800 text-stone-300'
              }`}
            >
              {submissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-[#d7ff3f] text-black shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Product</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-[#d7ff3f] text-black shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Product Upload (Excel / CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#d7ff3f] text-black shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Factory Profile</span>
          </button>
        </div>

        {/* TAB 1: MY PRODUCTS */}
        {activeTab === 'my-products' && (
          <div className="space-y-4">
            {/* Status Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                {(['All', 'pending_approval', 'approved', 'needs_revision'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-stone-800 text-[#d7ff3f] border border-stone-700'
                        : 'text-stone-400 hover:text-white hover:bg-stone-900'
                    }`}
                  >
                    {st === 'pending_approval'
                      ? 'Pending Approval'
                      : st === 'approved'
                      ? 'Approved'
                      : st === 'needs_revision'
                      ? 'Needs Revision'
                      : 'All Products'}
                  </button>
                ))}
              </div>

              <div className="text-xs text-stone-500">
                Approved products are published to the live OBRYNT storefront by the store owner.
              </div>
            </div>

            {/* List */}
            {filteredSubmissions.length === 0 ? (
              <div className="bg-[#141414] border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
                <Package className="w-10 h-10 mx-auto mb-3 text-stone-600" />
                <p className="font-bold text-white text-base">No products found</p>
                <p className="text-xs text-stone-500 mt-1">
                  Use "Add Single Product" or "Bulk Product Upload" to submit apparel items to OBRYNT.
                </p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-colors space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={sub.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg'}
                        alt={sub.productName}
                        className="w-16 h-16 rounded-xl object-cover bg-stone-800 shrink-0 border border-stone-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
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
                          <span>
                            {sub.category} / {sub.subcategory}
                          </span>
                          <span>•</span>
                          <span>Fabric: {sub.materialFabric}</span>
                          <span>•</span>
                          <span>MOQ: {sub.moq} units</span>
                          <span>•</span>
                          <span>Stock: {sub.stockQuantity}</span>
                        </div>

                        <p className="text-xs text-stone-400 line-clamp-1">{sub.description}</p>
                      </div>
                    </div>

                    {/* Quotation & Status */}
                    <div className="lg:text-right space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-800">
                      <div className="text-xs text-stone-400">
                        Factory Quotation:{' '}
                        <span className="font-black text-amber-400 text-sm">₹{sub.factoryQuotation}</span>
                      </div>
                      {sub.publishedProductSku && (
                        <div className="text-xs text-emerald-400 font-bold">
                          Live Store SKU: {sub.publishedProductSku}
                        </div>
                      )}
                      <div className="text-[10px] text-stone-500">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Owner Feedback notes */}
                  {sub.reviewNotes && (
                    <div className="bg-stone-900/80 border border-stone-800 p-3 rounded-xl text-xs text-stone-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-bold">OBRYNT Owner Feedback: </strong>
                        <span>{sub.reviewNotes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADD SINGLE PRODUCT */}
        {activeTab === 'single' && (
          <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6 sm:p-8 max-w-3xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-emerald-400" />
              Add Single Product for OBRYNT Approval
            </h3>
            <p className="text-xs text-stone-400 mb-6">
              Enter production specifications and your factory quote price in INR. After approval, the OBRYNT owner
              will establish the customer retail price and publish the item live.
            </p>

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={singleForm.productName}
                  onChange={(e) => setSingleForm({ ...singleForm, productName: e.target.value })}
                  placeholder="e.g. Heavy Loopback 450 GSM Oversized French Terry Hoodie"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={singleForm.description}
                  onChange={(e) => setSingleForm({ ...singleForm, description: e.target.value })}
                  placeholder="Detailed yarn count, weave, silhouette, stitching construction, care instructions..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Category *</label>
                  <select
                    value={singleForm.category}
                    onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Custom Design">Custom Design Blanks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Subcategory *</label>
                  <input
                    type="text"
                    required
                    value={singleForm.subcategory}
                    onChange={(e) => setSingleForm({ ...singleForm, subcategory: e.target.value })}
                    placeholder="e.g. T-shirts, Hoodies, Shirts, Cargo pants"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Factory Quotation Price (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={50}
                      value={singleForm.factoryQuotation}
                      onChange={(e) => setSingleForm({ ...singleForm, factoryQuotation: Number(e.target.value) })}
                      placeholder="450"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Factory SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={singleForm.sku}
                    onChange={(e) => setSingleForm({ ...singleForm, sku: e.target.value })}
                    placeholder="e.g. FAC-TKW-HD-01"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Available Sizes (comma-separated)</label>
                  <input
                    type="text"
                    value={singleForm.sizes}
                    onChange={(e) => setSingleForm({ ...singleForm, sizes: e.target.value })}
                    placeholder="S, M, L, XL, XXL"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Available Colours (comma-separated)</label>
                  <input
                    type="text"
                    value={singleForm.colors}
                    onChange={(e) => setSingleForm({ ...singleForm, colors: e.target.value })}
                    placeholder="Black, Vintage Bone, Olive"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={singleForm.stockQuantity}
                    onChange={(e) => setSingleForm({ ...singleForm, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Minimum Order Qty (MOQ)</label>
                  <input
                    type="number"
                    min={1}
                    value={singleForm.moq}
                    onChange={(e) => setSingleForm({ ...singleForm, moq: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Material / Fabric</label>
                  <input
                    type="text"
                    value={singleForm.materialFabric}
                    onChange={(e) => setSingleForm({ ...singleForm, materialFabric: e.target.value })}
                    placeholder="e.g. 100% Combed Cotton (240 GSM)"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Product Image URL</label>
                <input
                  type="url"
                  value={singleForm.imageUrl}
                  onChange={(e) => setSingleForm({ ...singleForm, imageUrl: e.target.value })}
                  placeholder="https://... or sample path"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md"
                >
                  Submit Product for Approval
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: BULK PRODUCT UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    Bulk Product Upload & Automatic AI Categorisation
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-xl">
                    Import hundreds of factory products in one click using Excel (.xlsx, .xls) or CSV.
                    Download the standardized OBRYNT Factory Partner template below.
                  </p>
                </div>

                <button
                  onClick={downloadFactoryBulkExcelTemplate}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Sample Excel Template</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-stone-700 hover:border-emerald-400/80 rounded-2xl p-8 text-center transition-colors bg-stone-900/40">
                <Upload className="w-10 h-10 mx-auto mb-3 text-stone-500" />
                <p className="text-sm font-bold text-white mb-1">Choose an Excel (.xlsx, .xls) or CSV catalogue file</p>
                <p className="text-xs text-stone-400 mb-4">Mandatory fields: Product Name, Category, Quotation, SKU, Stock</p>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-black rounded-xl cursor-pointer border border-stone-600 transition-colors">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Report & Preview */}
              {bulkReport && (
                <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white font-bold">Discovered: {bulkReport.total} items</span>
                    <span className="text-emerald-400 font-bold">Valid for Submission: {bulkReport.valid}</span>
                    {bulkReport.duplicates > 0 && (
                      <span className="text-amber-400 font-bold">Duplicates Skipped: {bulkReport.duplicates}</span>
                    )}
                  </div>

                  <button
                    onClick={handleBulkUploadSubmit}
                    disabled={isProcessingBulk || bulkPreview.length === 0}
                    className="px-5 py-2 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md"
                  >
                    {isProcessingBulk ? 'Submitting Batch...' : `Submit All ${bulkPreview.length} Products`}
                  </button>
                </div>
              )}

              {/* Preview Cards */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  <div className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
                    Parsed Catalogue Preview ({bulkPreview.length} items ready for OBRYNT review)
                  </div>
                  {bulkPreview.slice(0, 10).map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-[11px] text-stone-400">
                          {item.sku} • {item.category} / {item.subcategory} • Quote: ₹{item.factoryQuotation} • Stock: {item.stockQuantity}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Ready
                      </span>
                    </div>
                  ))}
                  {bulkPreview.length > 10 && (
                    <p className="text-[11px] text-stone-500 text-center py-2">
                      ...and {bulkPreview.length - 10} more items in this upload batch.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FACTORY PROFILE */}
        {activeTab === 'profile' && factoryProfile && (
          <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6 sm:p-8 max-w-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              Factory Partner Profile
            </h3>

            <div className="space-y-3 text-xs divide-y divide-stone-800">
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Factory Name</span>
                <span className="text-white font-bold">{factoryProfile.name}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Factory ID</span>
                <span className="font-mono text-cyan-400">{factoryProfile.id}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Managing Owner</span>
                <span className="text-white font-bold">{factoryProfile.ownerName}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Email</span>
                <span className="text-white">{factoryProfile.email}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Contact Number</span>
                <span className="text-white">{factoryProfile.phone}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Facility Address</span>
                <span className="text-white text-right max-w-xs">{factoryProfile.address}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Monthly Capacity</span>
                <span className="text-emerald-400 font-bold">{factoryProfile.capacity}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-400">Specialization</span>
                <span className="text-stone-200">{factoryProfile.specialization}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
